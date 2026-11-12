import 'dart:async';

import 'package:material_ui/material_ui.dart';

import '../i18n/i18n.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import 'controls.dart';

/// Root navigator — lets toasts show from anywhere (socket events, after pops).
final rootNavigatorKey = GlobalKey<NavigatorState>();

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});

  @override
  Widget build(BuildContext context) => const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: SizedBox.square(
            dimension: 34,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
        ),
      );
}

class EmptyView extends StatelessWidget {
  const EmptyView({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: p.isDark
                      ? [const Color(0x337876C1), const Color(0x33B26A9F)]
                      : [Brand.b100, Brand.a100],
                ),
              ),
              child: Icon(icon,
                  size: 34, color: p.isDark ? Brand.b300 : Brand.b500),
            ),
            const SizedBox(height: 18),
            Text(title,
                textAlign: TextAlign.center,
                style: context.text.titleMedium?.copyWith(color: p.ink)),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(subtitle!,
                  textAlign: TextAlign.center,
                  style: context.text.bodyMedium?.copyWith(color: p.inkMuted)),
            ],
            if (action != null) ...[const SizedBox(height: 20), action!],
          ],
        ),
      ),
    );
  }
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => EmptyView(
        icon: Icons.cloud_off_rounded,
        title: tr('common.error'),
        subtitle: message,
        action: OutlinedButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh_rounded, size: 18),
          label: Text(tr('mobile.common.tryAgain')),
        ),
      );
}

/// Red safety box for allergies & chronic diseases — never missable.
class AlertBanner extends StatelessWidget {
  const AlertBanner({super.key, required this.patient});
  final Patient patient;

  @override
  Widget build(BuildContext context) {
    if (!patient.hasAlerts) return const SizedBox.shrink();
    final p = context.palette;
    final c = p.danger;
    Widget line(String label, List<String> items) => Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text.rich(TextSpan(children: [
            TextSpan(
                text: '$label  ',
                style: TextStyle(color: c, fontWeight: FontWeight.w800)),
            TextSpan(
                text: items.join(', '),
                style: TextStyle(color: c, fontWeight: FontWeight.w500)),
          ])),
        );
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.withValues(alpha: p.isDark ? 0.14 : 0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: c.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.warning_amber_rounded, color: c, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('mobile.patient.safetyAlert'),
                    style: TextStyle(
                        color: c, fontWeight: FontWeight.w800, fontSize: 13)),
                if (patient.allergies.isNotEmpty)
                  line(tr('patientDetail.alerts.allergies'), patient.allergies),
                if (patient.chronicDiseases.isNotEmpty)
                  line(tr('patientDetail.alerts.chronic'), patient.chronicDiseases),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ------------------------------------------------------------ status tones

Tone visitTone(String status) => switch (status) {
      VisitStatus.scheduled => Tone.violet,
      VisitStatus.waiting => Tone.warning,
      VisitStatus.inConsultation => Tone.info,
      VisitStatus.pendingPayment => Tone.brand,
      VisitStatus.completed => Tone.success,
      VisitStatus.cancelled => Tone.danger,
      _ => Tone.neutral,
    };

Tone prescriptionTone(String status) => switch (status) {
      'pending' => Tone.warning,
      'paid' || 'dispensed' || 'completed' => Tone.success,
      'stopped' || 'expired' => Tone.danger,
      _ => Tone.neutral,
    };

Tone bookingTone(String status) => switch (status) {
      'pending' => Tone.warning,
      'contacted' => Tone.info,
      'confirmed' => Tone.success,
      'declined' => Tone.danger,
      _ => Tone.neutral,
    };

// ------------------------------------------------------------------- toast

enum ToastKind { success, error, info }

class Toast {
  Toast._();
  static OverlayEntry? _current;
  static Timer? _timer;

  static void success(String msg) => show(msg, kind: ToastKind.success);
  static void error(String msg) => show(msg, kind: ToastKind.error);
  static void info(String msg, {IconData? icon}) =>
      show(msg, kind: ToastKind.info, icon: icon);

  static void show(String message,
      {ToastKind kind = ToastKind.info, IconData? icon}) {
    final overlay = rootNavigatorKey.currentState?.overlay;
    if (overlay == null) return;
    _timer?.cancel();
    _current?.remove();
    final entry = OverlayEntry(
      builder: (_) => _ToastView(message: message, kind: kind, icon: icon),
    );
    _current = entry;
    overlay.insert(entry);
    _timer = Timer(Duration(milliseconds: kind == ToastKind.error ? 4000 : 3000),
        () {
      if (_current == entry) {
        entry.remove();
        _current = null;
      }
    });
  }
}

class _ToastView extends StatelessWidget {
  const _ToastView({required this.message, required this.kind, this.icon});
  final String message;
  final ToastKind kind;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final (color, defaultIcon) = switch (kind) {
      ToastKind.success => (Brand.b600, Icons.check_circle_rounded),
      ToastKind.error => (p.danger, Icons.error_rounded),
      ToastKind.info => (Brand.a500, Icons.notifications_active_rounded),
    };
    return Positioned(
      left: 16,
      right: 16,
      top: MediaQuery.paddingOf(context).top + 10,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutBack,
        builder: (context, v, child) => Opacity(
          opacity: v.clamp(0, 1),
          child: Transform.translate(offset: Offset(0, (1 - v) * -24), child: child),
        ),
        child: Material(
          color: p.surfaceSolid,
          elevation: 0,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: p.divider),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF281E5A).withValues(alpha: 0.28),
                  blurRadius: 30,
                  offset: const Offset(0, 14),
                  spreadRadius: -12,
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(icon ?? defaultIcon, color: color, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    message,
                    style: TextStyle(
                        color: p.ink, fontWeight: FontWeight.w600, fontSize: 14),
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

// ------------------------------------------------------------------ dialogs

Future<bool> confirmAction(
  BuildContext context, {
  required String title,
  required String message,
  String? confirmLabel,
  bool destructive = false,
}) async {
  final p = context.palette;
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(tr('common.cancel'), style: TextStyle(color: p.inkSoft)),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(ctx, true),
          style: FilledButton.styleFrom(
            backgroundColor: destructive ? p.danger : Brand.b600,
            foregroundColor: Colors.white,
            shape: const StadiumBorder(),
          ),
          child: Text(confirmLabel ?? tr('mobile.common.confirm')),
        ),
      ],
    ),
  );
  return ok ?? false;
}
