import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists tokens and the signed-in user in the platform keystore
/// (Keychain on iOS, EncryptedSharedPreferences/Keystore on Android).
class SessionStorage {
  SessionStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _kAccess = 'accessToken';
  static const _kRefresh = 'refreshToken';
  static const _kUser = 'user';

  String? _accessCache;
  String? _refreshCache;

  String? get accessToken => _accessCache;
  String? get refreshToken => _refreshCache;

  Future<({String? access, String? refresh, Map<String, dynamic>? user})>
      load() async {
    try {
      _accessCache = await _storage.read(key: _kAccess);
      _refreshCache = await _storage.read(key: _kRefresh);
      final rawUser = await _storage.read(key: _kUser);
      Map<String, dynamic>? user;
      if (rawUser != null) {
        final decoded = jsonDecode(rawUser);
        if (decoded is Map) user = Map<String, dynamic>.from(decoded);
      }
      return (access: _accessCache, refresh: _refreshCache, user: user);
    } catch (_) {
      // Corrupt/unavailable keystore — treat as signed out.
      await clear();
      return (access: null, refresh: null, user: null);
    }
  }

  Future<void> saveTokens({required String access, String? refresh}) async {
    _accessCache = access;
    await _storage.write(key: _kAccess, value: access);
    if (refresh != null) {
      _refreshCache = refresh;
      await _storage.write(key: _kRefresh, value: refresh);
    }
  }

  Future<void> saveUser(Map<String, dynamic> user) =>
      _storage.write(key: _kUser, value: jsonEncode(user));

  Future<void> clear() async {
    _accessCache = null;
    _refreshCache = null;
    try {
      await _storage.delete(key: _kAccess);
      await _storage.delete(key: _kRefresh);
      await _storage.delete(key: _kUser);
    } catch (_) {}
  }
}
