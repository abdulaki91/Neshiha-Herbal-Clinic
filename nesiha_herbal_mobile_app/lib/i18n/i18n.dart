import 'dart:convert';
import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// One interface language, mirroring `languages` in
/// Frontend/src/i18n/config.js.
class AppLanguage {
  const AppLanguage(this.code, this.name, this.nativeName, {this.rtl = false});
  final String code;
  final String name;
  final String nativeName;
  final bool rtl;

  Locale get locale => Locale(code);
}

/// Translations shared with the web portal.
///
/// `assets/i18n/web/<code>.json` are byte-for-byte copies of
/// `Frontend/src/i18n/locales/<code>/translation.json` (re-copy them with
/// `dart run tool/sync_translations.dart`), so both clients show identical
/// wording under the same keys. Strings that only exist on mobile live in
/// `assets/i18n/mobile/<code>.json` under the `mobile.` prefix and are
/// merged on top.
///
/// Lookup behaves like the web's i18next setup: dotted keys,
/// `{{name}}` interpolation, and English as the fallback language.
class I18n extends ChangeNotifier {
  I18n._();
  static final I18n instance = I18n._();

  static const languages = [
    AppLanguage('en', 'English', 'English'),
    AppLanguage('om', 'Afan Oromo', 'Afaan Oromoo'),
    AppLanguage('am', 'Amharic', 'አማርኛ'),
    AppLanguage('ar', 'Arabic', 'العربية', rtl: true),
  ];

  static const _prefsKey = 'nhc-language';

  String _code = 'en';
  Map<String, dynamic> _strings = const {};
  Map<String, dynamic> _fallback = const {};

  String get code => _code;
  AppLanguage get language =>
      languages.firstWhere((l) => l.code == _code, orElse: () => languages.first);
  Locale get locale => language.locale;
  bool get isRtl => language.rtl;
  List<Locale> get supportedLocales => [for (final l in languages) l.locale];

  /// Locale for `intl` date/number formatting. Afaan Oromo has no CLDR data
  /// in `intl`, so it formats like English (as the web portal does).
  String get intlLocale => _code == 'om' ? 'en' : _code;

  /// Restores the saved language, else the device language when supported,
  /// else English.
  Future<void> load() async {
    String? saved;
    try {
      saved = (await SharedPreferences.getInstance()).getString(_prefsKey);
    } catch (_) {}
    final device = PlatformDispatcher.instance.locale.languageCode;
    final code = saved ??
        (languages.any((l) => l.code == device) ? device : 'en');
    _fallback = await _read('en');
    await _apply(code);
  }

  Future<void> setLanguage(String code) async {
    if (code == _code && _strings.isNotEmpty) return;
    await _apply(code);
    try {
      await (await SharedPreferences.getInstance()).setString(_prefsKey, code);
    } catch (_) {}
  }

  Future<void> _apply(String code) async {
    if (!languages.any((l) => l.code == code)) code = 'en';
    _strings = code == 'en' && _fallback.isNotEmpty ? _fallback : await _read(code);
    if (_fallback.isEmpty) _fallback = code == 'en' ? _strings : await _read('en');
    _code = code;
    notifyListeners();
  }

  static Future<Map<String, dynamic>> _read(String code) async {
    final merged = <String, dynamic>{};
    for (final path in ['assets/i18n/web/$code.json', 'assets/i18n/mobile/$code.json']) {
      try {
        final decoded = jsonDecode(await rootBundle.loadString(path));
        if (decoded is Map) _deepMerge(merged, Map<String, dynamic>.from(decoded));
      } catch (_) {
        // Missing file → that layer simply falls back to English.
      }
    }
    return merged;
  }

  static void _deepMerge(Map<String, dynamic> into, Map<String, dynamic> from) {
    from.forEach((k, v) {
      final existing = into[k];
      if (v is Map && existing is Map<String, dynamic>) {
        _deepMerge(existing, Map<String, dynamic>.from(v));
      } else {
        into[k] = v is Map ? Map<String, dynamic>.from(v) : v;
      }
    });
  }

  static String? _lookup(Map<String, dynamic> root, String key) {
    dynamic node = root;
    for (final part in key.split('.')) {
      if (node is Map && node.containsKey(part)) {
        node = node[part];
      } else {
        return null;
      }
    }
    return node is String ? node : null;
  }

  bool has(String key) =>
      _lookup(_strings, key) != null || _lookup(_fallback, key) != null;

  /// Translate [key]; `{{name}}` placeholders are filled from [args].
  /// Unknown keys return the key itself, like i18next.
  String t(String key, [Map<String, Object?>? args]) {
    var s = _lookup(_strings, key) ?? _lookup(_fallback, key) ?? key;
    if (args != null && args.isNotEmpty) {
      s = s.replaceAllMapped(RegExp(r'{{\s*(\w+)\s*}}'), (m) {
        final v = args[m.group(1)];
        return v == null ? '' : '$v';
      });
    }
    return s;
  }

  /// Like [t] but returns null instead of the key when missing.
  String? maybe(String key, [Map<String, Object?>? args]) =>
      has(key) ? t(key, args) : null;

  /// Test hook: install strings without touching assets or prefs.
  @visibleForTesting
  void debugUse(String code, Map<String, dynamic> strings,
      {Map<String, dynamic>? fallback}) {
    _code = code;
    _strings = strings;
    _fallback = fallback ?? strings;
    notifyListeners();
  }
}

/// Translate with the current language. Safe anywhere — widgets, toasts,
/// model label helpers. Screens rebuild on a language change because the
/// app marks the whole tree dirty (see `NesihaApp`).
String tr(String key, [Map<String, Object?>? args]) => I18n.instance.t(key, args);

/// A web label used as a field label on mobile: drops the web's trailing
/// " *" (required marker) and ":" — mobile marks optional fields instead.
String trl(String key, [Map<String, Object?>? args]) =>
    tr(key, args).replaceAll(RegExp(r'\s*[*:：]\s*$'), '').trim();

/// Fallback-safe localization delegates.
///
/// `material_ui`'s [GlobalMaterialLocalizations.delegates] cover Amharic
/// and Arabic (including RTL) but not Afaan Oromo; for an unsupported
/// language the framework's own strings (date picker, "OK", tooltips) use
/// English while the app's text stays in Oromo.
class FallbackLocalizationsDelegate<T> extends LocalizationsDelegate<T> {
  const FallbackLocalizationsDelegate(this.inner);
  final LocalizationsDelegate<T> inner;

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<T> load(Locale locale) =>
      inner.load(inner.isSupported(locale) ? locale : const Locale('en'));

  @override
  bool shouldReload(covariant LocalizationsDelegate<T> old) => false;

  @override
  Type get type => inner.type;
}
