import 'package:flutter/foundation.dart';

import '../i18n/i18n.dart';
import '../core/api_client.dart';
import '../core/json.dart';
import '../core/session_storage.dart';
import '../core/socket_service.dart';
import '../models/models.dart';

enum AuthStatus { loading, signedOut, signedIn }

class AuthController extends ChangeNotifier {
  AuthController({
    required this.session,
    required this.client,
    required this.socket,
  }) {
    client.onSessionExpired = () => _signOutLocally(expired: true);
  }

  final SessionStorage session;
  final ApiClient client;
  final SocketService socket;

  AuthStatus _status = AuthStatus.loading;
  AppUser? _user;
  bool _expired = false;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  String get role => _user?.role ?? '';

  /// True once after the session expired, so the login screen can say why.
  bool consumeExpiredFlag() {
    final v = _expired;
    _expired = false;
    return v;
  }

  Future<void> bootstrap() async {
    final saved = await session.load();
    if (saved.access == null || saved.user == null) {
      _status = AuthStatus.signedOut;
      notifyListeners();
      return;
    }
    _user = AppUser(saved.user!);
    _status = AuthStatus.signedIn;
    socket.connect(token: saved.access!, role: _user!.role);
    notifyListeners();

    // Refresh the profile in the background (role/name may have changed).
    try {
      final res = await client.get('/auth/profile');
      final fresh = asMap(res.data);
      if (fresh != null && _status == AuthStatus.signedIn) {
        _user = AppUser(fresh);
        await session.saveUser(fresh);
        notifyListeners();
      }
    } catch (_) {
      // Offline or expired — the interceptor handles expiry.
    }
  }

  Future<void> login(String email, String password) async {
    final res = await client.post('/auth/login', data: {
      'email': email.trim(),
      'password': password,
    });
    final data = res.map;
    final access = asString(data['accessToken']);
    final refresh = asString(data['refreshToken']);
    final user = asMap(data['user']);
    if (access == null || user == null) {
      throw ApiException(tr('mobile.errors.unexpected'));
    }
    await session.saveTokens(access: access, refresh: refresh);
    await session.saveUser(user);
    _user = AppUser(user);
    _status = AuthStatus.signedIn;
    socket.connect(token: access, role: _user!.role);
    notifyListeners();
  }

  /// Puts the controller straight into a signed-in (or signed-out, for
  /// null) state without touching storage, network or sockets.
  @visibleForTesting
  void debugSetUser(AppUser? user) {
    _user = user;
    _status = user == null ? AuthStatus.signedOut : AuthStatus.signedIn;
    notifyListeners();
  }

  Future<void> changePassword(String current, String next) async {
    await client.put('/auth/change-password', data: {
      'currentPassword': current,
      'newPassword': next,
    });
  }

  Future<void> logout() async {
    try {
      await client.post('/auth/logout');
    } catch (_) {
      // Best effort — we sign out locally regardless.
    }
    await _signOutLocally();
  }

  Future<void> _signOutLocally({bool expired = false}) async {
    if (_status == AuthStatus.signedOut) return;
    socket.disconnect();
    await session.clear();
    _user = null;
    _expired = expired;
    _status = AuthStatus.signedOut;
    notifyListeners();
  }
}
