import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'features/auth/login_screen.dart';
import 'features/shell/home_shell.dart';
import 'state/auth_controller.dart';
import 'state/theme_controller.dart';
import 'theme/app_theme.dart';
import 'widgets/backdrop.dart';
import 'widgets/brand.dart';
import 'widgets/feedback.dart';

class NesihaApp extends StatelessWidget {
  const NesihaApp({super.key});

  @override
  Widget build(BuildContext context) {
    final mode = context.watch<ThemeController>().mode;
    return MaterialApp(
      title: 'Nesiha Clinic',
      debugShowCheckedModeBanner: false,
      navigatorKey: rootNavigatorKey,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: mode,
      builder: (context, child) {
        final dark = Theme.of(context).brightness == Brightness.dark;
        return AnnotatedRegion<SystemUiOverlayStyle>(
          value: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
          child: child!,
        );
      },
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final child = switch (auth.status) {
      AuthStatus.loading => const _Splash(),
      AuthStatus.signedOut => const LoginScreen(),
      AuthStatus.signedIn => HomeShell(key: ValueKey(auth.user?.id)),
    };
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 400),
      switchInCurve: Curves.easeOut,
      child: KeyedSubtree(key: ValueKey(auth.status), child: child),
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    return const AppBackdrop(
      child: Center(child: BrandMark(size: 72)),
    );
  }
}
