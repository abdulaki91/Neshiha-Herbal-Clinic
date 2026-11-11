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
import '../visits/visit_form_screen.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key, this.pushed = false});
  final bool pushed;

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen>
    with AsyncLoad<AppointmentsScreen, List<Visit>> {
  String _search = '';
  final _busy = <String>{};

  @override
  List<String> get refreshOn => const ['visit:created', 'visit:status-changed'];

  @override
  Future<List<Visit>> fetch() =>
      context.read<ClinicApi>().appointments(search: _search);

  Future<void> _schedule() async {
    final ok = await Navigator.of(context).push<bool>(MaterialPageRoute(
        builder: (_) =>
            const VisitFormScreen(initialMode: VisitMode.appointment)));
    if (ok == true) reload(silent: true);
  }

  Future<void> _run(Visit v, Future<void> Function() action, String done) async {
    setState(() => _busy.add(v.id));
    try {
      await action();
      Toast.success(done);
      await reload(silent: true);
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy.remove(v.id));
    }
  }

  Future<void> _cancel(Visit v) async {
    final ok = await confirmAction(context,
        title: 'Cancel appointment?',
        message:
            '${v.patient?.fullName ?? 'This patient'}\'s appointment on ${Fmt.date(v.visitDate)} will be cancelled.',
        confirmLabel: 'Cancel appointment',
        destructive: true);
    if (!ok || !mounted) return;
    final api = context.read<ClinicApi>();
    _run(v, () => api.setVisitStatus(v.id, VisitStatus.cancelled),
        'Appointment cancelled');
  }

  String _groupLabel(DateTime? d) {
    if (d == null) return 'Unscheduled';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final diff = DateTime(d.year, d.month, d.day).difference(today).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Tomorrow';
    return Fmt.date(d);
  }

  @override
  Widget build(BuildContext context) {
    final list = [...?data]..sort((a, b) => a.sortKey.compareTo(b.sortKey));
    final groups = <String, List<Visit>>{};
    for (final v in list) {
      groups.putIfAbsent(_groupLabel(v.visitDate), () => []).add(v);
    }

    return TabPage(
      title: 'Appointments',
      subtitle: 'Upcoming scheduled visits',
      pushed: widget.pushed,
      fab: GradientFab(
          label: 'Schedule', icon: Icons.event_rounded, onPressed: _schedule),
      header: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        child: SearchField(
          hint: 'Search by patient',
          onChanged: (v) {
            _search = v;
            reload();
          },
        ),
      ),
      child: loading && data == null
          ? const LoadingView()
          : error != null && data == null
              ? ErrorView(message: error!, onRetry: reload)
              : RefreshIndicator(
                  onRefresh: () => reload(silent: true),
                  child: ListView(
                    padding: TabPage.listPadding(context, widget.pushed, hasFab: true),
                    children: [
                      if (list.isEmpty)
                        const EmptyView(
                          icon: Icons.event_available_rounded,
                          title: 'No upcoming appointments',
                          subtitle: 'Scheduled visits will appear here.',
                        ),
                      for (final entry in groups.entries) ...[
                        SectionTitle(entry.key,
                            trailing: Text('${entry.value.length}',
                                style: context.text.labelLarge
                                    ?.copyWith(color: context.palette.inkMuted))),
                        for (final v in entry.value)
                          _AppointmentCard(
                            visit: v,
                            busy: _busy.contains(v.id),
                            onCheckIn: Fmt.isToday(v.visitDate)
                                ? () => _run(
                                    v,
                                    () => context.read<ClinicApi>().checkIn(v.id),
                                    '${v.patient?.firstName ?? 'Patient'} checked in — sent to the queue')
                                : null,
                            onCancel: () => _cancel(v),
                          ),
                        const SizedBox(height: 8),
                      ],
                    ],
                  ),
                ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  const _AppointmentCard({
    required this.visit,
    required this.busy,
    required this.onCheckIn,
    required this.onCancel,
  });

  final Visit visit;
  final bool busy;
  final VoidCallback? onCheckIn;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final time = Fmt.clock(visit.scheduledTime).split(' ');
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 10),
      radius: 22,
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 58,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [
                    Brand.b500.withValues(alpha: p.isDark ? 0.3 : 0.14),
                    Brand.a400.withValues(alpha: p.isDark ? 0.25 : 0.12),
                  ]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Text(time.first,
                        style: context.text.titleMedium
                            ?.copyWith(color: p.ink, fontWeight: FontWeight.w700)),
                    if (time.length > 1)
                      Text(time.last,
                          style: context.text.labelSmall?.copyWith(color: p.inkMuted)),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(visit.patient?.fullName ?? '—',
                        style: context.text.titleMedium?.copyWith(color: p.ink)),
                    const SizedBox(height: 2),
                    Text(
                      [
                        visit.patient?.patientId ?? '',
                        if (visit.patient?.phone != null) visit.patient!.phone!,
                      ].where((e) => e.isNotEmpty).join(' · '),
                      style: context.text.bodySmall,
                    ),
                    if (visit.chiefComplaint != null) ...[
                      const SizedBox(height: 4),
                      Text(visit.chiefComplaint!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: context.text.bodyMedium),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: onCheckIn == null
                    ? Text('Check-in opens on the appointment day',
                        style: context.text.bodySmall)
                    : FilledButton.icon(
                        onPressed: busy ? null : onCheckIn,
                        icon: busy
                            ? const SizedBox.square(
                                dimension: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.how_to_reg_rounded, size: 18),
                        label: const Text('Check in'),
                        style: FilledButton.styleFrom(
                          backgroundColor: Brand.b600,
                          foregroundColor: Colors.white,
                          shape: const StadiumBorder(),
                        ),
                      ),
              ),
              const SizedBox(width: 8),
              IconButton(
                tooltip: 'Cancel appointment',
                onPressed: busy ? null : onCancel,
                icon: Icon(Icons.event_busy_rounded, color: p.danger),
                style: IconButton.styleFrom(
                    backgroundColor: p.danger.withValues(alpha: 0.1)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
