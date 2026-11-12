import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../core/format.dart';
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

  Future<AppUser> staffMember(String id) async =>
      AppUser((await _c.get('/staff/$id')).map);

  Future<Map<String, dynamic>> staffStats() async =>
      (await _c.get('/staff/stats')).map;

  Future<void> createStaff(Map<String, dynamic> data) =>
      _c.post('/staff', data: data);

  Future<void> updateStaff(String id, Map<String, dynamic> data) =>
      _c.put('/staff/$id', data: data);

  /// Soft-deletes the account (the backend deactivates it).
  Future<void> deleteStaff(String id) => _c.delete('/staff/$id');

  Future<void> resetStaffPassword(String id, String password) =>
      _c.post('/staff/$id/reset-password', data: {'password': password});

  // -------------------------------------------------------- notifications
  Future<List<AppNotification>> notifications() async {
    final r = await _c.get('/notifications', query: {'pageSize': 30});
    return r.list.map(AppNotification.new).toList();
  }

  Future<void> clearNotifications() => _c.delete('/notifications');

  Future<void> markNotificationRead(String id) =>
      _c.patch('/notifications/$id/read');

  Future<void> deleteNotification(String id) => _c.delete('/notifications/$id');

  // ---------------------------------------------------------- vital signs
  /// Vitals live on the visit row (VitalSignsForm.jsx does the same PUT).
  Future<void> saveVitals(String visitId, Map<String, dynamic> vitals) =>
      _c.put('/visits/$visitId', data: vitals);

  Future<List<Visit>> completedVisits({String? patientId, int pageSize = 1}) async {
    final r = await _c.get('/visits', query: {
      'patientId': patientId,
      'status': VisitStatus.completed,
      'sortBy': 'visitDate',
      'sortOrder': 'DESC',
      'pageSize': pageSize,
    });
    return r.list.map(Visit.new).toList();
  }

  Future<void> assignDoctor(String visitId, String doctorId) =>
      _c.patch('/visits/$visitId/assign-doctor', data: {'doctorId': doctorId});

  // ------------------------------------------------------- investigations
  Future<List<Investigation>> investigations({
    String? visitId,
    String? patientId,
    String? status,
    int pageSize = 100,
  }) async {
    final r = await _c.get('/investigations', query: {
      'visitId': visitId,
      'patientId': patientId,
      'status': status,
      'sortBy': 'requestedDate',
      'sortOrder': 'DESC',
      'pageSize': pageSize,
    });
    return r.list.map(Investigation.new).toList();
  }

  Future<void> requestInvestigation(Map<String, dynamic> data) =>
      _c.post('/investigations', data: data);

  Future<void> updateInvestigation(String id, Map<String, dynamic> data) =>
      _c.put('/investigations/$id', data: data);

  // ------------------------------------------------------------- pharmacy
  Future<List<Prescription>> pharmacyPrescriptions({String? status}) async {
    final r = await _c.get('/prescriptions', query: {
      'status': status,
      'sortBy': 'prescribedDate',
      'sortOrder': 'DESC',
      'pageSize': 100,
    });
    return r.list.map(Prescription.new).toList();
  }

  /// Takes stock out of inventory (`POST /prescriptions/:id/dispense`,
  /// doctor or cashier). Quantity defaults to the full prescription.
  Future<void> dispensePrescription(String id, {int? quantity}) =>
      _c.post('/prescriptions/$id/dispense',
          data: {'quantity': ?quantity});

  // ---------------------------------------------------- medicine (admin)
  Future<Medicine> medicine(String id) async =>
      Medicine((await _c.get('/medicines/$id')).map);

  Future<void> createMedicine(Map<String, dynamic> data) =>
      _c.post('/medicines', data: data);

  Future<void> updateMedicine(String id, Map<String, dynamic> data) =>
      _c.put('/medicines/$id', data: data);

  Future<void> deleteMedicine(String id) => _c.delete('/medicines/$id');

  Future<Map<String, dynamic>> medicineStats() async =>
      (await _c.get('/medicines/stats')).map;

  // -------------------------------------------------------------- reports
  /// Doctor-only revenue report: `period` is daily | weekly | monthly.
  Future<Map<String, dynamic>> revenueReport(String period, DateTime date) async =>
      (await _c.get('/reports/revenue',
              query: {'period': period, 'date': Fmt.apiDate(date)}))
          .map;

  // ------------------------------------------------------------- settings
  Future<ClinicSettings> settings() async =>
      ClinicSettings((await _c.get('/settings')).map);

  Future<ClinicSettings> updateSettings(Map<String, dynamic> data) async =>
      ClinicSettings((await _c.put('/settings', data: data)).map);

  Future<void> uploadLogo(PickedUpload file) =>
      _c.post('/settings/logo', data: FormData.fromMap({'logo': file.toMultipart()}));

  // ------------------------------------------------------ website content
  Future<List<ContentItem>> contentList(String resource, {String? status}) async {
    final r = await _c.get('/$resource',
        query: {'status': status, 'pageSize': 100, 'sortBy': 'sortOrder', 'sortOrder': 'ASC'});
    return r.list.map(ContentItem.new).toList();
  }

  Future<void> saveContent(
    String resource, {
    String? id,
    required Map<String, dynamic> data,
    PickedUpload? image,
    List<PickedUpload>? images,
  }) {
    Object body = data;
    if (image != null || (images != null && images.isNotEmpty)) {
      // Same shape as contentHooks.js: objects are JSON-encoded fields.
      final form = FormData();
      if (image != null) form.files.add(MapEntry('image', image.toMultipart()));
      for (final f in images ?? const <PickedUpload>[]) {
        form.files.add(MapEntry('images', f.toMultipart()));
      }
      data.forEach((k, v) {
        if (v == null) return;
        form.fields.add(MapEntry(k, v is Map || v is List ? jsonEncode(v) : '$v'));
      });
      body = form;
    }
    return id == null
        ? _c.post('/$resource', data: body)
        : _c.put('/$resource/$id', data: body);
  }

  Future<void> deleteContent(String resource, String id) =>
      _c.delete('/$resource/$id');

  Future<void> setContentStatus(String resource, String id, String status) =>
      _c.patch('/$resource/$id/status', data: {'status': status});

  Future<void> reorderContent(String resource, String id, String direction) =>
      _c.patch('/$resource/$id/reorder', data: {'direction': direction});

  // ---------------------------------------------------------- attachments
  Future<List<Attachment>> patientAttachments(String patientId) async =>
      (await _c.get('/patients/$patientId/attachments'))
          .list
          .map(Attachment.new)
          .toList();

  Future<List<Attachment>> visitAttachments(String visitId) async =>
      (await _c.get('/visits/$visitId/attachments'))
          .list
          .map(Attachment.new)
          .toList();

  Future<void> uploadPatientAttachment(String patientId, PickedUpload file,
          {String? visitId}) =>
      _c.post('/patients/$patientId/attachments',
          data: FormData.fromMap({
            'document': file.toMultipart(),
            'visitId': ?visitId,
          }));

  Future<void> deletePatientAttachment(String patientId, String attachmentId) =>
      _c.delete('/patients/$patientId/attachments/$attachmentId');

  Future<void> deletePatient(String id) => _c.delete('/patients/$id');
}

/// A file chosen with the picker, ready to send as multipart.
///
/// The backend's multer filter checks each part's MIME type, and Dio sends
/// `application/octet-stream` unless told otherwise, so the type is set
/// from the extension here.
class PickedUpload {
  PickedUpload({required this.name, this.path, this.bytes});
  final String name;
  final String? path;
  final Uint8List? bytes;

  static const _types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'csv': 'text/csv',
  };

  static const allowedExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'pdf', //
    'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv',
  ];
  static const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  String get mimeType {
    final ext = name.contains('.') ? name.split('.').last.toLowerCase() : '';
    return _types[ext] ?? 'application/octet-stream';
  }

  MultipartFile toMultipart() {
    final type = DioMediaType.parse(mimeType);
    if (bytes != null) {
      return MultipartFile.fromBytes(bytes!, filename: name, contentType: type);
    }
    return MultipartFile.fromFileSync(path!, filename: name, contentType: type);
  }
}
