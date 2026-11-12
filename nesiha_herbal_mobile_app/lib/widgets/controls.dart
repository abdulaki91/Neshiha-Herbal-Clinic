import 'dart:async';

import 'package:material_ui/material_ui.dart';

import '../i18n/i18n.dart';
import '../theme/app_theme.dart';

/// Primary pill button with the brand → orchid gradient.
class GradientButton extends StatelessWidget {
  const GradientButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.loading = false,
    this.expand = true,
    this.height = 54,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final bool expand;
  final double height;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    final child = AnimatedOpacity(
      duration: const Duration(milliseconds: 200),
      opacity: enabled ? 1 : 0.6,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: Brand.primaryGradient,
          borderRadius: BorderRadius.circular(height / 2),
          boxShadow: [
            BoxShadow(
              color: Brand.b600.withValues(alpha: 0.35),
              blurRadius: 22,
              offset: const Offset(0, 10),
              spreadRadius: -8,
            ),
          ],
        ),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            borderRadius: BorderRadius.circular(height / 2),
            onTap: enabled ? onPressed : null,
            child: SizedBox(
              height: height,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 22),
                child: Row(
                  mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (loading)
                      const SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.2, color: Colors.white),
                      )
                    else ...[
                      if (icon != null) ...[
                        Icon(icon, color: Colors.white, size: 20),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Text(
                          label,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                            letterSpacing: 0.1,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
    return expand ? SizedBox(width: double.infinity, child: child) : child;
  }
}

/// Round frosted icon button with optional badge (top bar controls).
class CircleIconButton extends StatelessWidget {
  const CircleIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.badge = 0,
    this.tooltip,
    this.size = 44,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final int badge;
  final String? tooltip;
  final double size;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final button = Material(
      color: p.surface,
      shape: CircleBorder(side: BorderSide(color: p.surfaceBorder)),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: SizedBox.square(
          dimension: size,
          child: Icon(icon, size: 21, color: p.inkSoft),
        ),
      ),
    );
    return Tooltip(
      message: tooltip ?? '',
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          button,
          if (badge > 0)
            Positioned(right: -2, top: -2, child: CountBadge(count: badge)),
        ],
      ),
    );
  }
}

class CountBadge extends StatelessWidget {
  const CountBadge({super.key, required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minWidth: 19, minHeight: 19),
      padding: const EdgeInsets.symmetric(horizontal: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFF43F5E),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.palette.surfaceSolid, width: 2),
      ),
      alignment: Alignment.center,
      child: Text(
        count > 99 ? '99+' : '$count',
        style: const TextStyle(
            color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
      ),
    );
  }
}

/// Gradient circle with initials.
class InitialsAvatar extends StatelessWidget {
  const InitialsAvatar(this.initials, {super.key, this.size = 44, this.soft = true});
  final String initials;
  final double size;

  /// Soft pastel (list rows) vs. strong brand gradient (headers).
  final bool soft;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final colors = soft
        ? (p.isDark
            ? [Brand.b600.withValues(alpha: 0.7), Brand.a600.withValues(alpha: 0.7)]
            : [Brand.b200, Brand.a200])
        : [Brand.b500, Brand.a400];
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: TextStyle(
          color: soft && !p.isDark ? Brand.b800 : Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: size * 0.36,
        ),
      ),
    );
  }
}

enum Tone { neutral, brand, success, warning, danger, info, violet }

extension ToneColors on Tone {
  Color color(Palette p) => switch (this) {
        Tone.neutral => p.inkSoft,
        Tone.brand => p.isDark ? Brand.b300 : Brand.b600,
        Tone.success => p.success,
        Tone.warning => p.warning,
        Tone.danger => p.danger,
        Tone.info => p.info,
        Tone.violet => p.isDark ? Brand.a300 : Brand.a600,
      };
}

/// Small rounded status label.
class StatusPill extends StatelessWidget {
  const StatusPill(this.label, {super.key, this.tone = Tone.neutral, this.dot = true});
  final String label;
  final Tone tone;
  final bool dot;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final c = tone.color(p);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: c.withValues(alpha: p.isDark ? 0.16 : 0.11),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot) ...[
            Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(color: c, shape: BoxShape.circle)),
            const SizedBox(width: 6),
          ],
          Text(label,
              style: TextStyle(
                  color: c, fontSize: 11.5, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

/// Pill-shaped segmented control.
class Segmented<T> extends StatelessWidget {
  const Segmented({
    super.key,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final T value;
  final List<(T, String, IconData?)> items;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: p.subtle,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: p.surfaceBorder),
      ),
      child: Row(
        children: [
          for (final (v, label, icon) in items)
            Expanded(
              child: GestureDetector(
                onTap: () => onChanged(v),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOut,
                  height: 42,
                  decoration: BoxDecoration(
                    color: v == value ? p.selectedFill : Colors.transparent,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: v == value
                        ? [
                            BoxShadow(
                              color: p.shadow.withValues(alpha: 0.18),
                              blurRadius: 14,
                              offset: const Offset(0, 6),
                              spreadRadius: -6,
                            ),
                          ]
                        : null,
                  ),
                  alignment: Alignment.center,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (icon != null) ...[
                        Icon(icon,
                            size: 17,
                            color: v == value
                                ? Theme.of(context).colorScheme.primary
                                : p.inkMuted),
                        const SizedBox(width: 6),
                      ],
                      Flexible(
                        child: Text(
                          label,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13.5,
                            color: v == value ? p.ink : p.inkMuted,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Horizontally scrolling filter chips.
class FilterChips<T> extends StatelessWidget {
  const FilterChips({
    super.key,
    required this.value,
    required this.items,
    required this.onChanged,
    this.padding = const EdgeInsets.symmetric(horizontal: 20),
  });

  final T value;
  final List<(T, String)> items;
  final ValueChanged<T> onChanged;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: padding,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final (v, label) = items[i];
          return ChoicePill(
            label: label,
            selected: v == value,
            onTap: () => onChanged(v),
          );
        },
      ),
    );
  }
}

class ChoicePill extends StatelessWidget {
  const ChoicePill({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        gradient: selected ? Brand.primaryGradient : null,
        color: selected ? null : p.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
            color: selected ? Colors.transparent : p.surfaceBorder),
      ),
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon,
                      size: 16, color: selected ? Colors.white : p.inkSoft),
                  const SizedBox(width: 6),
                ],
                // Capped width + ellipsis: translated labels can be long
                // (e.g. "Mobile Money (Telebirr/CBE Birr)"). Not Flexible —
                // pills also sit in horizontal lists with unbounded width.
                ConstrainedBox(
                  constraints: BoxConstraints(
                      maxWidth: MediaQuery.sizeOf(context).width - 120),
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: selected ? Colors.white : p.inkSoft,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Search box with a debounce, so typing doesn't fire a request per key.
class SearchField extends StatefulWidget {
  const SearchField({
    super.key,
    required this.hint,
    required this.onChanged,
    this.debounce = const Duration(milliseconds: 400),
  });

  final String hint;
  final ValueChanged<String> onChanged;
  final Duration debounce;

  @override
  State<SearchField> createState() => _SearchFieldState();
}

class _SearchFieldState extends State<SearchField> {
  final _ctrl = TextEditingController();
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  void _changed(String v) {
    setState(() {});
    _timer?.cancel();
    _timer = Timer(widget.debounce, () => widget.onChanged(v.trim()));
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _ctrl,
      onChanged: _changed,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: widget.hint,
        prefixIcon: const Icon(Icons.search_rounded),
        suffixIcon: _ctrl.text.isEmpty
            ? null
            : IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () {
                  _ctrl.clear();
                  _changed('');
                },
              ),
        contentPadding: const EdgeInsets.symmetric(vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide(color: context.palette.surfaceBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide(color: context.palette.surfaceBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide(
              color: Theme.of(context).colorScheme.primary, width: 1.5),
        ),
      ),
    );
  }
}

/// Free-text tags (symptoms, diagnoses) with an add field.
class TagInput extends StatefulWidget {
  const TagInput({
    super.key,
    required this.tags,
    required this.onChanged,
    required this.hint,
    this.tone = Tone.info,
  });

  final List<String> tags;
  final ValueChanged<List<String>> onChanged;
  final String hint;
  final Tone tone;

  @override
  State<TagInput> createState() => _TagInputState();
}

class _TagInputState extends State<TagInput> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _add() {
    final v = _ctrl.text.trim();
    if (v.isEmpty) return;
    widget.onChanged([...widget.tags, v]);
    _ctrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final c = widget.tone.color(p);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _ctrl,
          onSubmitted: (_) => _add(),
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            hintText: widget.hint,
            suffixIcon: Padding(
              padding: const EdgeInsets.all(6),
              child: IconButton.filled(
                onPressed: _add,
                icon: const Icon(Icons.add_rounded),
                style: IconButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ),
        ),
        if (widget.tags.isNotEmpty) ...[
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (var i = 0; i < widget.tags.length; i++)
                Container(
                  padding: const EdgeInsets.only(left: 12, right: 4),
                  decoration: BoxDecoration(
                    color: c.withValues(alpha: p.isDark ? 0.16 : 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(widget.tags[i],
                            style: TextStyle(
                                color: c, fontWeight: FontWeight.w600)),
                      ),
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        iconSize: 16,
                        color: c,
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () {
                          final next = [...widget.tags]..removeAt(i);
                          widget.onChanged(next);
                        },
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

/// Labelled form field wrapper for consistent spacing.
class FieldLabel extends StatelessWidget {
  const FieldLabel(this.label, {super.key, required this.child, this.optional = false});
  final String label;
  final Widget child;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text.rich(TextSpan(children: [
              TextSpan(
                  text: label,
                  style: context.text.labelLarge?.copyWith(color: p.inkSoft)),
              if (optional)
                TextSpan(
                    text: '  ${tr('mobile.common.optional')}',
                    style:
                        context.text.labelSmall?.copyWith(color: p.inkMuted)),
            ])),
          ),
          child,
        ],
      ),
    );
  }
}
