import 'dart:async';
import 'dart:ui';

import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/json.dart';
import '../../core/api_client.dart';
import '../../core/notification_service.dart';
import '../../core/push_service.dart';
import '../../core/socket_service.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
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

    // Notifications: open the right screen when one is tapped (including the
    // one that launched the app), and ask for permission once signed in.
    final notifications = NotificationService.instance;
    notifications.tapped.addListener(_onNotificationTap);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _onNotificationTap();
      if (notifications.enabled && !notifications.permitted) {
        notifications.requestPermission();
      }
      // Firebase push for when the app is closed.
      PushService.instance.register(context.read<ApiClient>());
    });
  }

  @override
  void dispose() {
    NotificationService.instance.tapped.removeListener(_onNotificationTap);
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
    final toast = _toastFor(e.name, data);
    if (toast != null) _alert(toast.$1, toast.$2, _destinationFor(e.name));
  }

  /// System notification (sound + popup) when allowed, otherwise the
  /// in-app toast.
  Future<void> _alert(String message, IconData icon, String? destination) async {
    // In the background, a registered phone gets the Firebase push for the
    // same event — don't alert twice.
    final background =
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed;
    if (background && PushService.instance.registered) return;
    final shown = await NotificationService.instance
        .show(body: message, payload: destination);
    if (!shown) Toast.info(message, icon: icon);
  }

  /// Where tapping an event's notification takes this role (a nav id;
  /// ShellController.goTo ignores ids the role doesn't have).
  String? _destinationFor(String event) => switch (event) {
        'queue:updated' || 'visit:created' => 'queue',
        'visit:status-changed' => switch (_role) {
            Roles.doctor => 'queue',
            Roles.cashier => 'cashier',
            _ => 'visits',
          },
        'patient:registered' => 'patients',
        'prescription:created' => _role == Roles.cashier ? 'cashier' : 'queue',
        'medicine:dispensed' => 'pharmacy',
        'medicine:low-stock' => 'medicines',
        'payment:completed' => _role == Roles.cashier ? 'cashier' : 'reports',
        'registration-fee:collected' => 'reports',
        'investigation:created' || 'investigation:result-added' => 'laboratory',
        'booking-request:created' => 'bookings',
        'staff:created' => 'staff',
        _ => null,
      };

  void _onNotificationTap() {
    final id = NotificationService.instance.tapped.value;
    if (id == null || !mounted) return;
    NotificationService.instance.tapped.value = null;
    _shell.goTo(context, id);
  }

  // Same events, roles and wording as the web's PortalLayout.jsx toasts.
  // Some events reach a role through two rooms (e.g. queue:updated and
  // visit:status-changed for one save), so identical toasts within a
  // moment are collapsed.
  String? _lastToast;
  DateTime _lastToastAt = DateTime(2000);

  (String, IconData)? _toastFor(String name, Map<String, dynamic> data) {
    final isDoctor = _role == Roles.doctor;
    final isClerk = _role == Roles.dataClerk;
    final isCashier = _role == Roles.cashier;
    final isAdmin = _role == Roles.superAdmin || _role == Roles.staffManager;
    final (String, IconData)? t = switch (name) {
      'queue:updated' when isDoctor =>
        (tr('toast.newPatientInQueue'), Icons.notifications_active_rounded),
      'visit:created' when isDoctor => (tr('toast.newVisitCreated'), Icons.event_note_rounded),
      'visit:status-changed' when !isAdmin => (
          tr('toast.visitStatus', {'status': VisitStatus.label(asString(data['status']))}),
          Icons.sync_rounded
        ),
      'patient:registered' when isDoctor || isClerk => (
          tr('toast.patientRegistered', {
            'firstName': asString(data['firstName']) ?? '',
            'lastName': asString(data['lastName']) ?? '',
          }),
          Icons.person_add_alt_1_rounded
        ),
      'notification:new' when (asString(data['message']) ?? asString(data['title'])) != null => (
          asString(data['message']) ?? asString(data['title'])!,
          asString(data['priority']) == 'urgent'
              ? Icons.priority_high_rounded
              : Icons.mark_email_unread_rounded
        ),
      'prescription:created' when isDoctor || isCashier =>
        (tr('toast.prescriptionAdded'), Icons.medication_rounded),
      'medicine:dispensed' when isDoctor || isCashier =>
        (tr('toast.medicineDispensed'), Icons.local_pharmacy_rounded),
      'medicine:low-stock' when isDoctor || isClerk => (
          tr('mobile.toast.lowStock', {'name': asString(data['name']) ?? ''}),
          Icons.inventory_2_rounded
        ),
      'payment:completed' when isDoctor || isCashier => (
          tr('toast.paymentReceived', {'amount': Fmt.count(asDouble(data['amount']))}),
          Icons.payments_rounded
        ),
      'registration-fee:collected' when isDoctor => (
          tr('mobile.toast.registrationFee', {'amount': Fmt.count(asDouble(data['amount']))}),
          Icons.how_to_reg_rounded
        ),
      'investigation:created' when isDoctor => (
          tr('mobile.toast.investigationRequested', {'test': asString(data['testName']) ?? ''}),
          Icons.biotech_rounded
        ),
      'investigation:result-added' when isDoctor => (
          tr('mobile.toast.investigationResult', {'test': asString(data['testName']) ?? ''}),
          Icons.task_alt_rounded
        ),
      'booking-request:created' when isDoctor || isClerk => (
          tr('toast.newBookingRequest', {'name': asString(data['fullName']) ?? ''}),
          Icons.event_available_rounded
        ),
      'staff:created' when isAdmin => (tr('toast.staffCreated'), Icons.badge_rounded),
      _ => null,
    };
    if (t == null) return null;
    final now = DateTime.now();
    if (t.$1 == _lastToast && now.difference(_lastToastAt) < const Duration(seconds: 2)) {
      return null;
    }
    _lastToast = t.$1;
    _lastToastAt = now;
    return t;
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
