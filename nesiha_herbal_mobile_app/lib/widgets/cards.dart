import 'package:material_ui/material_ui.dart';

import '../theme/app_theme.dart';

/// Frosted card — the basic surface of the app (web: `.glass-panel`).
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.radius = 24,
    this.borderColor,
    this.color,
    this.margin,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final double radius;
  final Color? borderColor;
  final Color? color;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radius),
      side: BorderSide(color: borderColor ?? p.surfaceBorder),
    );
    final card = CustomPaint(
      painter: OuterShadowPainter(
        radius: radius,
        shadow: BoxShadow(
          color: p.shadow.withValues(alpha: p.isDark ? 0.35 : 0.14),
          blurRadius: 30,
          offset: const Offset(0, 14),
          spreadRadius: -16,
        ),
      ),
      child: Material(
        color: color ?? p.surface,
        shape: shape,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
    return margin == null ? card : Padding(padding: margin!, child: card);
  }
}

/// Drop shadow painted only *outside* a rounded rect. Flutter's BoxShadow
/// is also drawn underneath the box, which shows through translucent
/// (frosted) surfaces as a dark ghost shape; CSS box-shadow never does.
class OuterShadowPainter extends CustomPainter {
  const OuterShadowPainter({required this.radius, required this.shadow});
  final double radius;
  final BoxShadow shadow;

  @override
  void paint(Canvas canvas, Size size) {
    final box = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius));
    final reach = shadow.blurRadius * 2 + shadow.offset.distance + shadow.spreadRadius.abs();
    canvas.save();
    canvas.clipPath(Path()
      ..fillType = PathFillType.evenOdd
      ..addRect((Offset.zero & size).inflate(reach))
      ..addRRect(box));
    canvas.drawRRect(
      box.shift(shadow.offset).inflate(shadow.spreadRadius),
      shadow.toPaint(),
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(OuterShadowPainter old) =>
      old.radius != radius || old.shadow != shadow;
}

/// Large screen title with optional subtitle and trailing actions.
class PageHeader extends StatelessWidget {
  const PageHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.padding = const EdgeInsets.fromLTRB(20, 8, 20, 12),
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: padding,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: context.text.headlineSmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!,
                      style: context.text.bodyMedium
                          ?.copyWith(color: p.inkMuted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                ],
              ],
            ),
          ),
          if (trailing != null) ...[const SizedBox(width: 12), trailing!],
        ],
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.trailing, this.icon});
  final String title;
  final Widget? trailing;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 4),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(title,
                style: context.text.titleMedium?.copyWith(color: p.ink)),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

/// Small label/value pair used in detail cards.
class InfoTile extends StatelessWidget {
  const InfoTile({super.key, required this.label, required this.value, this.icon});
  final String label;
  final String value;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (icon != null) ...[
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: Theme.of(context)
                  .colorScheme
                  .primary
                  .withValues(alpha: p.isDark ? 0.18 : 0.09),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, size: 17, color: Theme.of(context).colorScheme.primary),
          ),
          const SizedBox(width: 10),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: context.text.labelSmall?.copyWith(color: p.inkMuted)),
              const SizedBox(height: 2),
              Text(value,
                  style: context.text.bodyMedium?.copyWith(
                      color: p.ink, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }
}
