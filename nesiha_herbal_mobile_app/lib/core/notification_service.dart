import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../i18n/i18n.dart';

/// System notifications (sound + heads-up popup) for live clinic events.
///
/// Events arrive over the app's Socket.IO connection (see SocketService),
/// so they show while the app is open or recently in the background. When
/// the plugin isn't available (tests, unsupported platform) or the user
/// turned alerts off or denied permission, [show] returns false and the
/// caller falls back to an in-app toast.
class NotificationService extends ChangeNotifier {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  static const _prefsKey = 'nhc-notifications';
  static const _channelId = 'nhc_alerts';

  final _plugin = FlutterLocalNotificationsPlugin();
  bool _ready = false;
  bool _enabled = true;
  bool _permitted = false;
  int _nextId = 1;

  /// Destination id (a nav id such as `queue`) from a tapped notification;
  /// HomeShell listens and navigates there.
  final ValueNotifier<String?> tapped = ValueNotifier(null);

  bool get isSupported => !kIsWeb && (Platform.isAndroid || Platform.isIOS);
  bool get enabled => _enabled;
  bool get permitted => _permitted;
  bool get active => _ready && _enabled && _permitted;

  Future<void> init() async {
    try {
      _enabled = (await SharedPreferences.getInstance()).getBool(_prefsKey) ?? true;
    } catch (_) {}
    if (!isSupported) return;
    try {
      await _plugin.initialize(
        settings: const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
          // Permission is asked after sign-in (requestPermission), not at launch.
          iOS: DarwinInitializationSettings(
            requestAlertPermission: false,
            requestSoundPermission: false,
            requestBadgePermission: false,
          ),
        ),
        onDidReceiveNotificationResponse: (r) => open(r.payload),
      );
      await _createChannel();
      final launch = await _plugin.getNotificationAppLaunchDetails();
      if (launch?.didNotificationLaunchApp ?? false) {
        open(launch!.notificationResponse?.payload);
      }
      _permitted = await _checkPermission();
      _ready = true;
    } catch (e) {
      debugPrint('Notifications unavailable: $e');
    }
    notifyListeners();
  }

  Future<void> _createChannel() async {
    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    // High importance = heads-up popup + the default notification sound.
    await android?.createNotificationChannel(AndroidNotificationChannel(
      _channelId,
      tr('mobile.notify.channelName'),
      description: tr('mobile.notify.channelDescription'),
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    ));
  }

  Future<bool> _checkPermission() async {
    if (Platform.isAndroid) {
      final android = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      return await android?.areNotificationsEnabled() ?? false;
    }
    final ios = _plugin.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();
    final s = await ios?.checkPermissions();
    return s?.isEnabled ?? false;
  }

  /// Asks the OS for permission (Android 13+, iOS). Safe to call repeatedly;
  /// the OS only shows its dialog while the answer is undecided.
  Future<bool> requestPermission() async {
    if (!_ready) return false;
    try {
      bool? granted;
      if (Platform.isAndroid) {
        granted = await _plugin
            .resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin>()
            ?.requestNotificationsPermission();
      } else {
        granted = await _plugin
            .resolvePlatformSpecificImplementation<
                IOSFlutterLocalNotificationsPlugin>()
            ?.requestPermissions(alert: true, sound: true, badge: true);
      }
      _permitted = granted ?? await _checkPermission();
    } catch (_) {
      _permitted = false;
    }
    notifyListeners();
    return _permitted;
  }

  Future<void> setEnabled(bool value) async {
    _enabled = value;
    notifyListeners();
    try {
      await (await SharedPreferences.getInstance()).setBool(_prefsKey, value);
    } catch (_) {}
    if (value && !_permitted) await requestPermission();
  }

  /// Shows a system notification; returns false if it wasn't shown (the
  /// caller then uses an in-app toast instead).
  Future<bool> show({required String body, String? title, String? payload}) async {
    if (!active) return false;
    try {
      await _plugin.show(
        id: _nextId++ & 0x7fffffff,
        title: title ?? tr('sidebar.brandName'),
        body: body,
        payload: payload,
        notificationDetails: NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            tr('mobile.notify.channelName'),
            channelDescription: tr('mobile.notify.channelDescription'),
            importance: Importance.high,
            priority: Priority.high,
            category: AndroidNotificationCategory.message,
            styleInformation: BigTextStyleInformation(body),
            ticker: body,
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBanner: true,
            presentSound: true,
            presentList: true,
          ),
        ),
      );
      return true;
    } catch (e) {
      debugPrint('Notification failed: $e');
      return false;
    }
  }

  /// Route to [payload] (a nav id), e.g. from a tapped system or push notification.
  void open(String? payload) {
    if (payload == null || payload.isEmpty) return;
    tapped.value = null; // re-fire even for the same destination twice
    tapped.value = payload;
  }
}
