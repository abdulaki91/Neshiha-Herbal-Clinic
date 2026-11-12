import 'package:material_ui/material_ui.dart';

import '../theme/app_theme.dart';
import 'backdrop.dart';
import 'cards.dart';

/// Space screens leave at the bottom so content clears the floating nav bar.
const double kNavClearance = 112;

/// Frame for a top-level screen. The same screen can live in the bottom
/// navigation (as a tab) or be pushed from the "More" menu; [pushed] picks
/// the right chrome (back button, own Scaffold, FAB placement).
class TabPage extends StatelessWidget {
  const TabPage({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.trailing,
    this.pushed = false,
    this.fab,
    this.header,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;
  final bool pushed;
  final Widget? fab;

  /// Extra fixed content under the title (search, filters).
  final Widget? header;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            if (pushed)
              Padding(
                padding: const EdgeInsets.only(left: 8, top: 4),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_rounded),
                  color: context.palette.ink,
                  onPressed: () => Navigator.of(context).maybePop(),
                ),
              ),
            Expanded(
              child: PageHeader(
                title: title,
                subtitle: subtitle,
                trailing: trailing,
                padding: EdgeInsets.fromLTRB(pushed ? 4 : 20, 10, 20, 12),
              ),
            ),
          ],
        ),
        ?header,
        Expanded(child: child),
      ],
    );

    if (pushed) {
      return BackdropScaffold(
        body: SafeArea(bottom: false, child: content),
        floatingActionButton: fab,
      );
    }
    return SafeArea(
      bottom: false,
      child: Stack(
        children: [
          Positioned.fill(child: content),
          if (fab != null)
            Positioned(
              right: 20,
              bottom: kNavClearance - 18 + MediaQuery.paddingOf(context).bottom,
              child: fab!,
            ),
        ],
      ),
    );
  }

  /// Bottom padding for scrollables inside a [TabPage].
  static EdgeInsets listPadding(BuildContext context, bool pushed,
          {double top = 4, bool hasFab = false}) =>
      EdgeInsets.fromLTRB(
        20,
        top,
        20,
        (pushed ? 24 : kNavClearance + MediaQuery.paddingOf(context).bottom) +
            (hasFab ? 72 : 0),
      );
}

/// Extended FAB in the brand gradient.
class GradientFab extends StatelessWidget {
  const GradientFab({super.key, required this.label, required this.icon, required this.onPressed});
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: Brand.primaryGradient,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Brand.b600.withValues(alpha: 0.45),
            blurRadius: 24,
            offset: const Offset(0, 12),
            spreadRadius: -8,
          ),
        ],
      ),
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          borderRadius: BorderRadius.circular(28),
          onTap: onPressed,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: Colors.white, size: 21),
                const SizedBox(width: 8),
                Text(label,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 14.5)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
