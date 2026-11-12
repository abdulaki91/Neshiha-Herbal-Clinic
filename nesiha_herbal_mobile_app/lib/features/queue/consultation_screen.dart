import 'dart:async';

import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/print_docs.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/backdrop.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import 'herbal_medicine_tab.dart';
import 'investigations_tab.dart';
import 'patient_history_tab.dart';
import 'vitals_tab.dart';

enum SaveState { idle, pending, saving, saved, error }

/// The doctor's workspace for one visit: notes, herbal prescriptions and the
/// patient's history. Notes autosave ~1.2s after typing stops (same engine
/// as the web portal), and are flushed before leaving or completing.
class ConsultationScreen extends StatefulWidget {
  const ConsultationScreen({super.key, required this.visit});
  final Visit visit;

  @override
  State<ConsultationScreen> createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends State<ConsultationScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 5, vsync: this);
  bool _printing = false;
  late final Visit v = widget.visit;

  late final _complaint = TextEditingController(text: v.chiefComplaint);
  late final _hpi = TextEditingController(text: v.historyOfPresentIllness);
  late final _exam = TextEditingController(text: v.physicalExamination);
  late final _plan = TextEditingController(text: v.treatmentPlan);
  late final _notes = TextEditingController(text: v.doctorNotes);
  late List<String> _symptoms = [...v.symptoms];
  late List<String> _diagnosis = [...v.diagnosis];
  late DateTime? _followUp = DateTime.tryParse(v.followUpDate ?? '');

  SaveState _save = SaveState.idle;
  Timer? _debounce;
  bool _completing = false;
  bool _leaving = false;

  @override
  void initState() {
    super.initState();
    // What's loaded is already on the server — don't "autosave" it back.
    _lastSaved = jsonKey;
    for (final c in [_complaint, _hpi, _exam, _plan, _notes]) {
      c.addListener(_changed);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _tabs.dispose();
    for (final c in [_complaint, _hpi, _exam, _plan, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  Map<String, dynamic> get _payload => {
        'chiefComplaint': _complaint.text.trim(),
        'symptoms': _symptoms,
        'historyOfPresentIllness': _hpi.text.trim(),
        'physicalExamination': _exam.text.trim(),
        'diagnosis': _diagnosis,
        'treatmentPlan': _plan.text.trim(),
        'doctorNotes': _notes.text.trim(),
        'followUpDate': _followUp == null ? null : Fmt.apiDate(_followUp!),
      };

  String? _lastSaved;

  void _changed() {
    // TextEditingController also notifies on selection changes; only real
    // content changes should schedule a save.
    if (jsonKey == _lastSaved) {
      if (_save == SaveState.pending) {
        _debounce?.cancel();
        setState(() => _save = SaveState.saved);
      }
      return;
    }
    if (_save != SaveState.pending) setState(() => _save = SaveState.pending);
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 1200), _persist);
  }

  String get jsonKey => _payload.toString();

  Future<bool> _persist() async {
    _debounce?.cancel();
    final snapshot = jsonKey;
    if (snapshot == _lastSaved) return true;
    if (mounted) setState(() => _save = SaveState.saving);
    try {
      await context.read<ClinicApi>().updateVisit(v.id, _payload);
      _lastSaved = snapshot;
      if (mounted) {
        setState(() => _save =
            jsonKey == snapshot ? SaveState.saved : SaveState.pending);
      }
      return true;
    } catch (e) {
      if (mounted) setState(() => _save = SaveState.error);
      Toast.error('${tr('doctorQueue.toast.saveError')}: ${ApiException.from(e).message}');
      return false;
    }
  }

  /// Herbal prescription slip for the patient (PrintablePrescriptionSlip.jsx).
  Future<void> _print() async {
    final api = context.read<ClinicApi>();
    final doctor = context.read<AuthController>().user;
    setState(() => _printing = true);
    try {
      final rx = (await api.prescriptions(visitId: v.id))
          .where((p) => p.status != 'stopped')
          .toList();
      if (rx.isEmpty) {
        Toast.info(tr('doctorQueue.consultation.printNoPrescriptions'));
        return;
      }
      await PrintDocs.prescriptionSlip(
        visit: Visit({...v.raw, ..._payload}),
        prescriptions: rx,
        doctor: v.doctor ?? (doctor == null ? null : PersonRef(doctor.raw)),
      );
    } catch (e) {
      Toast.error(tr('doctorQueue.consultation.printError'));
    } finally {
      if (mounted) setState(() => _printing = false);
    }
  }

  Future<void> _leave() async {
    if (_leaving) return;
    _leaving = true;
    if (_save == SaveState.pending || _save == SaveState.error) {
      await _persist();
    }
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _complete() async {
    final api = context.read<ClinicApi>();
    setState(() => _completing = true);
    try {
      if (!await _persist()) return;
      final pending = await api.prescriptions(visitId: v.id, status: 'pending');
      if (!mounted) return;
      final total = pending.fold<double>(0, (s, p) => s + p.totalAmount);
      final ok = await confirmAction(
        context,
        title: tr('mobile.consultation.completeTitle'),
        message: pending.isEmpty
            ? tr('mobile.consultation.completeMessage')
            : tr('mobile.consultation.sendToCashierMessage',
                {'count': pending.length, 'amount': Fmt.money(total)}),
        confirmLabel: pending.isEmpty
            ? tr('mobile.consultation.complete')
            : tr('mobile.consultation.sendToCashier'),
      );
      if (!ok) return;
      await api.updateVisit(v.id, {
        'status': pending.isEmpty
            ? VisitStatus.completed
            : VisitStatus.pendingPayment,
        'consultationEndTime': Fmt.apiTimeSeconds(DateTime.now()),
      });
      Toast.success(pending.isEmpty
          ? tr('doctorQueue.toast.completeSuccess')
          : tr('doctorQueue.toast.sentToCashier'));
      _leaving = true;
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _completing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final patient = v.patient;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _leave();
      },
      child: BackdropScaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: _leave,
          ),
          titleSpacing: 0,
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(patient?.fullName ?? tr('doctorQueue.consultation.title'),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              Text('${tr('common.visitNumber')}${v.visitNumber}',
                  style: context.text.bodySmall?.copyWith(color: p.inkMuted)),
            ],
          ),
          actions: [
            _SaveIndicator(state: _save),
            _printing
                ? const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 14),
                    child: SizedBox.square(
                        dimension: 20, child: CircularProgressIndicator(strokeWidth: 2.5)),
                  )
                : IconButton(
                    tooltip: tr('doctorQueue.consultation.printPrescription'),
                    icon: const Icon(Icons.print_rounded),
                    onPressed: _print,
                  ),
            const SizedBox(width: 4),
          ],
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: _PatientStrip(visit: v),
            ),
            if (patient?.hasAlerts ?? false)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                child: AlertBanner(patient: patient!),
              ),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: p.subtle,
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(color: p.surfaceBorder),
                ),
                child: TabBar(
                  controller: _tabs,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  dividerColor: Colors.transparent,
                  indicatorSize: TabBarIndicatorSize.tab,
                  indicator: BoxDecoration(
                    color: p.selectedFill,
                    borderRadius: BorderRadius.circular(22),
                  ),
                  labelColor: p.ink,
                  unselectedLabelColor: p.inkMuted,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  splashBorderRadius: BorderRadius.circular(22),
                  tabs: [
                    Tab(height: 40, text: tr('doctorQueue.tabs.consultation')),
                    Tab(height: 40, text: tr('doctorQueue.tabs.vitalSigns')),
                    Tab(height: 40, text: tr('doctorQueue.tabs.investigation')),
                    Tab(height: 40, text: tr('doctorQueue.tabs.herbalMedicine')),
                    Tab(height: 40, text: tr('doctorQueue.consultation.patientFileDrawer')),
                  ],
                ),
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabs,
                children: [
                  _notesTab(context),
                  VitalsTab(visitId: v.id),
                  InvestigationsTab(visit: v),
                  HerbalMedicineTab(visit: v),
                  PatientHistoryTab(
                      patientId: patient?.id ?? asPatientId(v) ?? '', currentVisit: v),
                ],
              ),
            ),
          ],
        ),
        bottomBar: _CompleteBar(
          diagnosis: _diagnosis,
          busy: _completing,
          onComplete: _complete,
        ),
      ),
    );
  }

  /// Web labels carry a trailing " *" for required fields; mobile marks
  /// optional fields instead, so strip it.
  String _label(String key) => tr(key).replaceAll(RegExp(r'\s*\*\s*$'), '');

  Widget _notesTab(BuildContext context) {
    final p = context.palette;
    InputDecoration hint(String h) => InputDecoration(hintText: h);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
      children: [
        GlassCard(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldLabel(_label('consultation.chiefComplaintLabel'),
                  child: TextField(
                    controller: _complaint,
                    minLines: 2,
                    maxLines: 4,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: hint(tr('consultation.chiefComplaintPlaceholder')),
                  )),
              FieldLabel(tr('consultation.symptomsLabel'),
                  child: TagInput(
                    tags: _symptoms,
                    hint: tr('consultation.addSymptomPlaceholder'),
                    tone: Tone.info,
                    onChanged: (t) {
                      setState(() => _symptoms = t);
                      _changed();
                    },
                  )),
              FieldLabel(tr('consultation.historyOfPresentIllnessLabel'),
                  child: TextField(
                    controller: _hpi,
                    minLines: 3,
                    maxLines: 8,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: hint(tr('consultation.historyOfPresentIllnessPlaceholder')),
                  )),
              FieldLabel(tr('consultation.physicalExaminationLabel'),
                  child: TextField(
                    controller: _exam,
                    minLines: 3,
                    maxLines: 8,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: hint(tr('consultation.physicalExaminationPlaceholder')),
                  )),
            ],
          ),
        ),
        const SizedBox(height: 12),
        GlassCard(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldLabel(tr('consultation.diagnosisLabel'),
                  child: TagInput(
                    tags: _diagnosis,
                    hint: tr('consultation.addDiagnosisPlaceholder'),
                    tone: Tone.danger,
                    onChanged: (t) {
                      setState(() => _diagnosis = t);
                      _changed();
                    },
                  )),
              FieldLabel(tr('consultation.treatmentPlanLabel'),
                  child: TextField(
                    controller: _plan,
                    minLines: 3,
                    maxLines: 8,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: hint(tr('consultation.treatmentPlanPlaceholder')),
                  )),
              FieldLabel(tr('consultation.doctorNotesLabel'),
                  optional: true,
                  child: TextField(
                    controller: _notes,
                    minLines: 2,
                    maxLines: 6,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: hint(tr('consultation.doctorNotesPlaceholder')),
                  )),
              FieldLabel(tr('consultation.followUpDateLabel'),
                  optional: true,
                  child: Material(
                    color: p.isDark ? const Color(0x0FFFFFFF) : const Color(0xD9FFFFFF),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: p.divider),
                    ),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () async {
                        final now = DateTime.now();
                        final d = await showDatePicker(
                          context: context,
                          initialDate: _followUp ?? now.add(const Duration(days: 7)),
                          firstDate: DateTime(now.year, now.month, now.day),
                          lastDate: now.add(const Duration(days: 365)),
                        );
                        if (d != null) {
                          setState(() => _followUp = d);
                          _changed();
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(14, 6, 6, 6),
                        child: Row(
                          children: [
                            Icon(Icons.event_repeat_rounded,
                                size: 19, color: Theme.of(context).colorScheme.primary),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _followUp == null
                                    ? tr('mobile.consultation.noFollowUp')
                                    : Fmt.date(_followUp),
                                style: TextStyle(
                                  color: _followUp == null ? p.inkMuted : p.ink,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (_followUp != null)
                              IconButton(
                                icon: const Icon(Icons.close_rounded, size: 18),
                                onPressed: () {
                                  setState(() => _followUp = null);
                                  _changed();
                                },
                              )
                            else
                              const SizedBox(height: 44),
                          ],
                        ),
                      ),
                    ),
                  )),
            ],
          ),
        ),
      ],
    );
  }
}

class _PatientStrip extends StatelessWidget {
  const _PatientStrip({required this.visit});
  final Visit visit;

  @override
  Widget build(BuildContext context) {
    final pt = visit.patient;
    return GlassCard(
      radius: 20,
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          InitialsAvatar(pt?.initials ?? '?', size: 42, soft: false),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(pt?.patientId ?? '', style: context.text.titleSmall),
                const SizedBox(height: 2),
                Text(
                  [pt?.ageGender ?? '', if (pt?.phone != null) pt!.phone!]
                      .where((e) => e.isNotEmpty)
                      .join(' · '),
                  style: context.text.bodySmall,
                ),
              ],
            ),
          ),
          if (visit.arrivalTime != null)
            StatusPill(tr('mobile.visit.arrivedAt', {'time': Fmt.clock(visit.arrivalTime)}),
                tone: Tone.brand, dot: false),
        ],
      ),
    );
  }
}

class _SaveIndicator extends StatelessWidget {
  const _SaveIndicator({required this.state});
  final SaveState state;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final (label, color, pulse) = switch (state) {
      SaveState.idle => ('', p.inkMuted, false),
      SaveState.pending => (tr('mobile.consultation.unsaved'), p.inkMuted, true),
      SaveState.saving => (tr('common.saving'), p.warning, true),
      SaveState.saved => (tr('mobile.consultation.saved'), p.success, false),
      SaveState.error => (tr('mobile.consultation.notSaved'), p.danger, false),
    };
    if (label.isEmpty) return const SizedBox.shrink();
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: Row(
        key: ValueKey(state),
        mainAxisSize: MainAxisSize.min,
        children: [
          if (state == SaveState.saved)
            Icon(Icons.cloud_done_rounded, size: 17, color: color)
          else
            Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                color: color.withValues(alpha: pulse ? 0.7 : 1),
                shape: BoxShape.circle,
              ),
            ),
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(
                  color: color, fontWeight: FontWeight.w700, fontSize: 12.5)),
        ],
      ),
    );
  }
}

class _CompleteBar extends StatelessWidget {
  const _CompleteBar({
    required this.diagnosis,
    required this.busy,
    required this.onComplete,
  });

  final List<String> diagnosis;
  final bool busy;
  final VoidCallback onComplete;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      decoration: BoxDecoration(
        color: p.surfaceSolid,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
        boxShadow: [
          BoxShadow(
            color: p.shadow.withValues(alpha: 0.25),
            blurRadius: 30,
            offset: const Offset(0, -6),
            spreadRadius: -12,
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        minimum: const EdgeInsets.fromLTRB(16, 12, 16, 14),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(tr('doctorQueue.consultation.diagnosisTitle').toUpperCase(),
                    style: context.text.labelSmall?.copyWith(
                        color: p.inkMuted,
                        letterSpacing: 1,
                        fontWeight: FontWeight.w800)),
                const SizedBox(width: 10),
                Expanded(
                  child: diagnosis.isEmpty
                      ? Text(tr('doctorQueue.consultation.noDiagnosis'),
                          style: context.text.bodySmall
                              ?.copyWith(fontStyle: FontStyle.italic))
                      : SizedBox(
                          height: 28,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: diagnosis.length,
                            separatorBuilder: (_, _) => const SizedBox(width: 6),
                            itemBuilder: (_, i) => StatusPill(diagnosis[i],
                                tone: Tone.danger, dot: false),
                          ),
                        ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            GradientButton(
              label: tr('doctorQueue.consultation.completeConsultation'),
              icon: Icons.task_alt_rounded,
              loading: busy,
              onPressed: onComplete,
            ),
          ],
        ),
      ),
    );
  }
}
