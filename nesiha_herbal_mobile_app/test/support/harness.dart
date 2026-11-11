import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:nesiha_herbal_mobile_app/app.dart';
import 'package:nesiha_herbal_mobile_app/core/api_client.dart';
import 'package:nesiha_herbal_mobile_app/core/session_storage.dart';
import 'package:nesiha_herbal_mobile_app/core/socket_service.dart';
import 'package:nesiha_herbal_mobile_app/data/clinic_api.dart';
import 'package:nesiha_herbal_mobile_app/state/auth_controller.dart';
import 'package:nesiha_herbal_mobile_app/state/theme_controller.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'fake_api.dart';

/// Phone-sized viewport (iPhone 14-ish: 390×844 logical @3x).
void usePhoneViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(1170, 2532);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
}

/// Pumps the full app wired to [FakeApi]. A null [role] shows the login screen.
Future<void> pumpApp(
  WidgetTester tester, {
  String? role,
  ThemeMode mode = ThemeMode.light,
}) async {
  SharedPreferences.setMockInitialValues({});
  final session = SessionStorage();
  final client = ApiClient(session);
  final socket = SocketService();
  final theme = ThemeController();
  await theme.setMode(mode);
  final auth = AuthController(session: session, client: client, socket: socket)
    ..debugSetUser(role == null ? null : fakeUser(role));

  const debugErrors = bool.fromEnvironment('DEBUG_ERRORS');
  if (debugErrors) {
    final original = FlutterError.onError;
    FlutterError.onError = (d) {
      // ignore: avoid_print
      print('LIVE ERROR: ${d.exceptionAsString()}\n'
          '${d.context}\n${d.informationCollector?.call().take(3).join('\n')}');
      original?.call(d);
    };
  }

  await tester.pumpWidget(MultiProvider(
    providers: [
      Provider.value(value: client),
      Provider<ClinicApi>.value(value: FakeApi()),
      ChangeNotifierProvider.value(value: socket),
      ChangeNotifierProvider.value(value: theme),
      ChangeNotifierProvider.value(value: auth),
    ],
    child: const NesihaApp(),
  ));
  await tester.pumpAndSettle();
}

/// Unmounts the app so periodic refresh timers are cancelled, and lets any
/// toast's auto-dismiss timer run out, before the test ends.
Future<void> unmount(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox());
  await tester.pump(const Duration(seconds: 5));
}
