import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../core/format.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';

Tone investigationTone(String status) => switch (status) {
      'requested' => Tone.warning,
      'in_progress' => Tone.info,
      'completed' => Tone.success,
      'cancelled' => Tone.danger,
      _ => Tone.neutral,
    };

Tone urgencyTone(String urgency) => switch (urgency) {
      'urgent' => Tone.warning,
      'stat' => Tone.danger,
      _ => Tone.neutral,
    };

/// One investigation request with its status, urgency, dates and — once
/// completed — the results. Used in the consultation and the laboratory.
class InvestigationCard extends StatelessWidget {
  const InvestigationCard({
    super.key,
    required this.investigation,
    this.showPatient = false,
    this.actions = const [],
  });

  final Investigation investigation;
  final bool showPatient;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final inv = investigation;
    final patient = inv.patient;
    return GlassCard(
      radius: 22,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showPatient && patient != null) ...[
            Row(
              children: [
                InitialsAvatar(patient.initials, size: 34),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(patient.fullName, style: context.text.titleSmall),
                      Text(
                        [
                          patient.patientId,
                          if (patient.age != null)
                            tr('mobile.common.ageYears', {'age': patient.age}),
                        ].where((e) => e.isNotEmpty).join(' · '),
                        style: context.text.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
          ],
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: investigationTone(inv.status)
                      .color(p)
                      .withValues(alpha: p.isDark ? 0.18 : 0.1),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(Icons.biotech_rounded,
                    color: investigationTone(inv.status).color(p), size: 21),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(inv.testName, style: context.text.titleSmall),
                    const SizedBox(height: 2),
                    Text(Investigation.typeLabel(inv.type), style: context.text.bodySmall),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              StatusPill(Investigation.statusLabel(inv.status),
                  tone: investigationTone(inv.status)),
              StatusPill(Investigation.urgencyLabel(inv.urgency),
                  tone: urgencyTone(inv.urgency), dot: false),
            ],
          ),
          if (inv.urgency == 'stat' && inv.isPending) ...[
            const SizedBox(height: 8),
            Text(tr('pendingInvestigations.statAlert'),
                style: context.text.labelMedium?.copyWith(color: p.danger)),
          ],
          if (inv.instructions != null) ...[
            const SizedBox(height: 8),
            Text('${tr('laboratory.detail.instructions')} ${inv.instructions}',
                style: context.text.bodySmall),
          ],
          const SizedBox(height: 8),
          Wrap(
            spacing: 14,
            runSpacing: 4,
            children: [
              _Meta(Icons.event_rounded,
                  '${tr('laboratory.info.requested')} ${Fmt.date(inv.requestedDate)}'),
              if (inv.scheduledDate != null)
                _Meta(Icons.schedule_rounded,
                    '${tr('laboratory.info.scheduled')} ${Fmt.date(inv.scheduledDate)}'),
              if (inv.completedDate != null)
                _Meta(Icons.task_alt_rounded,
                    '${tr('laboratory.info.completed')} ${Fmt.date(inv.completedDate)}'),
            ],
          ),
          if (inv.status == 'completed' && inv.results != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: p.success.withValues(alpha: p.isDark ? 0.12 : 0.07),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tr('laboratory.detail.results'),
                      style: context.text.labelMedium?.copyWith(color: p.success)),
                  const SizedBox(height: 4),
                  Text(inv.results!, style: context.text.bodyMedium),
                  if (inv.interpretation != null) ...[
                    const SizedBox(height: 8),
                    Text(tr('laboratory.detail.interpretation'),
                        style: context.text.labelMedium?.copyWith(color: p.success)),
                    const SizedBox(height: 2),
                    Text(inv.interpretation!, style: context.text.bodyMedium),
                  ],
                  if (inv.performedBy != null) ...[
                    const SizedBox(height: 8),
                    Text('${tr('laboratory.info.performedBy')} ${inv.performedBy}',
                        style: context.text.bodySmall),
                  ],
                  if (AppConfig.fileUrl(inv.resultFile) case final url?) ...[
                    const SizedBox(height: 6),
                    TextButton.icon(
                      icon: const Icon(Icons.attach_file_rounded, size: 18),
                      label: Text(tr('pendingInvestigations.viewResultFile')),
                      onPressed: () => launchUrl(Uri.parse(url),
                          mode: LaunchMode.externalApplication),
                    ),
                  ],
                ],
              ),
            ),
          ],
          if (actions.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: actions),
          ],
        ],
      ),
    );
  }
}

class _Meta extends StatelessWidget {
  const _Meta(this.icon, this.text);
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: p.inkMuted),
        const SizedBox(width: 4),
        Text(text, style: context.text.bodySmall),
      ],
    );
  }
}

