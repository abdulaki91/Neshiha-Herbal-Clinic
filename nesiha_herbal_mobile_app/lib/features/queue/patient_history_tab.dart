import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/async_state.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../widgets/cards.dart';
import '../../widgets/feedback.dart';
import '../patients/patient_file.dart';
import '../visits/visit_tile.dart';

/// The patient's file for the visit being seen: follow-up status, recent
/// prescriptions and test results, attachments, then previous visits —
/// what the web shows in its patient record sidebar.
class PatientHistoryTab extends StatefulWidget {
  const PatientHistoryTab({
    super.key,
    required this.patientId,
    required this.currentVisit,
  });

  final String patientId;
  final Visit currentVisit;

  @override
  State<PatientHistoryTab> createState() => _PatientHistoryTabState();
}

class _PatientHistoryTabState extends State<PatientHistoryTab>
    with AsyncLoad<PatientHistoryTab, Patient>, AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Future<Patient> fetch() =>
      context.read<ClinicApi>().patientHistory(widget.patientId);

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final visits = (data?.visits ?? const <Visit>[])
        .where((v) => v.id != widget.currentVisit.id)
        .toList();
    return RefreshIndicator(
      onRefresh: () => reload(silent: true),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        children: [
          FollowUpCard(patientId: widget.patientId, currentVisit: widget.currentVisit),
          const SizedBox(height: 12),
          RecentPrescriptionsCard(patientId: widget.patientId),
          const SizedBox(height: 12),
          RecentInvestigationsCard(patientId: widget.patientId),
          const SizedBox(height: 12),
          AttachmentsSection(
            patientId: widget.patientId,
            visitId: widget.currentVisit.id,
            canDelete: true,
          ),
          const SizedBox(height: 18),
          SectionTitle(tr('patientRecordSidebar.tabs.visitHistory')),
          if (loading && data == null)
            const LoadingView()
          else if (error != null && data == null)
            ErrorView(message: error!, onRetry: reload)
          else if (visits.isEmpty)
            EmptyView(
              icon: Icons.history_toggle_off_rounded,
              title: tr('patientHistory.empty'),
            )
          else
            for (final v in visits)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: VisitHistoryCard(visit: v),
              ),
        ],
      ),
    );
  }
}
