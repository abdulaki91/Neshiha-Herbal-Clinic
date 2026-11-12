import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'features/auth/login_screen.dart';
import 'i18n/i18n.dart';
import 'features/shell/home_shell.dart';
import 'state/auth_controller.dart';
import 'state/theme_controller.dart';
import 'theme/app_theme.dart';
import 'widgets/backdrop.dart';
import 'widgets/brand.dart';
import 'widgets/feedback.dart';

final _delegates = [
  for (final d in GlobalMaterialLocalizations.delegates)
    FallbackLocalizationsDelegate<dynamic>(d),
];

class NesihaApp extends StatefulWidget {
  const NesihaApp({super.key});

  @override
  State<NesihaApp> createState() => _NesihaAppState();
}

class _NesihaAppState extends State<NesihaApp> {
  String _lang = I18n.instance.code;

  @override
  void initState() {
    super.initState();
    Intl.defaultLocale = I18n.instance.intlLocale;
    I18n.instance.addListener(_onLanguage);
  }

  @override
  void dispose() {
    I18n.instance.removeListener(_onLanguage);
    super.dispose();
  }

  /// Text comes from the global `tr()`, which widgets don't "depend" on, so
  /// a language switch marks every element dirty — a full in-place rebuild
  /// that keeps navigation, scroll positions and form state.
  void _onLanguage() {
    if (_lang == I18n.instance.code) return;
    _lang = I18n.instance.code;
    Intl.defaultLocale = I18n.instance.intlLocale;
    setState(() {});
    void mark(Element e) {
      e.markNeedsBuild();
      e.visitChildren(mark);
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final root = rootNavigatorKey.currentContext;
      if (root is Element) mark(root);
    });
  }

  @override
  Widget build(BuildContext context) {
    final mode = context.watch<ThemeController>().mode;
    return MaterialApp(
      title: tr('sidebar.brandName'),
      debugShowCheckedModeBanner: false,
      navigatorKey: rootNavigatorKey,
      locale: I18n.instance.locale,
      supportedLocales: I18n.instance.supportedLocales,
      localizationsDelegates: _delegates,
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
