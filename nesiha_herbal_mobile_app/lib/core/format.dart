import 'package:intl/intl.dart';

import 'config.dart';

class Fmt {
  Fmt._();

  static final _money = NumberFormat('#,##0.00');
  static final _count = NumberFormat.decimalPattern();

  static String money(num? v) => '${_money.format(v ?? 0)} ${AppConfig.currency}';
  static String count(num? v) => _count.format(v ?? 0);

  static String date(DateTime? d) =>
      d == null ? '—' : DateFormat('d MMM yyyy').format(d);
  static String dateShort(DateTime? d) =>
      d == null ? '—' : DateFormat('d MMM').format(d);
  static String time(DateTime? d) =>
      d == null ? '—' : DateFormat('h:mm a').format(d);
  static String dateTime(DateTime? d) =>
      d == null ? '—' : DateFormat('d MMM, h:mm a').format(d);
  static String longToday() => DateFormat('EEEE, d MMMM').format(DateTime.now());

  /// "2026-11-11" — the API's DATEONLY format.
  static String apiDate(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

  /// "14:05" — what the API takes for TIME columns.
  static String apiTime(DateTime d) => DateFormat('HH:mm').format(d);
  static String apiTimeSeconds(DateTime d) => DateFormat('HH:mm:ss').format(d);

  /// TIME column ("14:05:00") → "2:05 PM".
  static String clock(String? hhmmss) {
    if (hhmmss == null || hhmmss.isEmpty) return '—';
    final parts = hhmmss.split(':');
    final h = int.tryParse(parts[0]);
    final m = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    if (h == null) return hhmmss;
    return DateFormat('h:mm a').format(DateTime(2000, 1, 1, h, m));
  }

  static String relative(DateTime? d) {
    if (d == null) return '';
    final diff = DateTime.now().difference(d);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return date(d);
  }

  static bool isToday(DateTime? d) {
    if (d == null) return false;
    final n = DateTime.now();
    return d.year == n.year && d.month == n.month && d.day == n.day;
  }

  static String greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  static String titleCase(String? s) {
    if (s == null || s.isEmpty) return '';
    return s
        .replaceAll('_', ' ')
        .split(' ')
        .where((w) => w.isNotEmpty)
        .map((w) => w[0].toUpperCase() + w.substring(1))
        .join(' ');
  }

  static String initials(String? first, String? last) {
    final a = (first ?? '').trim();
    final b = (last ?? '').trim();
    final s = '${a.isNotEmpty ? a[0] : ''}${b.isNotEmpty ? b[0] : ''}';
    return s.isEmpty ? '?' : s.toUpperCase();
  }
}
