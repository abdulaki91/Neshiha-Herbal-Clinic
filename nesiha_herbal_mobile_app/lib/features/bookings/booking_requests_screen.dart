import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../i18n/i18n.dart';
import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/paged_state.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';
import '../patients/patient_form_screen.dart';

/// Appointment requests submitted from the public website.
class BookingRequestsScreen extends StatefulWidget {
  const BookingRequestsScreen({super.key, this.pushed = false});
  final bool pushed;

  @override
  State<BookingRequestsScreen> createState() => _BookingRequestsScreenState();
}

class _BookingRequestsScreenState extends State<BookingRequestsScreen>
    with PagedLoad<BookingRequestsScreen, BookingRequest> {
  String? _status = 'pending';
  final _busy = <String>{};

  @override
  List<String> get refreshOn =>
      const ['booking-request:created', 'booking-request:updated'];

  @override
  Future<Paged<BookingRequest>> fetchPage(int page) => context
      .read<ClinicApi>()
      .bookingRequests(page: page, status: _status);

  Future<void> _setStatus(BookingRequest b, String status, String done) async {
    final api = context.read<ClinicApi>();
    setState(() => _busy.add(b.id));
    try {
      await api.setBookingStatus(b.id, status);
      Toast.success(done);
      await refresh();
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy.remove(b.id));
    }
  }

  Future<void> _decline(BookingRequest b) async {
    final ok = await confirmAction(context,
        title: tr('bookingRequests.decline'),
        message: tr('mobile.bookings.declineMessage', {'name': b.fullName}),
        confirmLabel: tr('bookingRequests.decline'),
        destructive: true);
    if (ok) _setStatus(b, 'declined', tr('bookingRequests.statusUpdateSuccess'));
  }

  /// Registration needs more than the public form collects, so convert opens
  /// the patient form pre-filled; the request is marked converted only once
  /// the patient is actually created (same as the web portal).
  Future<void> _convert(BookingRequest b) async {
    final parts = b.fullName.trim().split(RegExp(r'\s+'));
    final api = context.read<ClinicApi>();
    final created = await Navigator.of(context).push<Patient>(MaterialPageRoute(
      builder: (_) => PatientFormScreen(prefill: {
        'firstName': parts.first,
        'lastName': parts.skip(1).join(' '),
        'phone': b.phone,
      }),
    ));
    if (created == null) return;
    try {
      await api.setBookingStatus(b.id, 'converted');
    } catch (_) {
      // The patient exists either way; not worth alarming the user over.
    }
    refresh();
  }

  @override
  Widget build(BuildContext context) {
    return TabPage(
      title: tr('bookingRequests.title'),
      subtitle: tr('bookingRequests.subtitle'),
      pushed: widget.pushed,
      header: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: FilterChips<String?>(
          value: _status,
          items: [
            (null, tr('bookingRequests.allStatuses')),
            for (final s in BookingRequest.statuses) (s, tr('bookingRequests.status.$s')),
          ],
          onChanged: (v) {
            setState(() => _status = v);
            refresh(showSpinner: true);
          },
        ),
      ),
      child: buildPaged(
        padding: TabPage.listPadding(context, widget.pushed),
        empty: EmptyView(
          icon: Icons.inbox_outlined,
          title: tr('bookingRequests.empty'),
          subtitle: tr('mobile.bookings.emptyHint'),
        ),
        itemBuilder: (context, b) => _BookingCard(
          booking: b,
          busy: _busy.contains(b.id),
          onContacted: () => _setStatus(b, 'contacted', tr('bookingRequests.statusUpdateSuccess')),
          onConvert: () => _convert(b),
          onDecline: () => _decline(b),
        ),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({
    required this.booking,
    required this.busy,
    required this.onContacted,
    required this.onConvert,
    required this.onDecline,
  });

  final BookingRequest booking;
  final bool busy;
  final VoidCallback onContacted;
  final VoidCallback onConvert;
  final VoidCallback onDecline;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final b = booking;
    final open = !['converted', 'declined'].contains(b.status);
    return GlassCard(
      radius: 22,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(b.fullName, style: context.text.titleMedium),
              ),
              StatusPill(I18n.instance.maybe('bookingRequests.status.${b.status}') ?? Fmt.titleCase(b.status), tone: bookingTone(b.status)),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 14,
            runSpacing: 6,
            children: [
              _Meta(Icons.phone_rounded, b.phone),
              if (b.email != null) _Meta(Icons.mail_outline_rounded, b.email!),
              _Meta(
                Icons.event_rounded,
                [
                  Fmt.date(b.preferredDate),
                  if (b.preferredTime != null) I18n.instance.maybe('bookingRequests.time.${b.preferredTime}') ?? Fmt.titleCase(b.preferredTime),
                ].join(' · '),
              ),
            ],
          ),
          if (b.reason != null) ...[
            const SizedBox(height: 10),
            Text('"${b.reason}"',
                style: context.text.bodyMedium
                    ?.copyWith(fontStyle: FontStyle.italic, color: p.inkSoft)),
          ],
          if (b.createdAt != null) ...[
            const SizedBox(height: 8),
            Text(tr('mobile.bookings.received', {'when': Fmt.relative(b.createdAt)}), style: context.text.bodySmall),
          ],
          if (open) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: busy ? null : onConvert,
                    icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
                    label: Text(tr('bookingRequests.convert')),
                    style: FilledButton.styleFrom(
                      backgroundColor: Brand.b600,
                      foregroundColor: Colors.white,
                      shape: const StadiumBorder(),
                      minimumSize: const Size(0, 44),
                    ),
                  ),
                ),
                if (b.status == 'pending') ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: busy ? null : onContacted,
                      style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44)),
                      child: Text(tr('bookingRequests.markContacted')),
                    ),
                  ),
                ],
                const SizedBox(width: 8),
                IconButton(
                  tooltip: tr('bookingRequests.decline'),
                  onPressed: busy ? null : onDecline,
                  icon: Icon(Icons.close_rounded, color: p.danger),
                  style: IconButton.styleFrom(
                      backgroundColor: p.danger.withValues(alpha: 0.1)),
                ),
              ],
            ),
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
        Icon(icon, size: 15, color: p.inkMuted),
        const SizedBox(width: 5),
        Text(text,
            style: context.text.bodySmall
                ?.copyWith(color: p.inkSoft, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
