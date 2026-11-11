import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/paged_state.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';

/// Staff directory with activate / deactivate (super admin & staff manager).
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

  @override
  List<String> get refreshOn => const ['staff:created', 'staff:updated'];

  @override
  Future<Paged<AppUser>> fetchPage(int page) => context
      .read<ClinicApi>()
      .staff(page: page, search: _search, role: _role);

  Future<void> _toggle(AppUser u) async {
    final activate = !u.isActive;
    final ok = await confirmAction(
      context,
      title: activate ? 'Activate account?' : 'Deactivate account?',
      message: activate
          ? '${u.fullName} will be able to sign in again.'
          : '${u.fullName} will no longer be able to sign in.',
      confirmLabel: activate ? 'Activate' : 'Deactivate',
      destructive: !activate,
    );
    if (!ok || !mounted) return;
    final api = context.read<ClinicApi>();
    setState(() => _busy.add(u.id));
    try {
      await api.setStaffActive(u.id, activate);
      Toast.success(activate ? 'Account activated' : 'Account deactivated');
      await refresh();
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy.remove(u.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = context.read<AuthController>().user?.id;
    return TabPage(
      title: 'Staff',
      subtitle: 'Accounts and access',
      pushed: widget.pushed,
      header: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: SearchField(
              hint: 'Search by name or email',
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
              items: const [
                (null, 'All'),
                (Roles.doctor, 'Doctors'),
                (Roles.dataClerk, 'Data clerks'),
                (Roles.cashier, 'Cashiers'),
                (Roles.staffManager, 'Managers'),
                (Roles.superAdmin, 'Admins'),
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
        padding: TabPage.listPadding(context, widget.pushed),
        empty: const EmptyView(
          icon: Icons.badge_outlined,
          title: 'No staff found',
        ),
        itemBuilder: (context, u) {
          final p = context.palette;
          return GlassCard(
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
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          StatusPill(Roles.label(u.role), tone: Tone.brand, dot: false),
                          StatusPill(Fmt.titleCase(u.status),
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
                  Text('You', style: context.text.labelLarge?.copyWith(color: p.inkMuted)),
              ],
            ),
          );
        },
      ),
    );
  }
}
