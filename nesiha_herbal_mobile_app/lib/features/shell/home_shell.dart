import 'dart:async';
import 'dart:ui';

import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/json.dart';
import '../../core/socket_service.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/backdrop.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import 'nav_config.dart';

/// Lets any screen switch tabs (e.g. a dashboard CTA → Queue) and read the
/// live badge counts.
class ShellController extends ChangeNotifier {
  ShellController(this.tabs, this.more);

  final List<NavDestination> tabs;
  final List<NavDestination> more;
  int index = 0;
  final Map<NavBadge, int> counts = {};

  void select(int i) {
    if (i == index) return;
    index = i;
    notifyListeners();
  }

  /// Switch to [id] if it's a tab; otherwise push it (it lives under More).
  void goTo(BuildContext context, String id) {
    final i = tabs.indexWhere((t) => t.id == id);
    if (i >= 0) return select(i);
    final dest = more.where((d) => d.id == id).firstOrNull;
    if (dest != null) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => dest.page()));
    }
  }

  int count(NavBadge? b) => b == null ? 0 : (counts[b] ?? 0);

  void setCounts(Map<NavBadge, int> next) {
    counts
      ..clear()
      ..addAll(next);
    notifyListeners();
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late final ShellController _shell;
  late final String _role;
  final _built = <int>{0};
  StreamSubscription<SocketEvent>? _sub;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _role = context.read<AuthController>().role;
    final nav = navFor(_role);
    _shell = ShellController(nav.tabs, nav.more);
    _refreshCounts();
    // Sockets keep counts fresh; polling is the safety net for missed events
    // (same pattern as the web portal's refetchInterval).
    _poll = Timer.periodic(const Duration(seconds: 30), (_) => _refreshCounts());
    _sub = context.read<SocketService>().events.listen(_onSocket);
  }

  @override
  void dispose() {
    _sub?.cancel();
    _poll?.cancel();
    _shell.dispose();
    super.dispose();
  }

  Future<void> _refreshCounts() async {
    final api = context.read<ClinicApi>();
    final next = <NavBadge, int>{};
    final jobs = <Future<void>>[];
    if (_role == Roles.doctor) {
      jobs.add(api.queue().then((q) => next[NavBadge.queue] = q.length));
    }
    if (_role == Roles.cashier) {
      jobs.add(api
          .pendingPayments()
          .then((v) => next[NavBadge.payments] = v.length));
    }
    if (_role == Roles.doctor || _role == Roles.dataClerk) {
      jobs.add(api
          .pendingBookingCount()
          .then((c) => next[NavBadge.bookings] = c));
    }
    await Future.wait(jobs.map((j) => j.catchError((_) {})));
    if (mounted) _shell.setCounts(next);
  }

  void _onSocket(SocketEvent e) {
    const countEvents = {
      'queue:updated',
      'visit:status-changed',
      'visit:created',
      'payment:completed',
      'prescription:created',
      'booking-request:created',
      'booking-request:updated',
    };
    if (countEvents.contains(e.name)) _refreshCounts();

    final data = asMap(e.data) ?? const {};
    final isDoctor = _role == Roles.doctor;
    final isClerk = _role == Roles.dataClerk;
    final isCashier = _role == Roles.cashier;
    switch (e.name) {
      case 'queue:updated' when isDoctor:
        Toast.info('New patient in the queue', icon: Icons.notifications_active_rounded);
      case 'patient:registered' when isDoctor || isClerk:
        final name = '${asString(data['firstName']) ?? ''} ${asString(data['lastName']) ?? ''}'.trim();
        if (name.isNotEmpty) {
          Toast.info('$name was registered', icon: Icons.person_add_alt_1_rounded);
        }
      case 'notification:new':
        final msg = asString(data['message']) ?? asString(data['title']);
        if (msg != null) Toast.info(msg);
      case 'prescription:created' when isCashier:
        Toast.info('New prescription awaiting payment', icon: Icons.medication_rounded);
      case 'payment:completed' when isDoctor || isCashier:
        Toast.info('Payment received · ${Fmt.money(asDouble(data['amount']))}',
            icon: Icons.payments_rounded);
      case 'booking-request:created' when isDoctor || isClerk:
        Toast.info('New booking request from ${asString(data['fullName']) ?? 'a visitor'}',
            icon: Icons.event_available_rounded);
      case 'staff:created'
          when _role == Roles.superAdmin || _role == Roles.staffManager:
        Toast.info('New staff account created', icon: Icons.badge_rounded);
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _shell,
      child: Consumer<ShellController>(
        builder: (context, shell, _) {
          _built.add(shell.index);
          return PopScope(
            canPop: shell.index == 0,
            onPopInvokedWithResult: (didPop, _) {
              if (!didPop) shell.select(0);
            },
            child: AppBackdrop(
              child: Scaffold(
                backgroundColor: Colors.transparent,
                extendBody: true,
                body: IndexedStack(
                  index: shell.index,
                  children: [
                    for (var i = 0; i < shell.tabs.length; i++)
                      _built.contains(i)
                          ? shell.tabs[i].page()
                          : const SizedBox.shrink(),
                  ],
                ),
                bottomNavigationBar: _NavBar(shell: shell),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _NavBar extends StatelessWidget {
  const _NavBar({required this.shell});
  final ShellController shell;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, bottom > 0 ? bottom : 14),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(30),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
          child: Container(
            height: 70,
            decoration: BoxDecoration(
              color: p.isDark
                  ? const Color(0xCC1E1A33)
                  : Colors.white.withValues(alpha: 0.78),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: p.surfaceBorder),
            ),
            child: Row(
              children: [
                for (var i = 0; i < shell.tabs.length; i++)
                  Expanded(
                    child: _NavItem(
                      dest: shell.tabs[i],
                      selected: i == shell.index,
                      badge: shell.tabs[i].id == 'more'
                          ? shell.more.fold(
                              0, (s, d) => s + shell.count(d.badge))
                          : shell.count(shell.tabs[i].badge),
                      onTap: () => shell.select(i),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.dest,
    required this.selected,
    required this.badge,
    required this.onTap,
  });

  final NavDestination dest;
  final bool selected;
  final int badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Semantics(
      selected: selected,
      button: true,
      label: dest.label,
      child: InkResponse(
        onTap: onTap,
        radius: 36,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  width: selected ? 46 : 36,
                  height: 32,
                  decoration: BoxDecoration(
                    gradient: selected ? Brand.markGradient : null,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: selected
                        ? [
                            BoxShadow(
                              color: Brand.b500.withValues(alpha: 0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 5),
                              spreadRadius: -4,
                            )
                          ]
                        : null,
                  ),
                  child: Icon(
                    selected ? dest.activeIcon : dest.icon,
                    size: 21,
                    color: selected ? Colors.white : p.inkMuted,
                  ),
                ),
                if (badge > 0)
                  Positioned(
                      right: -8, top: -6, child: CountBadge(count: badge)),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              dest.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? p.ink : p.inkMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
