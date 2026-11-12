import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../i18n/i18n.dart';
import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/paged_state.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/backdrop.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../patients/patients_screen.dart';

enum VisitMode { walkIn, appointment }

/// Create a walk-in visit (straight into the doctor's queue) or schedule an
/// appointment. Pops `true` on success.
class VisitFormScreen extends StatefulWidget {
  const VisitFormScreen({
    super.key,
    this.initialPatient,
    this.initialMode = VisitMode.walkIn,
  });

  final Patient? initialPatient;
  final VisitMode initialMode;

  @override
  State<VisitFormScreen> createState() => _VisitFormScreenState();
}

class _VisitFormScreenState extends State<VisitFormScreen> {
  late VisitMode _mode = widget.initialMode;
  late Patient? _patient = widget.initialPatient;
  final _complaint = TextEditingController();
  late DateTime _date = _defaultDate(widget.initialMode);
  TimeOfDay _time = TimeOfDay.now();
  bool _saving = false;
  bool _showErrors = false;

  static DateTime _defaultDate(VisitMode m) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return m == VisitMode.appointment ? today.add(const Duration(days: 1)) : today;
  }

  @override
  void dispose() {
    _complaint.dispose();
    super.dispose();
  }

  void _setMode(VisitMode m) => setState(() {
        _mode = m;
        _date = _defaultDate(m);
      });

  Future<void> _pickPatient() async {
    final p = await showModalBottomSheet<Patient>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const PatientPickerSheet(),
    );
    if (p != null) setState(() => _patient = p);
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final d = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (d != null) setState(() => _date = d);
  }

  Future<void> _pickTime() async {
    final t = await showTimePicker(context: context, initialTime: _time);
    if (t != null) setState(() => _time = t);
  }

  Future<void> _save() async {
    setState(() => _showErrors = true);
    if (_patient == null) {
      Toast.error(tr('visitForm.patientRequired'));
      return;
    }
    setState(() => _saving = true);
    final time = Fmt.apiTime(
        DateTime(2000, 1, 1, _time.hour, _time.minute));
    final complaint = _complaint.text.trim();
    final payload = <String, dynamic>{
      'patientId': _patient!.id,
      if (complaint.isNotEmpty) 'chiefComplaint': complaint,
      'visitDate': Fmt.apiDate(_date),
      if (_mode == VisitMode.appointment) ...{
        'scheduledTime': time,
        'status': VisitStatus.scheduled,
      } else
        'arrivalTime': time,
    };
    try {
      await context.read<ClinicApi>().createVisit(payload);
      Toast.success(_mode == VisitMode.appointment
          ? tr('visitForm.scheduleSuccess')
          : tr('visitForm.createSuccess'));
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
    final isAppt = _mode == VisitMode.appointment;
    return BackdropScaffold(
      appBar: AppBar(title: Text(isAppt ? tr('visitForm.scheduleTitle') : tr('visitForm.title'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
        children: [
          Segmented<VisitMode>(
            value: _mode,
            onChanged: _setMode,
            items: [
              (VisitMode.walkIn, tr('visitForm.mode.walkIn'), Icons.directions_walk_rounded),
              (VisitMode.appointment, tr('visitForm.mode.appointment'), Icons.event_rounded),
            ],
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Text(
              isAppt
                  ? tr('visitForm.appointmentHint')
                  : tr('mobile.visit.walkInHint'),
              style: context.text.bodySmall,
            ),
          ),
          const SizedBox(height: 18),
          FieldLabel(
            trl('visitForm.patientLabel'),
            child: GlassCard(
              onTap: _pickPatient,
              radius: 18,
              borderColor: _showErrors && _patient == null ? p.danger : null,
              padding: const EdgeInsets.all(14),
              child: _patient == null
                  ? Row(
                      children: [
                        Icon(Icons.person_search_rounded,
                            color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(tr('visitForm.patientPlaceholder'),
                              style: context.text.titleSmall
                                  ?.copyWith(color: p.inkSoft)),
                        ),
                        Icon(Icons.chevron_right_rounded, color: p.inkMuted),
                      ],
                    )
                  : Row(
                      children: [
                        InitialsAvatar(_patient!.initials, size: 42),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_patient!.fullName,
                                  style: context.text.titleSmall),
                              Text('${_patient!.patientId} · ${_patient!.ageGender}',
                                  style: context.text.bodySmall),
                            ],
                          ),
                        ),
                        Text(tr('mobile.common.change'),
                            style: TextStyle(
                                color: Theme.of(context).colorScheme.primary,
                                fontWeight: FontWeight.w700)),
                      ],
                    ),
            ),
          ),
          if (_patient?.hasAlerts ?? false) ...[
            AlertBanner(patient: _patient!),
            const SizedBox(height: 16),
          ],
          FieldLabel(
            tr('visitForm.chiefComplaintLabel'),
            optional: true,
            child: TextField(
              controller: _complaint,
              minLines: 2,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                  hintText: tr('visitForm.chiefComplaintPlaceholder')),
            ),
          ),
          Row(
            children: [
              Expanded(
                child: FieldLabel(
                  isAppt ? tr('visitForm.appointmentDateLabel') : tr('visitForm.visitDateLabel'),
                  child: _PickerBox(
                    icon: Icons.calendar_today_rounded,
                    label: Fmt.isToday(_date) ? tr('appointments.dateGroup.today') : Fmt.date(_date),
                    onTap: isAppt ? _pickDate : null,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FieldLabel(
                  isAppt ? tr('visitForm.scheduledTimeLabel') : trl('visitForm.arrivalTimeLabel'),
                  child: _PickerBox(
                    icon: Icons.schedule_rounded,
                    label: _time.format(context),
                    onTap: _pickTime,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      bottomBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(20, 8, 20, 16),
        child: GradientButton(
          label: isAppt ? tr('visitForm.scheduleButton') : tr('mobile.visit.sendToDoctor'),
          icon: isAppt ? Icons.event_available_rounded : Icons.send_rounded,
          loading: _saving,
          onPressed: _save,
        ),
      ),
    );
  }
}

class _PickerBox extends StatelessWidget {
  const _PickerBox({required this.icon, required this.label, this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Material(
      color: p.isDark ? const Color(0x0FFFFFFF) : const Color(0xD9FFFFFF),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: p.divider),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
          child: Row(
            children: [
              Icon(icon, size: 18, color: onTap == null ? p.inkMuted : Theme.of(context).colorScheme.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(label,
                    style: TextStyle(
                        color: onTap == null ? p.inkMuted : p.ink,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Searchable patient list in a bottom sheet; pops the chosen [Patient].
class PatientPickerSheet extends StatefulWidget {
  const PatientPickerSheet({super.key});

  @override
  State<PatientPickerSheet> createState() => _PatientPickerSheetState();
}

class _PatientPickerSheetState extends State<PatientPickerSheet>
    with PagedLoad<PatientPickerSheet, Patient> {
  String _search = '';

  @override
  Future<Paged<Patient>> fetchPage(int page) =>
      context.read<ClinicApi>().patients(page: page, search: _search);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.85,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('visitForm.patientPlaceholder'), style: context.text.titleLarge),
                const SizedBox(height: 12),
                SearchField(
                  hint: tr('patients.search.placeholder'),
                  onChanged: (v) {
                    _search = v;
                    refresh(showSpinner: true);
                  },
                ),
              ],
            ),
          ),
          Expanded(
            child: buildPaged(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              spacing: 8,
              empty: EmptyView(
                icon: Icons.person_search_rounded,
                title: tr('patients.empty.title'),
                subtitle: tr('mobile.visit.registerFirst'),
              ),
              itemBuilder: (context, pt) => PatientTile(
                patient: pt,
                onTap: () => Navigator.of(context).pop(pt),
                trailing: const SizedBox.shrink(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
