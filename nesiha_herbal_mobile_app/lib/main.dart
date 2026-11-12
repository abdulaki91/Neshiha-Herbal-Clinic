import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/api_client.dart';
import 'core/session_storage.dart';
import 'core/socket_service.dart';
import 'data/clinic_api.dart';
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
  // Not awaited: the splash shows while the stored session is restored.
  auth.bootstrap();

  runApp(MultiProvider(
    providers: [
      Provider.value(value: client),
      Provider(create: (_) => ClinicApi(client)),
      ChangeNotifierProvider.value(value: socket),
      ChangeNotifierProvider.value(value: theme),
      ChangeNotifierProvider.value(value: auth),
    ],
    child: const NesihaApp(),
  ));
}
