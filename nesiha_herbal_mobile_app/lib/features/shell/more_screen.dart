import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/notification_service.dart';
import '../../core/socket_service.dart';
import '../../i18n/i18n.dart';
import '../../i18n/language_picker.dart';
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
    final notifications = context.watch<NotificationService>();
    final user = auth.user;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: TabPage.listPadding(context, false, top: 10),
        children: [
          Text(tr('mobile.nav.more'), style: context.text.headlineSmall),
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
            SectionTitle(tr('mobile.more.workspace')),
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
          SectionTitle(tr('mobile.more.appearance')),
          Segmented<ThemeMode>(
            value: theme.mode,
            onChanged: theme.setMode,
            items: [
              (ThemeMode.system, tr('mobile.more.themeSystem'), Icons.brightness_auto_rounded),
              (ThemeMode.light, tr('mobile.more.themeLight'), Icons.light_mode_rounded),
              (ThemeMode.dark, tr('mobile.more.themeDark'), Icons.dark_mode_rounded),
            ],
          ),
          const SizedBox(height: 22),
          SectionTitle(tr('mobile.more.language')),
          const LanguagePicker(),
          const SizedBox(height: 22),
          SectionTitle(tr('mobile.more.account')),
          GlassCard(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
              children: [
                _MenuTile(
                  icon: Icons.lock_reset_rounded,
                  title: tr('mobile.password.title'),
                  onTap: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    useSafeArea: true,
                    builder: (_) => const _ChangePasswordSheet(),
                  ),
                ),
                if (notifications.isSupported)
                  _MenuTile(
                    icon: Icons.notifications_active_rounded,
                    title: tr('mobile.notify.toggleTitle'),
                    subtitle: notifications.enabled && !notifications.permitted
                        ? tr('mobile.notify.blocked')
                        : tr('mobile.notify.toggleSubtitle'),
                    onTap: () => notifications.setEnabled(!notifications.enabled),
                    trailing: Switch.adaptive(
                      value: notifications.enabled && notifications.permitted,
                      onChanged: notifications.setEnabled,
                    ),
                  ),
                _MenuTile(
                  icon: Icons.sensors_rounded,
                  title: tr('dashboard.systemStatus.realtimeUpdates'),
                  subtitle: live ? tr('dashboard.systemStatus.connected') : tr('dashboard.systemStatus.reconnecting'),
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
                  title: tr('mobile.more.server'),
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
              title: tr('sidebar.logout'),
              color: p.danger,
              trailing: const SizedBox.shrink(),
              onTap: () async {
                final ok = await confirmAction(context,
                    title: tr('mobile.more.signOutTitle'),
                    message: tr('mobile.more.signOutMessage'),
                    confirmLabel: tr('sidebar.logout'),
                    destructive: true);
                if (ok) auth.logout();
              },
            ),
          ),
          const SizedBox(height: 18),
          Center(
            child: Text(tr('mobile.more.footer'),
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
      Toast.success(tr('mobile.password.changed'));
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
              Text(tr('mobile.password.title'), style: context.text.titleLarge),
              const SizedBox(height: 4),
              Text(tr('staffForm.passwordHint'),
                  style: context.text.bodySmall),
              const SizedBox(height: 18),
              TextFormField(
                controller: _current,
                obscureText: true,
                decoration: InputDecoration(labelText: tr('mobile.password.current')),
                validator: (v) => (v ?? '').isEmpty ? tr('mobile.validation.required') : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _next,
                obscureText: true,
                decoration: InputDecoration(labelText: tr('staff.resetPassword.newPassword')),
                validator: (v) {
                  final s = v ?? '';
                  if (s.length < 8) return tr('staffForm.passwordTooShort');
                  if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(s)) {
                    return tr('staffForm.passwordWeak');
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _confirm,
                obscureText: true,
                decoration: InputDecoration(labelText: tr('staff.resetPassword.confirmPassword')),
                validator: (v) => v != _next.text ? tr('staff.resetPassword.mismatch') : null,
              ),
              const SizedBox(height: 20),
              GradientButton(
                label: tr('mobile.password.submit'),
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
