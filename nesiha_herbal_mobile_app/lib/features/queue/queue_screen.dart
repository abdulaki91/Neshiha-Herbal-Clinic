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
import 'consultation_screen.dart';

class QueueScreen extends StatefulWidget {
  const QueueScreen({super.key, this.pushed = false});
  final bool pushed;

  @override
  State<QueueScreen> createState() => _QueueScreenState();
}

class _QueueScreenState extends State<QueueScreen>
    with AsyncLoad<QueueScreen, List<Visit>> {
  String? _starting;

  @override
  List<String> get refreshOn =>
      const ['queue:updated', 'visit:status-changed', 'visit:created'];

  @override
  Duration? get pollEvery => const Duration(seconds: 15);

  @override
  Future<List<Visit>> fetch() => context.read<ClinicApi>().queue();

  Future<void> _open(Visit v) async {
    final api = context.read<ClinicApi>();
    if (v.status != VisitStatus.inConsultation) {
      setState(() => _starting = v.id);
      try {
        await api.updateVisit(v.id, {
          'status': VisitStatus.inConsultation,
          'consultationStartTime': Fmt.apiTimeSeconds(DateTime.now()),
        });
      } catch (e) {
        Toast.error(ApiException.from(e).message);
        return;
      } finally {
        if (mounted) setState(() => _starting = null);
      }
    }
    if (!mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ConsultationScreen(visit: v)),
    );
    reload(silent: true);
  }

  @override
  Widget build(BuildContext context) {
    final queue = data ?? const <Visit>[];
    final inConsult =
        queue.where((v) => v.status == VisitStatus.inConsultation).length;
    return TabPage(
      title: 'Patient queue',
      subtitle: data == null
          ? 'Today\'s waiting patients'
          : '${queue.length} ${queue.length == 1 ? 'patient' : 'patients'}'
              '${inConsult > 0 ? ' · $inConsult in consultation' : ''}',
      pushed: widget.pushed,
      trailing: CircleIconButton(
        icon: Icons.refresh_rounded,
        tooltip: 'Refresh',
        onPressed: () => reload(),
      ),
      child: loading && data == null
          ? const LoadingView()
          : error != null && data == null
              ? ErrorView(message: error!, onRetry: reload)
              : RefreshIndicator(
                  onRefresh: () => reload(silent: true),
                  child: queue.isEmpty
                      ? ListView(
                          padding: TabPage.listPadding(context, widget.pushed),
                          children: const [
                            EmptyView(
                              icon: Icons.check_circle_outline_rounded,
                              title: 'Your queue is clear',
                              subtitle:
                                  'New patients appear here automatically as they arrive.',
                            ),
                          ],
                        )
                      : ListView.separated(
                          padding: TabPage.listPadding(context, widget.pushed),
                          itemCount: queue.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 12),
                          itemBuilder: (context, i) => _QueueCard(
                            visit: queue[i],
                            position: i + 1,
                            busy: _starting == queue[i].id,
                            onOpen: () => _open(queue[i]),
                          ),
                        ),
                ),
    );
  }
}

class _QueueCard extends StatelessWidget {
  const _QueueCard({
    required this.visit,
    required this.position,
    required this.busy,
    required this.onOpen,
  });

  final Visit visit;
  final int position;
  final bool busy;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final patient = visit.patient;
    final active = visit.status == VisitStatus.inConsultation;
    return GlassCard(
      onTap: busy ? null : onOpen,
      radius: 24,
      borderColor: active ? Brand.b400.withValues(alpha: 0.7) : null,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  gradient: active ? Brand.markGradient : null,
                  color: active ? null : Brand.b500.withValues(alpha: p.isDark ? 0.2 : 0.1),
                  borderRadius: BorderRadius.circular(15),
                ),
                alignment: Alignment.center,
                child: Text('$position',
                    style: TextStyle(
                        color: active ? Colors.white : (p.isDark ? Brand.b200 : Brand.b700),
                        fontWeight: FontWeight.w800,
                        fontSize: 18)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(patient?.fullName ?? '—',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: context.text.titleMedium?.copyWith(color: p.ink)),
                        ),
                        if (patient?.hasAlerts ?? false) ...[
                          const SizedBox(width: 6),
                          Icon(Icons.warning_amber_rounded, size: 17, color: p.danger),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      [
                        patient?.ageGender ?? '',
                        if (visit.arrivalTime != null)
                          'Arrived ${Fmt.clock(visit.arrivalTime)}',
                      ].where((e) => e.isNotEmpty).join(' · '),
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
              StatusPill(VisitStatus.label(visit.status), tone: visitTone(visit.status)),
            ],
          ),
          if (visit.chiefComplaint != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: p.subtle,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(visit.chiefComplaint!,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: context.text.bodyMedium),
            ),
          ],
          const SizedBox(height: 14),
          GradientButton(
            label: active ? 'Resume consultation' : 'Start consultation',
            icon: active ? Icons.play_arrow_rounded : Icons.medical_services_rounded,
            height: 46,
            loading: busy,
            onPressed: onOpen,
          ),
        ],
      ),
    );
  }
}
