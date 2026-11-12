// Copies the web portal's translations into the app so both clients share
// one source of truth. Run from the app folder after editing any
// Frontend/src/i18n/locales/<code>/translation.json:
//
//   dart run tool/sync_translations.dart
//
// Mobile-only strings are not touched; they live in assets/i18n/mobile/.
import 'dart:io';

void main() {
  const languages = ['en', 'om', 'am', 'ar'];
  final source = Directory('../Frontend/src/i18n/locales');
  if (!source.existsSync()) {
    stderr.writeln('Not found: ${source.path} (run from nesiha_herbal_mobile_app/)');
    exitCode = 1;
    return;
  }
  for (final code in languages) {
    final from = File('${source.path}/$code/translation.json');
    final to = File('assets/i18n/web/$code.json');
    to.parent.createSync(recursive: true);
    from.copySync(to.path);
    stdout.writeln('✓ $code  ${from.lengthSync()} bytes');
  }
}
