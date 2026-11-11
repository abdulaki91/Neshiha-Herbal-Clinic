import 'package:material_ui/material_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Light / dark / follow-system, remembered across launches and logouts
/// (same behaviour as the web portal's theme toggle).
class ThemeController extends ChangeNotifier {
  static const _key = 'nhc-theme';

  ThemeMode _mode = ThemeMode.system;
  ThemeMode get mode => _mode;

  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _mode = switch (prefs.getString(_key)) {
        'light' => ThemeMode.light,
        'dark' => ThemeMode.dark,
        _ => ThemeMode.system,
      };
    } catch (_) {
      _mode = ThemeMode.system;
    }
    notifyListeners();
  }

  Future<void> setMode(ThemeMode mode) async {
    _mode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      if (mode == ThemeMode.system) {
        await prefs.remove(_key);
      } else {
        await prefs.setString(_key, mode == ThemeMode.dark ? 'dark' : 'light');
      }
    } catch (_) {}
  }

  /// Flip relative to what's currently on screen.
  void toggle(Brightness current) =>
      setMode(current == Brightness.dark ? ThemeMode.light : ThemeMode.dark);
}
