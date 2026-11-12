import 'package:intl/intl.dart';

import '../i18n/i18n.dart';
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

  // Values sent to the API are always formatted with the 'en' locale. With
  // the app in Arabic, the default locale writes Arabic-Indic digits
  // ("١٤:٠٥:٠٩"), which MySQL rejects for DATE/TIME columns — completing a
  // consultation failed with "Database error occurred" in Arabic only.

  /// "2026-11-11" — the API's DATEONLY format.
  static String apiDate(DateTime d) => DateFormat('yyyy-MM-dd', 'en').format(d);

  /// "14:05" — what the API takes for TIME columns.
  static String apiTime(DateTime d) => DateFormat('HH:mm', 'en').format(d);
  static String apiTimeSeconds(DateTime d) => DateFormat('HH:mm:ss', 'en').format(d);

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
    if (diff.inSeconds < 60) return capitalize(tr('topbar.time.justNow'));
    if (diff.inMinutes < 60) return tr('topbar.time.minutesAgo', {'m': diff.inMinutes});
    if (diff.inHours < 24) return tr('topbar.time.hoursAgo', {'h': diff.inHours});
    if (diff.inDays < 7) return tr('mobile.time.daysAgo', {'d': diff.inDays});
    return date(d);
  }

  /// Days between two calendar dates (ignores time of day).
  static int daysBetween(DateTime a, DateTime b) =>
      DateTime(b.year, b.month, b.day)
          .difference(DateTime(a.year, a.month, a.day))
          .inDays;

  static bool isToday(DateTime? d) {
    if (d == null) return false;
    final n = DateTime.now();
    return d.year == n.year && d.month == n.month && d.day == n.day;
  }

  static String greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return tr('mobile.greeting.morning');
    if (h < 17) return tr('mobile.greeting.afternoon');
    return tr('mobile.greeting.evening');
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

  /// "pending" → "Pending" (keeps the rest of the string as-is).
  static String capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  static String initials(String? first, String? last) {
    final a = (first ?? '').trim();
    final b = (last ?? '').trim();
    final s = '${a.isNotEmpty ? a[0] : ''}${b.isNotEmpty ? b[0] : ''}';
    return s.isEmpty ? '?' : s.toUpperCase();
  }
}
