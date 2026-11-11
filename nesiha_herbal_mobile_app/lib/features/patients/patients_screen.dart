import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/paged_state.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';
import 'patient_detail_screen.dart';
import 'patient_form_screen.dart';

class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key, this.pushed = false});
  final bool pushed;

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen>
    with PagedLoad<PatientsScreen, Patient> {
  String _search = '';

  @override
  List<String> get refreshOn => const ['patient:registered'];

  @override
  Future<Paged<Patient>> fetchPage(int page) =>
      context.read<ClinicApi>().patients(page: page, search: _search);

  bool get _canRegister {
    final role = context.read<AuthController>().role;
    return role == Roles.dataClerk || role == Roles.doctor;
  }

  Future<void> _register() async {
    final created = await Navigator.of(context).push<Patient>(
      MaterialPageRoute(builder: (_) => const PatientFormScreen()),
    );
    if (created != null) refresh();
  }

  @override
  Widget build(BuildContext context) {
    return TabPage(
      title: 'Patients',
      subtitle: 'Search and manage patient records',
      pushed: widget.pushed,
      fab: _canRegister
          ? GradientFab(
              label: 'Register',
              icon: Icons.person_add_alt_1_rounded,
              onPressed: _register,
            )
          : null,
      header: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        child: SearchField(
          hint: 'Search by name, phone or ID',
          onChanged: (v) {
            _search = v;
            refresh(showSpinner: true);
          },
        ),
      ),
      child: buildPaged(
        padding: TabPage.listPadding(context, widget.pushed,
            hasFab: _canRegister),
        empty: EmptyView(
          icon: Icons.person_search_rounded,
          title: _search.isEmpty ? 'No patients yet' : 'No matches',
          subtitle: _search.isEmpty
              ? 'Registered patients will appear here.'
              : 'Try a different name, phone or patient ID.',
        ),
        itemBuilder: (context, p) => PatientTile(
          patient: p,
          onTap: () async {
            await Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => PatientDetailScreen(patientId: p.id)));
            refresh();
          },
        ),
      ),
    );
  }
}

class PatientTile extends StatelessWidget {
  const PatientTile({super.key, required this.patient, this.onTap, this.trailing});
  final Patient patient;
  final VoidCallback? onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return GlassCard(
      onTap: onTap,
      radius: 22,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          InitialsAvatar(patient.initials, size: 48),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(patient.fullName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: context.text.titleMedium?.copyWith(color: p.ink)),
                    ),
                    if (patient.hasAlerts) ...[
                      const SizedBox(width: 6),
                      Icon(Icons.warning_amber_rounded, size: 17, color: p.danger),
                    ],
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  [patient.patientId, patient.ageGender]
                      .where((e) => e.isNotEmpty)
                      .join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: context.text.bodySmall,
                ),
                if (patient.phone != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.phone_rounded, size: 14, color: p.inkMuted),
                      const SizedBox(width: 5),
                      Text(patient.phone!,
                          style: context.text.bodySmall
                              ?.copyWith(color: p.inkSoft, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ],
            ),
          ),
          trailing ?? Icon(Icons.chevron_right_rounded, color: p.inkMuted),
        ],
      ),
    );
  }
}
