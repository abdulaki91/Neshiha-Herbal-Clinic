import 'dart:convert';

/// Tolerant JSON readers. The API is MySQL-backed via Sequelize, so DECIMAL
/// columns arrive as strings ("200.00"), some JSON columns arrive
/// double-encoded as strings, and optional fields are often null.

String? asString(dynamic v) {
  if (v == null) return null;
  final s = v.toString();
  return s.isEmpty ? null : s;
}

int? asInt(dynamic v) {
  if (v == null) return null;
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString()) ?? double.tryParse(v.toString())?.toInt();
}

double? asDouble(dynamic v) {
  if (v == null) return null;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString());
}

bool asBool(dynamic v, {bool fallback = false}) {
  if (v == null) return fallback;
  if (v is bool) return v;
  if (v is num) return v != 0;
  final s = v.toString().toLowerCase();
  return s == 'true' || s == '1';
}

DateTime? asDate(dynamic v) {
  if (v == null) return null;
  final s = v.toString();
  if (s.isEmpty) return null;
  return DateTime.tryParse(s)?.toLocal();
}

Map<String, dynamic>? asMap(dynamic v) =>
    v is Map ? Map<String, dynamic>.from(v) : null;

List<Map<String, dynamic>> asMapList(dynamic v) {
  if (v is! List) return const [];
  return v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
}

/// Reads a list of strings stored either as a real JSON array or as a
/// JSON-encoded string (e.g. Visit.symptoms, Patient.knownAllergies).
List<String> asStringList(dynamic v) {
  if (v == null) return const [];
  if (v is List) {
    return v.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList();
  }
  final s = v.toString().trim();
  if (s.isEmpty) return const [];
  try {
    final decoded = jsonDecode(s);
    if (decoded is List) return asStringList(decoded);
    if (decoded is String && decoded.trim().isNotEmpty) return [decoded.trim()];
  } catch (_) {
    // Plain text, possibly comma separated
  }
  return s.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
}
