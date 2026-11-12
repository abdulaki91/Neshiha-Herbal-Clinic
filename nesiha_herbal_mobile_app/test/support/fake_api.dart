import 'package:nesiha_herbal_mobile_app/core/api_client.dart';
import 'package:nesiha_herbal_mobile_app/core/session_storage.dart';
import 'package:nesiha_herbal_mobile_app/data/clinic_api.dart';
import 'package:nesiha_herbal_mobile_app/models/models.dart';

/// Canned responses shaped exactly like the backend's JSON, so screens can
/// be rendered and exercised without a server.
class FakeApi extends ClinicApi {
  FakeApi() : super(ApiClient(SessionStorage()));

  static String _today() => DateTime.now().toIso8601String().substring(0, 10);
  static String _inDays(int d) =>
      DateTime.now().add(Duration(days: d)).toIso8601String().substring(0, 10);

  static Map<String, dynamic> patientJson(
    String id,
    String first,
    String last, {
    String gender = 'male',
    int age = 40,
    String? allergies,
    String? chronic,
  }) =>
      {
        'id': id,
        'patientId': 'NHC-${id.padLeft(5, '0')}',
        'firstName': first,
        'lastName': last,
        'gender': gender,
        'age': age,
        'phone': '+251 91 234 ${id.padLeft(4, '0')}',
        'city': 'Addis Ababa',
        'woreda': 'Bole',
        'knownAllergies': allergies,
        'chronicDiseases': chronic,
        'createdAt': DateTime.now()
            .subtract(Duration(hours: int.parse(id)))
            .toIso8601String(),
      };

  static final patientsJson = [
    patientJson('1', 'Abebe', 'Tesfaye',
        age: 44, allergies: '["Penicillin"]', chronic: '["Hypertension"]'),
    patientJson('2', 'Tigist', 'Hailu', gender: 'female', age: 32),
    patientJson('3', 'Mulugeta', 'Bekele',
        age: 49, chronic: '["Diabetes","High cholesterol"]'),
    patientJson('4', 'Hanna', 'Gebre',
        gender: 'female', age: 26, allergies: '["Dust","Pollen"]'),
    patientJson('5', 'Dawit', 'Abate', age: 36),
  ];

  static final medicinesJson = [
    {
      'id': 'm1', 'code': 'HRB-001', 'name': 'Moringa leaf powder',
      'strength': '100 g', 'category': 'herbal_powder', 'sellingPrice': '180.00',
      'availableQuantity': 42, 'minimumStock': 10, 'status': 'available',
      'expiryDate': _inDays(300),
    },
    {
      'id': 'm2', 'code': 'HRB-002', 'name': 'Black seed oil',
      'strength': '250 ml', 'category': 'oil', 'sellingPrice': '320.00',
      'availableQuantity': 6, 'minimumStock': 8, 'status': 'low_stock',
    },
    {
      'id': 'm3', 'code': 'HRB-003', 'name': 'Ginger & honey tonic',
      'strength': '500 ml', 'category': 'tonic', 'sellingPrice': '150.00',
      'availableQuantity': 0, 'minimumStock': 5, 'status': 'out_of_stock',
    },
  ];

  static Map<String, dynamic> visitJson(
    String id,
    Map<String, dynamic> patient, {
    String status = 'waiting',
    String arrival = '09:15:00',
    String? complaint,
    String? date,
    List<Map<String, dynamic>> prescriptions = const [],
  }) =>
      {
        'id': id,
        'visitNumber': 'V-2026-${id.padLeft(4, '0')}',
        'status': status,
        'visitDate': date ?? _today(),
        'arrivalTime': arrival,
        'scheduledTime': arrival,
        'chiefComplaint': complaint,
        'symptoms': '["Headache","Fatigue"]',
        'diagnosis': status == 'completed' ? '["Tension headache"]' : null,
        'treatmentPlan':
            status == 'completed' ? 'Moringa twice daily, hydrate well' : null,
        'patient': patient,
        'doctor': {'id': 'd1', 'firstName': 'Selam', 'lastName': 'Kebede'},
        'prescriptions': prescriptions,
      };

  static Map<String, dynamic> rxJson(String id, int medIndex,
          {int qty = 2, String status = 'pending'}) =>
      {
        'id': id,
        'status': status,
        'quantity': qty,
        'unitPrice': medicinesJson[medIndex]['sellingPrice'],
        'totalAmount': (double.parse(
                    medicinesJson[medIndex]['sellingPrice'] as String) *
                qty)
            .toStringAsFixed(2),
        'instructions': 'Mix with warm water, twice daily after meals',
        'medicine': medicinesJson[medIndex],
      };

  static final queueJson = [
    visitJson('11', patientsJson[0],
        status: 'in_consultation',
        arrival: '08:40:00',
        complaint: 'Persistent headache and dizziness for a week'),
    visitJson('12', patientsJson[1],
        arrival: '09:05:00', complaint: 'Joint pain in both knees'),
    visitJson('13', patientsJson[3],
        arrival: '09:30:00', complaint: 'Seasonal allergies, sneezing'),
  ];

  @override
  Future<Map<String, dynamic>> dashboard(String role) async => switch (role) {
        Roles.doctor => {
            'todayQueue': 3,
            'todayCompleted': 5,
            'todayPrescriptions': 7,
            'todayDispensed': 4,
            'waitingPatients': queueJson,
          },
        Roles.dataClerk => {
            'todayRegistrations': 4,
            'todayVisits': 9,
            'waitingPatients': 3,
            'recentPatients': patientsJson,
          },
        Roles.cashier => {
            'pendingPayments': 2,
            'todayPaymentsCount': 6,
            'recentPayments': [
              for (var i = 0; i < 3; i++)
                {
                  'id': 'pay$i',
                  'paymentNumber': 'PAY-00${i + 1}',
                  'amount': '${(i + 1) * 180}.00',
                  'paymentMethod': ['cash', 'mobile_money', 'transfer'][i],
                  'paidAt': DateTime.now()
                      .subtract(Duration(minutes: 20 * i + 5))
                      .toIso8601String(),
                  'patient': patientsJson[i],
                },
            ],
          },
        _ => {
            'summary': {
              'todayVisits': 12,
              'completedVisits': 8,
              'waitingPatients': 3,
              'lowStockMedicines': 2,
              'expiredMedicines': 0,
              'totalDoctors': 3,
              'totalStaff': 11,
              'totalPatients': 1284,
            },
          },
      };

  @override
  Future<int> pendingBookingCount() async => 2;

  @override
  Future<List<AppNotification>> notifications() async => [
        AppNotification({
          'id': 'n1',
          'title': 'New patient in queue',
          'message': 'Tigist Hailu is waiting',
          'isRead': false,
          'createdAt': DateTime.now().toIso8601String(),
        }),
        // Saved by the backend for an event: shown translated from its key.
        AppNotification({
          'id': 'n2',
          'title': 'Payment received: 450 ETB',
          'message': 'Payment received: 450 ETB',
          'isRead': false,
          'metadata': {
            'key': 'paymentReceived',
            'params': {'amount': '450'},
            'destination': 'reports',
          },
          'createdAt': DateTime.now().toIso8601String(),
        }),
      ];

  @override
  Future<Paged<Patient>> patients(
          {int page = 1, int pageSize = 20, String? search}) async =>
      Paged(patientsJson.map(Patient.new).toList(), null);

  @override
  Future<Patient> patientHistory(String id) async => Patient({
        ...patientsJson.firstWhere((p) => p['id'] == id,
            orElse: () => patientsJson.first),
        'visits': [
          {
            ...visitJson('21', patientsJson[0],
                status: 'completed',
                date: _inDays(-30),
                complaint: 'Recurring headaches',
                prescriptions: [
                  {...rxJson('h1', 1, qty: 1, status: 'dispensed'), 'dosage': '2 tsp', 'frequency': 'Twice daily'},
                ]),
            'temperature': '37.2',
            'bloodPressureSystolic': 150,
            'bloodPressureDiastolic': 95,
            'doctorNotes': 'Advised less screen time',
            'investigations': [invJson('hi1', 'completed')],
          },
          visitJson('22', patientsJson[0],
              status: 'completed',
              date: _inDays(-90),
              complaint: 'Fatigue and poor sleep'),
        ],
      });

  @override
  Future<Paged<Visit>> visits(
          {int page = 1,
          int pageSize = 20,
          String? status,
          String? patientId}) async =>
      Paged([
        ...queueJson.map(Visit.new),
        Visit(visitJson('14', patientsJson[2],
            status: 'completed', complaint: 'Follow-up on blood sugar')),
        Visit(visitJson('15', patientsJson[4],
            status: 'pending_payment', complaint: 'Digestive discomfort')),
      ], null);

  @override
  Future<List<Visit>> queue() async => queueJson.map(Visit.new).toList();

  @override
  Future<List<Visit>> appointments({String? search}) async => [
        Visit(visitJson('31', patientsJson[4],
            status: 'scheduled', arrival: '10:30:00',
            complaint: 'Follow-up consultation')),
        Visit(visitJson('32', patientsJson[2],
            status: 'scheduled', arrival: '14:00:00', date: _inDays(1))),
      ];

  @override
  Future<List<Prescription>> prescriptions(
          {String? visitId,
          String? patientId,
          String? status,
          int pageSize = 100}) async =>
      status == 'pending'
          ? []
          : [Prescription(rxJson('r1', 0)), Prescription(rxJson('r2', 1, qty: 1))];

  @override
  Future<Paged<Medicine>> medicines(
          {int page = 1,
          int pageSize = 50,
          String? search,
          String? status}) async =>
      Paged(medicinesJson.map(Medicine.new).toList(), null);

  @override
  Future<List<Visit>> pendingPayments({String? search}) async => [
        Visit(visitJson('41', patientsJson[1],
            status: 'pending_payment',
            prescriptions: [rxJson('r3', 0), rxJson('r4', 1, qty: 1)])),
        Visit(visitJson('42', patientsJson[4],
            status: 'pending_payment', prescriptions: [rxJson('r5', 2, qty: 3)])),
      ];

  @override
  Future<List<Payment>> paymentHistory({int pageSize = 50}) async => [
        Payment({
          'id': 'p1',
          'paymentNumber': 'PAY-001',
          'amount': '500.00',
          'paymentMethod': 'cash',
          'paidAt': DateTime.now().toIso8601String(),
          'patient': patientsJson[0],
        }),
      ];

  @override
  Future<Paged<BookingRequest>> bookingRequests(
          {int page = 1, int pageSize = 20, String? status}) async =>
      Paged([
        BookingRequest({
          'id': 'b1',
          'fullName': 'Meron Alemu',
          'phone': '+251 92 555 0101',
          'email': 'meron@example.com',
          'preferredDate': _inDays(2),
          'preferredTime': 'morning',
          'reason': 'Looking for herbal treatment for migraines',
          'status': 'pending',
          'createdAt': DateTime.now()
              .subtract(const Duration(hours: 2))
              .toIso8601String(),
        }),
      ], null);

  @override
  Future<Paged<AppUser>> staff(
          {int page = 1,
          int pageSize = 30,
          String? search,
          String? role}) async =>
      Paged([
        AppUser({
          'id': 'u2', 'firstName': 'Selam', 'lastName': 'Kebede',
          'email': 'doctor@neshihaclinic.com', 'role': 'doctor', 'status': 'active',
        }),
        AppUser({
          'id': 'u3', 'firstName': 'Yonas', 'lastName': 'Tadesse',
          'email': 'clerk@neshihaclinic.com', 'role': 'data_clerk',
          'status': 'inactive',
        }),
      ], null);

  // ------------------------------------------------ added with the web-parity port
  @override
  Future<Visit> visit(String id) async => Visit({
        ...queueJson.firstWhere((v) => v['id'] == id, orElse: () => queueJson.first),
        'temperature': '37.9',
        'bloodPressureSystolic': 145,
        'bloodPressureDiastolic': 92,
        'heartRate': 78,
        'weight': '72.5',
        'height': '170',
      });

  @override
  Future<void> saveVitals(String visitId, Map<String, dynamic> vitals) async {}

  @override
  Future<void> updateVisit(String id, Map<String, dynamic> data) async {}

  static Map<String, dynamic> invJson(String id, String status,
          {String urgency = 'routine'}) =>
      {
        'id': id,
        'visitId': '11',
        'patientId': '1',
        'investigationType': 'Blood Test',
        'testName': status == 'completed' ? 'Lipid panel' : 'Complete Blood Count',
        'urgency': urgency,
        'status': status,
        'requestedDate':
            DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
        'completedDate': status == 'completed' ? DateTime.now().toIso8601String() : null,
        'results': status == 'completed' ? 'LDL 3.1 mmol/L, HDL 1.2 mmol/L' : null,
        'performedBy': status == 'completed' ? 'Lab tech Almaz' : null,
        'patient': patientsJson[0],
      };

  @override
  Future<List<Investigation>> investigations(
          {String? visitId, String? patientId, String? status, int pageSize = 100}) async =>
      [invJson('i1', 'requested', urgency: 'stat'), invJson('i2', 'completed')]
          .where((j) => status == null || j['status'] == status)
          .map(Investigation.new)
          .toList();

  @override
  Future<void> updateInvestigation(String id, Map<String, dynamic> data) async {}

  @override
  Future<void> requestInvestigation(Map<String, dynamic> data) async {}

  @override
  Future<List<Visit>> completedVisits({String? patientId, int pageSize = 1}) async => [
        Visit({
          ...visitJson('90', patientsJson[0], status: 'completed', date: _inDays(-14)),
          'followUpDate': _today(),
        }),
      ];

  @override
  Future<List<Attachment>> patientAttachments(String patientId) async => [
        Attachment({
          'id': 'a1',
          'fileName': 'cbc-result.pdf',
          'filePath': 'uploads/patients/cbc-result.pdf',
          'fileType': 'application/pdf',
          'createdAt': DateTime.now().toIso8601String(),
        }),
      ];

  @override
  Future<List<Prescription>> pharmacyPrescriptions({String? status}) async => [
        Prescription({
          ...rxJson('p9', 0, status: status ?? 'paid'),
          'patient': patientsJson[1],
        }),
      ];

  @override
  Future<Map<String, dynamic>> revenueReport(String period, DateTime date) async => {
        'period': period,
        'startDate': _inDays(-2),
        'endDate': _today(),
        'summary': {
          'grandTotal': 1630,
          'consultationRevenue': 1230,
          'registrationFeeRevenue': 400,
          'totalPayments': 3,
          'totalRegistrations': 2,
          'byPaymentMethod': {'cash': 830, 'mobile_money': 400},
          'registrationByPaymentMethod': {'cash': 400},
        },
        'revenueByDay': [
          {'day': _inDays(-2), 'consultationRevenue': 500, 'registrationFeeRevenue': 200, 'total': 700},
          {'day': _inDays(-1), 'consultationRevenue': 330, 'registrationFeeRevenue': 0, 'total': 330},
          {'day': _today(), 'consultationRevenue': 400, 'registrationFeeRevenue': 200, 'total': 600},
        ],
        'payments': [
          {
            'id': 'pay1', 'paymentNumber': 'PAY-001', 'amount': 400, //
            'paymentMethod': 'cash', 'paidAt': DateTime.now().toIso8601String(),
            'patient': patientsJson[1],
          },
        ],
        'registrationFees': [
          {
            'id': 'r1', 'amount': 200, 'paymentMethod': 'cash', //
            'paidAt': DateTime.now().toIso8601String(), 'patient': patientsJson[4],
          },
        ],
      };

  @override
  Future<ClinicSettings> settings() async => ClinicSettings({
        'clinicName': 'Neshiha Herbal Clinic',
        'clinicPhone': '+251 11 000 0000',
        'currency': 'ETB',
        'workingHoursStart': '08:00:00',
        'workingHoursEnd': '17:30:00',
        'workingDays': ['monday', 'tuesday', 'wednesday'],
        'appointmentDuration': 30,
        'lowStockThreshold': 10,
        'tagline': {'en': 'Natural healing', 'am': 'ተፈጥሯዊ ፈውስ'},
      });

  @override
  Future<List<ContentItem>> contentList(String resource, {String? status}) async => [
        ContentItem({
          'id': 'c1',
          'status': 'published',
          'sortOrder': 1,
          'clientName': 'Kidist M.',
          'rating': 5,
          'text': {'en': 'Great care'},
          'question': {'en': 'Do you take walk-ins?'},
          'title': {'en': 'Herbal consultation'},
          'name': 'Kidist M.',
        }),
      ];

  @override
  Future<Map<String, dynamic>> staffStats() async => {
        'total': 6, 'active': 5, 'inactive': 1, 'suspended': 0, //
        'byRole': {'doctors': 2},
      };
}

AppUser fakeUser(String role) => AppUser({
      'id': 'me-$role',
      'firstName': 'Selam',
      'lastName': 'Kebede',
      'email': '$role@neshihaclinic.com',
      'role': role,
      'status': 'active',
    });
