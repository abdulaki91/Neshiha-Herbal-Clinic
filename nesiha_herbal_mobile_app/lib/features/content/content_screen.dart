import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/format.dart';
import '../../core/json.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/form_fields.dart';
import '../../widgets/tab_page.dart';
import 'content_types.dart';

/// Public-website content (super admin) — the mobile
/// ContentManagementPage.jsx: one list per collection with publish /
/// unpublish, reorder, edit and delete.
class ContentManagementScreen extends StatefulWidget {
  const ContentManagementScreen({super.key});

  @override
  State<ContentManagementScreen> createState() => _ContentManagementScreenState();
}

class _ContentManagementScreenState extends State<ContentManagementScreen> {
  ContentType _type = ContentType.all.first;
  String? _status;
  List<ContentItem>? _items;
  String? _error;
  final _busy = <String>{};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool spinner = true}) async {
    if (spinner) {
      setState(() {
        _items = null;
        _error = null;
      });
    }
    final type = _type;
    try {
      final list = await context.read<ClinicApi>().contentList(type.resource, status: _status);
      list.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      if (mounted && type == _type) setState(() => _items = list);
    } catch (e) {
      if (mounted) {
        setState(() => _error = '${tr('contentAdmin.common.loadError')}: ${ApiException.from(e).message}');
      }
    }
  }

  Future<void> _run(ContentItem item, Future<void> Function() action, String okMsg,
      String errMsg) async {
    setState(() => _busy.add(item.id));
    try {
      await action();
      if (okMsg.isNotEmpty) Toast.success(okMsg);
      await _load(spinner: false);
    } catch (e) {
      Toast.error('$errMsg: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _busy.remove(item.id));
    }
  }

  Future<void> _openForm([ContentItem? item]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => ContentFormScreen(type: _type, item: item)),
    );
    if (saved == true) _load(spinner: false);
  }

  void _actions(ContentItem item) {
    final api = context.read<ClinicApi>();
    final type = _type;
    final label = type.title(item);
    showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      builder: (ctx) {
        final p = ctx.palette;
        void go(VoidCallback f) {
          Navigator.pop(ctx);
          f();
        }

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
                  child: Text(label, maxLines: 2, style: ctx.text.titleMedium),
                ),
                ListTile(
                  leading: const Icon(Icons.edit_rounded),
                  title: Text(tr('common.edit')),
                  onTap: () => go(() => _openForm(item)),
                ),
                ListTile(
                  leading: Icon(item.isPublished
                      ? Icons.visibility_off_rounded
                      : Icons.public_rounded),
                  title: Text(item.isPublished
                      ? tr('mobile.content.unpublish')
                      : tr('mobile.content.publish')),
                  onTap: () => go(() => _run(
                        item,
                        () => api.setContentStatus(
                            type.resource, item.id, item.isPublished ? 'draft' : 'published'),
                        tr('contentAdmin.common.statusUpdateSuccess'),
                        tr('contentAdmin.common.statusUpdateError'),
                      )),
                ),
                ListTile(
                  leading: const Icon(Icons.arrow_upward_rounded),
                  title: Text(tr('contentAdmin.common.moveUp')),
                  onTap: () => go(() => _run(item, () => api.reorderContent(type.resource, item.id, 'up'),
                      '', tr('contentAdmin.common.reorderError'))),
                ),
                ListTile(
                  leading: const Icon(Icons.arrow_downward_rounded),
                  title: Text(tr('contentAdmin.common.moveDown')),
                  onTap: () => go(() => _run(item,
                      () => api.reorderContent(type.resource, item.id, 'down'), '',
                      tr('contentAdmin.common.reorderError'))),
                ),
                ListTile(
                  leading: Icon(Icons.delete_outline_rounded, color: p.danger),
                  title: Text(tr('common.delete'), style: TextStyle(color: p.danger)),
                  onTap: () => go(() async {
                    final ok = await confirmAction(
                      context,
                      title: tr('common.delete'),
                      message: tr('contentAdmin.common.deleteConfirm', {'label': label}),
                      confirmLabel: tr('common.delete'),
                      destructive: true,
                    );
                    if (ok) {
                      _run(item, () => api.deleteContent(type.resource, item.id),
                          tr('contentAdmin.common.deleteSuccess'), tr('contentAdmin.common.deleteError'));
                    }
                  }),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    return TabPage(
      title: tr('contentAdmin.title'),
      subtitle: tr('contentAdmin.subtitle'),
      pushed: true,
      fab: GradientFab(
        label: _type.t('addButton'),
        icon: Icons.add_rounded,
        onPressed: _openForm,
      ),
      header: Column(
        children: [
          FilterChips<ContentType>(
            value: _type,
            items: [for (final t in ContentType.all) (t, t.label)],
            onChanged: (t) {
              setState(() => _type = t);
              _load();
            },
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(0, 10, 0, 12),
            child: FilterChips<String?>(
              value: _status,
              items: [
                (null, tr('contentAdmin.common.allStatuses')),
                ('published', tr('contentAdmin.common.published')),
                ('draft', tr('contentAdmin.common.draft')),
              ],
              onChanged: (s) {
                setState(() => _status = s);
                _load();
              },
            ),
          ),
        ],
      ),
      child: Builder(builder: (context) {
        if (_error != null && items == null) return ErrorView(message: _error!, onRetry: _load);
        if (items == null) return const LoadingView();
        if (items.isEmpty) {
          return EmptyView(
            icon: Icons.web_rounded,
            title: _type.t('title'),
            subtitle: tr('contentAdmin.common.empty'),
          );
        }
        return RefreshIndicator(
          onRefresh: () => _load(spinner: false),
          child: ListView.separated(
            padding: TabPage.listPadding(context, true, hasFab: true),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _ItemCard(
              type: _type,
              item: items[i],
              busy: _busy.contains(items[i].id),
              onTap: () => _actions(items[i]),
            ),
          ),
        );
      }),
    );
  }
}

class _ItemCard extends StatelessWidget {
  const _ItemCard({required this.type, required this.item, required this.busy, required this.onTap});
  final ContentType type;
  final ContentItem item;
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final url = AppConfig.fileUrl(type.imagePath(item));
    final sub = type.subtitle?.call(item);
    final rating = asInt(item.raw['rating']);
    return GestureDetector(
      onTap: onTap,
      child: GlassCard(
        radius: 22,
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            if (type.imageField != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(type.circleImage ? 28 : 14),
                child: Container(
                  width: 56,
                  height: 56,
                  color: p.subtle,
                  child: url == null
                      ? Icon(Icons.image_outlined, color: p.inkMuted)
                      : Image.network(url,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) =>
                              Icon(Icons.broken_image_outlined, color: p.inkMuted)),
                ),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(type.title(item).isEmpty ? '—' : type.title(item),
                      maxLines: 2, overflow: TextOverflow.ellipsis, style: context.text.titleSmall),
                  if (sub != null && sub.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(sub, maxLines: 2, overflow: TextOverflow.ellipsis, style: context.text.bodySmall),
                  ],
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      StatusPill(
                        item.isPublished
                            ? tr('contentAdmin.common.published')
                            : tr('contentAdmin.common.draft'),
                        tone: item.isPublished ? Tone.success : Tone.neutral,
                      ),
                      if (rating != null) StatusPill('★' * rating.clamp(0, 5), tone: Tone.warning, dot: false),
                      if (asBool(item.raw['featured']))
                        StatusPill(tr('contentAdmin.successStories.featured'), tone: Tone.violet, dot: false),
                    ],
                  ),
                ],
              ),
            ),
            if (busy)
              const SizedBox.square(dimension: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
            else
              Icon(Icons.more_vert_rounded, color: p.inkMuted),
          ],
        ),
      ),
    );
  }
}

/// Generic add/edit form driven by a [ContentType]'s field list.
class ContentFormScreen extends StatefulWidget {
  const ContentFormScreen({super.key, required this.type, this.item});
  final ContentType type;
  final ContentItem? item;

  @override
  State<ContentFormScreen> createState() => _ContentFormScreenState();
}

class _ContentFormScreenState extends State<ContentFormScreen> {
  static const _bookingLink = '#book-appointment'; // BOOKING_CTA_LINK on the web
  static const _socials = ['linkedin', 'twitter', 'facebook'];

  final _form = GlobalKey<FormState>();
  final _text = <String, TextEditingController>{};
  final _loc = <String, Map<String, TextEditingController>>{};
  final _social = <String, TextEditingController>{};
  final _dates = <String, DateTime?>{};
  final _bools = <String, bool>{};
  int _rating = 5;
  late String _status = widget.item?.status ?? 'draft';
  PickedUpload? _image;
  List<PickedUpload> _images = [];
  late List<String> _existingImages =
      widget.item == null ? [] : asStringList(widget.item!.raw[widget.type.imageField ?? '']);
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final item = widget.item;
    for (final f in widget.type.fields) {
      switch (f.kind) {
        case FieldKind.text || FieldKind.url:
          _text[f.key] = TextEditingController(text: item?.str(f.key) ?? (f.key == 'icon' ? '🌿' : ''));
        case FieldKind.localized || FieldKind.localizedMultiline:
          _loc[f.key] = TranslatableFieldRow.controllersFor(item?.loc(f.key));
        case FieldKind.localizedLines:
          final raw = asMap(item?.raw[f.key]) ?? const {};
          _loc[f.key] = {
            for (final l in I18n.languages)
              l.code: TextEditingController(text: asStringList(raw[l.code]).join('\n')),
          };
        case FieldKind.rating:
          _rating = asInt(item?.raw[f.key]) ?? 5;
        case FieldKind.toggle:
          _bools[f.key] = asBool(item?.raw[f.key]);
        case FieldKind.date:
          _dates[f.key] = asDate(item?.raw[f.key]);
        case FieldKind.social:
          final links = asMap(item?.raw[f.key]) ?? const {};
          for (final s in _socials) {
            _social[s] = TextEditingController(text: asString(links[s]) ?? '');
          }
      }
    }
  }

  @override
  void dispose() {
    for (final c in [..._text.values, ..._social.values, for (final m in _loc.values) ...m.values]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    final type = widget.type;
    final data = <String, dynamic>{'status': _status};
    for (final f in type.fields) {
      switch (f.kind) {
        case FieldKind.text || FieldKind.url:
          data[f.key] = _text[f.key]!.text.trim();
        case FieldKind.localized || FieldKind.localizedMultiline:
          data[f.key] = TranslatableFieldRow.valueOf(_loc[f.key]!);
        case FieldKind.localizedLines:
          data[f.key] = {
            for (final e in _loc[f.key]!.entries)
              e.key: e.value.text
                  .split('\n')
                  .map((s) => s.trim())
                  .where((s) => s.isNotEmpty)
                  .toList(),
          };
        case FieldKind.rating:
          data[f.key] = _rating;
        case FieldKind.toggle:
          data[f.key] = _bools[f.key] ?? false;
        case FieldKind.date:
          final d = _dates[f.key];
          data[f.key] = d == null ? null : Fmt.apiDate(d);
        case FieldKind.social:
          data[f.key] = {for (final s in _socials) s: _social[s]!.text.trim()};
      }
    }
    // Like SuccessStoryForm.jsx: new uploads replace the set, otherwise keep
    // whatever images were left.
    if (type.multiImage && _images.isEmpty) data[type.imageField!] = _existingImages;

    setState(() => _saving = true);
    try {
      await context.read<ClinicApi>().saveContent(
            type.resource,
            id: widget.item?.id,
            data: data,
            image: type.multiImage ? null : _image,
            images: type.multiImage ? _images : null,
          );
      Toast.success(widget.item == null ? type.t('createSuccess') : type.t('updateSuccess'));
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      Toast.error('${type.t('saveError')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _fieldWidget(ContentField f) {
    final label = f.labelKey.isEmpty ? '' : tr(f.labelKey);
    switch (f.kind) {
      case FieldKind.text:
        return TextFieldRow(
          label: label,
          controller: _text[f.key]!,
          optional: !f.required,
          validator: f.required
              ? (v) => Validators.required(v, tr('contentAdmin.common.requiredField'))
              : null,
        );
      case FieldKind.url:
        if (f.key == 'ctaLink') {
          final booking = _text[f.key]!.text.trim() == _bookingLink;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SwitchRow(
                label: tr('contentAdmin.banners.linkToBookingForm'),
                subtitle: tr('contentAdmin.banners.linkToBookingFormHint'),
                value: booking,
                onChanged: (v) => setState(() => _text[f.key]!.text = v ? _bookingLink : ''),
              ),
              if (!booking)
                TextFieldRow(
                  label: label,
                  controller: _text[f.key]!,
                  keyboardType: TextInputType.url,
                  optional: true,
                ),
            ],
          );
        }
        return TextFieldRow(
          label: label,
          controller: _text[f.key]!,
          keyboardType: TextInputType.url,
          optional: true,
        );
      case FieldKind.localized:
        return TranslatableFieldRow(label: label, controllers: _loc[f.key]!, required: f.required);
      case FieldKind.localizedMultiline || FieldKind.localizedLines:
        return TranslatableFieldRow(
            label: label, controllers: _loc[f.key]!, required: f.required, multiline: true);
      case FieldKind.rating:
        return FieldLabel(
          label,
          child: Row(
            children: [
              for (var i = 1; i <= 5; i++)
                IconButton(
                  icon: Icon(i <= _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: const Color(0xFFF2B33D), size: 30),
                  onPressed: () => setState(() => _rating = i),
                ),
            ],
          ),
        );
      case FieldKind.toggle:
        return SwitchRow(
          label: label,
          value: _bools[f.key] ?? false,
          onChanged: (v) => setState(() => _bools[f.key] = v),
        );
      case FieldKind.date:
        return DateFieldRow(
          label: label,
          value: _dates[f.key],
          onChanged: (d) => setState(() => _dates[f.key] = d),
        );
      case FieldKind.social:
        return Column(
          children: [
            for (final s in _socials)
              TextFieldRow(
                label: tr('contentAdmin.teamMembers.$s'),
                controller: _social[s]!,
                keyboardType: TextInputType.url,
                optional: true,
              ),
          ],
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final type = widget.type;
    final p = context.palette;
    return FormPage(
      title: widget.item == null ? type.t('addTitle') : type.t('editTitle'),
      subtitle: type.label,
      formKey: _form,
      saving: _saving,
      saveLabel: tr('common.save'),
      onSave: _save,
      children: [
        FormSection(
          children: [
            if (type.imageField != null && !type.multiImage)
              ImagePickRow(
                label: tr(type.imageLabelKey),
                buttonLabel: tr(type.imageLabelKey),
                currentPath: widget.item == null ? null : type.imagePath(widget.item!),
                picked: _image,
                circle: type.circleImage,
                onPicked: (f) => setState(() => _image = f),
              ),
            if (type.multiImage)
              FieldLabel(
                tr('contentAdmin.successStories.images'),
                optional: true,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_images.isNotEmpty || _existingImages.isNotEmpty)
                      SizedBox(
                        height: 76,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: [
                            for (final f in _images)
                              _Thumb(child: Image.memory(f.bytes!, fit: BoxFit.cover)),
                            if (_images.isEmpty)
                              for (final path in _existingImages)
                                _Thumb(
                                  onRemove: () => setState(() => _existingImages =
                                      _existingImages.where((x) => x != path).toList()),
                                  child: Image.network(AppConfig.fileUrl(path)!,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, _, _) =>
                                          Icon(Icons.broken_image_outlined, color: p.inkMuted)),
                                ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      icon: const Icon(Icons.add_photo_alternate_rounded, size: 18),
                      label: Text(tr('contentAdmin.common.uploadImage')),
                      onPressed: () async {
                        final files = await pickUploads(images: true, multiple: true);
                        if (files.isNotEmpty) {
                          setState(() => _images = files.take(8).toList());
                        }
                      },
                    ),
                  ],
                ),
              ),
            for (final f in type.fields) _fieldWidget(f),
            DropdownRow<String>(
              label: tr('contentAdmin.common.status'),
              value: _status,
              items: [
                ('draft', tr('contentAdmin.common.draft')),
                ('published', tr('contentAdmin.common.published')),
              ],
              onChanged: (v) => setState(() => _status = v ?? _status),
            ),
          ],
        ),
      ],
    );
  }
}

class _Thumb extends StatelessWidget {
  const _Thumb({required this.child, this.onRemove});
  final Widget child;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(width: 76, height: 76, child: child),
          ),
          if (onRemove != null)
            PositionedDirectional(
              top: 2,
              end: 2,
              child: InkWell(
                onTap: onRemove,
                child: const CircleAvatar(
                  radius: 11,
                  backgroundColor: Colors.black54,
                  child: Icon(Icons.close_rounded, size: 14, color: Colors.white),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
