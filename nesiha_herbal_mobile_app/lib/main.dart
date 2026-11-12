import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/api_client.dart';
import 'core/notification_service.dart';
import 'core/push_service.dart';
import 'core/session_storage.dart';
import 'core/socket_service.dart';
import 'data/clinic_api.dart';
import 'i18n/i18n.dart';
import 'state/auth_controller.dart';
import 'state/theme_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
  ));
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  final session = SessionStorage();
  final client = ApiClient(session);
  final socket = SocketService(
    tokenProvider: () => client.accessToken,
    onAuthError: client.refreshAccessToken,
  );
  final theme = ThemeController();
  final auth = AuthController(session: session, client: client, socket: socket);

  await theme.load();
  // Month/day names for am & ar (intl ships the data; it just needs loading).
  await initializeDateFormatting();
  await I18n.instance.load();
  await NotificationService.instance.init();
  await PushService.instance.init();
  PushService.instance.socketConnected = () => socket.isConnected;
  // Not awaited: the splash shows while the stored session is restored.
  auth.bootstrap();

  runApp(MultiProvider(
    providers: [
      Provider.value(value: client),
      Provider(create: (_) => ClinicApi(client)),
      ChangeNotifierProvider.value(value: socket),
      ChangeNotifierProvider.value(value: theme),
      ChangeNotifierProvider.value(value: I18n.instance),
      ChangeNotifierProvider.value(value: NotificationService.instance),
      ChangeNotifierProvider.value(value: auth),
    ],
    child: const NesihaApp(),
  ));
}
