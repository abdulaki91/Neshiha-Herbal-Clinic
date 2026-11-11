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
          visitJson('21', patientsJson[0],
              status: 'completed',
              date: _inDays(-30),
              complaint: 'Recurring headaches'),
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
}

AppUser fakeUser(String role) => AppUser({
      'id': 'me-$role',
      'firstName': 'Selam',
      'lastName': 'Kebede',
      'email': '$role@neshihaclinic.com',
      'role': role,
      'status': 'active',
    });
