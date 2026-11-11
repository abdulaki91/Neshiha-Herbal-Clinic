import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/paged_state.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';
import '../patients/patient_detail_screen.dart';
import 'visit_form_screen.dart';
import 'visit_tile.dart';

class VisitsScreen extends StatefulWidget {
  const VisitsScreen({super.key, this.pushed = false});
  final bool pushed;

  @override
  State<VisitsScreen> createState() => _VisitsScreenState();
}

class _VisitsScreenState extends State<VisitsScreen>
    with PagedLoad<VisitsScreen, Visit> {
  String? _status;

  static const _filters = <(String?, String)>[
    (null, 'All'),
    (VisitStatus.waiting, 'Waiting'),
    (VisitStatus.inConsultation, 'In consultation'),
    (VisitStatus.pendingPayment, 'Pending payment'),
    (VisitStatus.completed, 'Completed'),
    (VisitStatus.scheduled, 'Scheduled'),
    (VisitStatus.cancelled, 'Cancelled'),
  ];

  @override
  List<String> get refreshOn => const ['visit:created', 'visit:status-changed'];

  @override
  Future<Paged<Visit>> fetchPage(int page) =>
      context.read<ClinicApi>().visits(page: page, status: _status);

  Future<void> _newVisit() async {
    final ok = await Navigator.of(context)
        .push<bool>(MaterialPageRoute(builder: (_) => const VisitFormScreen()));
    if (ok == true) refresh();
  }

  @override
  Widget build(BuildContext context) {
    return TabPage(
      title: 'Visits',
      subtitle: 'Walk-ins, consultations and follow-ups',
      pushed: widget.pushed,
      fab: GradientFab(
        label: 'New visit',
        icon: Icons.add_rounded,
        onPressed: _newVisit,
      ),
      header: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: FilterChips<String?>(
          value: _status,
          items: _filters,
          onChanged: (v) {
            setState(() => _status = v);
            refresh(showSpinner: true);
          },
        ),
      ),
      child: buildPaged(
        padding: TabPage.listPadding(context, widget.pushed, hasFab: true),
        empty: const EmptyView(
          icon: Icons.event_busy_rounded,
          title: 'No visits found',
          subtitle: 'Create a visit to send a patient to the doctor.',
        ),
        itemBuilder: (context, v) => VisitTile(
          visit: v,
          onTap: v.patient == null
              ? null
              : () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => PatientDetailScreen(patientId: v.patient!.id))),
        ),
      ),
    );
  }
}
