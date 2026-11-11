import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/async_state.dart';
import '../../core/format.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/backdrop.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../visits/visit_form_screen.dart';
import '../visits/visit_tile.dart';
import 'patient_form_screen.dart';

class PatientDetailScreen extends StatefulWidget {
  const PatientDetailScreen({super.key, required this.patientId});
  final String patientId;

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen>
    with AsyncLoad<PatientDetailScreen, Patient> {
  @override
  List<String> get refreshOn => const ['visit:status-changed', 'visit:created'];

  @override
  Future<Patient> fetch() =>
      context.read<ClinicApi>().patientHistory(widget.patientId);

  bool get _canEdit {
    final role = context.read<AuthController>().role;
    return role == Roles.dataClerk || role == Roles.doctor;
  }

  Future<void> _edit(Patient p) async {
    final saved = await Navigator.of(context).push<Patient>(
        MaterialPageRoute(builder: (_) => PatientFormScreen(patient: p)));
    if (saved != null) reload(silent: true);
  }

  Future<void> _newVisit(Patient p) async {
    final ok = await Navigator.of(context).push<bool>(MaterialPageRoute(
        builder: (_) => VisitFormScreen(initialPatient: p)));
    if (ok == true) reload(silent: true);
  }

  @override
  Widget build(BuildContext context) {
    final patient = data;
    return BackdropScaffold(
      appBar: AppBar(
        title: const Text('Patient'),
        actions: [
          if (patient != null && _canEdit)
            IconButton(
              tooltip: 'Edit',
              icon: const Icon(Icons.edit_rounded),
              onPressed: () => _edit(patient),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: loading && patient == null
          ? const LoadingView()
          : error != null && patient == null
              ? ErrorView(message: error!, onRetry: reload)
              : RefreshIndicator(
                  onRefresh: () => reload(silent: true),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 120),
                    children: [
                      _Header(patient: patient!),
                      if (patient.hasAlerts) ...[
                        const SizedBox(height: 14),
                        AlertBanner(patient: patient),
                      ],
                      const SizedBox(height: 14),
                      _Details(patient: patient),
                      const SizedBox(height: 22),
                      SectionTitle('Visit history',
                          icon: Icons.history_rounded,
                          trailing: Text('${patient.visits.length}',
                              style: context.text.labelLarge
                                  ?.copyWith(color: context.palette.inkMuted))),
                      if (patient.visits.isEmpty)
                        const GlassCard(
                          child: EmptyView(
                            icon: Icons.event_busy_rounded,
                            title: 'No visits yet',
                            subtitle: 'Visits for this patient will appear here.',
                          ),
                        )
                      else
                        for (final v in patient.visits)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: VisitHistoryCard(visit: v),
                          ),
                    ],
                  ),
                ),
      bottomBar: patient != null && _canEdit
          ? SafeArea(
              minimum: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: GradientButton(
                label: 'New visit',
                icon: Icons.add_rounded,
                onPressed: () => _newVisit(patient),
              ),
            )
          : null,
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.patient});
  final Patient patient;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return GlassCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        children: [
          InitialsAvatar(patient.initials, size: 76, soft: false),
          const SizedBox(height: 12),
          Text(patient.fullName,
              textAlign: TextAlign.center, style: context.text.headlineSmall),
          const SizedBox(height: 4),
          Text('Patient ID · ${patient.patientId}',
              style: context.text.bodyMedium?.copyWith(color: p.inkMuted)),
          const SizedBox(height: 14),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              _Chip(Icons.person_outline_rounded, patient.ageGender),
              if (patient.phone != null) _Chip(Icons.phone_rounded, patient.phone!),
              if (patient.city != null) _Chip(Icons.place_outlined, patient.city!),
              _Chip(Icons.calendar_today_rounded,
                  'Since ${Fmt.date(patient.createdAt)}'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.icon, this.label);
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: p.subtle,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: p.divider),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: p.inkMuted),
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(
                  color: p.inkSoft, fontWeight: FontWeight.w600, fontSize: 12.5)),
        ],
      ),
    );
  }
}

class _Details extends StatelessWidget {
  const _Details({required this.patient});
  final Patient patient;

  @override
  Widget build(BuildContext context) {
    final rows = <(IconData, String, String)>[
      if (patient.woreda != null) (Icons.map_outlined, 'Woreda', patient.woreda!),
      if (patient.address != null) (Icons.home_outlined, 'Address', patient.address!),
      if (patient.email != null) (Icons.mail_outline_rounded, 'Email', patient.email!),
      if (patient.occupation != null)
        (Icons.work_outline_rounded, 'Occupation', patient.occupation!),
      if (patient.maritalStatus != null)
        (Icons.favorite_border_rounded, 'Marital status',
            Fmt.titleCase(patient.maritalStatus)),
    ];
    if (rows.isEmpty) return const SizedBox.shrink();
    return GlassCard(
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            InfoTile(icon: rows[i].$1, label: rows[i].$2, value: rows[i].$3),
          ],
        ],
      ),
    );
  }
}
