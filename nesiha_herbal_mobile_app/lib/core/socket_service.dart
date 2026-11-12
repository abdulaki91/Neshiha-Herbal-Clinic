import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/widgets.dart';

import 'config.dart';

class SocketEvent {
  const SocketEvent(this.name, this.data);
  final String name;
  final dynamic data;
}

/// Real-time updates from the backend's Socket.IO server.
///
/// Every server event is re-broadcast on [events]; screens listen with
/// [on] and refresh themselves.
///
/// Why this is a hand-written Engine.IO client instead of the
/// `socket_io_client` package: the backend runs on Phusion Passenger, which
/// can't do WebSockets, so the server only accepts HTTP long-polling
/// (`transports: ["polling"]` in Backend/src/config/socket.js). On Android
/// and iOS, `socket_io_client` ignores `setTransports(['polling'])` and
/// always opens a WebSocket (its native transport factory only implements
/// WebSocket), so every handshake was rejected and the app never received a
/// single event. This client speaks Engine.IO v4 over plain HTTP polling —
/// exactly what the web portal's socket.io-client does — so it works on
/// every platform.
class SocketService extends ChangeNotifier with WidgetsBindingObserver {
  SocketService({
    String? url,
    this.tokenProvider,
    this.onAuthError,
  }) : _base = Uri.parse(url ?? AppConfig.socketUrl);

  final Uri _base;

  /// Reads the current access token at every handshake, so a reconnect
  /// after the token was refreshed doesn't reuse the expired one.
  String? Function()? tokenProvider;

  /// Called when the server rejects the token; should return a fresh one.
  Future<String?> Function()? onAuthError;

  final _events = StreamController<SocketEvent>.broadcast();
  final _http = Dio(BaseOptions(
    responseType: ResponseType.plain,
    connectTimeout: const Duration(seconds: 20),
    // Long-poll GETs are held open by the server for up to pingInterval.
    receiveTimeout: const Duration(seconds: 70),
    headers: {'Accept': '*/*'},
  ));

  bool _connected = false;
  bool _wanted = false;
  bool _observing = false;
  String? _role;
  String? _staticToken;

  /// Bumped on every (re)connect; stale loops compare and exit.
  int _session = 0;
  String? _sid;
  Duration _pingInterval = const Duration(seconds: 25);
  Duration _pingTimeout = const Duration(seconds: 20);
  Timer? _watchdog;
  Timer? _retryTimer;
  int _attempt = 0;

  final _outbox = <String>[];
  bool _writing = false;

  bool get isConnected => _connected;
  Stream<SocketEvent> get events => _events.stream;

  // ------------------------------------------------------------- public

  void connect({String? token, required String? role}) {
    _role = role;
    _staticToken = token;
    _wanted = true;
    _attempt = 0;
    if (!_observing) {
      WidgetsBinding.instance.addObserver(this);
      _observing = true;
    }
    _open();
  }

  void disconnect() {
    _wanted = false;
    _retryTimer?.cancel();
    if (_sid != null) {
      // Best effort: tell the server we're leaving (Engine.IO "close").
      _post(_session, _sid!, ['1']).catchError((_) {});
    }
    _teardown();
    if (_observing) {
      WidgetsBinding.instance.removeObserver(this);
      _observing = false;
    }
  }

  /// Emit an event to the server, e.g. `emit('subscribe:queue')`.
  void emit(String event, [Object? data]) {
    if (!_connected) return;
    final payload = data == null ? [event] : [event, data];
    _send('42${jsonEncode(payload)}');
  }

  /// Listen for any of [names]; cancel the returned subscription in dispose().
  StreamSubscription<SocketEvent> on(
    List<String> names,
    void Function(SocketEvent e) handler,
  ) =>
      events.where((e) => names.contains(e.name)).listen(handler);

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Mobile OSes freeze network activity in the background; reconnect
    // right away on resume instead of waiting for the backoff timer.
    if (state == AppLifecycleState.resumed && _wanted && !_connected) {
      _attempt = 0;
      _open();
    }
  }

  @override
  void dispose() {
    disconnect();
    _events.close();
    _http.close(force: true);
    super.dispose();
  }

  // ------------------------------------------------------------ engine

  Uri _uri([Map<String, String>? extra]) => _base.replace(
        path: '${_base.path.replaceAll(RegExp(r'/$'), '')}/socket.io/',
        queryParameters: {
          'EIO': '4',
          'transport': 'polling',
          't': DateTime.now().microsecondsSinceEpoch.toRadixString(36),
          ...?extra,
        },
      );

  void _teardown() {
    _session++;
    _sid = null;
    _watchdog?.cancel();
    _outbox.clear();
    _writing = false;
    _setConnected(false);
  }

  Future<void> _open() async {
    _retryTimer?.cancel();
    _teardown();
    if (!_wanted) return;
    final session = _session;
    final token = tokenProvider?.call() ?? _staticToken;
    if (token == null) return;

    try {
      // 1. Engine.IO handshake → session id + heartbeat timings.
      final res = await _http.getUri<String>(_uri());
      if (session != _session) return;
      final open = _decodePayload(res.data ?? '')
          .firstWhere((p) => p.startsWith('0'), orElse: () => '');
      if (open.isEmpty) throw StateError('No open packet');
      final info = jsonDecode(open.substring(1)) as Map<String, dynamic>;
      _sid = info['sid'] as String;
      _pingInterval = Duration(milliseconds: (info['pingInterval'] as num?)?.toInt() ?? 25000);
      _pingTimeout = Duration(milliseconds: (info['pingTimeout'] as num?)?.toInt() ?? 20000);
      _http.options.receiveTimeout = _pingInterval + _pingTimeout + const Duration(seconds: 10);

      // 2. Socket.IO CONNECT to the default namespace with the JWT.
      await _post(session, _sid!, ['40${jsonEncode({'token': token})}']);
      if (session != _session) return;

      _armWatchdog(session);
      unawaited(_pollLoop(session));
    } catch (e) {
      if (session == _session) _scheduleRetry();
    }
  }

  Future<void> _pollLoop(int session) async {
    while (session == _session && _sid != null) {
      try {
        final res = await _http.getUri<String>(_uri({'sid': _sid!}));
        if (session != _session) return;
        _armWatchdog(session);
        for (final packet in _decodePayload(res.data ?? '')) {
          await _handle(session, packet);
          if (session != _session) return;
        }
      } catch (e) {
        if (session != _session) return;
        _scheduleRetry();
        return;
      }
    }
  }

  Future<void> _handle(int session, String packet) async {
    if (packet.isEmpty) return;
    switch (packet[0]) {
      case '2': // ping → pong
        _send('3');
      case '1': // server closed the session
        _scheduleRetry();
      case '4': // message → Socket.IO packet
        await _handleSocketIo(session, packet.substring(1));
      default: // '6' noop, '3' pong, etc.
        break;
    }
  }

  Future<void> _handleSocketIo(int session, String p) async {
    if (p.isEmpty) return;
    final type = p[0];
    var body = p.substring(1);
    // Only the default namespace is used; skip "/nsp," if ever present.
    if (body.startsWith('/')) {
      final comma = body.indexOf(',');
      body = comma < 0 ? '' : body.substring(comma + 1);
    }
    switch (type) {
      case '0': // CONNECT ack
        _attempt = 0;
        _setConnected(true);
        // Room membership is per-connection server state, so re-join on
        // every (re)connect, not just the first.
        if (_role == 'doctor') emit('subscribe:queue');
        _events.add(const SocketEvent('connect', null));
      case '1': // DISCONNECT from server
        _scheduleRetry();
      case '4': // CONNECT_ERROR — almost always an expired/invalid token
        _setConnected(false);
        _teardown();
        final fresh = await onAuthError?.call();
        if (!_wanted) return;
        if (fresh != null) {
          _staticToken = fresh;
          _attempt = 0;
          unawaited(_open());
        } else {
          _scheduleRetry();
        }
      case '2': // EVENT: [id?]["name", data...]
        final start = body.indexOf('[');
        if (start < 0) return;
        try {
          final list = jsonDecode(body.substring(start));
          if (list is List && list.isNotEmpty && list.first is String) {
            if (!_events.isClosed) {
              _events.add(SocketEvent(
                  list.first as String, list.length > 1 ? list[1] : null));
            }
          }
        } catch (_) {
          // Malformed event — ignore it rather than drop the connection.
        }
      default:
        break;
    }
  }

  void _send(String packet) {
    final sid = _sid;
    if (sid == null) return;
    _outbox.add(packet);
    if (_writing) return;
    _flush(_session, sid);
  }

  Future<void> _flush(int session, String sid) async {
    _writing = true;
    try {
      while (_outbox.isNotEmpty && session == _session) {
        final batch = List<String>.from(_outbox);
        _outbox.clear();
        await _post(session, sid, batch);
      }
    } catch (_) {
      if (session == _session) _scheduleRetry();
    } finally {
      if (session == _session) _writing = false;
    }
  }

  Future<void> _post(int session, String sid, List<String> packets) =>
      _http.postUri<String>(
        _uri({'sid': sid}),
        data: packets.join('\x1e'),
        options: Options(contentType: 'text/plain;charset=UTF-8'),
      );

  void _armWatchdog(int session) {
    _watchdog?.cancel();
    // The server pings every pingInterval; silence beyond that plus
    // pingTimeout means the session is dead.
    _watchdog = Timer(_pingInterval + _pingTimeout, () {
      if (session == _session) _scheduleRetry();
    });
  }

  void _scheduleRetry() {
    _teardown();
    if (!_wanted) return;
    _retryTimer?.cancel();
    final base = min(15000, 1000 * pow(2, _attempt).toInt());
    final jitter = Random().nextInt(500);
    _attempt = min(_attempt + 1, 6);
    _retryTimer = Timer(Duration(milliseconds: base + jitter), _open);
  }

  static List<String> _decodePayload(String body) =>
      body.split('\x1e').where((p) => p.isNotEmpty).toList();

  void _setConnected(bool v) {
    if (_connected == v) return;
    _connected = v;
    if (!v && !_events.isClosed) {
      _events.add(const SocketEvent('disconnect', null));
    }
    notifyListeners();
  }
}
