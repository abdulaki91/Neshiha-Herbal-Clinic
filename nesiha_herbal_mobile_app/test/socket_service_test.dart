// End-to-end check of SocketService against a real Socket.IO server.
//
// Skipped unless SOCKET_IT_URL points at a server that behaves like
// Backend/src/config/socket.js (polling only, JWT auth, role rooms) and
// serves test tokens at /token?role=…  Example:
//
//   SOCKET_IT_URL=http://127.0.0.1:5055 flutter test test/socket_service_test.dart
import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nesiha_herbal_mobile_app/core/socket_service.dart';

void main() {
  final url = Platform.environment['SOCKET_IT_URL'];

  setUpAll(() {
    TestWidgetsFlutterBinding.ensureInitialized();
    // The test binding fakes HTTP; this test needs the real network.
    HttpOverrides.global = null;
  });

  Future<String> token({String role = 'doctor', bool bad = false}) async {
    final r = await Dio().get<String>('$url/token',
        queryParameters: {'role': role, if (bad) 'bad': '1'});
    return r.data!;
  }

  Future<List<SocketEvent>> collect(SocketService s, Set<String> wanted) async {
    final got = <SocketEvent>[];
    final done = Completer<void>();
    final sub = s.events.listen((e) {
      got.add(e);
      if (wanted.every((w) => got.any((g) => g.name == w)) && !done.isCompleted) {
        done.complete();
      }
    });
    await done.future.timeout(const Duration(seconds: 20));
    await sub.cancel();
    return got;
  }

  test('connects over polling, joins rooms and receives events', () async {
    final good = await token();
    final s = SocketService(url: url, tokenProvider: () => good);
    s.connect(role: 'doctor');
    final got = await collect(s, {'connect', 'payment:completed', 'queue:updated', 'notification:new'});
    expect(s.isConnected, isTrue);
    expect(got.firstWhere((e) => e.name == 'payment:completed').data['amount'], '450.00');
    // UTF-8 (Amharic) survives the polling payload framing.
    expect(got.firstWhere((e) => e.name == 'notification:new').data['message'], 'héllo ✓ ሰላም');
    s.dispose();
  }, skip: url == null ? 'SOCKET_IT_URL not set' : false);

  test('refreshes the token when the handshake is rejected', () async {
    final bad = await token(bad: true);
    final good = await token(role: 'cashier');
    var refreshed = false;
    final s = SocketService(
      url: url,
      tokenProvider: () => refreshed ? good : bad,
      onAuthError: () async {
        refreshed = true;
        return good;
      },
    );
    s.connect(role: 'cashier');
    await collect(s, {'connect', 'payment:completed'});
    expect(refreshed, isTrue);
    expect(s.isConnected, isTrue);
    s.dispose();
  }, skip: url == null ? 'SOCKET_IT_URL not set' : false);

  test('stays connected across server heartbeats', () async {
    final good = await token();
    final s = SocketService(url: url, tokenProvider: () => good);
    s.connect(role: 'doctor');
    await collect(s, {'connect'});
    var drops = 0;
    final sub = s.events.where((e) => e.name == 'disconnect').listen((_) => drops++);
    // Server pings every 3s here; 10s spans several ping/pong rounds.
    await Future<void>.delayed(const Duration(seconds: 10));
    expect(drops, 0);
    expect(s.isConnected, isTrue);
    await sub.cancel();
    s.dispose();
  }, skip: url == null ? 'SOCKET_IT_URL not set' : false);
}
