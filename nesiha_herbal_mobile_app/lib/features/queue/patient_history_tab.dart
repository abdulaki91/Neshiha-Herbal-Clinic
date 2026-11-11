import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/async_state.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../widgets/feedback.dart';
import '../visits/visit_tile.dart';

/// Previous visits for the patient being seen (current visit excluded).
class PatientHistoryTab extends StatefulWidget {
  const PatientHistoryTab({
    super.key,
    required this.patientId,
    required this.currentVisitId,
  });

  final String patientId;
  final String currentVisitId;

  @override
  State<PatientHistoryTab> createState() => _PatientHistoryTabState();
}

class _PatientHistoryTabState extends State<PatientHistoryTab>
    with AsyncLoad<PatientHistoryTab, Patient> {
  @override
  Future<Patient> fetch() =>
      context.read<ClinicApi>().patientHistory(widget.patientId);

  @override
  Widget build(BuildContext context) {
    if (loading && data == null) return const LoadingView();
    if (error != null && data == null) {
      return ErrorView(message: error!, onRetry: reload);
    }
    final visits =
        data!.visits.where((v) => v.id != widget.currentVisitId).toList();
    if (visits.isEmpty) {
      return const EmptyView(
        icon: Icons.history_toggle_off_rounded,
        title: 'First visit',
        subtitle: 'This patient has no previous visits on record.',
      );
    }
    return RefreshIndicator(
      onRefresh: () => reload(silent: true),
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        itemCount: visits.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (_, i) => VisitHistoryCard(visit: visits[i]),
      ),
    );
  }
}
