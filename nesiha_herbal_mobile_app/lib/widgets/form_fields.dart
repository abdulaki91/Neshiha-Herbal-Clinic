import 'package:file_picker/file_picker.dart';
import 'package:material_ui/material_ui.dart';

import '../core/config.dart';
import '../core/format.dart';
import '../data/clinic_api.dart';
import '../i18n/i18n.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import 'backdrop.dart';
import 'cards.dart';
import 'controls.dart';

/// Full-screen form: app bar, scrolling fields, and a pinned save button.
class FormPage extends StatelessWidget {
  const FormPage({
    super.key,
    required this.title,
    required this.children,
    required this.saveLabel,
    required this.onSave,
    this.saving = false,
    this.subtitle,
    this.formKey,
    this.actions,
  });

  final String title;
  final String? subtitle;
  final List<Widget> children;
  final String saveLabel;
  final VoidCallback? onSave;
  final bool saving;
  final GlobalKey<FormState>? formKey;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    Widget body = ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: children,
    );
    if (formKey != null) body = Form(key: formKey, child: body);
    return BackdropScaffold(
      appBar: AppBar(
        titleSpacing: 0,
        actions: actions,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
            if (subtitle != null)
              Text(subtitle!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: context.text.bodySmall?.copyWith(color: p.inkMuted)),
          ],
        ),
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        behavior: HitTestBehavior.translucent,
        child: body,
      ),
      bottomBar: SafeArea(
        top: false,
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 14),
        child: GradientButton(
          label: saveLabel,
          icon: Icons.check_rounded,
          loading: saving,
          onPressed: onSave,
        ),
      ),
    );
  }
}

/// A titled glass card that groups related form fields.
class FormSection extends StatelessWidget {
  const FormSection({
    super.key,
    required this.children,
    this.title,
    this.subtitle,
    this.icon,
  });

  final String? title;
  final String? subtitle;
  final IconData? icon;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: GlassCard(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 2),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (title != null) ...[
              Row(
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 19, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 8),
                  ],
                  Expanded(child: Text(title!, style: context.text.titleSmall)),
                ],
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(subtitle!, style: context.text.bodySmall?.copyWith(color: p.inkMuted)),
              ],
              const SizedBox(height: 14),
            ],
            ...children,
          ],
        ),
      ),
    );
  }
}

/// Plain text field with a label above it.
class TextFieldRow extends StatelessWidget {
  const TextFieldRow({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.optional = false,
    this.validator,
    this.keyboardType,
    this.minLines,
    this.maxLines = 1,
    this.obscure = false,
    this.enabled = true,
    this.capitalization = TextCapitalization.none,
    this.helper,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final bool optional;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final int? minLines;
  final int? maxLines;
  final bool obscure;
  final bool enabled;
  final TextCapitalization capitalization;
  final String? helper;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return FieldLabel(
      label,
      optional: optional,
      child: TextFormField(
        controller: controller,
        validator: validator,
        keyboardType: keyboardType,
        minLines: minLines,
        maxLines: obscure ? 1 : maxLines,
        obscureText: obscure,
        enabled: enabled,
        textCapitalization: capitalization,
        onChanged: onChanged,
        decoration: InputDecoration(hintText: hint, helperText: helper, helperMaxLines: 3),
      ),
    );
  }
}

/// Number-only field. [decimal] allows a decimal point.
class NumberFieldRow extends StatelessWidget {
  const NumberFieldRow({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.decimal = false,
    this.optional = true,
    this.validator,
    this.helper,
    this.suffix,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final bool decimal;
  final bool optional;
  final String? Function(String?)? validator;
  final String? helper;
  final String? suffix;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return FieldLabel(
      label,
      optional: optional,
      child: TextFormField(
        controller: controller,
        validator: validator,
        onChanged: onChanged,
        keyboardType: TextInputType.numberWithOptions(decimal: decimal),
        decoration: InputDecoration(
            hintText: hint, helperText: helper, suffixText: suffix, helperMaxLines: 2),
      ),
    );
  }
}

/// Labelled dropdown.
class DropdownRow<T> extends StatelessWidget {
  const DropdownRow({
    super.key,
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
    this.hint,
    this.optional = false,
    this.validator,
  });

  final String label;
  final T? value;
  final List<(T, String)> items;
  final ValueChanged<T?> onChanged;
  final String? hint;
  final bool optional;
  final String? Function(T?)? validator;

  @override
  Widget build(BuildContext context) {
    final known = items.any((e) => e.$1 == value);
    return FieldLabel(
      label,
      optional: optional,
      child: DropdownButtonFormField<T>(
        initialValue: known ? value : null,
        isExpanded: true,
        validator: validator,
        hint: hint == null ? null : Text(hint!),
        borderRadius: BorderRadius.circular(18),
        items: [
          for (final (v, l) in items)
            DropdownMenuItem<T>(
                value: v, child: Text(l, maxLines: 1, overflow: TextOverflow.ellipsis)),
        ],
        onChanged: onChanged,
      ),
    );
  }
}

/// Tappable date (or time) display that opens the platform picker.
class DateFieldRow extends StatelessWidget {
  const DateFieldRow({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.firstDate,
    this.lastDate,
    this.optional = true,
    this.placeholder,
    this.icon = Icons.event_rounded,
  });

  final String label;
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;
  final DateTime? firstDate;
  final DateTime? lastDate;
  final bool optional;
  final String? placeholder;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    return FieldLabel(
      label,
      optional: optional,
      child: PickerBox(
        icon: icon,
        text: value == null ? null : Fmt.date(value),
        placeholder: placeholder ?? tr('mobile.common.selectDate'),
        onClear: optional && value != null ? () => onChanged(null) : null,
        onTap: () async {
          final d = await showDatePicker(
            context: context,
            initialDate: value ?? now,
            firstDate: firstDate ?? DateTime(now.year - 5),
            lastDate: lastDate ?? DateTime(now.year + 10),
          );
          if (d != null) onChanged(d);
        },
      ),
    );
  }
}

/// Time of day stored as the API's "HH:mm:ss".
class TimeFieldRow extends StatelessWidget {
  const TimeFieldRow({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    TimeOfDay? parsed;
    final parts = (value ?? '').split(':');
    if (parts.length >= 2) {
      final h = int.tryParse(parts[0]);
      final m = int.tryParse(parts[1]);
      if (h != null && m != null) parsed = TimeOfDay(hour: h, minute: m);
    }
    return FieldLabel(
      label,
      child: PickerBox(
        icon: Icons.schedule_rounded,
        text: value == null || value!.isEmpty ? null : Fmt.clock(value),
        placeholder: '—',
        onTap: () async {
          final t = await showTimePicker(
              context: context, initialTime: parsed ?? const TimeOfDay(hour: 8, minute: 0));
          if (t != null) {
            String two(int n) => n.toString().padLeft(2, '0');
            onChanged('${two(t.hour)}:${two(t.minute)}:00');
          }
        },
      ),
    );
  }
}

/// The rounded "field-looking" button used by date/time pickers.
class PickerBox extends StatelessWidget {
  const PickerBox({
    super.key,
    required this.icon,
    required this.text,
    required this.placeholder,
    required this.onTap,
    this.onClear,
  });

  final IconData icon;
  final String? text;
  final String placeholder;
  final VoidCallback onTap;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Material(
      color: p.isDark ? const Color(0x0FFFFFFF) : const Color(0xD9FFFFFF),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: p.divider),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(14, 6, 6, 6),
          child: Row(
            children: [
              Icon(icon, size: 19, color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  text ?? placeholder,
                  style: TextStyle(
                    color: text == null ? p.inkMuted : p.ink,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (onClear != null)
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 18),
                  tooltip: tr('common.close'),
                  onPressed: onClear,
                )
              else
                const SizedBox(height: 44),
            ],
          ),
        ),
      ),
    );
  }
}

/// On/off row with a label.
class SwitchRow extends StatelessWidget {
  const SwitchRow({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.subtitle,
  });

  final String label;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: SwitchListTile.adaptive(
        contentPadding: EdgeInsets.zero,
        value: value,
        onChanged: onChanged,
        title: Text(label, style: context.text.titleSmall),
        subtitle: subtitle == null ? null : Text(subtitle!, style: context.text.bodySmall),
      ),
    );
  }
}

/// One text value per interface language (en/om/am/ar) with language
/// tabs — the mobile TranslatableInput.jsx. Only English can be required;
/// the website falls back to English for empty languages.
class TranslatableFieldRow extends StatefulWidget {
  const TranslatableFieldRow({
    super.key,
    required this.label,
    required this.controllers,
    this.required = false,
    this.multiline = false,
    this.hint,
  });

  final String label;
  final Map<String, TextEditingController> controllers;
  final bool required;
  final bool multiline;
  final String? hint;

  /// Controllers pre-filled from a stored `{"en": ..., "am": ...}` value.
  static Map<String, TextEditingController> controllersFor(Localized? value) => {
        for (final l in I18n.languages)
          l.code: TextEditingController(text: value?.values[l.code] ?? ''),
      };

  static Map<String, String> valueOf(Map<String, TextEditingController> c) => {
        for (final e in c.entries) e.key: e.value.text.trim(),
      };

  @override
  State<TranslatableFieldRow> createState() => _TranslatableFieldRowState();
}

class _TranslatableFieldRowState extends State<TranslatableFieldRow> {
  String _active = 'en';

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final active = widget.controllers[_active]!;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsetsDirectional.only(start: 4),
                  child: Text(widget.label,
                      style: context.text.labelLarge?.copyWith(color: p.inkSoft)),
                ),
              ),
              for (final l in I18n.languages)
                Padding(
                  padding: const EdgeInsetsDirectional.only(start: 4),
                  child: _LangChip(
                    code: l.code,
                    selected: l.code == _active,
                    filled: widget.controllers[l.code]!.text.trim().isNotEmpty,
                    onTap: () => setState(() => _active = l.code),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          // Every language keeps its own field so nothing typed is lost
          // when switching tabs; only the active one is visible.
          TextFormField(
            key: ValueKey(_active),
            controller: active,
            minLines: widget.multiline ? 3 : 1,
            maxLines: widget.multiline ? 8 : 1,
            textDirection: _active == 'ar' ? TextDirection.rtl : null,
            onChanged: (_) => setState(() {}),
            validator: (_) => widget.required &&
                    widget.controllers['en']!.text.trim().isEmpty
                ? tr('contentAdmin.common.requiredField')
                : null,
            decoration: InputDecoration(
              hintText: widget.hint,
              helperText: _active == 'en' ? null : tr('mobile.content.fallbackHint'),
            ),
          ),
        ],
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  const _LangChip({
    required this.code,
    required this.selected,
    required this.filled,
    required this.onTap,
  });

  final String code;
  final bool selected;
  final bool filled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          gradient: selected ? Brand.primaryGradient : null,
          color: selected ? null : p.subtle,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(code.toUpperCase(),
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: selected ? Colors.white : p.inkSoft)),
            if (filled && !selected) ...[
              const SizedBox(width: 3),
              Container(
                width: 5,
                height: 5,
                decoration: BoxDecoration(color: p.success, shape: BoxShape.circle),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Current image (from the server) or a newly picked one, with a button
/// to choose a replacement.
class ImagePickRow extends StatelessWidget {
  const ImagePickRow({
    super.key,
    required this.label,
    required this.buttonLabel,
    required this.currentPath,
    required this.picked,
    required this.onPicked,
    this.circle = false,
  });

  final String label;
  final String buttonLabel;
  final String? currentPath;
  final PickedUpload? picked;
  final ValueChanged<PickedUpload> onPicked;
  final bool circle;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    Widget preview;
    if (picked?.bytes != null) {
      preview = Image.memory(picked!.bytes!, fit: BoxFit.cover);
    } else if (AppConfig.fileUrl(currentPath) case final url?) {
      preview = Image.network(url,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => Icon(Icons.broken_image_rounded, color: p.inkMuted));
    } else {
      preview = Icon(Icons.image_outlined, color: p.inkMuted, size: 30);
    }
    return FieldLabel(
      label,
      optional: true,
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(circle ? 40 : 16),
            child: Container(
              width: 76,
              height: 76,
              color: p.subtle,
              alignment: Alignment.center,
              child: preview,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: OutlinedButton.icon(
              icon: const Icon(Icons.upload_rounded, size: 18),
              label: Text(buttonLabel),
              onPressed: () async {
                final files = await pickUploads(images: true);
                if (files.isNotEmpty) onPicked(files.first);
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Opens the system file picker. [images] limits it to photos; files are
/// read into memory so they work the same on every platform.
Future<List<PickedUpload>> pickUploads({bool images = false, bool multiple = false}) async {
  final extensions =
      images ? PickedUpload.imageExtensions : PickedUpload.allowedExtensions;
  final List<PlatformFile> picked;
  if (multiple) {
    picked = await FilePicker.pickFiles(
        type: FileType.custom, allowedExtensions: extensions);
  } else {
    final one = await FilePicker.pickFile(
        type: FileType.custom, allowedExtensions: extensions);
    picked = [?one];
  }
  return [
    for (final f in picked)
      PickedUpload(name: f.name, bytes: await f.readAsBytes()),
  ];
}

/// Two-column label/value line used in detail sheets.
class DetailLine extends StatelessWidget {
  const DetailLine(this.label, this.value, {super.key});
  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    if (value == null || value!.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: context.text.bodySmall?.copyWith(color: p.inkMuted)),
          ),
          Expanded(child: Text(value!, style: context.text.bodyMedium?.copyWith(color: p.ink))),
        ],
      ),
    );
  }
}

/// Shared validators.
class Validators {
  Validators._();

  static String? required(String? v, [String? message]) =>
      (v ?? '').trim().isEmpty ? (message ?? tr('mobile.validation.required')) : null;

  static String? email(String? v, {bool optional = false}) {
    final s = (v ?? '').trim();
    if (s.isEmpty) return optional ? null : tr('staffForm.emailRequired');
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s)
        ? null
        : tr('staffForm.emailInvalid');
  }

  static String? password(String? v) {
    final s = v ?? '';
    if (s.isEmpty) return tr('staffForm.passwordRequired');
    if (s.length < 8) return tr('staffForm.passwordTooShort');
    if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(s)) {
      return tr('staffForm.passwordWeak');
    }
    return null;
  }

  static String? positiveNumber(String? v, {bool optional = true}) {
    final s = (v ?? '').trim();
    if (s.isEmpty) return optional ? null : tr('mobile.validation.required');
    final n = num.tryParse(s);
    if (n == null || n < 0) return tr('mobile.validation.number');
    return null;
  }
}

/// Parses a trimmed text field: empty → null.
num? numOrNull(TextEditingController c) => num.tryParse(c.text.trim());
int? intOrNull(TextEditingController c) => int.tryParse(c.text.trim());
String? textOrNull(TextEditingController c) {
  final s = c.text.trim();
  return s.isEmpty ? null : s;
}
