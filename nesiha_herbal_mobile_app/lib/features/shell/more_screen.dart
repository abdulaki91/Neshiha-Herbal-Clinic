import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/socket_service.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../state/theme_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';
import 'home_shell.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final auth = context.watch<AuthController>();
    final shell = context.watch<ShellController>();
    final theme = context.watch<ThemeController>();
    final live = context.watch<SocketService>().isConnected;
    final user = auth.user;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: TabPage.listPadding(context, false, top: 10),
        children: [
          Text('More', style: context.text.headlineSmall),
          const SizedBox(height: 16),
          GlassCard(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                InitialsAvatar(user?.initials ?? '', size: 58, soft: false),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.fullName ?? '', style: context.text.titleLarge),
                      const SizedBox(height: 2),
                      Text(user?.email ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: context.text.bodySmall),
                      const SizedBox(height: 8),
                      StatusPill(Roles.label(user?.role),
                          tone: Tone.brand, dot: false),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (shell.more.isNotEmpty) ...[
            const SizedBox(height: 22),
            const SectionTitle('Workspace'),
            GlassCard(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Column(
                children: [
                  for (final d in shell.more)
                    _MenuTile(
                      icon: d.activeIcon,
                      title: d.label,
                      subtitle: d.description,
                      badge: shell.count(d.badge),
                      onTap: () => Navigator.of(context)
                          .push(MaterialPageRoute(builder: (_) => d.page())),
                    ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 22),
          const SectionTitle('Appearance'),
          Segmented<ThemeMode>(
            value: theme.mode,
            onChanged: theme.setMode,
            items: const [
              (ThemeMode.system, 'System', Icons.brightness_auto_rounded),
              (ThemeMode.light, 'Light', Icons.light_mode_rounded),
              (ThemeMode.dark, 'Dark', Icons.dark_mode_rounded),
            ],
          ),
          const SizedBox(height: 22),
          const SectionTitle('Account'),
          GlassCard(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
              children: [
                _MenuTile(
                  icon: Icons.lock_reset_rounded,
                  title: 'Change password',
                  onTap: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    useSafeArea: true,
                    builder: (_) => const _ChangePasswordSheet(),
                  ),
                ),
                _MenuTile(
                  icon: Icons.sensors_rounded,
                  title: 'Real-time updates',
                  subtitle: live ? 'Connected' : 'Reconnecting…',
                  trailing: Container(
                    width: 9,
                    height: 9,
                    decoration: BoxDecoration(
                      color: live ? p.success : p.warning,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                _MenuTile(
                  icon: Icons.dns_rounded,
                  title: 'Server',
                  subtitle: Uri.parse(AppConfig.apiUrl).host,
                  trailing: const SizedBox.shrink(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          GlassCard(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: _MenuTile(
              icon: Icons.logout_rounded,
              title: 'Sign out',
              color: p.danger,
              trailing: const SizedBox.shrink(),
              onTap: () async {
                final ok = await confirmAction(context,
                    title: 'Sign out?',
                    message: 'You\'ll need your email and password to sign back in.',
                    confirmLabel: 'Sign out',
                    destructive: true);
                if (ok) auth.logout();
              },
            ),
          ),
          const SizedBox(height: 18),
          Center(
            child: Text('Nesiha Herbal Clinic · Staff app',
                style: context.text.bodySmall),
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.badge = 0,
    this.trailing,
    this.color,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final int badge;
  final Widget? trailing;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final c = color ?? Theme.of(context).colorScheme.primary;
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: c.withValues(alpha: p.isDark ? 0.18 : 0.1),
          borderRadius: BorderRadius.circular(13),
        ),
        child: Icon(icon, color: c, size: 21),
      ),
      title: Text(title,
          style: context.text.titleSmall?.copyWith(color: color ?? p.ink)),
      subtitle: subtitle == null
          ? null
          : Text(subtitle!, style: context.text.bodySmall),
      trailing: trailing ??
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (badge > 0) CountBadge(count: badge),
              Icon(Icons.chevron_right_rounded, color: p.inkMuted),
            ],
          ),
    );
  }
}

class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet();

  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _form = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    final auth = context.read<AuthController>();
    setState(() => _saving = true);
    try {
      await auth.changePassword(_current.text, _next.text);
      Toast.success('Password changed — please sign in again');
      if (mounted) Navigator.of(context).pop();
      // The server invalidates every session on a password change.
      await auth.logout();
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Change password', style: context.text.titleLarge),
              const SizedBox(height: 4),
              Text('At least 8 characters, with upper & lower case letters and a number.',
                  style: context.text.bodySmall),
              const SizedBox(height: 18),
              TextFormField(
                controller: _current,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Current password'),
                validator: (v) => (v ?? '').isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _next,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'New password'),
                validator: (v) {
                  final s = v ?? '';
                  if (s.length < 8) return 'At least 8 characters';
                  if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(s)) {
                    return 'Needs upper & lower case letters and a number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _confirm,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Confirm new password'),
                validator: (v) => v != _next.text ? 'Passwords don\'t match' : null,
              ),
              const SizedBox(height: 20),
              GradientButton(
                label: 'Update password',
                icon: Icons.check_rounded,
                loading: _saving,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
