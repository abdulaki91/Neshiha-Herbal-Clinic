import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/paged_state.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';
import 'medicine_form_screen.dart';

class MedicinesScreen extends StatefulWidget {
  const MedicinesScreen({super.key, this.pushed = false});
  final bool pushed;

  @override
  State<MedicinesScreen> createState() => _MedicinesScreenState();
}

class _MedicinesScreenState extends State<MedicinesScreen>
    with PagedLoad<MedicinesScreen, Medicine> {
  String _search = '';
  String? _status;

  @override
  List<String> get refreshOn => const ['medicine:dispensed', 'medicine:low-stock'];

  @override
  Future<Paged<Medicine>> fetchPage(int page) => context
      .read<ClinicApi>()
      .medicines(page: page, search: _search, status: _status);

  // Backend: doctors & data clerks create/edit; only doctors delete.
  String get _role => context.read<AuthController>().role;
  bool get _canEdit => _role == Roles.doctor || _role == Roles.dataClerk;
  bool get _canDelete => _role == Roles.doctor;

  Future<void> _openForm([Medicine? m]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => MedicineFormScreen(medicine: m)),
    );
    if (saved == true) refresh();
  }

  Future<void> _delete(Medicine m) async {
    final ok = await confirmAction(
      context,
      title: m.name,
      message: tr('medicines.toast.deleteConfirmation'),
      confirmLabel: tr('common.delete'),
      destructive: true,
    );
    if (!ok || !mounted) return;
    try {
      await context.read<ClinicApi>().deleteMedicine(m.id);
      Toast.success(tr('medicines.toast.deleteSuccess'));
      refresh();
    } catch (e) {
      Toast.error('${tr('medicines.toast.deleteError')}: ${ApiException.from(e).message}');
    }
  }

  void _actions(Medicine m) {
    if (!_canEdit) return;
    showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
                child: Text(m.name, style: ctx.text.titleMedium),
              ),
              ListTile(
                leading: const Icon(Icons.edit_rounded),
                title: Text(tr('common.edit')),
                onTap: () {
                  Navigator.pop(ctx);
                  _openForm(m);
                },
              ),
              if (_canDelete)
                ListTile(
                  leading: Icon(Icons.delete_outline_rounded, color: ctx.palette.danger),
                  title: Text(tr('common.delete'),
                      style: TextStyle(color: ctx.palette.danger)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _delete(m);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return TabPage(
      title: tr('medicines.title'),
      subtitle: tr('medicines.subtitle'),
      pushed: widget.pushed,
      fab: _canEdit
          ? GradientFab(
              label: tr('medicines.addButton'),
              icon: Icons.add_rounded,
              onPressed: _openForm,
            )
          : null,
      header: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: SearchField(
              hint: tr('medicines.search.placeholder'),
              onChanged: (v) {
                _search = v;
                refresh(showSpinner: true);
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: FilterChips<String?>(
              value: _status,
              items: [
                (null, tr('common.all')),
                ('available', tr('mobile.medicine.available')),
                ('low_stock', tr('mobile.medicine.lowStock')),
                ('out_of_stock', tr('mobile.medicine.outOfStock')),
                ('expired', tr('mobile.medicine.expired')),
              ],
              onChanged: (v) {
                setState(() => _status = v);
                refresh(showSpinner: true);
              },
            ),
          ),
        ],
      ),
      child: buildPaged(
        padding: TabPage.listPadding(context, widget.pushed, hasFab: _canEdit),
        empty: EmptyView(
          icon: Icons.local_florist_outlined,
          title: tr('medicines.empty'),
        ),
        itemBuilder: (context, m) => GestureDetector(
          onTap: () => _actions(m),
          child: _MedicineCard(medicine: m),
        ),
      ),
    );
  }
}

class _MedicineCard extends StatelessWidget {
  const _MedicineCard({required this.medicine});
  final Medicine medicine;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final m = medicine;
    final (label, tone) = m.isExpired
        ? (tr('mobile.medicine.expired'), Tone.danger)
        : m.isOut
            ? (tr('mobile.medicine.outOfStock'), Tone.danger)
            : m.isLow
                ? (tr('mobile.medicine.lowStock'), Tone.warning)
                : (tr('mobile.medicine.inStock'), Tone.success);
    final ratio = m.minimumStock <= 0
        ? 1.0
        : (m.availableQuantity / (m.minimumStock * 3)).clamp(0.0, 1.0);
    return GlassCard(
      radius: 22,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Brand.sage.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.eco_rounded, color: Brand.sage),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.strength == null ? m.name : '${m.name} · ${m.strength}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.text.titleSmall),
                    const SizedBox(height: 2),
                    Text(
                      [
                        ?m.code,
                        ?m.category,
                        if (m.dosageForm != null)
                          I18n.instance.maybe(
                                  'medicineForm.dosageForm.${m.dosageForm!.toLowerCase()}') ??
                              m.dosageForm!,
                      ].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
              if (m.sellingPrice != null)
                Text(Fmt.money(m.sellingPrice),
                    style: context.text.labelLarge
                        ?.copyWith(color: Theme.of(context).colorScheme.primary)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: ratio,
                    minHeight: 6,
                    color: tone.color(p),
                    backgroundColor: tone.color(p).withValues(alpha: 0.15),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(tr('mobile.medicine.left', {'count': m.availableQuantity}),
                  style: context.text.labelMedium?.copyWith(color: p.inkSoft)),
              const SizedBox(width: 10),
              StatusPill(label, tone: tone),
            ],
          ),
          if (m.expiryDate != null) ...[
            const SizedBox(height: 8),
            Text(tr('mobile.medicine.expires', {'date': Fmt.date(m.expiryDate)}),
                style: context.text.bodySmall),
          ],
        ],
      ),
    );
  }
}
