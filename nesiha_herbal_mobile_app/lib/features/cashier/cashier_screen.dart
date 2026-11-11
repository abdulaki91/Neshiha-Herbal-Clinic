import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/async_state.dart';
import '../../core/format.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';

class CashierScreen extends StatefulWidget {
  const CashierScreen({super.key, this.pushed = false});
  final bool pushed;

  @override
  State<CashierScreen> createState() => _CashierScreenState();
}

class _CashierScreenState extends State<CashierScreen> {
  int _tab = 0;
  final _recentKey = GlobalKey<_RecentPaymentsState>();

  @override
  Widget build(BuildContext context) {
    return TabPage(
      title: 'Cashier',
      subtitle: 'Receive payments & dispense medicine',
      pushed: widget.pushed,
      header: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        child: Segmented<int>(
          value: _tab,
          onChanged: (v) {
            setState(() => _tab = v);
            if (v == 1) _recentKey.currentState?.reload(silent: true);
          },
          items: const [
            (0, 'Pending', Icons.pending_actions_rounded),
            (1, 'Recent', Icons.history_rounded),
          ],
        ),
      ),
      child: IndexedStack(
        index: _tab,
        children: [
          _PendingPayments(pushed: widget.pushed),
          _RecentPayments(key: _recentKey, pushed: widget.pushed),
        ],
      ),
    );
  }
}

class _PendingPayments extends StatefulWidget {
  const _PendingPayments({required this.pushed});
  final bool pushed;

  @override
  State<_PendingPayments> createState() => _PendingPaymentsState();
}

class _PendingPaymentsState extends State<_PendingPayments>
    with AsyncLoad<_PendingPayments, List<Visit>> {
  String _search = '';

  @override
  List<String> get refreshOn =>
      const ['visit:status-changed', 'prescription:created', 'payment:completed'];

  @override
  Duration? get pollEvery => const Duration(seconds: 15);

  @override
  Future<List<Visit>> fetch() =>
      context.read<ClinicApi>().pendingPayments(search: _search);

  Future<void> _pay(Visit v) async {
    final paid = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _PaymentSheet(visit: v),
    );
    if (paid == true) reload(silent: true);
  }

  @override
  Widget build(BuildContext context) {
    final list = data ?? const <Visit>[];
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: SearchField(
            hint: 'Search by patient name or ID',
            onChanged: (v) {
              _search = v;
              reload();
            },
          ),
        ),
        Expanded(
          child: loading && data == null
              ? const LoadingView()
              : error != null && data == null
                  ? ErrorView(message: error!, onRetry: reload)
                  : RefreshIndicator(
                      onRefresh: () => reload(silent: true),
                      child: list.isEmpty
                          ? ListView(
                              padding: TabPage.listPadding(context, widget.pushed),
                              children: const [
                                EmptyView(
                                  icon: Icons.verified_rounded,
                                  title: 'No pending payments',
                                  subtitle:
                                      'Completed consultations with prescriptions appear here.',
                                ),
                              ],
                            )
                          : ListView.separated(
                              padding: TabPage.listPadding(context, widget.pushed),
                              itemCount: list.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (context, i) => _BillCard(
                                visit: list[i],
                                onPay: () => _pay(list[i]),
                              ),
                            ),
                    ),
        ),
      ],
    );
  }
}

double _billTotal(Visit v) =>
    v.prescriptions.fold<double>(0, (s, p) => s + p.totalAmount);

class _BillCard extends StatelessWidget {
  const _BillCard({required this.visit, required this.onPay});
  final Visit visit;
  final VoidCallback onPay;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final patient = visit.patient;
    return GlassCard(
      radius: 24,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              InitialsAvatar(patient?.initials ?? '?', size: 46),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(patient?.fullName ?? '—', style: context.text.titleMedium),
                    const SizedBox(height: 2),
                    Text(
                      [
                        patient?.patientId ?? '',
                        '#${visit.visitNumber}',
                        if (visit.doctor != null) 'Dr. ${visit.doctor!.fullName}',
                      ].where((e) => e.isNotEmpty).join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (final rx in visit.prescriptions)
            Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: p.subtle,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          rx.medicine?.strength == null
                              ? rx.medicineName
                              : '${rx.medicineName} (${rx.medicine!.strength})',
                          style: context.text.titleSmall,
                        ),
                        Text('Qty ${rx.quantity} × ${Fmt.money(rx.unitPrice)}',
                            style: context.text.bodySmall),
                        if (rx.instructions != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(rx.instructions!,
                                style: context.text.bodySmall?.copyWith(
                                    color: p.info, fontStyle: FontStyle.italic)),
                          ),
                      ],
                    ),
                  ),
                  Text(Fmt.money(rx.totalAmount), style: context.text.labelLarge),
                ],
              ),
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total due', style: context.text.bodySmall),
                    Text(Fmt.money(_billTotal(visit)),
                        style: context.text.titleLarge?.copyWith(
                            color: Theme.of(context).colorScheme.primary)),
                  ],
                ),
              ),
              GradientButton(
                label: 'Receive',
                icon: Icons.payments_rounded,
                expand: false,
                height: 48,
                onPressed: onPay,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PaymentSheet extends StatefulWidget {
  const _PaymentSheet({required this.visit});
  final Visit visit;

  @override
  State<_PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends State<_PaymentSheet> {
  String _method = 'cash';
  final _txn = TextEditingController();
  final _notes = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _txn.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final total = _billTotal(widget.visit);
    final api = context.read<ClinicApi>();
    setState(() => _saving = true);
    try {
      await api.processPayment(widget.visit.id, {
        'amount': double.parse(total.toStringAsFixed(2)),
        'paymentMethod': _method,
        'transactionId': _txn.text.trim(),
        'notes': _notes.text.trim(),
      });
      Toast.success('Payment received — medicine dispensed');
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final total = _billTotal(widget.visit);
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Receive payment', style: context.text.titleLarge),
            const SizedBox(height: 4),
            Text(widget.visit.patient?.fullName ?? '',
                style: context.text.bodyMedium?.copyWith(color: p.inkMuted)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 22),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: p.heroGradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
              ),
              child: Column(
                children: [
                  Text('Amount due',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(Fmt.money(total),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w300,
                          letterSpacing: -1)),
                  Text(
                      '${widget.visit.prescriptions.length} ${widget.visit.prescriptions.length == 1 ? 'item' : 'items'}',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8))),
                ],
              ),
            ),
            const SizedBox(height: 18),
            FieldLabel(
              'Payment method',
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final (v, l, i) in const [
                    ('cash', 'Cash', Icons.payments_rounded),
                    ('transfer', 'Bank transfer', Icons.account_balance_rounded),
                    ('mobile_money', 'Mobile money', Icons.phone_iphone_rounded),
                    ('other', 'Other', Icons.more_horiz_rounded),
                  ])
                    ChoicePill(
                      label: l,
                      icon: i,
                      selected: _method == v,
                      onTap: () => setState(() => _method = v),
                    ),
                ],
              ),
            ),
            if (_method != 'cash')
              FieldLabel('Transaction ID',
                  optional: true,
                  child: TextField(
                    controller: _txn,
                    decoration: const InputDecoration(
                        hintText: 'Reference from Telebirr / CBE Birr / bank'),
                  )),
            FieldLabel('Notes',
                optional: true,
                child: TextField(controller: _notes, maxLines: 2)),
            const SizedBox(height: 4),
            GradientButton(
              label: 'Confirm ${Fmt.money(total)}',
              icon: Icons.check_circle_rounded,
              loading: _saving,
              onPressed: _confirm,
            ),
          ],
        ),
      ),
    );
  }
}

class _RecentPayments extends StatefulWidget {
  const _RecentPayments({super.key, required this.pushed});
  final bool pushed;

  @override
  State<_RecentPayments> createState() => _RecentPaymentsState();
}

class _RecentPaymentsState extends State<_RecentPayments>
    with AsyncLoad<_RecentPayments, List<Payment>> {
  @override
  List<String> get refreshOn => const ['payment:completed'];

  @override
  Future<List<Payment>> fetch() => context.read<ClinicApi>().paymentHistory();

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final list = data ?? const <Payment>[];
    if (loading && data == null) return const LoadingView();
    if (error != null && data == null) {
      return ErrorView(message: error!, onRetry: reload);
    }
    return RefreshIndicator(
      onRefresh: () => reload(silent: true),
      child: ListView.separated(
        padding: TabPage.listPadding(context, widget.pushed),
        itemCount: list.isEmpty ? 1 : list.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, i) {
          if (list.isEmpty) {
            return const EmptyView(
              icon: Icons.receipt_long_rounded,
              title: 'No payments yet',
            );
          }
          final pay = list[i];
          return GlassCard(
            radius: 20,
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: p.success.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(Icons.receipt_rounded, color: p.success),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(pay.patient?.fullName ?? pay.paymentNumber,
                          style: context.text.titleSmall),
                      const SizedBox(height: 2),
                      Text(
                        '${pay.paymentNumber} · ${Payment.methodLabel(pay.method)}',
                        style: context.text.bodySmall,
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(Fmt.money(pay.amount),
                        style: context.text.titleSmall?.copyWith(
                            color: Theme.of(context).colorScheme.primary)),
                    const SizedBox(height: 2),
                    Text(Fmt.dateTime(pay.paidAt), style: context.text.bodySmall),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
