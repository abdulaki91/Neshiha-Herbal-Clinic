import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:nesiha_herbal_mobile_app/models/models.dart';
import 'package:nesiha_herbal_mobile_app/theme/app_theme.dart';

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

void main() {
  // google_fonts would try to download fonts in tests.
  setUpAll(() => AppTheme.fontFamilyOverride = 'Roboto');

  for (final mode in [ThemeMode.light, ThemeMode.dark]) {
    final suffix = mode == ThemeMode.dark ? ' (dark)' : '';

    testWidgets('login screen renders$suffix', (tester) async {
      usePhoneViewport(tester);
      await pumpApp(tester, mode: mode);
      expect(find.text('Welcome back'), findsOneWidget);
      expect(find.text('Sign in'), findsOneWidget);

      // Empty submit shows validation, no crash.
      await tester.tap(find.text('Sign in'));
      await tester.pumpAndSettle();
      expect(find.text('Email is required'), findsOneWidget);
      await unmount(tester);
    });

    testWidgets('doctor: dashboard, queue, consultation$suffix', (tester) async {
      usePhoneViewport(tester);
      await pumpApp(tester, role: Roles.doctor, mode: mode);
      expect(find.text('Patients are waiting for you.'), findsOneWidget);

      await openTab(tester, 'Queue');
      expect(find.text('Patient queue'), findsOneWidget);
      expect(find.text('Resume consultation'), findsOneWidget);

      // Open the in-progress consultation (no status change needed).
      await tester.tap(find.text('Resume consultation'));
      await tester.pumpAndSettle();
      expect(find.text('Complete consultation'), findsOneWidget);
      expect(find.text('Safety alert'), findsOneWidget);

      await tester.tap(find.text('Medicine'));
      await tester.pumpAndSettle();
      expect(find.text('Moringa leaf powder'), findsOneWidget);

      await tester.tap(find.text('History'));
      await tester.pumpAndSettle();
      expect(find.textContaining('Recurring headaches', findRichText: true),
          findsWidgets);

      await back(tester);
      await openTab(tester, 'Patients');
      await openTab(tester, 'Visits');
      await openTab(tester, 'More');
      expect(find.text('Booking requests'), findsOneWidget);

      for (final entry in ['Booking requests', 'Appointments', 'Medicines']) {
        await tester.tap(find.text(entry));
        await tester.pumpAndSettle();
        await back(tester);
      }
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
      expect(find.text('Visit history'), findsOneWidget);
      await back(tester);

      await tester.tap(find.text('Register'));
      await tester.pumpAndSettle();
      expect(find.text('Registration fee'), findsOneWidget);
      await tester.tap(find.text('Register patient').last);
      await tester.pumpAndSettle();
      expect(find.text('Gender is required'), findsOneWidget);
      await back(tester);

      await openTab(tester, 'Visits');
      await tester.tap(find.text('New visit'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Appointment'));
      await tester.pumpAndSettle();
      expect(find.text('Schedule appointment'), findsWidgets);
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

      await tester.tap(find.text('Receive').first);
      await tester.pumpAndSettle();
      expect(find.text('Receive payment'), findsOneWidget);
      await tester.tapAt(const Offset(20, 40)); // dismiss sheet
      await tester.pumpAndSettle();

      await tester.tap(find.text('Recent'));
      await tester.pumpAndSettle();
      expect(find.text('PAY-001 · Cash'), findsOneWidget);
      await unmount(tester);
    });

    testWidgets('admin: dashboard and staff$suffix', (tester) async {
      usePhoneViewport(tester);
      await pumpApp(tester, role: Roles.superAdmin, mode: mode);
      expect(find.text('Some medicines are running low.'), findsOneWidget);
      await openTab(tester, 'Staff');
      expect(find.text('Yonas Tadesse'), findsOneWidget);
      await openTab(tester, 'More');
      expect(find.text('Sign out'), findsOneWidget);
      await unmount(tester);
    });
  }
}
