import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../i18n/i18n.dart';
import '../../core/api_client.dart';
import '../../core/async_state.dart';
import '../../core/format.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/feedback.dart';

Future<void> showNotificationsSheet(BuildContext context) =>
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const _NotificationsSheet(),
    );

class _NotificationsSheet extends StatefulWidget {
  const _NotificationsSheet();

  @override
  State<_NotificationsSheet> createState() => _NotificationsSheetState();
}

class _NotificationsSheetState extends State<_NotificationsSheet>
    with AsyncLoad<_NotificationsSheet, List<AppNotification>> {
  bool _clearing = false;

  @override
  List<String> get refreshOn => const ['notification:new'];

  @override
  Future<List<AppNotification>> fetch() =>
      context.read<ClinicApi>().notifications();

  Future<void> _clear() async {
    setState(() => _clearing = true);
    try {
      await context.read<ClinicApi>().clearNotifications();
      await reload(silent: true);
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _clearing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final list = data ?? const <AppNotification>[];
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.75,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 12, 8),
            child: Row(
              children: [
                Expanded(
                    child: Text(tr('topbar.notifications'), style: context.text.titleLarge)),
                if (list.isNotEmpty)
                  TextButton.icon(
                    onPressed: _clearing ? null : _clear,
                    icon: const Icon(Icons.done_all_rounded, size: 18),
                    label: Text(tr('topbar.markAllRead')),
                  ),
              ],
            ),
          ),
          Expanded(
            child: loading && data == null
                ? const LoadingView()
                : error != null && data == null
                    ? ErrorView(message: error!, onRetry: reload)
                    : list.isEmpty
                        ? EmptyView(
                            icon: Icons.notifications_off_outlined,
                            title: tr('topbar.noNotifications'),
                            subtitle: tr('mobile.notifications.emptyHint'),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                            itemCount: list.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 8),
                            itemBuilder: (context, i) {
                              final n = list[i];
                              final c = switch (n.priority ?? n.type) {
                                'urgent' || 'error' => p.danger,
                                'success' => p.success,
                                'warning' || 'high' => p.warning,
                                _ => Brand.b500,
                              };
                              return Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: n.isRead
                                      ? p.subtle
                                      : Brand.b500.withValues(alpha: p.isDark ? 0.14 : 0.07),
                                  borderRadius: BorderRadius.circular(18),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      margin: const EdgeInsets.only(top: 5),
                                      width: 9,
                                      height: 9,
                                      decoration: BoxDecoration(
                                          color: c, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(n.title,
                                              style: context.text.titleSmall),
                                          if (n.message != null &&
                                              n.message != n.title) ...[
                                            const SizedBox(height: 2),
                                            Text(n.message!,
                                                style: context.text.bodyMedium),
                                          ],
                                          const SizedBox(height: 4),
                                          Text(Fmt.relative(n.createdAt),
                                              style: context.text.bodySmall),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
