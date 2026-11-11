import 'package:material_ui/material_ui.dart';

import '../../models/models.dart';
import '../appointments/appointments_screen.dart';
import '../bookings/booking_requests_screen.dart';
import '../cashier/cashier_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../medicines/medicines_screen.dart';
import '../patients/patients_screen.dart';
import '../queue/queue_screen.dart';
import '../staff/staff_screen.dart';
import '../visits/visits_screen.dart';
import 'more_screen.dart';

enum NavBadge { queue, payments, bookings }

class NavDestination {
  const NavDestination({
    required this.id,
    required this.label,
    required this.icon,
    required this.activeIcon,
    required this.page,
    this.badge,
    this.description,
  });

  final String id;
  final String label;
  final IconData icon;
  final IconData activeIcon;

  /// Builds the screen. Tabs call it with pushed=false via [page];
  /// "More" entries are pushed and build their own chrome.
  final Widget Function() page;
  final NavBadge? badge;
  final String? description;
}

NavDestination _home() => NavDestination(
      id: 'home',
      label: 'Home',
      icon: Icons.space_dashboard_outlined,
      activeIcon: Icons.space_dashboard_rounded,
      page: () => const DashboardScreen(),
    );

NavDestination _more() => NavDestination(
      id: 'more',
      label: 'More',
      icon: Icons.grid_view_outlined,
      activeIcon: Icons.grid_view_rounded,
      page: () => const MoreScreen(),
    );

NavDestination _queue() => NavDestination(
      id: 'queue',
      label: 'Queue',
      icon: Icons.groups_outlined,
      activeIcon: Icons.groups_rounded,
      badge: NavBadge.queue,
      page: () => const QueueScreen(),
    );

NavDestination _patients() => NavDestination(
      id: 'patients',
      label: 'Patients',
      icon: Icons.people_alt_outlined,
      activeIcon: Icons.people_alt_rounded,
      page: () => const PatientsScreen(),
    );

NavDestination _visits() => NavDestination(
      id: 'visits',
      label: 'Visits',
      icon: Icons.event_note_outlined,
      activeIcon: Icons.event_note_rounded,
      page: () => const VisitsScreen(),
    );

NavDestination _cashier() => NavDestination(
      id: 'cashier',
      label: 'Cashier',
      icon: Icons.point_of_sale_outlined,
      activeIcon: Icons.point_of_sale_rounded,
      badge: NavBadge.payments,
      page: () => const CashierScreen(),
    );

NavDestination _staff() => NavDestination(
      id: 'staff',
      label: 'Staff',
      icon: Icons.badge_outlined,
      activeIcon: Icons.badge_rounded,
      page: () => const StaffScreen(),
    );

NavDestination _bookings({bool pushed = false}) => NavDestination(
      id: 'bookings',
      label: pushed ? 'Booking requests' : 'Bookings',
      description: 'Requests from the clinic website',
      icon: Icons.inbox_outlined,
      activeIcon: Icons.inbox_rounded,
      badge: NavBadge.bookings,
      page: () => BookingRequestsScreen(pushed: pushed),
    );

NavDestination _appointments() => NavDestination(
      id: 'appointments',
      label: 'Appointments',
      description: 'Scheduled visits & check-in',
      icon: Icons.schedule_outlined,
      activeIcon: Icons.schedule_rounded,
      page: () => const AppointmentsScreen(pushed: true),
    );

NavDestination _medicines() => NavDestination(
      id: 'medicines',
      label: 'Medicines',
      description: 'Herbal stock & prices',
      icon: Icons.local_florist_outlined,
      activeIcon: Icons.local_florist_rounded,
      page: () => const MedicinesScreen(pushed: true),
    );

/// Role → navigation, mirroring the web sidebar (components/portal/Sidebar.jsx).
({List<NavDestination> tabs, List<NavDestination> more}) navFor(String role) {
  switch (role) {
    case Roles.doctor:
      return (
        tabs: [_home(), _queue(), _patients(), _visits(), _more()],
        more: [_bookings(pushed: true), _appointments(), _medicines()],
      );
    case Roles.dataClerk:
      return (
        tabs: [_home(), _patients(), _visits(), _bookings(), _more()],
        more: [_appointments(), _medicines()],
      );
    case Roles.cashier:
      return (
        tabs: [_home(), _cashier(), _patients(), _more()],
        more: [],
      );
    case Roles.superAdmin:
    case Roles.staffManager:
      return (tabs: [_home(), _staff(), _more()], more: []);
    default:
      return (tabs: [_home(), _more()], more: []);
  }
}
