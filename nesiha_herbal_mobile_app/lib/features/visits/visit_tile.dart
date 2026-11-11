import 'package:material_ui/material_ui.dart';

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
                    Text(patient?.fullName ?? 'Unknown patient',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.text.titleMedium?.copyWith(color: p.ink)),
                    const SizedBox(height: 2),
                    Text('Visit #${visit.visitNumber}',
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
                  child: Text('Dr. ${visit.doctor!.fullName}',
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

/// Past visit in a patient's history: complaint, diagnosis, treatment.
class VisitHistoryCard extends StatelessWidget {
  const VisitHistoryCard({super.key, required this.visit});
  final Visit visit;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
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
                    Text(Fmt.date(visit.visitDate),
                        style: context.text.titleSmall?.copyWith(color: p.ink)),
                    const SizedBox(height: 2),
                    Text(
                      [
                        '#${visit.visitNumber}',
                        if (visit.doctor != null) 'Dr. ${visit.doctor!.fullName}',
                      ].join(' · '),
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
              StatusPill(VisitStatus.label(visit.status),
                  tone: visitTone(visit.status)),
            ],
          ),
          if (visit.chiefComplaint != null) ...[
            const SizedBox(height: 12),
            _Labelled('Complaint', visit.chiefComplaint!),
          ],
          if (visit.diagnosis.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final d in visit.diagnosis)
                  StatusPill(d, tone: Tone.danger, dot: false),
              ],
            ),
          ],
          if (visit.treatmentPlan != null) ...[
            const SizedBox(height: 10),
            _Labelled('Treatment', visit.treatmentPlan!),
          ],
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
