import 'package:material_ui/material_ui.dart';

import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../appointments/appointments_screen.dart';
import '../bookings/booking_requests_screen.dart';
import '../cashier/cashier_screen.dart';
import '../content/content_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../lab/laboratory_screen.dart';
import '../medicines/medicines_screen.dart';
import '../patients/patients_screen.dart';
import '../pharmacy/pharmacy_screen.dart';
import '../queue/queue_screen.dart';
import '../reports/reports_screen.dart';
import '../settings/settings_screen.dart';
import '../staff/staff_screen.dart';
import '../visits/visits_screen.dart';
import 'more_screen.dart';

enum NavBadge { queue, payments, bookings }

class NavDestination {
  const NavDestination({
    required this.id,
    required this.labelKey,
    required this.icon,
    required this.activeIcon,
    required this.page,
    this.badge,
    this.descriptionKey,
  });

  final String id;

  /// Translation keys — resolved at build time so a language switch
  /// relabels the navigation immediately.
  final String labelKey;
  final String? descriptionKey;
  final IconData icon;
  final IconData activeIcon;

  String get label => tr(labelKey);
  String? get description => descriptionKey == null ? null : tr(descriptionKey!);

  /// Builds the screen. Tabs call it with pushed=false via [page];
  /// "More" entries are pushed and build their own chrome.
  final Widget Function() page;
  final NavBadge? badge;
}

NavDestination _home() => NavDestination(
      id: 'home',
      labelKey: 'mobile.nav.home',
      icon: Icons.space_dashboard_outlined,
      activeIcon: Icons.space_dashboard_rounded,
      page: () => const DashboardScreen(),
    );

NavDestination _more() => NavDestination(
      id: 'more',
      labelKey: 'mobile.nav.more',
      icon: Icons.grid_view_outlined,
      activeIcon: Icons.grid_view_rounded,
      page: () => const MoreScreen(),
    );

NavDestination _queue() => NavDestination(
      id: 'queue',
      labelKey: 'sidebar.queue',
      icon: Icons.groups_outlined,
      activeIcon: Icons.groups_rounded,
      badge: NavBadge.queue,
      page: () => const QueueScreen(),
    );

NavDestination _patients() => NavDestination(
      id: 'patients',
      labelKey: 'sidebar.patients',
      icon: Icons.people_alt_outlined,
      activeIcon: Icons.people_alt_rounded,
      page: () => const PatientsScreen(),
    );

NavDestination _visits() => NavDestination(
      id: 'visits',
      labelKey: 'sidebar.visits',
      icon: Icons.event_note_outlined,
      activeIcon: Icons.event_note_rounded,
      page: () => const VisitsScreen(),
    );

NavDestination _cashier() => NavDestination(
      id: 'cashier',
      labelKey: 'sidebar.cashier',
      icon: Icons.point_of_sale_outlined,
      activeIcon: Icons.point_of_sale_rounded,
      badge: NavBadge.payments,
      page: () => const CashierScreen(),
    );

NavDestination _staff() => NavDestination(
      id: 'staff',
      labelKey: 'sidebar.staff',
      icon: Icons.badge_outlined,
      activeIcon: Icons.badge_rounded,
      page: () => const StaffScreen(),
    );

NavDestination _bookings({bool pushed = false}) => NavDestination(
      id: 'bookings',
      labelKey: pushed ? 'sidebar.bookingRequests' : 'mobile.nav.bookings',
      descriptionKey: 'bookingRequests.subtitle',
      icon: Icons.inbox_outlined,
      activeIcon: Icons.inbox_rounded,
      badge: NavBadge.bookings,
      page: () => BookingRequestsScreen(pushed: pushed),
    );

NavDestination _appointments() => NavDestination(
      id: 'appointments',
      labelKey: 'sidebar.appointments',
      descriptionKey: 'appointments.subtitle',
      icon: Icons.schedule_outlined,
      activeIcon: Icons.schedule_rounded,
      page: () => const AppointmentsScreen(pushed: true),
    );

NavDestination _medicines() => NavDestination(
      id: 'medicines',
      labelKey: 'sidebar.medicines',
      descriptionKey: 'medicines.subtitle',
      icon: Icons.local_florist_outlined,
      activeIcon: Icons.local_florist_rounded,
      page: () => const MedicinesScreen(pushed: true),
    );

NavDestination _laboratory() => NavDestination(
      id: 'laboratory',
      labelKey: 'sidebar.laboratory',
      descriptionKey: 'laboratory.subtitle',
      icon: Icons.biotech_outlined,
      activeIcon: Icons.biotech_rounded,
      page: () => const LaboratoryScreen(),
    );

NavDestination _pharmacy() => NavDestination(
      id: 'pharmacy',
      labelKey: 'pharmacy.title',
      descriptionKey: 'pharmacy.subtitle',
      icon: Icons.local_pharmacy_outlined,
      activeIcon: Icons.local_pharmacy_rounded,
      page: () => const PharmacyScreen(),
    );

NavDestination _reports() => NavDestination(
      id: 'reports',
      labelKey: 'sidebar.reports',
      descriptionKey: 'mobile.reports.subtitle',
      icon: Icons.insights_outlined,
      activeIcon: Icons.insights_rounded,
      page: () => const ReportsScreen(),
    );

NavDestination _content() => NavDestination(
      id: 'content',
      labelKey: 'sidebar.content',
      descriptionKey: 'contentAdmin.subtitle',
      icon: Icons.web_outlined,
      activeIcon: Icons.web_rounded,
      page: () => const ContentManagementScreen(),
    );

NavDestination _settings() => NavDestination(
      id: 'settings',
      labelKey: 'sidebar.settings',
      descriptionKey: 'settings.subtitle',
      icon: Icons.settings_outlined,
      activeIcon: Icons.settings_rounded,
      page: () => const SettingsScreen(),
    );

/// Role → navigation, mirroring the web's sidebar and role-guarded routes
/// (Frontend/src/components/portal/Sidebar.jsx, App.jsx).
({List<NavDestination> tabs, List<NavDestination> more}) navFor(String role) {
  switch (role) {
    case Roles.doctor:
      return (
        tabs: [_home(), _queue(), _patients(), _visits(), _more()],
        more: [
          _bookings(pushed: true),
          _appointments(),
          _medicines(),
          _laboratory(),
          _pharmacy(),
          _reports(),
        ],
      );
    case Roles.dataClerk:
      return (
        tabs: [_home(), _patients(), _visits(), _bookings(), _more()],
        more: [_appointments(), _medicines(), _laboratory(), _pharmacy()],
      );
    case Roles.cashier:
      return (
        tabs: [_home(), _cashier(), _patients(), _more()],
        more: [_pharmacy()],
      );
    case Roles.superAdmin:
      return (tabs: [_home(), _staff(), _more()], more: [_content(), _settings()]);
    case Roles.staffManager:
      return (tabs: [_home(), _staff(), _more()], more: []);
    default:
      return (tabs: [_home(), _more()], more: []);
  }
}
