import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'config.dart';

class SocketEvent {
  const SocketEvent(this.name, this.data);
  final String name;
  final dynamic data;
}

/// Real-time updates from the backend's Socket.IO server.
///
/// Every server event is re-broadcast on [events]; screens listen with
/// [on] and refresh themselves. Like the web portal it uses HTTP long
/// polling only — the backend's host (Phusion Passenger) can't upgrade to
/// WebSockets, so trying one first would only stall each (re)connect.
class SocketService extends ChangeNotifier {
  io.Socket? _socket;
  final _events = StreamController<SocketEvent>.broadcast();
  bool _connected = false;
  String? _role;

  bool get isConnected => _connected;
  Stream<SocketEvent> get events => _events.stream;

  void connect({required String token, required String? role}) {
    disconnect();
    _role = role;
    final socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['polling'])
          .setAuth({'token': token})
          .disableAutoConnect()
          .enableForceNew()
          .enableReconnection()
          .build(),
    );

    socket.on('connect', (_) {
      _setConnected(true);
      // Room membership is per-connection server state, so re-join on
      // every (re)connect, not just the first.
      if (_role == 'doctor') socket.emit('subscribe:queue');
    });
    socket.on('disconnect', (_) => _setConnected(false));
    socket.on('connect_error', (_) => _setConnected(false));
    socket.onAny((event, data) {
      if (!_events.isClosed) _events.add(SocketEvent(event, data));
    });

    _socket = socket;
    socket.connect();
  }

  void disconnect() {
    final s = _socket;
    _socket = null;
    if (s != null) {
      s.offAny();
      s.dispose();
    }
    _setConnected(false);
  }

  /// Listen for any of [names]; cancel the returned subscription in dispose().
  StreamSubscription<SocketEvent> on(
    List<String> names,
    void Function(SocketEvent e) handler,
  ) =>
      events.where((e) => names.contains(e.name)).listen(handler);

  void _setConnected(bool v) {
    if (_connected == v) return;
    _connected = v;
    notifyListeners();
  }

  @override
  void dispose() {
    disconnect();
    _events.close();
    super.dispose();
  }
}
