import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/paged_state.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';
import 'staff_form_screen.dart';

/// Staff management (super admin & staff manager) — the mobile
/// StaffPage.jsx: stats, search & filters, create, edit, activate /
/// deactivate, reset password and delete.
class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key, this.pushed = false});
  final bool pushed;

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen>
    with PagedLoad<StaffScreen, AppUser> {
  String _search = '';
  String? _role;
  final _busy = <String>{};
  Map<String, dynamic>? _stats;

  @override
  List<String> get refreshOn => const ['staff:created', 'staff:updated'];

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final s = await context.read<ClinicApi>().staffStats();
      if (mounted) setState(() => _stats = s);
    } catch (_) {}
  }

  @override
  Future<Paged<AppUser>> fetchPage(int page) {
    _loadStats();
    return context
        .read<ClinicApi>()
        .staff(page: page, search: _search, role: _role);
  }

  Future<void> _openForm([AppUser? u]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => StaffFormScreen(staff: u)),
    );
    if (saved == true) refresh();
  }

  Future<void> _toggle(AppUser u) async {
    final activate = !u.isActive;
    final ok = await confirmAction(
      context,
      title: activate ? tr('staff.activate') : tr('staff.deactivate'),
      message: activate
          ? tr('mobile.staff.activateMessage', {'name': u.fullName})
          : tr('mobile.staff.deactivateMessage', {'name': u.fullName}),
      confirmLabel: activate ? tr('staff.activate') : tr('staff.deactivate'),
      destructive: !activate,
    );
    if (!ok || !mounted) return;
    final api = context.read<ClinicApi>();
    setState(() => _busy.add(u.id));
    try {
      await api.setStaffActive(u.id, activate);
      Toast.success(activate ? tr('staff.toast.activateSuccess') : tr('staff.toast.deactivateSuccess'));
      await refresh();
    } catch (e) {
      Toast.error(
          '${activate ? tr('staff.toast.activateError') : tr('staff.toast.deactivateError')}: '
          '${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _busy.remove(u.id));
    }
  }

  Future<void> _delete(AppUser u) async {
    final ok = await confirmAction(
      context,
      title: tr('common.delete'),
      message: tr('staff.deleteConfirm', {'name': u.fullName}),
      confirmLabel: tr('common.delete'),
      destructive: true,
    );
    if (!ok || !mounted) return;
    try {
      await context.read<ClinicApi>().deleteStaff(u.id);
      Toast.success(tr('staff.toast.deleteSuccess'));
      refresh();
    } catch (e) {
      Toast.error('${tr('staff.toast.deleteError')}: ${ApiException.from(e).message}');
    }
  }

  void _actions(AppUser u) {
    final me = context.read<AuthController>().user?.id;
    final iAmAdmin = context.read<AuthController>().role == Roles.superAdmin;
    // A staff manager can't modify super admin accounts (backend rule).
    final locked = u.role == Roles.superAdmin && !iAmAdmin;
    showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      builder: (ctx) {
        final p = ctx.palette;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ListTile(
                  leading: InitialsAvatar(u.initials, size: 40),
                  title: Text(u.fullName, style: ctx.text.titleMedium),
                  subtitle: Text([u.email, ?u.phone].join(' · ')),
                ),
                const Divider(),
                if (!locked)
                  ListTile(
                    leading: const Icon(Icons.edit_rounded),
                    title: Text(tr('common.edit')),
                    onTap: () {
                      Navigator.pop(ctx);
                      _openForm(u);
                    },
                  ),
                if (!locked && u.id != me)
                  ListTile(
                    leading: const Icon(Icons.lock_reset_rounded),
                    title: Text(tr('staff.resetPassword.title')),
                    onTap: () {
                      Navigator.pop(ctx);
                      showResetPasswordSheet(context, u);
                    },
                  ),
                if (!locked && u.id != me)
                  ListTile(
                    leading: Icon(Icons.delete_outline_rounded, color: p.danger),
                    title: Text(tr('common.delete'), style: TextStyle(color: p.danger)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _delete(u);
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final me = context.read<AuthController>().user?.id;
    return TabPage(
      title: tr('staff.title'),
      subtitle: tr('staff.subtitle'),
      pushed: widget.pushed,
      fab: GradientFab(
        label: tr('staff.addButton'),
        icon: Icons.person_add_alt_1_rounded,
        onPressed: _openForm,
      ),
      header: Column(
        children: [
          if (_stats != null) _StatsRow(stats: _stats!),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: SearchField(
              hint: tr('staff.searchPlaceholder'),
              onChanged: (v) {
                _search = v;
                refresh(showSpinner: true);
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: FilterChips<String?>(
              value: _role,
              items: [
                (null, tr('staff.filter.allRoles')),
                for (final r in Roles.all) (r, Roles.label(r)),
              ],
              onChanged: (v) {
                setState(() => _role = v);
                refresh(showSpinner: true);
              },
            ),
          ),
        ],
      ),
      child: buildPaged(
        padding: TabPage.listPadding(context, widget.pushed, hasFab: true),
        empty: EmptyView(
          icon: Icons.badge_outlined,
          title: tr('staff.empty'),
        ),
        itemBuilder: (context, u) {
          final p = context.palette;
          return GestureDetector(
            onTap: () => _actions(u),
            child: GlassCard(
              radius: 22,
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  InitialsAvatar(u.initials, size: 46),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(u.fullName, style: context.text.titleSmall),
                        const SizedBox(height: 2),
                        Text(u.email,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: context.text.bodySmall),
                        if (u.lastLogin != null)
                          Text(tr('mobile.staff.lastLogin', {'when': Fmt.relative(u.lastLogin)}),
                              style: context.text.bodySmall?.copyWith(color: p.inkMuted)),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            StatusPill(Roles.label(u.role), tone: Tone.brand, dot: false),
                            StatusPill(AppUser.statusLabel(u.status),
                                tone: u.isActive ? Tone.success : Tone.danger),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (u.id != me)
                    Switch.adaptive(
                      value: u.isActive,
                      activeTrackColor: Brand.b500,
                      onChanged: _busy.contains(u.id) ? null : (_) => _toggle(u),
                    )
                  else
                    Text(tr('staff.you'),
                        style: context.text.labelLarge?.copyWith(color: p.inkMuted)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.stats});
  final Map<String, dynamic> stats;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final byRole = stats['byRole'];
    final doctors = byRole is Map ? byRole['doctors'] : null;
    final items = [
      (tr('staff.stats.total'), stats['total'], Tone.brand),
      (tr('staff.stats.active'), stats['active'], Tone.success),
      (tr('staff.stats.inactive'), stats['inactive'], Tone.danger),
      (tr('staff.stats.doctors'), doctors, Tone.info),
    ];
    return SizedBox(
      height: 76,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final (label, value, tone) = items[i];
          return GlassCard(
            radius: 18,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('${value ?? '—'}',
                    style: context.text.titleLarge
                        ?.copyWith(color: tone.color(p), fontWeight: FontWeight.w800)),
                Text(label, style: context.text.bodySmall),
              ],
            ),
          );
        },
      ),
    );
  }
}
