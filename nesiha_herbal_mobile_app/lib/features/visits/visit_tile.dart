import 'package:material_ui/material_ui.dart';

import '../../i18n/i18n.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';

/// Visit row in lists (Visits screen).
class VisitTile extends StatelessWidget {
  const VisitTile({super.key, required this.visit, this.onTap});
  final Visit visit;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final patient = visit.patient;
    return GlassCard(
      onTap: onTap,
      radius: 22,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              InitialsAvatar(patient?.initials ?? '?', size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(patient?.fullName ?? tr('common.patient'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.text.titleMedium?.copyWith(color: p.ink)),
                    const SizedBox(height: 2),
                    Text('${tr('common.visitNumber')}${visit.visitNumber}',
                        style: context.text.bodySmall),
                  ],
                ),
              ),
              StatusPill(VisitStatus.label(visit.status),
                  tone: visitTone(visit.status)),
            ],
          ),
          if (visit.chiefComplaint != null) ...[
            const SizedBox(height: 10),
            Text(visit.chiefComplaint!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: context.text.bodyMedium),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.calendar_today_rounded, size: 14, color: p.inkMuted),
              const SizedBox(width: 5),
              Text(Fmt.date(visit.visitDate), style: context.text.bodySmall),
              const SizedBox(width: 14),
              Icon(Icons.schedule_rounded, size: 14, color: p.inkMuted),
              const SizedBox(width: 5),
              Text(Fmt.clock(visit.arrivalTime ?? visit.scheduledTime),
                  style: context.text.bodySmall),
              if (visit.doctor != null) ...[
                const SizedBox(width: 14),
                Icon(Icons.medical_services_outlined, size: 14, color: p.inkMuted),
                const SizedBox(width: 5),
                Flexible(
                  child: Text('${tr('common.doctorPrefix')} ${visit.doctor!.fullName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.bodySmall),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

/// A past visit in a patient's history.
///
/// Always shows when, who, the complaint, the diagnosis and the medicines
/// the patient received. "Full record" opens everything else recorded in
/// that visit: symptoms, vital signs, history, examination, treatment plan,
/// doctor's notes, follow-up date, medicine instructions and payment state,
/// investigations with their results, and the payment.
class VisitHistoryCard extends StatefulWidget {
  const VisitHistoryCard({super.key, required this.visit, this.initiallyExpanded = false});
  final Visit visit;
  final bool initiallyExpanded;

  @override
  State<VisitHistoryCard> createState() => _VisitHistoryCardState();
}

class _VisitHistoryCardState extends State<VisitHistoryCard> {
  late bool _open = widget.initiallyExpanded;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final v = widget.visit;
    final meds = v.prescriptions;
    final tests = v.investigations;
    final hasMore = v.symptoms.isNotEmpty ||
        v.hasVitals ||
        v.historyOfPresentIllness != null ||
        v.physicalExamination != null ||
        v.treatmentPlan != null ||
        v.doctorNotes != null ||
        v.followUpDate != null ||
        tests.isNotEmpty ||
        v.payments.isNotEmpty ||
        meds.any((m) => m.instructions != null || m.dosage != null);
    return GlassCard(
      radius: 22,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(Fmt.date(v.visitDate),
                        style: context.text.titleSmall?.copyWith(color: p.ink)),
                    const SizedBox(height: 2),
                    Text(
                      [
                        '#${v.visitNumber}',
                        if (v.doctor != null) '${tr('common.doctorPrefix')} ${v.doctor!.fullName}',
                      ].join(' · '),
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
              StatusPill(VisitStatus.label(v.status), tone: visitTone(v.status)),
            ],
          ),
          if (v.chiefComplaint != null) ...[
            const SizedBox(height: 12),
            _Labelled(trl('patientDetail.visitHistory.complaint'), v.chiefComplaint!),
          ],
          if (v.diagnosis.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final d in v.diagnosis) StatusPill(d, tone: Tone.danger, dot: false),
              ],
            ),
          ],
          // Medicines received — always visible.
          const SizedBox(height: 12),
          _SectionLabel(Icons.medication_rounded, tr('herbalMedicine.listTitle')),
          if (meds.isEmpty)
            Text(tr('herbalMedicine.emptyList'),
                style: context.text.bodySmall?.copyWith(color: p.inkMuted))
          else
            for (final rx in meds) _MedicineLine(rx: rx, detailed: _open),
          if (_open) ..._details(context, v, tests),
          if (hasMore)
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: TextButton.icon(
                style: TextButton.styleFrom(padding: EdgeInsets.zero),
                icon: Icon(_open ? Icons.expand_less_rounded : Icons.expand_more_rounded),
                label: Text(_open ? tr('mobile.history.hide') : tr('mobile.history.fullRecord')),
                onPressed: () => setState(() => _open = !_open),
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _details(BuildContext context, Visit v, List<Investigation> tests) {
    String fmtNum(num? n) => n == null ? '' : (n == n.roundToDouble() ? '${n.toInt()}' : '$n');
    final vitals = <String>[
      if (v.temperature != null) '${trl('vitalSigns.temperatureLabel')}: ${fmtNum(v.temperature)}',
      if (v.bloodPressureSystolic != null || v.bloodPressureDiastolic != null)
        '${trl('vitalSigns.bloodPressureLabel')}: ${fmtNum(v.bloodPressureSystolic)}/${fmtNum(v.bloodPressureDiastolic)}',
      if (v.heartRate != null) '${trl('vitalSigns.heartRateLabel')}: ${v.heartRate}',
      if (v.respiratoryRate != null) '${trl('vitalSigns.respiratoryRateLabel')}: ${v.respiratoryRate}',
      if (v.oxygenSaturation != null) '${trl('vitalSigns.oxygenSaturationLabel')}: ${fmtNum(v.oxygenSaturation)}',
      if (v.weight != null) '${trl('vitalSigns.weightLabel')}: ${fmtNum(v.weight)}',
      if (v.height != null) '${trl('vitalSigns.heightLabel')}: ${fmtNum(v.height)}',
      if (v.bmi != null) 'BMI: ${v.bmi!.toStringAsFixed(1)}',
    ];
    final followUp = DateTime.tryParse(v.followUpDate ?? '');
    return [
      if (v.symptoms.isNotEmpty) ...[
        const SizedBox(height: 12),
        _Labelled(tr('consultation.symptomsLabel'), v.symptoms.join(', ')),
      ],
      if (vitals.isNotEmpty) ...[
        const SizedBox(height: 12),
        _SectionLabel(Icons.monitor_heart_rounded, tr('vitalSigns.title')),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [for (final s in vitals) _VitalChip(s)],
        ),
      ],
      if (v.historyOfPresentIllness != null) ...[
        const SizedBox(height: 10),
        _Labelled(tr('consultation.historyOfPresentIllnessLabel'), v.historyOfPresentIllness!),
      ],
      if (v.physicalExamination != null) ...[
        const SizedBox(height: 10),
        _Labelled(tr('consultation.physicalExaminationLabel'), v.physicalExamination!),
      ],
      if (v.treatmentPlan != null) ...[
        const SizedBox(height: 10),
        _Labelled(trl('patientDetail.visitHistory.treatment'), v.treatmentPlan!),
      ],
      if (v.doctorNotes != null) ...[
        const SizedBox(height: 10),
        _Labelled(tr('consultation.doctorNotesLabel'), v.doctorNotes!),
      ],
      if (followUp != null) ...[
        const SizedBox(height: 10),
        _Labelled(tr('consultation.followUpDateLabel'), Fmt.date(followUp)),
      ],
      if (tests.isNotEmpty) ...[
        const SizedBox(height: 12),
        _SectionLabel(Icons.biotech_rounded, tr('doctorQueue.tabs.investigation')),
        for (final t in tests) _TestLine(test: t),
      ],
      for (final pay in v.payments) ...[
        const SizedBox(height: 10),
        _Labelled(
          tr('mobile.history.payment'),
          [
            Fmt.money(pay.amount),
            Payment.methodLabel(pay.method),
            Fmt.dateTime(pay.paidAt),
          ].join(' · '),
        ),
      ],
    ];
  }
}

/// A vital-sign reading. Unlike StatusPill it may wrap: labels such as
/// "Blood Pressure (mmHg): 150/95" don't fit one line on narrow phones.
class _VitalChip extends StatelessWidget {
  const _VitalChip(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: p.info.withValues(alpha: p.isDark ? 0.16 : 0.11),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(text,
          style: TextStyle(color: p.info, fontSize: 11.5, fontWeight: FontWeight.w700)),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.icon, this.text);
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 15, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 6),
          Text(text,
              style: TextStyle(color: p.inkMuted, fontWeight: FontWeight.w800, fontSize: 12.5)),
        ],
      ),
    );
  }
}

/// One prescribed medicine: name, quantity and status; with [detailed],
/// also dosage, frequency, duration, instructions and price.
class _MedicineLine extends StatelessWidget {
  const _MedicineLine({required this.rx, required this.detailed});
  final Prescription rx;
  final bool detailed;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final name = rx.medicine?.strength == null
        ? rx.medicineName
        : '${rx.medicineName} (${rx.medicine!.strength})';
    final schedule = [?rx.dosage, ?rx.frequency, ?rx.duration].join(' · ');
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 3),
            child: Icon(Icons.eco_rounded, size: 15, color: Brand.sage),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$name  ×${rx.quantity}',
                    style: TextStyle(color: p.ink, fontWeight: FontWeight.w700, fontSize: 13.5)),
                if (detailed && schedule.isNotEmpty)
                  Text(schedule, style: context.text.bodySmall),
                if (detailed && rx.instructions != null)
                  Text(rx.instructions!,
                      style: context.text.bodySmall?.copyWith(fontStyle: FontStyle.italic)),
                if (detailed)
                  Text(
                    [
                      Fmt.money(rx.totalAmount),
                      if (rx.dispensedDate != null)
                        '${tr('pharmacy.status.dispensed')} ${Fmt.date(rx.dispensedDate)}',
                    ].join(' · '),
                    style: context.text.bodySmall?.copyWith(color: p.inkMuted),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          StatusPill(Prescription.statusLabel(rx.status), tone: prescriptionTone(rx.status)),
        ],
      ),
    );
  }
}

class _TestLine extends StatelessWidget {
  const _TestLine({required this.test});
  final Investigation test;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('${test.testName} · ${Investigation.typeLabel(test.type)}',
                    style: TextStyle(color: p.ink, fontWeight: FontWeight.w700, fontSize: 13.5)),
              ),
              StatusPill(Investigation.statusLabel(test.status),
                  tone: test.status == 'completed'
                      ? Tone.success
                      : test.status == 'cancelled'
                          ? Tone.danger
                          : Tone.warning),
            ],
          ),
          if (test.results != null)
            Text('${tr('laboratory.detail.results')} ${test.results}', style: context.text.bodySmall),
          if (test.interpretation != null)
            Text('${tr('laboratory.detail.interpretation')} ${test.interpretation}',
                style: context.text.bodySmall),
        ],
      ),
    );
  }
}

class _Labelled extends StatelessWidget {
  const _Labelled(this.label, this.text);
  final String label;
  final String text;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Text.rich(TextSpan(children: [
      TextSpan(
          text: '$label  ',
          style: TextStyle(color: p.inkMuted, fontWeight: FontWeight.w700, fontSize: 12.5)),
      TextSpan(text: text, style: TextStyle(color: p.inkSoft, fontSize: 13.5)),
    ]));
  }
}
