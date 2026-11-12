import 'package:cupertino_ui/cupertino_ui.dart'
    show CupertinoPageTransitionsBuilder;
import 'package:google_fonts/google_fonts.dart';
import 'package:material_ui/material_ui.dart';

/// Brand scales from the web portal (Frontend/src/index.css):
/// periwinkle lavender (brand) + orchid (accent).
class Brand {
  Brand._();
  static const b50 = Color(0xFFF4F4FB);
  static const b100 = Color(0xFFE8E8F7);
  static const b200 = Color(0xFFD3D3EF);
  static const b300 = Color(0xFFB4B3E2);
  static const b400 = Color(0xFF9391D1);
  static const b500 = Color(0xFF7876C1);
  static const b600 = Color(0xFF6260B0);
  static const b700 = Color(0xFF514E96);
  static const b800 = Color(0xFF43417A);
  static const b900 = Color(0xFF393862);
  static const b950 = Color(0xFF1D1C35);

  static const a100 = Color(0xFFF6E9F3);
  static const a200 = Color(0xFFEDD2E7);
  static const a300 = Color(0xFFDFB0D4);
  static const a400 = Color(0xFFCA88B9);
  static const a500 = Color(0xFFB26A9F);
  static const a600 = Color(0xFF985384);

  static const sage = Color(0xFF7FA585);
  static const sageLight = Color(0xFFA8C3A4);

  /// The signature brand → orchid gradient used on primary buttons.
  static const primaryGradient = LinearGradient(
    colors: [b600, a600],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const markGradient = LinearGradient(
    colors: [b500, a400],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

/// Theme-dependent design tokens. Read with `context.palette`.
@immutable
class Palette extends ThemeExtension<Palette> {
  const Palette({
    required this.isDark,
    required this.bgGradient,
    required this.bgBlobA,
    required this.bgBlobB,
    required this.surface,
    required this.surfaceSolid,
    required this.surfaceBorder,
    required this.subtle,
    required this.ink,
    required this.inkSoft,
    required this.inkMuted,
    required this.divider,
    required this.heroGradient,
    required this.heroBlob,
    required this.success,
    required this.warning,
    required this.danger,
    required this.info,
    required this.shadow,
  });

  final bool isDark;
  final List<Color> bgGradient;
  final Color bgBlobA;
  final Color bgBlobB;
  final Color surface;
  final Color surfaceSolid;
  final Color surfaceBorder;
  final Color subtle;
  final Color ink;
  final Color inkSoft;
  final Color inkMuted;
  final Color divider;
  final List<Color> heroGradient;
  final Color heroBlob;
  final Color success;
  final Color warning;
  final Color danger;
  final Color info;
  final Color shadow;

  static const light = Palette(
    isDark: false,
    bgGradient: [Color(0xFFE3E3F4), Color(0xFFE9E4F3), Color(0xFFF2E5EE)],
    bgBlobA: Color(0xBFF0C4D6),
    bgBlobB: Color(0xE6CEC8F0),
    surface: Color(0xBDFFFFFF),
    surfaceSolid: Colors.white,
    surfaceBorder: Color(0xC0FFFFFF),
    subtle: Color(0x80FFFFFF),
    ink: Color(0xFF23213A),
    inkSoft: Color(0xFF55536E),
    inkMuted: Color(0xFF8B89A3),
    divider: Color(0x1A3C3780),
    heroGradient: [
      Color(0xFF5F63AD),
      Color(0xFF6A69B3),
      Color(0xFF7F70B3),
      Color(0xFF9473AB),
    ],
    heroBlob: Color(0xC7C06C9E),
    success: Color(0xFF16A34A),
    warning: Color(0xFFD97706),
    danger: Color(0xFFE11D48),
    info: Color(0xFF2563EB),
    shadow: Color(0x384C468C),
  );

  static const dark = Palette(
    isDark: true,
    bgGradient: [Color(0xFF12111F), Color(0xFF161427), Color(0xFF1B1424)],
    bgBlobA: Color(0x38A05082),
    bgBlobB: Color(0x406260C8),
    surface: Color(0xB8241F3E),
    surfaceSolid: Color(0xFF211D38),
    surfaceBorder: Color(0x14FFFFFF),
    subtle: Color(0x0DFFFFFF),
    ink: Color(0xFFEFEEF8),
    inkSoft: Color(0xFFB7B4CF),
    inkMuted: Color(0xFF8D8AA8),
    divider: Color(0x14FFFFFF),
    heroGradient: [
      Color(0xFF2B2A52),
      Color(0xFF2E2950),
      Color(0xFF382848),
      Color(0xFF3B2643),
    ],
    heroBlob: Color(0x61AA5688),
    success: Color(0xFF4ADE80),
    warning: Color(0xFFFBBF24),
    danger: Color(0xFFFB7185),
    info: Color(0xFF60A5FA),
    shadow: Color(0xB3000000),
  );

  /// Fill for the selected item of a segmented control / pill tab bar.
  Color get selectedFill =>
      isDark ? const Color(0x24FFFFFF) : surfaceSolid;

  @override
  Palette copyWith() => this;

  @override
  Palette lerp(ThemeExtension<Palette>? other, double t) =>
      (other is Palette && t > 0.5) ? other : this;
}

extension PaletteX on BuildContext {
  Palette get palette => Theme.of(this).extension<Palette>()!;
  TextTheme get text => Theme.of(this).textTheme;
}

class AppTheme {
  AppTheme._();

  /// Tests set this to a locally loaded family: google_fonts would otherwise
  /// try to download Plus Jakarta Sans over the network.
  @visibleForTesting
  static String? fontFamilyOverride;

  static ThemeData light() => _build(Palette.light, Brightness.light);
  static ThemeData dark() => _build(Palette.dark, Brightness.dark);

  static ThemeData _build(Palette p, Brightness b) {
    final scheme = ColorScheme.fromSeed(
      seedColor: Brand.b600,
      brightness: b,
      primary: b == Brightness.light ? Brand.b600 : Brand.b300,
      secondary: b == Brightness.light ? Brand.a600 : Brand.a300,
      error: p.danger,
      surface: p.surfaceSolid,
    );

    final base = ThemeData(
      useMaterial3: true,
      brightness: b,
      colorScheme: scheme,
      scaffoldBackgroundColor: p.bgGradient.first,
    );

    final override = fontFamilyOverride;
    final text = (override != null
            ? base.textTheme.apply(fontFamily: override)
            : GoogleFonts.plusJakartaSansTextTheme(base.textTheme))
        .apply(bodyColor: p.ink, displayColor: p.ink);

    final fieldBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: p.divider),
    );

    return base.copyWith(
      textTheme: text.copyWith(
        headlineMedium: text.headlineMedium
            ?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.6),
        headlineSmall: text.headlineSmall
            ?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.4),
        titleLarge: text.titleLarge
            ?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.3),
        titleMedium: text.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        titleSmall: text.titleSmall?.copyWith(fontWeight: FontWeight.w600),
        bodyMedium: text.bodyMedium?.copyWith(color: p.inkSoft),
        bodySmall: text.bodySmall?.copyWith(color: p.inkMuted),
        labelLarge: text.labelLarge?.copyWith(fontWeight: FontWeight.w600),
      ),
      extensions: [p],
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        foregroundColor: p.ink,
        titleTextStyle: text.titleLarge?.copyWith(
            color: p.ink, fontWeight: FontWeight.w700, letterSpacing: -0.3),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: p.isDark ? const Color(0x0FFFFFFF) : const Color(0xD9FFFFFF),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: fieldBorder,
        enabledBorder: fieldBorder,
        focusedBorder: fieldBorder.copyWith(
            borderSide: BorderSide(color: scheme.primary, width: 1.6)),
        errorBorder:
            fieldBorder.copyWith(borderSide: BorderSide(color: p.danger)),
        focusedErrorBorder: fieldBorder.copyWith(
            borderSide: BorderSide(color: p.danger, width: 1.6)),
        hintStyle: TextStyle(color: p.inkMuted, fontWeight: FontWeight.w400),
        labelStyle: TextStyle(color: p.inkSoft),
        floatingLabelStyle: TextStyle(color: scheme.primary),
        prefixIconColor: p.inkMuted,
        suffixIconColor: p.inkMuted,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        // Tinted, not pure white/ink, so frosted cards inside sheets read.
        backgroundColor:
            p.isDark ? const Color(0xFF1B1830) : const Color(0xFFF3F2FA),
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        dragHandleColor: p.inkMuted.withValues(alpha: 0.4),
        shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: p.surfaceSolid,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        titleTextStyle: text.titleLarge?.copyWith(color: p.ink),
        contentTextStyle: text.bodyMedium?.copyWith(color: p.inkSoft),
      ),
      chipTheme: ChipThemeData(
        side: BorderSide(color: p.divider),
        shape: const StadiumBorder(),
        backgroundColor: p.surface,
        selectedColor: scheme.primary.withValues(alpha: p.isDark ? 0.3 : 0.14),
        labelStyle: text.labelLarge?.copyWith(color: p.inkSoft),
        secondaryLabelStyle: text.labelLarge?.copyWith(color: scheme.primary),
        showCheckmark: false,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      ),
      dividerTheme: DividerThemeData(color: p.divider, space: 1, thickness: 1),
      progressIndicatorTheme:
          ProgressIndicatorThemeData(color: scheme.primary),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: p.surfaceSolid,
        contentTextStyle: text.bodyMedium?.copyWith(color: p.ink),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: scheme.primary,
          textStyle: text.labelLarge,
          shape: const StadiumBorder(),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p.ink,
          side: BorderSide(color: p.divider),
          textStyle: text.labelLarge,
          minimumSize: const Size(0, 48),
          shape: const StadiumBorder(),
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: p.inkSoft,
        textColor: p.ink,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      datePickerTheme: DatePickerThemeData(
        backgroundColor: p.surfaceSolid,
        surfaceTintColor: Colors.transparent,
        headerBackgroundColor: Brand.b600,
        headerForegroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      ),
      timePickerTheme: TimePickerThemeData(
        backgroundColor: p.surfaceSolid,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(builders: {
        TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      }),
    );
  }
}
