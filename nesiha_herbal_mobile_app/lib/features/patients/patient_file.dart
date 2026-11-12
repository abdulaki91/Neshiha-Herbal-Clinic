import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/format.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/form_fields.dart';
import '../lab/investigation_card.dart';

/// Small self-loading card: shows a skeleton line until [load] resolves.
class _Loader<T> extends StatefulWidget {
  const _Loader({required this.load, required this.builder, this.refreshOn = const []});
  final Future<T> Function(ClinicApi api) load;
  final Widget Function(BuildContext context, T data, VoidCallback reload) builder;
  final List<String> refreshOn;

  @override
  State<_Loader<T>> createState() => _LoaderState<T>();
}

class _LoaderState<T> extends State<_Loader<T>> {
  T? _data;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  Future<void> _reload() async {
    try {
      final d = await widget.load(context.read<ClinicApi>());
      if (mounted) setState(() => _data = d);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_data == null) {
      if (_failed) return const SizedBox.shrink();
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 18),
        child: Center(
            child: SizedBox.square(dimension: 22, child: CircularProgressIndicator(strokeWidth: 2.5))),
      );
    }
    return widget.builder(context, _data as T, _reload);
  }
}

/// "First visit" / "Return visit — N days since last" / "Scheduled
/// follow-up" — the mobile FollowUpIndicator.jsx.
class FollowUpCard extends StatelessWidget {
  const FollowUpCard({super.key, required this.patientId, required this.currentVisit});
  final String patientId;
  final Visit currentVisit;

  @override
  Widget build(BuildContext context) {
    return _Loader<List<Visit>>(
      load: (api) => api.completedVisits(patientId: patientId, pageSize: 3),
      builder: (context, visits, _) {
        final p = context.palette;
        final last = visits.where((v) => v.id != currentVisit.id).firstOrNull;
        if (last == null) {
          return _Banner(
            icon: Icons.fiber_new_rounded,
            color: p.info,
            title: tr('followUpIndicator.firstVisit'),
          );
        }
        final current = currentVisit.visitDate ?? DateTime.now();
        final lastDate = last.visitDate;
        final scheduled = last.followUpDate != null &&
            currentVisit.raw['visitDate']?.toString().startsWith(last.followUpDate!) == true;
        final days = lastDate == null ? null : Fmt.daysBetween(lastDate, current);
        return _Banner(
          icon: scheduled ? Icons.event_available_rounded : Icons.replay_rounded,
          color: scheduled ? p.success : p.info,
          title: scheduled
              ? tr('followUpIndicator.scheduledFollowUp')
              : tr('followUpIndicator.returnVisit'),
          subtitle: days == null ? null : tr('followUpIndicator.daysSinceLast', {'days': days}),
          lines: [
            (tr('followUpIndicator.lastVisit'), Fmt.date(lastDate)),
            if (last.followUpDate != null)
              (tr('followUpIndicator.followUpScheduled'),
                  Fmt.date(DateTime.tryParse(last.followUpDate!))),
            if (last.diagnosis.isNotEmpty)
              (tr('followUpIndicator.previousDiagnosis'), last.diagnosis.join(', ')),
            if (last.treatmentPlan != null)
              (tr('followUpIndicator.previousTreatment'), last.treatmentPlan!),
            if (last.doctorNotes != null)
              (tr('followUpIndicator.previousNotes'), last.doctorNotes!),
          ],
        );
      },
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({
    required this.icon,
    required this.color,
    required this.title,
    this.subtitle,
    this.lines = const [],
  });

  final IconData icon;
  final Color color;
  final String title;
  final String? subtitle;
  final List<(String, String)> lines;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: p.isDark ? 0.13 : 0.07),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title,
                    style: context.text.titleSmall?.copyWith(color: color)),
              ),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: context.text.bodySmall),
          ],
          if (lines.isNotEmpty) const SizedBox(height: 8),
          for (final (label, value) in lines)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text.rich(TextSpan(children: [
                TextSpan(
                    text: '$label ',
                    style: TextStyle(fontWeight: FontWeight.w700, color: p.inkSoft)),
                TextSpan(text: value, style: TextStyle(color: p.ink)),
              ])),
            ),
        ],
      ),
    );
  }
}

/// Prescriptions from the last 90 days with days remaining — the mobile
/// ActivePrescriptions.jsx.
class RecentPrescriptionsCard extends StatelessWidget {
  const RecentPrescriptionsCard({super.key, required this.patientId});
  final String patientId;

  static int? daysRemaining(Prescription rx) {
    final d = rx.duration;
    final start = rx.prescribedDate;
    if (d == null || start == null) return null;
    final m = RegExp(r'(\d+)\s*(day|week|month)', caseSensitive: false).firstMatch(d);
    if (m == null) return null;
    final n = int.parse(m.group(1)!);
    final unit = m.group(2)!.toLowerCase();
    final days = unit == 'week' ? n * 7 : unit == 'month' ? n * 30 : n;
    return Fmt.daysBetween(DateTime.now(), start.add(Duration(days: days)));
  }

  @override
  Widget build(BuildContext context) {
    return _Loader<List<Prescription>>(
      load: (api) => api.prescriptions(patientId: patientId, pageSize: 10),
      builder: (context, all, _) {
        final p = context.palette;
        final cutoff = DateTime.now().subtract(const Duration(days: 90));
        final recent = all
            .where((rx) => rx.prescribedDate == null || rx.prescribedDate!.isAfter(cutoff))
            .toList();
        return _Section(
          icon: Icons.medication_rounded,
          title: tr('activePrescriptions.title'),
          empty: recent.isEmpty ? tr('activePrescriptions.empty') : null,
          children: [
            for (final rx in recent)
              Builder(builder: (context) {
                final left = daysRemaining(rx);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(rx.medicineName, style: context.text.titleSmall),
                            Text(
                              [
                                '${tr('activePrescriptions.prescribedPrefix')}${Fmt.date(rx.prescribedDate)}',
                                tr('receipt.medicine.qty', {'quantity': rx.quantity}),
                                if (rx.duration != null)
                                  '${tr('activePrescriptions.durationLabel')} ${rx.duration}',
                              ].join(' · '),
                              style: context.text.bodySmall,
                            ),
                            if (rx.instructions != null)
                              Text('${tr('activePrescriptions.instructionsLabel')} ${rx.instructions}',
                                  style: context.text.bodySmall),
                            if (left != null && left >= 0 && left <= 3)
                              Text(tr('activePrescriptions.endingSoonAlert'),
                                  style: context.text.labelSmall?.copyWith(color: p.warning)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          StatusPill(Prescription.statusLabel(rx.status),
                              tone: prescriptionTone(rx.status)),
                          if (left != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              left > 0
                                  ? '$left ${tr('activePrescriptions.daysLeft')}'
                                  : left == 0
                                      ? tr('activePrescriptions.endsToday')
                                      : tr('activePrescriptions.expired'),
                              style: context.text.labelSmall?.copyWith(
                                  color: left < 0 ? p.inkMuted : p.warning),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                );
              }),
          ],
        );
      },
    );
  }
}

/// Pending tests and recent results (last 90 days) — the mobile
/// PendingInvestigations.jsx.
class RecentInvestigationsCard extends StatelessWidget {
  const RecentInvestigationsCard({super.key, required this.patientId});
  final String patientId;

  @override
  Widget build(BuildContext context) {
    return _Loader<List<Investigation>>(
      load: (api) => api.investigations(patientId: patientId, pageSize: 10),
      builder: (context, all, _) {
        final cutoff = DateTime.now().subtract(const Duration(days: 90));
        final recent = all
            .where((i) => i.requestedDate == null || i.requestedDate!.isAfter(cutoff))
            .toList();
        final pending = recent.where((i) => i.isPending).toList();
        final done = recent.where((i) => i.status == 'completed').toList();
        return _Section(
          icon: Icons.biotech_rounded,
          title: pending.isNotEmpty
              ? '${tr('pendingInvestigations.pendingTitle')} (${pending.length})'
              : tr('pendingInvestigations.completedTitle'),
          empty: pending.isEmpty && done.isEmpty ? tr('pendingInvestigations.empty') : null,
          children: [
            for (final inv in [...pending, ...done])
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InvestigationCard(investigation: inv),
              ),
          ],
        );
      },
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.icon,
    required this.title,
    required this.children,
    this.empty,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final List<Widget> children;
  final String? empty;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return GlassCard(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(icon, size: 19, color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 8),
              Expanded(child: Text(title, style: context.text.titleSmall)),
              ?trailing,
            ],
          ),
          const SizedBox(height: 12),
          if (empty != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(empty!, style: context.text.bodySmall?.copyWith(color: p.inkMuted)),
            ),
          ...children,
        ],
      ),
    );
  }
}

/// Lab reports & documents on the patient's file: list, open, upload and
/// (doctor only) delete — the attachments tab of PatientRecordSidebar.jsx.
class AttachmentsSection extends StatefulWidget {
  const AttachmentsSection({
    super.key,
    required this.patientId,
    this.visitId,
    this.canUpload = true,
    this.canDelete = false,
  });

  final String patientId;
  final String? visitId;
  final bool canUpload;
  final bool canDelete;

  @override
  State<AttachmentsSection> createState() => _AttachmentsSectionState();
}

class _AttachmentsSectionState extends State<AttachmentsSection> {
  List<Attachment>? _items;
  bool _uploading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await context.read<ClinicApi>().patientAttachments(widget.patientId);
      if (mounted) setState(() => _items = list);
    } catch (_) {
      if (mounted) setState(() => _items = const []);
    }
  }

  Future<void> _upload() async {
    final files = await pickUploads();
    if (files.isEmpty || !mounted) return;
    final api = context.read<ClinicApi>();
    setState(() => _uploading = true);
    Toast.info(tr('patientRecordSidebar.toast.uploadingFile'), icon: Icons.cloud_upload_rounded);
    try {
      for (final f in files) {
        await api.uploadPatientAttachment(widget.patientId, f, visitId: widget.visitId);
      }
      Toast.success(tr('patientRecordSidebar.toast.fileAttached'));
      await _load();
    } catch (e) {
      Toast.error('${tr('patientRecordSidebar.toast.uploadFailed')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _delete(Attachment a) async {
    final ok = await confirmAction(
      context,
      title: tr('patientRecordSidebar.deleteFileTitle'),
      message: tr('patientRecordSidebar.toast.deleteFileConfirm'),
      confirmLabel: tr('common.delete'),
      destructive: true,
    );
    if (!ok || !mounted) return;
    try {
      await context.read<ClinicApi>().deletePatientAttachment(widget.patientId, a.id);
      Toast.success(tr('patientRecordSidebar.toast.fileDeleted'));
      await _load();
    } catch (e) {
      Toast.error('${tr('patientRecordSidebar.toast.deleteFileFailed')}: ${ApiException.from(e).message}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final items = _items;
    return _Section(
      icon: Icons.folder_open_rounded,
      title: '${tr('patientRecordSidebar.tabs.attachments')}${items == null ? '' : ' (${items.length})'}',
      empty: items != null && items.isEmpty ? tr('patientRecordSidebar.noFilesUploaded') : null,
      trailing: widget.canUpload
          ? (_uploading
              ? const SizedBox.square(
                  dimension: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
              : IconButton(
                  tooltip: tr('patientRecordSidebar.uploadTitle'),
                  icon: const Icon(Icons.upload_file_rounded),
                  onPressed: _upload,
                ))
          : null,
      children: [
        if (items == null)
          const Padding(
            padding: EdgeInsets.only(bottom: 14),
            child: Center(
                child: SizedBox.square(
                    dimension: 22, child: CircularProgressIndicator(strokeWidth: 2.5))),
          ),
        if (widget.canUpload && items != null && items.isEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(tr('patientRecordSidebar.uploadHint'),
                style: context.text.bodySmall?.copyWith(color: p.inkMuted)),
          ),
        for (final a in items ?? const <Attachment>[])
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: p.subtle,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                a.isImage
                    ? Icons.image_rounded
                    : a.isPdf
                        ? Icons.picture_as_pdf_rounded
                        : Icons.description_rounded,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            title: Text(a.fileName, maxLines: 1, overflow: TextOverflow.ellipsis),
            subtitle: Text(
                '${tr('patientRecordSidebar.uploadedOnPrefix')} ${Fmt.date(a.createdAt)}',
                style: context.text.bodySmall),
            onTap: () {
              final url = AppConfig.fileUrl(a.filePath);
              if (url != null) {
                launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
              }
            },
            trailing: widget.canDelete
                ? IconButton(
                    tooltip: tr('patientRecordSidebar.deleteFileTitle'),
                    icon: Icon(Icons.delete_outline_rounded, color: p.danger),
                    onPressed: () => _delete(a),
                  )
                : Icon(Icons.open_in_new_rounded, size: 18, color: p.inkMuted),
          ),
      ],
    );
  }
}
