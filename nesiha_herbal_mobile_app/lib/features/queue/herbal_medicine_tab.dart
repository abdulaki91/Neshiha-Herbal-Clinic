import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/async_state.dart';
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

/// Prescribe herbal medicines for the current visit. Pending prescriptions
/// go to the cashier when the consultation is completed.
class HerbalMedicineTab extends StatefulWidget {
  const HerbalMedicineTab({super.key, required this.visit});
  final Visit visit;

  @override
  State<HerbalMedicineTab> createState() => _HerbalMedicineTabState();
}

class _HerbalMedicineTabState extends State<HerbalMedicineTab>
    with AsyncLoad<HerbalMedicineTab, List<Prescription>> {
  final _removing = <String>{};

  @override
  Future<List<Prescription>> fetch() =>
      context.read<ClinicApi>().prescriptions(visitId: widget.visit.id);

  Future<void> _add() async {
    final added = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _PrescribeSheet(visit: widget.visit),
    );
    if (added == true) reload(silent: true);
  }

  Future<void> _remove(Prescription rx) async {
    final ok = await confirmAction(context,
        title: tr('mobile.herbal.removeTitle'),
        message: tr('herbalMedicine.cancelConfirm'),
        confirmLabel: tr('mobile.herbal.remove'),
        destructive: true);
    if (!ok || !mounted) return;
    final api = context.read<ClinicApi>();
    setState(() => _removing.add(rx.id));
    try {
      await api.stopPrescription(rx.id);
      Toast.success(tr('herbalMedicine.cancelSuccess'));
      await reload(silent: true);
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _removing.remove(rx.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final list = (data ?? const <Prescription>[])
        .where((r) => r.status != 'stopped')
        .toList();
    final pendingTotal = list
        .where((r) => r.status == 'pending')
        .fold<double>(0, (s, r) => s + r.totalAmount);

    if (loading && data == null) return const LoadingView();
    if (error != null && data == null) {
      return ErrorView(message: error!, onRetry: reload);
    }
    return RefreshIndicator(
      onRefresh: () => reload(silent: true),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        children: [
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tr('herbalMedicine.listTitle'), style: context.text.titleMedium),
                      const SizedBox(height: 2),
                      Text(
                        list.isEmpty
                            ? tr('herbalMedicine.emptyList')
                            : tr('mobile.herbal.toPay', {'amount': Fmt.money(pendingTotal)}),
                        style: context.text.bodySmall,
                      ),
                    ],
                  ),
                ),
                FilledButton.icon(
                  onPressed: _add,
                  icon: const Icon(Icons.add_rounded, size: 19),
                  label: Text(tr('mobile.common.add')),
                  style: FilledButton.styleFrom(
                    backgroundColor: Brand.b600,
                    foregroundColor: Colors.white,
                    shape: const StadiumBorder(),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (list.isEmpty)
            EmptyView(
              icon: Icons.local_florist_outlined,
              title: tr('herbalMedicine.emptyList'),
              subtitle: tr('mobile.herbal.emptyHint'),
            )
          else
            for (final rx in list)
              GlassCard(
                margin: const EdgeInsets.only(bottom: 10),
                radius: 20,
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 42,
                      height: 42,
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
                          Text(rx.medicineName, style: context.text.titleSmall),
                          const SizedBox(height: 3),
                          Text('${rx.quantity} × ${Fmt.money(rx.unitPrice)}',
                              style: context.text.bodySmall),
                          if (rx.instructions != null) ...[
                            const SizedBox(height: 6),
                            Text(rx.instructions!,
                                style: context.text.bodySmall?.copyWith(
                                    color: p.inkSoft, fontStyle: FontStyle.italic)),
                          ],
                          const SizedBox(height: 8),
                          StatusPill(Prescription.statusLabel(rx.status),
                              tone: prescriptionTone(rx.status)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(Fmt.money(rx.totalAmount),
                            style: context.text.titleSmall?.copyWith(
                                color: Theme.of(context).colorScheme.primary)),
                        if (rx.status == 'pending')
                          IconButton(
                            tooltip: tr('mobile.herbal.remove'),
                            onPressed: _removing.contains(rx.id)
                                ? null
                                : () => _remove(rx),
                            icon: Icon(Icons.delete_outline_rounded,
                                color: p.danger),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}

class _PrescribeSheet extends StatefulWidget {
  const _PrescribeSheet({required this.visit});
  final Visit visit;

  @override
  State<_PrescribeSheet> createState() => _PrescribeSheetState();
}

class _PrescribeSheetState extends State<_PrescribeSheet>
    with PagedLoad<_PrescribeSheet, Medicine> {
  String _search = '';
  Medicine? _medicine;
  final _price = TextEditingController();
  final _instructions = TextEditingController();
  int _qty = 1;
  bool _saving = false;

  @override
  Future<Paged<Medicine>> fetchPage(int page) => context
      .read<ClinicApi>()
      .medicines(page: page, pageSize: 50, search: _search);

  @override
  void dispose() {
    _price.dispose();
    _instructions.dispose();
    super.dispose();
  }

  double get _unit => double.tryParse(_price.text) ?? 0;
  double get _total => _unit * _qty;

  void _choose(Medicine m) => setState(() {
        _medicine = m;
        _price.text = m.sellingPrice?.toStringAsFixed(2) ?? '';
        _qty = 1;
      });

  Future<void> _save() async {
    final m = _medicine!;
    if (_qty <= 0) return Toast.error(tr('herbalMedicine.quantityError'));
    final auth = context.read<AuthController>();
    final api = context.read<ClinicApi>();
    setState(() => _saving = true);
    try {
      await api.createPrescription({
        'visitId': widget.visit.id,
        'patientId': widget.visit.patient?.id,
        'medicineId': m.id,
        'doctorId': auth.user?.id,
        'quantity': _qty,
        'unitPrice': _unit,
        'totalAmount': double.parse(_total.toStringAsFixed(2)),
        // Fixed defaults, as on the web (see Frontend/src/lib/prescriptionLabels.js)
        'dosage': 'As prescribed',
        'frequency': 'As directed',
        'route': 'oral',
        'instructions': _instructions.text.trim(),
        'prescribedDate': DateTime.now().toUtc().toIso8601String(),
      });
      Toast.success(tr('herbalMedicine.prescribeSuccess'));
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inset = MediaQuery.viewInsetsOf(context).bottom;
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.88,
      child: Padding(
        padding: EdgeInsets.only(bottom: inset),
        child: _medicine == null ? _picker(context) : _details(context),
      ),
    );
  }

  Widget _picker(BuildContext context) {
    final p = context.palette;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(trl('herbalMedicine.selectLabel'), style: context.text.titleLarge),
              const SizedBox(height: 12),
              SearchField(
                hint: tr('medicines.search.placeholder'),
                onChanged: (v) {
                  _search = v;
                  refresh(showSpinner: true);
                },
              ),
            ],
          ),
        ),
        Expanded(
          child: buildPaged(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            spacing: 8,
            empty: EmptyView(
              icon: Icons.search_off_rounded,
              title: tr('medicines.empty'),
            ),
            itemBuilder: (context, m) {
              final out = m.isOut || m.isExpired;
              return Opacity(
                opacity: out ? 0.5 : 1,
                child: GlassCard(
                  radius: 18,
                  padding: const EdgeInsets.all(12),
                  onTap: out ? null : () => _choose(m),
                  child: Row(
                    children: [
                      const Icon(Icons.eco_rounded, color: Brand.sage),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                                m.strength == null ? m.name : '${m.name} · ${m.strength}',
                                style: context.text.titleSmall),
                            Text(
                              m.isExpired
                                  ? tr('mobile.medicine.expired')
                                  : out
                                      ? tr('mobile.medicine.outOfStock')
                                      : tr('mobile.medicine.inStockCount', {'count': m.availableQuantity}),
                              style: context.text.bodySmall?.copyWith(
                                  color: out || m.isLow ? p.danger : null),
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
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _details(BuildContext context) {
    final p = context.palette;
    final m = _medicine!;
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
            children: [
              Text(tr('herbalMedicine.prescribeTitle'), style: context.text.titleLarge),
              const SizedBox(height: 14),
              GlassCard(
                radius: 18,
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    const Icon(Icons.eco_rounded, color: Brand.sage, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(m.name, style: context.text.titleMedium),
                          Text(
                            [
                              if (m.strength != null) m.strength!,
                              tr('mobile.medicine.inStockCount', {'count': m.availableQuantity}),
                            ].join(' · '),
                            style: context.text.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => setState(() => _medicine = null),
                      child: Text(tr('mobile.common.change')),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: FieldLabel(trl('herbalMedicine.unitPriceLabel'),
                        child: TextField(
                          controller: _price,
                          keyboardType:
                              const TextInputType.numberWithOptions(decimal: true),
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                          ],
                          onChanged: (_) => setState(() {}),
                        )),
                  ),
                  const SizedBox(width: 12),
                  FieldLabel(
                    trl('herbalMedicine.quantityLabel'),
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(
                        color: p.subtle,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: p.divider),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: _qty > 1 ? () => setState(() => _qty--) : null,
                            icon: const Icon(Icons.remove_rounded),
                          ),
                          SizedBox(
                            width: 34,
                            child: Text('$_qty',
                                textAlign: TextAlign.center,
                                style: context.text.titleMedium),
                          ),
                          IconButton(
                            onPressed: _qty < m.availableQuantity
                                ? () => setState(() => _qty++)
                                : null,
                            icon: const Icon(Icons.add_rounded),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              FieldLabel(trl('herbalMedicine.instructionsLabel').replaceAll(RegExp(r's*(.*)'), ''),
                  optional: true,
                  child: TextField(
                    controller: _instructions,
                    minLines: 2,
                    maxLines: 4,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: InputDecoration(
                        hintText: tr('herbalMedicine.instructionsPlaceholder')),
                  )),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [
                    Brand.b500.withValues(alpha: p.isDark ? 0.25 : 0.12),
                    Brand.a400.withValues(alpha: p.isDark ? 0.2 : 0.1),
                  ]),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  children: [
                    Expanded(child: Text(tr('herbalMedicine.totalLabel'), style: context.text.titleSmall)),
                    Text(Fmt.money(_total), style: context.text.headlineSmall),
                  ],
                ),
              ),
            ],
          ),
        ),
        SafeArea(
          top: false,
          minimum: const EdgeInsets.fromLTRB(20, 4, 20, 16),
          child: GradientButton(
            label: tr('herbalMedicine.saveButton'),
            icon: Icons.check_rounded,
            loading: _saving,
            onPressed: _save,
          ),
        ),
      ],
    );
  }
}
