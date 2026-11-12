import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../theme/app_theme.dart';
import '../widgets/cards.dart';
import 'i18n.dart';

/// The four interface languages (same as the web's LanguageSelector),
/// each shown in its own script. Switching re-renders the app in place;
/// Arabic also flips the layout to right-to-left.
class LanguagePicker extends StatelessWidget {
  const LanguagePicker({super.key, this.compact = false});

  /// Compact = a single row of chips (login screen).
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final i18n = context.watch<I18n>();
    final p = context.palette;
    if (compact) {
      return Wrap(
        alignment: WrapAlignment.center,
        spacing: 6,
        runSpacing: 6,
        children: [
          for (final l in I18n.languages)
            ChoiceChip(
              label: Text(l.nativeName),
              selected: l.code == i18n.code,
              showCheckmark: false,
              onSelected: (_) => i18n.setLanguage(l.code),
            ),
        ],
      );
    }
    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        children: [
          for (final l in I18n.languages)
            ListTile(
              onTap: () => i18n.setLanguage(l.code),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
              leading: Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Theme.of(context)
                      .colorScheme
                      .primary
                      .withValues(alpha: p.isDark ? 0.18 : 0.1),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Text(l.code.toUpperCase(),
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.primary)),
              ),
              title: Text(l.nativeName, style: context.text.titleSmall),
              subtitle: l.nativeName == l.name ? null : Text(l.name, style: context.text.bodySmall),
              trailing: l.code == i18n.code
                  ? Icon(Icons.check_circle_rounded, color: p.success)
                  : Icon(Icons.circle_outlined, color: p.inkMuted),
            ),
        ],
      ),
    );
  }
}
