import 'package:material_ui/material_ui.dart';

import '../theme/app_theme.dart';

/// The lavender → rose wash behind every screen (web: `.app-backdrop`).
class AppBackdrop extends StatelessWidget {
  const AppBackdrop({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: p.bgGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(1.2, -1.1),
                    radius: 1.1,
                    colors: [p.bgBlobB, p.bgBlobB.withValues(alpha: 0)],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(-1.2, 1.15),
                    radius: 1.15,
                    colors: [p.bgBlobA, p.bgBlobA.withValues(alpha: 0)],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}

/// Scaffold with the backdrop applied — used by every pushed screen.
class BackdropScaffold extends StatelessWidget {
  const BackdropScaffold({
    super.key,
    this.appBar,
    required this.body,
    this.floatingActionButton,
    this.bottomBar,
  });

  final PreferredSizeWidget? appBar;
  final Widget body;
  final Widget? floatingActionButton;
  final Widget? bottomBar;

  @override
  Widget build(BuildContext context) {
    return AppBackdrop(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: appBar,
        body: body,
        floatingActionButton: floatingActionButton,
        bottomNavigationBar: bottomBar,
      ),
    );
  }
}
