import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../i18n/i18n.dart';
import 'api_client.dart';
import 'notification_service.dart';

/// Firebase Cloud Messaging — alerts that arrive while the app is closed.
///
/// The backend (Backend/src/services/pushService.js) sends a translated
/// notification for important events to every phone registered here. The
/// system shows it on the app's "nhc_alerts" channel (sound + popup) when
/// the app is in the background or closed; tapping it opens the matching
/// screen via the `destination` data field.
///
/// While the app is open, the live socket already raises the same alerts,
/// so foreground FCM messages are only shown if the socket is down.
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  bool _ready = false;
  String? _token;
  ApiClient? _client;
  String? _registeredAs; // "<token>|<language>" last sent to the backend

  /// Lets foreground messages be skipped while the socket is delivering.
  bool Function()? socketConnected;

  /// True once this phone is registered with the backend for pushes.
  bool get registered => _registeredAs != null;

  Future<void> init() async {
    if (kIsWeb || !(Platform.isAndroid || Platform.isIOS)) return;
    try {
      // Android reads android/app/google-services.json. (iOS would also
      // need ios/Runner/GoogleService-Info.plist; without it this throws
      // and pushes are simply off on iOS.)
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;

      FirebaseMessaging.onMessageOpenedApp
          .listen((m) => NotificationService.instance.open(m.data['destination']));
      final initial = await messaging.getInitialMessage();
      if (initial != null) {
        NotificationService.instance.open(initial.data['destination']);
      }
      FirebaseMessaging.onMessage.listen(_onForegroundMessage);
      // Classic registration tokens (deprecated in favour of FID "direct
      // send", which the backend's firebase-admin multicast doesn't target).
      // ignore: deprecated_member_use
      messaging.onTokenRefresh.listen((t) {
        _token = t;
        unawaited(_sync());
      });
      // Pushes are written in the app's language — re-register on a switch.
      I18n.instance.addListener(() => unawaited(_sync()));
      _ready = true;
    } catch (e) {
      debugPrint('Push unavailable: $e');
    }
  }

  void _onForegroundMessage(RemoteMessage m) {
    if (socketConnected?.call() ?? false) return; // socket already alerted
    final body = m.notification?.body;
    if (body == null) return;
    NotificationService.instance.show(
      title: m.notification?.title,
      body: body,
      payload: m.data['destination'],
    );
  }

  /// Call after sign-in.
  Future<void> register(ApiClient client) async {
    _client = client;
    if (!_ready) return;
    try {
      // ignore: deprecated_member_use
      _token ??= await FirebaseMessaging.instance.getToken();
      await _sync();
    } catch (e) {
      debugPrint('Push registration failed: $e');
    }
  }

  Future<void> _sync() async {
    final client = _client;
    final token = _token;
    if (client == null || token == null) return;
    final key = '$token|${I18n.instance.code}';
    if (key == _registeredAs) return;
    try {
      await client.post('/notifications/devices', data: {
        'token': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
        'language': I18n.instance.code,
      });
      _registeredAs = key;
    } catch (e) {
      debugPrint('Push registration failed: $e');
    }
  }

  /// Call before signing out (while the access token is still valid), so
  /// the next person to use this phone doesn't get the previous user's alerts.
  Future<void> unregister() async {
    final client = _client;
    final token = _token;
    _client = null;
    _registeredAs = null;
    if (client == null || token == null) return;
    try {
      await client.delete('/notifications/devices', data: {'token': token});
    } catch (_) {
      // Best effort — the backend also drops tokens Firebase reports dead.
    }
  }
}
