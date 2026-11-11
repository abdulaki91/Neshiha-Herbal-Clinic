import '../core/api_client.dart';
import '../core/json.dart';
import '../models/models.dart';

class Paged<T> {
  Paged(this.items, this.pagination);
  final List<T> items;
  final Pagination? pagination;
  bool get hasNext => pagination?.hasNext ?? false;
}

/// Every backend call the app makes, in one place. Endpoints and payloads
/// match the web portal's hooks (Frontend/src/hooks/*) so both clients
/// behave identically against the shared API.
class ClinicApi {
  ClinicApi(this._c);
  final ApiClient _c;

  // ------------------------------------------------------------ dashboard
  Future<Map<String, dynamic>> dashboard(String role) async {
    final path = switch (role) {
      Roles.doctor => '/dashboard/doctor',
      Roles.dataClerk => '/dashboard/clerk',
      Roles.cashier => '/dashboard/cashier',
      _ => '/dashboard/admin',
    };
    return (await _c.get(path)).map;
  }

  Future<int> pendingBookingCount() async {
    final r = await _c.get('/booking-requests/pending-count');
    return asInt(r.map['count']) ?? 0;
  }

  // ------------------------------------------------------------- patients
  Future<Paged<Patient>> patients({
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async {
    final r = await _c.get('/patients',
        query: {'page': page, 'pageSize': pageSize, 'search': search});
    return Paged(r.list.map(Patient.new).toList(), r.pagination);
  }

  Future<Patient> patient(String id) async =>
      Patient((await _c.get('/patients/$id')).map);

  Future<Patient> patientHistory(String id) async =>
      Patient((await _c.get('/patients/$id/history')).map);

  Future<Patient> createPatient(Map<String, dynamic> data) async =>
      Patient((await _c.post('/patients', data: data)).map);

  Future<Patient> updatePatient(String id, Map<String, dynamic> data) async =>
      Patient((await _c.put('/patients/$id', data: data)).map);

  // --------------------------------------------------------------- visits
  Future<Paged<Visit>> visits({
    int page = 1,
    int pageSize = 20,
    String? status,
    String? patientId,
  }) async {
    final r = await _c.get('/visits', query: {
      'page': page,
      'pageSize': pageSize,
      'status': status,
      'patientId': patientId,
    });
    return Paged(r.list.map(Visit.new).toList(), r.pagination);
  }

  Future<List<Visit>> queue() async =>
      (await _c.get('/visits/queue')).list.map(Visit.new).toList();

  Future<Visit> visit(String id) async =>
      Visit((await _c.get('/visits/$id')).map);

  Future<void> createVisit(Map<String, dynamic> data) =>
      _c.post('/visits', data: data);

  Future<void> updateVisit(String id, Map<String, dynamic> data) =>
      _c.put('/visits/$id', data: data);

  Future<void> setVisitStatus(String id, String status) =>
      _c.patch('/visits/$id/status', data: {'status': status});

  Future<List<Visit>> appointments({String? search}) async {
    final r = await _c.get('/visits/appointments',
        query: {'search': search, 'pageSize': 100});
    return r.list.map(Visit.new).toList();
  }

  Future<void> checkIn(String visitId) => _c.patch('/visits/$visitId/check-in');

  // -------------------------------------------------------- prescriptions
  Future<List<Prescription>> prescriptions({
    String? visitId,
    String? patientId,
    String? status,
    int pageSize = 100,
  }) async {
    final r = await _c.get('/prescriptions', query: {
      'visitId': visitId,
      'patientId': patientId,
      'status': status,
      'pageSize': pageSize,
    });
    return r.list.map(Prescription.new).toList();
  }

  Future<void> createPrescription(Map<String, dynamic> data) =>
      _c.post('/prescriptions', data: data);

  Future<void> stopPrescription(String id, {String reason = 'cancelled'}) =>
      _c.patch('/prescriptions/$id/stop', data: {'reason': reason});

  // ------------------------------------------------------------ medicines
  Future<Paged<Medicine>> medicines({
    int page = 1,
    int pageSize = 50,
    String? search,
    String? status,
  }) async {
    final r = await _c.get('/medicines', query: {
      'page': page,
      'pageSize': pageSize,
      'search': search,
      'status': status,
    });
    return Paged(r.list.map(Medicine.new).toList(), r.pagination);
  }

  // ------------------------------------------------------------- payments
  Future<List<Visit>> pendingPayments({String? search}) async {
    final r = await _c.get('/payments/pending', query: {'search': search});
    return asMapList(r.map['visits']).map(Visit.new).toList();
  }

  Future<List<Payment>> paymentHistory({int pageSize = 50}) async {
    final r = await _c.get('/payments/history', query: {'pageSize': pageSize});
    return asMapList(r.map['payments']).map(Payment.new).toList();
  }

  Future<void> processPayment(String visitId, Map<String, dynamic> data) =>
      _c.post('/payments/$visitId', data: data);

  // ----------------------------------------------------- booking requests
  Future<Paged<BookingRequest>> bookingRequests({
    int page = 1,
    int pageSize = 20,
    String? status,
  }) async {
    final r = await _c.get('/booking-requests',
        query: {'page': page, 'pageSize': pageSize, 'status': status});
    return Paged(r.list.map(BookingRequest.new).toList(), r.pagination);
  }

  Future<void> setBookingStatus(String id, String status) =>
      _c.patch('/booking-requests/$id/status', data: {'status': status});

  // ---------------------------------------------------------------- staff
  Future<Paged<AppUser>> staff({
    int page = 1,
    int pageSize = 30,
    String? search,
    String? role,
  }) async {
    final r = await _c.get('/staff', query: {
      'page': page,
      'pageSize': pageSize,
      'search': search,
      'role': role,
    });
    return Paged(r.list.map(AppUser.new).toList(), r.pagination);
  }

  Future<void> setStaffActive(String id, bool active) =>
      _c.patch('/staff/$id/${active ? 'activate' : 'deactivate'}');

  // -------------------------------------------------------- notifications
  Future<List<AppNotification>> notifications() async {
    final r = await _c.get('/notifications', query: {'pageSize': 30});
    return r.list.map(AppNotification.new).toList();
  }

  Future<void> clearNotifications() => _c.delete('/notifications');
}
