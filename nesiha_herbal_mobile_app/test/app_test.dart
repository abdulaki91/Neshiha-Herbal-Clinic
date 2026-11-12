import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:nesiha_herbal_mobile_app/core/socket_service.dart';
import 'package:nesiha_herbal_mobile_app/i18n/i18n.dart';
import 'package:nesiha_herbal_mobile_app/models/models.dart';
import 'package:nesiha_herbal_mobile_app/theme/app_theme.dart';
import 'package:provider/provider.dart';

import 'support/harness.dart';

/// Taps a bottom-navigation tab by its label.
Future<void> openTab(WidgetTester tester, String label) async {
  await tester.tap(find.descendant(
    of: find.byType(Semantics),
    matching: find.text(label),
  ).last);
  await tester.pumpAndSettle();
}

/// System back (respects PopScope, like the Android back gesture).
Future<void> back(WidgetTester tester) async {
  await tester.binding.handlePopRoute();
  await tester.pumpAndSettle();
}

/// Taps a (possibly scrolled-off) tab or button by its text.
Future<void> tapText(WidgetTester tester, String text) async {
  await tester.ensureVisible(find.text(text).first);
  await tester.pumpAndSettle();
  await tester.tap(find.text(text).first);
  await tester.pumpAndSettle();
}

/// Waits (in real time) until the language switch has loaded its
/// translation files, then settles the UI.
Future<void> settleLanguage(WidgetTester tester, String code) async {
  for (var i = 0; i < 50 && I18n.instance.code != code; i++) {
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 100)));
    await tester.pump();
  }
  await tester.pumpAndSettle();
}

/// Picks a language row in More → Language. Invoked directly: the row can
/// sit under the floating nav bar, which would swallow a positional tap.
Future<void> chooseLanguage(WidgetTester tester, String nativeName) async {
  final tile = tester.widget<ListTile>(find.ancestor(
      of: find.text(nativeName), matching: find.byType(ListTile)));
  tile.onTap!();
}

/// Opens an entry from the More tab's workspace list.
Future<void> openMore(WidgetTester tester, String entry) async {
  await openTab(tester, tr('mobile.nav.more'));
  await tester.scrollUntilVisible(find.text(entry), 200,
      scrollable: find.byType(Scrollable).first);
  await tester.tap(find.text(entry));
  await tester.pumpAndSettle();
}

void main() {
  // google_fonts would try to download fonts in tests.
  setUpAll(() => AppTheme.fontFamilyOverride = 'Roboto');

  for (final mode in [ThemeMode.light, ThemeMode.dark]) {
    final suffix = mode == ThemeMode.dark ? ' (dark)' : '';

    testWidgets('login screen renders$suffix', (tester) async {
      usePhoneViewport(tester);
      await pumpApp(tester, mode: mode);
      expect(find.text('Welcome back'), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.text('አማርኛ'), findsOneWidget); // language picker

      // Empty submit shows validation, no crash.
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();
      expect(find.text('Email is required'), findsOneWidget);
      await unmount(tester);
    });

    testWidgets('doctor: dashboard, queue, consultation$suffix', (tester) async {
      usePhoneViewport(tester);
      await pumpApp(tester, role: Roles.doctor, mode: mode);
      expect(find.text('Patients are waiting for you.'), findsOneWidget);

      await openTab(tester, 'Queue');
      expect(find.text('Patient Queue'), findsOneWidget);
      expect(find.text('Continue'), findsOneWidget);

      // Open the in-progress consultation (no status change needed).
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      expect(find.text('Complete Consultation'), findsOneWidget);
      expect(find.text('Safety alert'), findsOneWidget);

      // Vital signs: stored readings load, BMI is derived, high BP flagged.
      await tapText(tester, 'Vital Signs');
      expect(find.text('Body Mass Index (BMI)'), findsOneWidget);
      expect(find.text('25.1'), findsOneWidget);
      expect(find.text('Overweight'), findsOneWidget);

      // Investigations for the visit, with the STAT warning.
      await tapText(tester, 'Investigation');
      expect(find.text('Complete Blood Count'), findsOneWidget);
      expect(find.text('STAT - Immediate attention required'), findsOneWidget);
      await tester.tap(find.text('Request Investigation').first);
      await tester.pumpAndSettle();
      expect(find.text('Investigation Type'), findsOneWidget);
      await tester.tapAt(const Offset(20, 40)); // dismiss sheet
      await tester.pumpAndSettle();

      await tapText(tester, 'Herbal Medicine');
      expect(find.text('Moringa leaf powder'), findsOneWidget);

      // Patient file: follow-up, recent results and attachments.
      await tapText(tester, 'Patient File');
      expect(find.text('✓ Scheduled Follow-up Visit'), findsOneWidget);
      await tester.scrollUntilVisible(find.text('cbc-result.pdf'), 300,
          scrollable: find.byType(Scrollable).last);
      expect(find.text('cbc-result.pdf'), findsOneWidget);

      await back(tester);
      await openTab(tester, 'Patients');
      await openTab(tester, 'Visits');
      await openTab(tester, 'More');
      expect(find.text('Booking Requests'), findsOneWidget);

      for (final entry in ['Booking Requests', 'Appointments', 'Medicines']) {
        await tester.tap(find.text(entry));
        await tester.pumpAndSettle();
        await back(tester);
      }
      await unmount(tester);
    });

    testWidgets('doctor: laboratory, pharmacy, reports$suffix', (tester) async {
      usePhoneViewport(tester);
      await pumpApp(tester, role: Roles.doctor, mode: mode);

      await openMore(tester, 'Laboratory');
      expect(find.text('Complete Blood Count'), findsOneWidget);
      await tester.tap(find.text('Enter Results'));
      await tester.pumpAndSettle();
      expect(find.text('Enter Investigation Results'), findsOneWidget);
      await tester.tap(find.text('Submit Results'));
      await tester.pumpAndSettle();
      expect(find.text('Please enter investigation results'), findsOneWidget);
      await back(tester);
      await back(tester);

      await openMore(tester, 'Pharmacy');
      expect(find.text('Tigist Hailu'), findsOneWidget);
      expect(find.text('Dispense'), findsOneWidget);
      await back(tester);

      await openMore(tester, 'Reports');
      expect(find.text('1,630.00 ETB'), findsOneWidget);
      expect(find.text('Revenue by day'), findsOneWidget);
      await unmount(tester);
    });

    testWidgets('data clerk: patients, register form, visit form$suffix',
        (tester) async {
      usePhoneViewport(tester);
      await pumpApp(tester, role: Roles.dataClerk, mode: mode);
      expect(find.text('Registered today'), findsOneWidget);

      await openTab(tester, 'Patients');
      await tester.tap(find.text('Abebe Tesfaye'));
      await tester.pumpAndSettle();
      expect(find.text('cbc-result.pdf'), findsOneWidget);
      await tester.scrollUntilVisible(find.text('Visit History'), 300,
          scrollable: find.byType(Scrollable).last);
      expect(find.text('Visit History'), findsOneWidget);
      await back(tester);

      await tester.tap(find.text('Register Patient'));
      await tester.pumpAndSettle();
      expect(find.text('Registration Fee'), findsOneWidget);
      await tester.tap(find.text('Register Patient').last);
      await tester.pumpAndSettle();
      expect(find.text('Gender is required'), findsOneWidget);
      await back(tester);

      await openTab(tester, 'Visits');
      await tester.tap(find.text('New Visit'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Schedule Ahead'));
      await tester.pumpAndSettle();
      expect(find.text('Schedule Appointment'), findsWidgets);
      await back(tester);

      await openTab(tester, 'Bookings');
      expect(find.text('Meron Alemu'), findsOneWidget);
      await unmount(tester);
    });

    testWidgets('cashier: pending bills and payment sheet$suffix',
        (tester) async {
      usePhoneViewport(tester);
      await pumpApp(tester, role: Roles.cashier, mode: mode);
      await openTab(tester, 'Cashier');
      expect(find.text('Tigist Hailu'), findsOneWidget);

      // The bill card's button starts under the floating nav bar.
      await tester.drag(find.byType(Scrollable).last, const Offset(0, -200));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Receive & Dispense').first);
      await tester.pumpAndSettle();
      expect(find.text('Receive Payment'), findsOneWidget);
      await tester.tapAt(const Offset(20, 40)); // dismiss sheet
      await tester.pumpAndSettle();

      await tester.tap(find.text('Recent Payments'));
      await tester.pumpAndSettle();
      expect(find.text('PAY-001 · Cash'), findsOneWidget);
      await unmount(tester);
    });

    testWidgets('admin: dashboard, staff, content, settings$suffix', (tester) async {
      usePhoneViewport(tester);
      await pumpApp(tester, role: Roles.superAdmin, mode: mode);
      expect(find.text('Some medicines are running low.'), findsOneWidget);
      await openTab(tester, 'Staff');
      expect(find.text('Yonas Tadesse'), findsOneWidget);
      await tester.tap(find.text('Add Staff'));
      await tester.pumpAndSettle();
      expect(find.text('Add Staff Member'), findsOneWidget);
      await back(tester);

      await openMore(tester, 'Website Content');
      expect(find.text('Kidist M.'), findsOneWidget);
      await tester.tap(find.text('Kidist M.'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Edit'));
      await tester.pumpAndSettle();
      expect(find.text('Edit Testimonial'), findsOneWidget);
      await back(tester);
      await back(tester);

      await openMore(tester, 'Settings');
      expect(find.text('Clinic Information'), findsOneWidget);
      await back(tester);

      await openTab(tester, 'More');
      await tester.scrollUntilVisible(find.text('Logout'), 300,
          scrollable: find.byType(Scrollable).first);
      expect(find.text('Logout'), findsOneWidget);
      await unmount(tester);
    });
  }

  testWidgets('language: Amharic and Arabic, switched live', (tester) async {
    usePhoneViewport(tester);
    await pumpApp(tester, role: Roles.doctor, lang: 'am');
    // Web translation for the Queue tab, plus a mobile-only string.
    expect(find.text('ወረፋ'), findsWidgets);
    expect(find.text('መነሻ'), findsOneWidget);

    // Switch to Arabic from More → Language without restarting.
    await openTab(tester, 'ተጨማሪ');
    await tester.scrollUntilVisible(find.text('العربية'), 200,
        scrollable: find.byType(Scrollable).first);
    await chooseLanguage(tester, 'العربية');
    await settleLanguage(tester, 'ar');
    expect(find.text('قائمة الانتظار'), findsWidgets);
    expect(Directionality.of(tester.element(find.text('المزيد').first)),
        TextDirection.rtl);

    // And back to English.
    await chooseLanguage(tester, 'English');
    await settleLanguage(tester, 'en');
    expect(find.text('Queue'), findsWidgets);
    expect(Directionality.of(tester.element(find.text('More').first)),
        TextDirection.ltr);
    await unmount(tester);
  });

  testWidgets('real-time: socket events refresh and notify', (tester) async {
    usePhoneViewport(tester);
    await pumpApp(tester, role: Roles.doctor);
    final socket = tester
        .element(find.byType(Scaffold).first)
        .read<SocketService>();
    socket.debugInject(const SocketEvent(
        'investigation:result-added', {'testName': 'Lipid panel'}));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('Results ready: Lipid panel'), findsOneWidget);

    socket.debugInject(const SocketEvent('payment:completed', {'amount': '450.00'}));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('Payment received: 450 ETB'), findsOneWidget);
    await unmount(tester);
  });
}
