import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/async_state.dart';
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

/// Doctor-only revenue report — the mobile DoctorReportsPage.jsx:
/// consultation/prescription payments plus registration fees, by day and by
/// payment method, for a day, week or month.
class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key, this.pushed = true});
  final bool pushed;

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with AsyncLoad<ReportsScreen, Map<String, dynamic>> {
  String _period = 'daily';
  DateTime _date = DateTime.now();

  @override
  Future<Map<String, dynamic>> fetch() =>
      context.read<ClinicApi>().revenueReport(_period, _date);

  @override
  List<String> get refreshOn => const ['payment:completed', 'registration-fee:collected'];

  String get _periodLabel => switch (_period) {
        'weekly' => tr('cashierReports.periodLabels.thisWeek'),
        'monthly' => tr('cashierReports.periodLabels.thisMonth'),
        _ => tr('cashierReports.periodLabels.today'),
      };

  @override
  Widget build(BuildContext context) {
    final r = data;
    return TabPage(
      title: tr('sidebar.reports'),
      subtitle: tr('mobile.reports.subtitle'),
      pushed: widget.pushed,
      header: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        child: Column(
          children: [
            Segmented<String>(
              value: _period,
              onChanged: (v) {
                setState(() => _period = v);
                reload();
              },
              items: [
                ('daily', tr('cashierReports.periods.daily'), Icons.today_rounded),
                ('weekly', tr('cashierReports.periods.weekly'), Icons.view_week_rounded),
                ('monthly', tr('cashierReports.periods.monthly'), Icons.calendar_month_rounded),
              ],
            ),
            const SizedBox(height: 10),
            PickerBox(
              icon: Icons.event_rounded,
              text: Fmt.date(_date),
              placeholder: '',
              onTap: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (d != null) {
                  setState(() => _date = d);
                  reload();
                }
              },
            ),
          ],
        ),
      ),
      child: Builder(builder: (context) {
        if (loading && r == null) return const LoadingView();
        if (error != null && r == null) return ErrorView(message: error!, onRetry: reload);
        if (r == null) {
          return EmptyView(icon: Icons.bar_chart_rounded, title: tr('cashierReports.empty.report'));
        }
        final s = asMap(r['summary']) ?? const {};
        final days = asMapList(r['revenueByDay']);
        final payments = asMapList(r['payments']).map(Payment.new).toList();
        final fees = asMapList(r['registrationFees']);
        return RefreshIndicator(
          onRefresh: () => reload(silent: true),
          child: ListView(
            padding: TabPage.listPadding(context, widget.pushed),
            children: [
              _HeroTotal(
                total: asDouble(s['grandTotal']) ?? 0,
                caption:
                    '$_periodLabel · ${Fmt.date(asDate(r['startDate']))} – ${Fmt.date(asDate(r['endDate']))}',
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _Tile(
                      label: tr('mobile.reports.consultation'),
                      value: Fmt.money(asDouble(s['consultationRevenue'])),
                      sub: tr('mobile.reports.paymentsCount', {'count': asInt(s['totalPayments']) ?? 0}),
                      swatch: _ChartColors.of(context).consultation,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _Tile(
                      label: tr('mobile.reports.registration'),
                      value: Fmt.money(asDouble(s['registrationFeeRevenue'])),
                      sub: tr('mobile.reports.registrationsCount',
                          {'count': asInt(s['totalRegistrations']) ?? 0}),
                      swatch: _ChartColors.of(context).registration,
                    ),
                  ),
                ],
              ),
              if (days.length > 1) ...[
                const SizedBox(height: 18),
                SectionTitle(tr('mobile.reports.byDay')),
                _RevenueChart(days: days),
              ],
              if (days.isNotEmpty) ...[
                const SizedBox(height: 12),
                _DayTable(days: days),
              ],
              const SizedBox(height: 18),
              _MethodBreakdown(
                title: tr('cashierReports.byPaymentMethod'),
                byMethod: asMap(s['byPaymentMethod']) ?? const {},
              ),
              const SizedBox(height: 18),
              SectionTitle('${tr('cashierReports.paymentTransactions')} (${payments.length})'),
              if (payments.isEmpty)
                _Empty(tr('cashierReports.empty.payments'))
              else
                GlassCard(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: [
                      for (final pay in payments)
                        ListTile(
                          dense: true,
                          title: Text(pay.patient?.fullName ?? pay.paymentNumber),
                          subtitle: Text(
                              '${pay.paymentNumber} · ${Payment.methodLabel(pay.method)} · ${Fmt.dateTime(pay.paidAt)}'),
                          trailing: Text(Fmt.money(pay.amount),
                              style: context.text.labelLarge),
                        ),
                    ],
                  ),
                ),
              const SizedBox(height: 18),
              _MethodBreakdown(
                title: '${tr('mobile.reports.registration')} · ${tr('cashierReports.byPaymentMethod')}',
                byMethod: asMap(s['registrationByPaymentMethod']) ?? const {},
              ),
              const SizedBox(height: 18),
              SectionTitle('${tr('mobile.reports.registrationFees')} (${fees.length})'),
              if (fees.isEmpty)
                _Empty(tr('mobile.reports.noRegistrations'))
              else
                GlassCard(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    children: [
                      for (final f in fees)
                        ListTile(
                          dense: true,
                          title: Text(Patient.maybe(f['patient'])?.fullName ?? '—'),
                          subtitle: Text(
                              '${Payment.methodLabel(asString(f['paymentMethod']))} · ${Fmt.dateTime(asDate(f['paidAt']))}'),
                          trailing: Text(Fmt.money(asDouble(f['amount'])),
                              style: context.text.labelLarge),
                        ),
                    ],
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }
}

/// Two series colours, validated with the dataviz palette checker
/// (CVD separation, normal-vision floor, lightness band) per theme.
class _ChartColors {
  const _ChartColors(this.consultation, this.registration);
  final Color consultation;
  final Color registration;

  static _ChartColors of(BuildContext context) => context.palette.isDark
      ? const _ChartColors(Color(0xFF6E6CC4), Color(0xFFC8689F))
      : const _ChartColors(Color(0xFF6260B0), Color(0xFFCA88B9));
}

class _HeroTotal extends StatelessWidget {
  const _HeroTotal({required this.total, required this.caption});
  final double total;
  final String caption;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: Brand.primaryGradient,
        borderRadius: BorderRadius.circular(26),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('cashierReports.cards.totalRevenue'),
              style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(Fmt.money(total),
              style: const TextStyle(
                  color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(caption, style: const TextStyle(color: Colors.white70, fontSize: 12.5)),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.label, required this.value, required this.sub, required this.swatch});
  final String label;
  final String value;
  final String sub;
  final Color swatch;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      radius: 20,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                  width: 10,
                  height: 10,
                  decoration:
                      BoxDecoration(color: swatch, borderRadius: BorderRadius.circular(3))),
              const SizedBox(width: 6),
              Expanded(
                  child: Text(label,
                      maxLines: 1, overflow: TextOverflow.ellipsis, style: context.text.labelMedium)),
            ],
          ),
          const SizedBox(height: 6),
          FittedBox(
              fit: BoxFit.scaleDown,
              alignment: AlignmentDirectional.centerStart,
              child: Text(value, style: context.text.titleMedium)),
          Text(sub, style: context.text.bodySmall),
        ],
      ),
    );
  }
}

/// Stacked bars per day: consultation (bottom) + registration fees (top),
/// 2px surface gap between segments, rounded data-ends, legend above and a
/// tap-to-inspect readout (the table below is the accessible view).
class _RevenueChart extends StatefulWidget {
  const _RevenueChart({required this.days});
  final List<Map<String, dynamic>> days;

  @override
  State<_RevenueChart> createState() => _RevenueChartState();
}

class _RevenueChartState extends State<_RevenueChart> {
  int? _selected;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final c = _ChartColors.of(context);
    final days = widget.days;
    final maxTotal = days
        .map((d) => asDouble(d['total']) ?? 0)
        .fold<double>(0, (a, b) => a > b ? a : b);
    final sel = _selected == null ? null : days[_selected!];
    return GlassCard(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 14,
            children: [
              _LegendItem(color: c.consultation, label: tr('mobile.reports.consultation')),
              _LegendItem(color: c.registration, label: tr('mobile.reports.registration')),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 44,
            child: sel == null
                ? Text(tr('mobile.reports.tapBar'), style: context.text.bodySmall?.copyWith(color: p.inkMuted))
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${Fmt.date(asDate(sel['day']))} · ${Fmt.money(asDouble(sel['total']))}',
                          style: context.text.titleSmall),
                      Text(
                        '${tr('mobile.reports.consultation')} ${Fmt.money(asDouble(sel['consultationRevenue']))}'
                        ' · ${tr('mobile.reports.registration')} ${Fmt.money(asDouble(sel['registrationFeeRevenue']))}',
                        style: context.text.bodySmall,
                      ),
                    ],
                  ),
          ),
          SizedBox(
            height: 150,
            child: LayoutBuilder(builder: (context, box) {
              final slot = box.maxWidth / days.length;
              final barW = (slot * 0.62).clamp(4.0, 28.0);
              return Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  for (var i = 0; i < days.length; i++)
                    GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => setState(() => _selected = _selected == i ? null : i),
                      child: SizedBox(
                        width: slot,
                        height: box.maxHeight,
                        child: Align(
                          alignment: Alignment.bottomCenter,
                          child: _Bar(
                            width: barW,
                            maxHeight: box.maxHeight,
                            maxTotal: maxTotal,
                            consultation: asDouble(days[i]['consultationRevenue']) ?? 0,
                            registration: asDouble(days[i]['registrationFeeRevenue']) ?? 0,
                            colors: c,
                            gapColor: p.surfaceSolid,
                            dimmed: _selected != null && _selected != i,
                          ),
                        ),
                      ),
                    ),
                ],
              );
            }),
          ),
          Divider(height: 1, color: p.divider),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(Fmt.dateShort(asDate(days.first['day'])), style: context.text.bodySmall),
              Text(Fmt.dateShort(asDate(days.last['day'])), style: context.text.bodySmall),
            ],
          ),
        ],
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({
    required this.width,
    required this.maxHeight,
    required this.maxTotal,
    required this.consultation,
    required this.registration,
    required this.colors,
    required this.gapColor,
    required this.dimmed,
  });

  final double width;
  final double maxHeight;
  final double maxTotal;
  final double consultation;
  final double registration;
  final _ChartColors colors;
  final Color gapColor;
  final bool dimmed;

  @override
  Widget build(BuildContext context) {
    if (maxTotal <= 0) return const SizedBox.shrink();
    // The 2px surface gap between segments comes out of the bar budget so
    // the tallest stacked bar still fits.
    final gap = consultation > 0 && registration > 0 ? 2.0 : 0.0;
    final scale = (maxHeight - 2) / maxTotal;
    final hc = consultation * scale;
    final hr = registration * scale;
    const r = Radius.circular(4);
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 150),
      opacity: dimmed ? 0.4 : 1,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (hr > 0)
            Container(
              width: width,
              height: hr,
              decoration: BoxDecoration(
                color: colors.registration,
                borderRadius: const BorderRadius.vertical(top: r),
              ),
            ),
          if (gap > 0) Container(width: width, height: gap, color: gapColor),
          if (hc > 0)
            Container(
              width: width,
              height: hc,
              decoration: BoxDecoration(
                color: colors.consultation,
                borderRadius: hr > 0 ? null : const BorderRadius.vertical(top: r),
              ),
            ),
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
          const SizedBox(width: 6),
          Text(label, style: context.text.labelMedium),
        ],
      );
}

class _DayTable extends StatelessWidget {
  const _DayTable({required this.days});
  final List<Map<String, dynamic>> days;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        children: [
          for (final d in days.reversed)
            ListTile(
              dense: true,
              title: Text(Fmt.date(asDate(d['day']))),
              subtitle: Text(
                '${tr('mobile.reports.consultation')} ${Fmt.money(asDouble(d['consultationRevenue']))}'
                ' · ${tr('mobile.reports.registration')} ${Fmt.money(asDouble(d['registrationFeeRevenue']))}',
              ),
              trailing: Text(Fmt.money(asDouble(d['total'])), style: context.text.labelLarge),
            ),
        ],
      ),
    );
  }
}

class _MethodBreakdown extends StatelessWidget {
  const _MethodBreakdown({required this.title, required this.byMethod});
  final String title;
  final Map<String, dynamic> byMethod;

  @override
  Widget build(BuildContext context) {
    if (byMethod.isEmpty) return const SizedBox.shrink();
    final p = context.palette;
    final total = byMethod.values.fold<double>(0, (s, v) => s + (asDouble(v) ?? 0));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionTitle(title),
        GlassCard(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 4),
          child: Column(
            children: [
              for (final e in byMethod.entries)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(child: Text(Payment.methodLabel(e.key), style: context.text.labelLarge)),
                          Text(Fmt.money(asDouble(e.value)), style: context.text.labelLarge),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: total <= 0 ? 0 : (asDouble(e.value) ?? 0) / total,
                          minHeight: 6,
                          color: Brand.b500,
                          backgroundColor: p.subtle,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(16),
        child: Text(text, style: context.text.bodySmall?.copyWith(color: context.palette.inkMuted)),
      );
}
