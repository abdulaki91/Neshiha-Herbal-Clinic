/// Build-time configuration.
///
/// Defaults point at the production backend (the same one the web portal's
/// `.env.production` uses), so a plain `flutter run` works on a real phone.
/// Override for local development, e.g. against the API in `api/`:
///
///   flutter run --dart-define=API_URL=http://10.0.2.2:5000/api/v1 \
///               --dart-define=SOCKET_URL=http://10.0.2.2:5000
///
/// (10.0.2.2 is the host machine as seen from the Android emulator.)
class AppConfig {
  AppConfig._();

  static const apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://nesihaherbalclinic-backend.abdulaki.com/api/v1',
  );

  static const socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'https://nesihaherbalclinic-backend.abdulaki.com',
  );

  /// Fixed by the backend (REGISTRATION_FEE_AMOUNT in api/src/config/constants.js)
  /// and never sent from the client — shown for display only.
  static const registrationFee = 200;

  static const currency = 'ETB';

  /// The backend's origin — uploaded files are served from `<origin>/uploads/…`.
  static String get origin {
    final u = Uri.parse(apiUrl);
    return u.replace(path: '', query: null, fragment: null).toString();
  }

  /// Absolute URL for a stored file path such as `uploads/banners/x.jpg`
  /// (the web portal builds the same `${backendBase}/${path}`).
  static String? fileUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final clean = path.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '');
    return '${origin.replaceFirst(RegExp(r'/+$'), '')}/$clean';
  }
}
