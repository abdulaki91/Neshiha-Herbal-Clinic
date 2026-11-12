import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/async_state.dart';
import '../../core/format.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/form_fields.dart';
import '../../widgets/tab_page.dart';

/// Prescriptions by status with dispensing — the mobile PharmacyPage.jsx.
///
/// Dispensing uses `POST /prescriptions/:id/dispense` (doctor or cashier),
/// which takes the stock out of inventory in one transaction. (The web
/// page's older two-call flow targets a `PUT /prescriptions/:id` route the
/// backend doesn't have.)
class PharmacyScreen extends StatefulWidget {
  const PharmacyScreen({super.key, this.pushed = true});
  final bool pushed;

  @override
  State<PharmacyScreen> createState() => _PharmacyScreenState();
}

class _PharmacyScreenState extends State<PharmacyScreen>
    with AsyncLoad<PharmacyScreen, List<Prescription>> {
  String _status = 'paid';
  String _search = '';

  @override
  Future<List<Prescription>> fetch() =>
      context.read<ClinicApi>().pharmacyPrescriptions(status: _status);

  @override
  List<String> get refreshOn =>
      const ['prescription:created', 'medicine:dispensed', 'payment:completed'];

  bool get _canDispense {
    final role = context.read<AuthController>().role;
    return role == Roles.doctor || role == Roles.cashier;
  }

  List<Prescription> get _filtered {
    final term = _search.trim().toLowerCase();
    final all = data ?? const <Prescription>[];
    if (term.isEmpty) return all;
    return all.where((rx) {
      final p = rx.patient ?? rx.visit?.patient;
      return [p?.fullName ?? '', p?.patientId ?? '', rx.medicineName]
          .any((s) => s.toLowerCase().contains(term));
    }).toList();
  }

  Future<void> _dispense(Prescription rx) async {
    final done = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _DispenseSheet(prescription: rx),
    );
    if (done == true) reload(silent: true);
  }

  @override
  Widget build(BuildContext context) {
    final list = _filtered;
    return TabPage(
      title: tr('pharmacy.title'),
      subtitle: tr('pharmacy.subtitle'),
      pushed: widget.pushed,
      header: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: SearchField(
              hint: tr('pharmacy.search.placeholder'),
              debounce: const Duration(milliseconds: 150),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: FilterChips<String>(
              value: _status,
              items: [
                for (final s in ['paid', 'pending', 'dispensed', 'completed'])
                  (s, tr('pharmacy.filters.$s')),
              ],
              onChanged: (v) {
                setState(() => _status = v);
                reload();
              },
            ),
          ),
        ],
      ),
      child: Builder(builder: (context) {
        if (loading && data == null) return const LoadingView();
        if (error != null && data == null) {
          return ErrorView(message: error!, onRetry: reload);
        }
        if (list.isEmpty) {
          return EmptyView(
            icon: Icons.medication_outlined,
            title: _search.isNotEmpty
                ? tr('pharmacy.empty.search')
                : tr('pharmacy.empty.status',
                    {'status': tr('pharmacy.filters.$_status').toLowerCase()}),
          );
        }
        return RefreshIndicator(
          onRefresh: () => reload(silent: true),
          child: ListView.separated(
            padding: TabPage.listPadding(context, widget.pushed),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _RxCard(
              prescription: list[i],
              onDispense: _canDispense &&
                      (list[i].status == 'paid' || list[i].status == 'pending')
                  ? () => _dispense(list[i])
                  : null,
            ),
          ),
        );
      }),
    );
  }
}

class _RxCard extends StatelessWidget {
  const _RxCard({required this.prescription, this.onDispense});
  final Prescription prescription;
  final VoidCallback? onDispense;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final rx = prescription;
    final patient = rx.patient ?? rx.visit?.patient;
    return GlassCard(
      radius: 22,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (patient != null) ...[
            Row(
              children: [
                InitialsAvatar(patient.initials, size: 34),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(patient.fullName, style: context.text.titleSmall),
                      Text(patient.patientId, style: context.text.bodySmall),
                    ],
                  ),
                ),
                StatusPill(Prescription.statusLabel(rx.status),
                    tone: prescriptionTone(rx.status)),
              ],
            ),
            const SizedBox(height: 12),
          ],
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Brand.sage.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: const Icon(Icons.eco_rounded, color: Brand.sage, size: 21),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rx.medicine?.strength == null
                          ? rx.medicineName
                          : '${rx.medicineName} · ${rx.medicine!.strength}',
                      style: context.text.titleSmall,
                    ),
                    Text(
                      [
                        '${tr('pharmacy.prescription.quantity')}: ${rx.quantity}',
                        if (rx.dosage != null) '${tr('pharmacy.prescription.dosage')}: ${rx.dosage}',
                        if (rx.frequency != null)
                          '${tr('pharmacy.prescription.frequency')}: ${rx.frequency}',
                        if (rx.duration != null)
                          '${tr('pharmacy.prescription.duration')}: ${rx.duration}',
                      ].join(' · '),
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
              Text(Fmt.money(rx.totalAmount),
                  style: context.text.labelLarge
                      ?.copyWith(color: Theme.of(context).colorScheme.primary)),
            ],
          ),
          if (rx.instructions != null) ...[
            const SizedBox(height: 8),
            Text('${tr('pharmacy.prescription.instructions')} ${rx.instructions}',
                style: context.text.bodySmall),
          ],
          const SizedBox(height: 8),
          Text(
            rx.status == 'dispensed' && rx.dispensedDate != null
                ? '${tr('pharmacy.status.dispensed')} · ${Fmt.dateTime(rx.dispensedDate)}'
                : '${tr('pharmacy.prescription.prescribed')} ${Fmt.date(rx.prescribedDate)}',
            style: context.text.bodySmall?.copyWith(color: p.inkMuted),
          ),
          if (onDispense != null) ...[
            const SizedBox(height: 12),
            GradientButton(
              label: tr('pharmacy.actions.dispense'),
              icon: Icons.local_pharmacy_rounded,
              height: 46,
              onPressed: onDispense,
            ),
          ],
        ],
      ),
    );
  }
}

class _DispenseSheet extends StatefulWidget {
  const _DispenseSheet({required this.prescription});
  final Prescription prescription;

  @override
  State<_DispenseSheet> createState() => _DispenseSheetState();
}

class _DispenseSheetState extends State<_DispenseSheet> {
  final _form = GlobalKey<FormState>();
  late final _qty = TextEditingController(text: '${widget.prescription.quantity}');
  bool _saving = false;

  @override
  void dispose() {
    _qty.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await context
          .read<ClinicApi>()
          .dispensePrescription(widget.prescription.id, quantity: int.parse(_qty.text.trim()));
      Toast.success(tr('pharmacy.toast.dispenseSuccess'));
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      Toast.error('${tr('pharmacy.toast.dispenseError')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final rx = widget.prescription;
    final stock = rx.medicine?.availableQuantity;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(tr('pharmacy.dispenseModal.title'), style: context.text.titleLarge),
              const SizedBox(height: 14),
              FormSection(
                title: tr('pharmacy.dispenseModal.prescriptionDetails'),
                children: [
                  DetailLine(tr('common.patient'), (rx.patient ?? rx.visit?.patient)?.fullName),
                  DetailLine(tr('pharmacy.prescription.medicineFallback'), rx.medicineName),
                  DetailLine(tr('pharmacy.dispenseModal.prescribedQuantity'), '${rx.quantity}'),
                  if (stock != null)
                    DetailLine(trl('medicines.card.inStock'), '$stock'),
                ],
              ),
              NumberFieldRow(
                label: trl('pharmacy.dispenseModal.quantityToDispense'),
                controller: _qty,
                optional: false,
                validator: (v) {
                  final n = int.tryParse((v ?? '').trim());
                  if (n == null || n <= 0) return tr('pharmacy.toast.invalidQuantity');
                  if (n > rx.quantity) return tr('mobile.pharmacy.exceedsPrescribed');
                  return null;
                },
              ),
              const SizedBox(height: 4),
              GradientButton(
                label: tr('pharmacy.dispenseModal.confirm'),
                icon: Icons.check_rounded,
                loading: _saving,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
