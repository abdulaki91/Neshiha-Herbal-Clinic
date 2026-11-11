import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/async_state.dart';
import '../../core/format.dart';
import '../../core/json.dart';
import '../../core/socket_service.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/brand.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';
import '../notifications/notifications_sheet.dart';
import '../patients/patient_detail_screen.dart';
import '../shell/home_shell.dart';

class _DashData {
  _DashData(this.stats, this.pendingBookings);
  final Map<String, dynamic> stats;
  final int pendingBookings;
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with AsyncLoad<DashboardScreen, _DashData> {
  late final String role = context.read<AuthController>().role;

  @override
  List<String> get refreshOn => const [
        'visit:created',
        'visit:status-changed',
        'queue:updated',
        'patient:registered',
        'payment:completed',
        'prescription:created',
        'booking-request:created',
      ];

  @override
  Future<_DashData> fetch() async {
    final api = context.read<ClinicApi>();
    final wantsBookings = role == Roles.doctor || role == Roles.dataClerk;
    final results = await Future.wait([
      api.dashboard(role),
      wantsBookings
          ? api.pendingBookingCount().catchError((_) => 0)
          : Future.value(0),
    ]);
    return _DashData(results[0] as Map<String, dynamic>, results[1] as int);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: () => reload(silent: true),
        child: ListView(
          padding: TabPage.listPadding(context, false, top: 0),
          children: [
            _TopBar(firstName: user?.firstName ?? '', initials: user?.initials ?? ''),
            const SizedBox(height: 18),
            if (loading && data == null)
              const SizedBox(height: 360, child: LoadingView())
            else if (error != null && data == null)
              ErrorView(message: error!, onRetry: reload)
            else
              ..._content(context, data!),
          ],
        ),
      ),
    );
  }

  List<Widget> _content(BuildContext context, _DashData d) {
    final s = d.stats;
    final live = context.watch<SocketService>().isConnected;
    final shell = context.read<ShellController>();
    void go(String id) => shell.goTo(context, id);

    switch (role) {
      case Roles.doctor:
        final queue = asInt(s['todayQueue']) ?? 0;
        final done = asInt(s['todayCompleted']) ?? 0;
        final rx = asInt(s['todayPrescriptions']) ?? 0;
        final dispensed = asInt(s['todayDispensed']) ?? 0;
        final waiting = asMapList(s['waitingPatients']).map(Visit.new).toList();
        final next = waiting.isNotEmpty ? waiting.first.patient?.fullName : null;
        final insight = queue > 0
            ? _Insight('Patients are waiting for you.',
                'In queue: $queue · Next up: ${next ?? '—'}')
            : d.pendingBookings > 0
                ? _Insight('New online booking requests need review.',
                    'Pending requests: ${d.pendingBookings}')
                : done > 0
                    ? _Insight('Your queue is clear — nice work today.',
                        'Consultations completed today: $done')
                    : _Insight('No patients in your queue yet.',
                        'New visits will appear here in real time.');
        final ctaBookings = queue == 0 && d.pendingBookings > 0;
        return [
          _Hero(
            percent: _pct(done, done + queue),
            caption: done + queue == 0 ? 'No visits yet' : 'Queue cleared',
            marks: [('In queue', queue), ('Completed', done), ('Prescribed', rx)],
            insight: insight,
            ctaLabel: ctaBookings ? 'Review requests' : 'Open queue',
            onCta: () => go(ctaBookings ? 'bookings' : 'queue'),
          ),
          const SizedBox(height: 16),
          _TileGrid(tiles: [
            _Tile('In queue', '$queue', Icons.groups_rounded, Tone.warning,
                footer: next != null ? 'Next: $next' : 'Live',
                live: live),
            _Tile('Completed today', '$done', Icons.task_alt_rounded, Tone.success),
            _Tile('Prescriptions', '$rx', Icons.medication_rounded, Tone.brand,
                footer: '$dispensed of $rx dispensed',
                progress: rx == 0 ? null : dispensed / rx),
            _Tile('Booking requests', '${d.pendingBookings}', Icons.inbox_rounded,
                d.pendingBookings > 0 ? Tone.danger : Tone.violet,
                footer: 'From the website', onTap: () => go('bookings')),
          ]),
          const SizedBox(height: 22),
          SectionTitle('Waiting patients',
              trailing: waiting.isEmpty
                  ? null
                  : TextButton(
                      onPressed: () => go('queue'), child: const Text('See queue'))),
          if (waiting.isEmpty)
            const _EmptyPanel('No patients waiting right now.')
          else
            for (var i = 0; i < waiting.length && i < 5; i++)
              _ListRow(
                leading: _NumberBadge(i + 1),
                title: waiting[i].patient?.fullName ?? '—',
                subtitle: [
                  waiting[i].patient?.ageGender ?? '',
                  if (waiting[i].arrivalTime != null)
                    'Arrived ${Fmt.clock(waiting[i].arrivalTime)}',
                ].where((e) => e.isNotEmpty).join(' · '),
                onTap: () => go('queue'),
              ),
        ];

      case Roles.dataClerk:
        final registered = asInt(s['todayRegistrations']) ?? 0;
        final visits = asInt(s['todayVisits']) ?? 0;
        final waiting = asInt(s['waitingPatients']) ?? 0;
        final seen = (visits - waiting).clamp(0, 1 << 30);
        final recent = asMapList(s['recentPatients']).map(Patient.new).toList();
        final insight = d.pendingBookings > 0
            ? _Insight('New online booking requests need review.',
                'Pending requests: ${d.pendingBookings}')
            : waiting > 0
                ? _Insight('Patients are waiting to be seen.',
                    'Waiting now: $waiting. Keeping the queue moving shortens wait times.')
                : _Insight('Everything is running smoothly — all caught up.',
                    'New activity will appear here in real time.');
        return [
          _Hero(
            percent: _pct(seen, visits),
            caption: visits == 0 ? 'No visits yet' : 'Visits seen',
            marks: [('Waiting', waiting), ('Visits', visits), ('Registered', registered)],
            insight: insight,
            ctaLabel: d.pendingBookings > 0 ? 'Review requests' : 'View patients',
            onCta: () => go(d.pendingBookings > 0 ? 'bookings' : 'patients'),
          ),
          const SizedBox(height: 16),
          _TileGrid(tiles: [
            _Tile('Registered today', '$registered', Icons.person_add_alt_1_rounded,
                Tone.brand, live: live, footer: 'Live'),
            _Tile("Today's visits", '$visits', Icons.event_note_rounded, Tone.info,
                footer: '$seen seen · $waiting waiting',
                progress: visits == 0 ? null : seen / visits),
            _Tile('Waiting now', '$waiting', Icons.hourglass_top_rounded,
                waiting > 0 ? Tone.warning : Tone.success,
                footer: 'Checked in & waiting'),
            _Tile('Booking requests', '${d.pendingBookings}', Icons.inbox_rounded,
                d.pendingBookings > 0 ? Tone.danger : Tone.violet,
                footer: 'From the website', onTap: () => go('bookings')),
          ]),
          const SizedBox(height: 22),
          const SectionTitle('Recent registrations'),
          if (recent.isEmpty)
            const _EmptyPanel('No registrations yet.')
          else
            for (final pt in recent.take(6))
              _ListRow(
                leading: InitialsAvatar(pt.initials, size: 42),
                title: pt.fullName,
                subtitle: 'ID ${pt.patientId}',
                trailing: Fmt.time(pt.createdAt),
                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => PatientDetailScreen(patientId: pt.id))),
              ),
        ];

      case Roles.cashier:
        final pending = asInt(s['pendingPayments']) ?? 0;
        final processed = asInt(s['todayPaymentsCount']) ?? 0;
        final recent = asMapList(s['recentPayments']).map(Payment.new).toList();
        final last = recent.isNotEmpty ? recent.first : null;
        final insight = pending > 0
            ? _Insight('Visits are waiting for payment.', 'Pending payments: $pending')
            : _Insight('All payments are settled.',
                'New payments will appear here in real time.');
        return [
          _Hero(
            percent: _pct(processed, processed + pending),
            caption: processed + pending == 0 ? 'No payments yet' : 'Payments cleared',
            marks: [('Pending', pending), ('Processed', processed)],
            insight: insight,
            ctaLabel: 'Open cashier',
            onCta: () => go('cashier'),
          ),
          const SizedBox(height: 16),
          _TileGrid(tiles: [
            _Tile('Pending payments', '$pending', Icons.pending_actions_rounded,
                pending > 0 ? Tone.warning : Tone.success,
                footer: 'Waiting to be paid', onTap: () => go('cashier')),
            _Tile('Processed today', '$processed', Icons.receipt_long_rounded,
                Tone.brand, live: live, footer: 'Live'),
            _Tile('Last payment', last == null ? '—' : Fmt.time(last.paidAt),
                Icons.schedule_rounded, Tone.info,
                footer: last == null
                    ? 'No payments yet'
                    : '${last.patient?.fullName ?? ''} · ${Payment.methodLabel(last.method)}'),
            _Tile('Recent', '${recent.length}', Icons.payments_rounded, Tone.violet,
                footer: 'Recent transactions'),
          ]),
          const SizedBox(height: 22),
          const SectionTitle('Recent payments'),
          if (recent.isEmpty)
            const _EmptyPanel('No payments yet today.')
          else
            for (final pay in recent.take(8))
              _ListRow(
                leading: InitialsAvatar(pay.patient?.initials ?? '₿', size: 42),
                title: pay.patient?.fullName ?? pay.paymentNumber,
                subtitle:
                    '${pay.paymentNumber} · ${Payment.methodLabel(pay.method)}',
                trailing: Fmt.money(pay.amount),
              ),
        ];

      default:
        final sum = asMap(s['summary']) ?? const {};
        final visits = asInt(sum['todayVisits']) ?? 0;
        final completed = asInt(sum['completedVisits']) ?? 0;
        final waiting = asInt(sum['waitingPatients']) ?? 0;
        final low = asInt(sum['lowStockMedicines']) ?? 0;
        final expired = asInt(sum['expiredMedicines']) ?? 0;
        final doctors = asInt(sum['totalDoctors']) ?? 0;
        final staff = asInt(sum['totalStaff']) ?? 0;
        final patients = asInt(sum['totalPatients']) ?? 0;
        final insight = expired > 0
            ? _Insight('Some medicines have expired.',
                'Expired: $expired · Low stock: $low. Remove expired stock before it reaches a patient.')
            : low > 0
                ? _Insight('Some medicines are running low.',
                    'Low stock: $low. Restock soon to avoid gaps in treatment.')
                : waiting > 0
                    ? _Insight('Patients are waiting to be seen.', 'Waiting now: $waiting.')
                    : _Insight('Everything is running smoothly — all caught up.',
                        'New activity will appear here in real time.');
        return [
          _Hero(
            percent: _pct(completed, visits),
            caption: visits == 0 ? 'No visits yet' : 'Visits completed',
            marks: [('Waiting', waiting), ('Completed', completed), ('Visits', visits)],
            insight: insight,
            ctaLabel: 'Manage staff',
            onCta: () => go('staff'),
          ),
          const SizedBox(height: 16),
          _TileGrid(tiles: [
            _Tile("Today's visits", '$visits', Icons.event_note_rounded, Tone.info,
                progress: visits == 0 ? null : completed / visits,
                footer: '$completed completed'),
            _Tile('Total patients', Fmt.count(patients), Icons.people_alt_rounded,
                Tone.brand, live: live, footer: 'Active records'),
            _Tile('Staff', '$staff', Icons.badge_rounded, Tone.violet,
                footer: '$doctors doctors', onTap: () => go('staff')),
            _Tile('Medicine alerts', '${low + expired}', Icons.local_florist_rounded,
                low + expired == 0 ? Tone.success : Tone.danger,
                footer: '$low low · $expired expired'),
          ]),
          const SizedBox(height: 22),
          const SectionTitle('System status'),
          _StatusRow(icon: Icons.storage_rounded, label: 'Database', ok: true,
              text: 'Online'),
          _StatusRow(icon: Icons.sensors_rounded, label: 'Real-time updates',
              ok: live, text: live ? 'Connected' : 'Reconnecting'),
        ];
    }
  }

  static double? _pct(int part, int whole) =>
      whole > 0 ? part / whole * 100 : null;
}

// ----------------------------------------------------------------- pieces

class _TopBar extends StatelessWidget {
  const _TopBar({required this.firstName, required this.initials});
  final String firstName;
  final String initials;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(Fmt.longToday(),
                    style: context.text.bodySmall?.copyWith(
                        color: p.inkMuted, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text('${Fmt.greeting()}, $firstName',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.text.headlineSmall
                        ?.copyWith(fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          const _BellButton(),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => context.read<ShellController>().goTo(context, 'more'),
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: p.surfaceBorder, width: 2),
              ),
              child: InitialsAvatar(initials, size: 40, soft: false),
            ),
          ),
        ],
      ),
    );
  }
}

class _BellButton extends StatefulWidget {
  const _BellButton();

  @override
  State<_BellButton> createState() => _BellButtonState();
}

class _BellButtonState extends State<_BellButton>
    with AsyncLoad<_BellButton, int> {
  @override
  List<String> get refreshOn => const [
        'notification:new',
        'patient:registered',
        'payment:completed',
        'visit:status-changed',
      ];

  @override
  Future<int> fetch() async {
    final list = await context.read<ClinicApi>().notifications();
    return list.where((n) => !n.isRead).length;
  }

  @override
  Widget build(BuildContext context) {
    return CircleIconButton(
      icon: Icons.notifications_none_rounded,
      tooltip: 'Notifications',
      badge: data ?? 0,
      onPressed: () async {
        await showNotificationsSheet(context);
        reload(silent: true);
      },
    );
  }
}

class _Insight {
  _Insight(this.headline, this.detail);
  final String headline;
  final String detail;
}

class _Hero extends StatelessWidget {
  const _Hero({
    required this.percent,
    required this.caption,
    required this.marks,
    required this.insight,
    required this.ctaLabel,
    required this.onCta,
  });

  final double? percent;
  final String caption;
  final List<(String, int)> marks;
  final _Insight insight;
  final String ctaLabel;
  final VoidCallback onCta;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return ClipRRect(
      borderRadius: BorderRadius.circular(30),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: p.heroGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(color: Colors.white.withValues(alpha: p.isDark ? 0.08 : 0.4)),
          borderRadius: BorderRadius.circular(30),
        ),
        child: Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(-1.1, 1.1),
                    radius: 1.1,
                    colors: [p.heroBlob, p.heroBlob.withValues(alpha: 0)],
                  ),
                ),
              ),
            ),
            const Positioned(right: -10, bottom: -14, child: Sprigs(size: 130, opacity: 0.75)),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      PulseRing(percent: percent, caption: caption, size: 128),
                      const SizedBox(width: 18),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            for (final (label, value) in marks)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 5),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 7,
                                      height: 7,
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.85),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(label,
                                          style: TextStyle(
                                              color: Colors.white.withValues(alpha: 0.88),
                                              fontSize: 13,
                                              fontWeight: FontWeight.w500)),
                                    ),
                                    Text('$value',
                                        style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 20,
                                            fontWeight: FontWeight.w300)),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text("Today's insight",
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Text(insight.headline,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          height: 1.18,
                          letterSpacing: -0.4,
                          fontWeight: FontWeight.w400)),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.only(right: 70),
                    child: Text(insight.detail,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontSize: 13.5,
                            height: 1.4)),
                  ),
                  const SizedBox(height: 16),
                  Material(
                    color: Colors.white,
                    shape: const StadiumBorder(),
                    child: InkWell(
                      customBorder: const StadiumBorder(),
                      onTap: onCta,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(ctaLabel,
                                style: const TextStyle(
                                    color: Brand.b950,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14)),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward_rounded,
                                size: 18, color: Brand.b950),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tile {
  _Tile(this.title, this.value, this.icon, this.tone,
      {this.footer, this.progress, this.live, this.onTap});
  final String title;
  final String value;
  final IconData icon;
  final Tone tone;
  final String? footer;
  final double? progress;
  final bool? live;
  final VoidCallback? onTap;
}

class _TileGrid extends StatelessWidget {
  const _TileGrid({required this.tiles});
  final List<_Tile> tiles;

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < tiles.length; i += 2) {
      rows.add(IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: _TileCard(tile: tiles[i])),
            const SizedBox(width: 12),
            Expanded(
                child: i + 1 < tiles.length
                    ? _TileCard(tile: tiles[i + 1])
                    : const SizedBox()),
          ],
        ),
      ));
      if (i + 2 < tiles.length) rows.add(const SizedBox(height: 12));
    }
    return Column(children: rows);
  }
}

class _TileCard extends StatelessWidget {
  const _TileCard({required this.tile});
  final _Tile tile;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final c = tile.tone.color(p);
    return GlassCard(
      onTap: tile.onTap,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: c.withValues(alpha: p.isDark ? 0.18 : 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(tile.icon, size: 19, color: c),
              ),
              const Spacer(),
              if (tile.live != null)
                _LiveDot(on: tile.live!),
            ],
          ),
          const SizedBox(height: 12),
          Text(tile.value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.text.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w400, letterSpacing: -1, height: 1)),
          const SizedBox(height: 4),
          Text(tile.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.text.labelLarge?.copyWith(color: p.inkSoft)),
          if (tile.progress != null) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: tile.progress!.clamp(0, 1),
                minHeight: 5,
                color: c,
                backgroundColor: c.withValues(alpha: 0.15),
              ),
            ),
          ],
          if (tile.footer != null) ...[
            const SizedBox(height: 8),
            Text(tile.footer!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.text.bodySmall),
          ],
        ],
      ),
    );
  }
}

class _LiveDot extends StatelessWidget {
  const _LiveDot({required this.on});
  final bool on;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final c = on ? p.success : p.warning;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(
            color: c,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: c.withValues(alpha: 0.6), blurRadius: 6)],
          ),
        ),
        const SizedBox(width: 5),
        Text(on ? 'Live' : 'Offline',
            style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w700)),
      ],
    );
  }
}

class _ListRow extends StatelessWidget {
  const _ListRow({
    required this.leading,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  final Widget leading;
  final String title;
  final String subtitle;
  final String? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      radius: 20,
      onTap: onTap,
      child: Row(
        children: [
          leading,
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.text.titleSmall?.copyWith(color: p.ink)),
                const SizedBox(height: 2),
                Text(subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: context.text.bodySmall),
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 8),
            Text(trailing!,
                style: context.text.labelLarge?.copyWith(color: p.inkSoft)),
          ] else if (onTap != null)
            Icon(Icons.chevron_right_rounded, color: p.inkMuted),
        ],
      ),
    );
  }
}

class _NumberBadge extends StatelessWidget {
  const _NumberBadge(this.n);
  final int n;

  @override
  Widget build(BuildContext context) => Container(
        width: 42,
        height: 42,
        decoration: const BoxDecoration(
          gradient: Brand.markGradient,
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Text('$n',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
      );
}

class _EmptyPanel extends StatelessWidget {
  const _EmptyPanel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
        child: Center(
          child: Text(text,
              textAlign: TextAlign.center,
              style: context.text.bodyMedium
                  ?.copyWith(color: context.palette.inkMuted)),
        ),
      );
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({
    required this.icon,
    required this.label,
    required this.ok,
    required this.text,
  });
  final IconData icon;
  final String label;
  final bool ok;
  final String text;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final c = ok ? p.success : p.warning;
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      radius: 20,
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: context.text.titleSmall)),
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: c, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(text, style: TextStyle(color: c, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
