import '../core/format.dart';
import '../core/json.dart';

/// Staff roles, mirroring ROLES in api/src/config/constants.js.
class Roles {
  Roles._();
  static const superAdmin = 'super_admin';
  static const staffManager = 'staff_manager';
  static const dataClerk = 'data_clerk';
  static const doctor = 'doctor';
  static const cashier = 'cashier';

  static String label(String? role) => switch (role) {
        superAdmin => 'Super Admin',
        staffManager => 'Staff Manager',
        dataClerk => 'Data Clerk',
        doctor => 'Doctor',
        cashier => 'Cashier',
        _ => Fmt.titleCase(role),
      };
}

class AppUser {
  AppUser(this.raw);
  final Map<String, dynamic> raw;

  String get id => asString(raw['id']) ?? '';
  String get firstName => asString(raw['firstName']) ?? '';
  String get lastName => asString(raw['lastName']) ?? '';
  String get fullName => '$firstName $lastName'.trim();
  String get email => asString(raw['email']) ?? '';
  String? get phone => asString(raw['phone']);
  String get role => asString(raw['role']) ?? '';
  String get status => asString(raw['status']) ?? 'active';
  String? get department => asString(raw['department']);
  String? get specialization => asString(raw['specialization']);
  DateTime? get lastLogin => asDate(raw['lastLogin']);
  String get initials => Fmt.initials(firstName, lastName);
  bool get isActive => status == 'active';
}

class PersonRef {
  PersonRef(this.raw);
  final Map<String, dynamic> raw;
  static PersonRef? maybe(dynamic v) {
    final m = asMap(v);
    return m == null ? null : PersonRef(m);
  }

  String get id => asString(raw['id']) ?? '';
  String get firstName => asString(raw['firstName']) ?? '';
  String get lastName => asString(raw['lastName']) ?? '';
  String get fullName => '$firstName $lastName'.trim();
  String get initials => Fmt.initials(firstName, lastName);
}

class Patient {
  Patient(this.raw);
  final Map<String, dynamic> raw;
  static Patient? maybe(dynamic v) {
    final m = asMap(v);
    return m == null ? null : Patient(m);
  }

  String get id => asString(raw['id']) ?? '';
  String get patientId => asString(raw['patientId']) ?? '';
  String get firstName => asString(raw['firstName']) ?? '';
  String get lastName => asString(raw['lastName']) ?? '';
  String get fullName => '$firstName $lastName'.trim();
  String get initials => Fmt.initials(firstName, lastName);
  String? get gender => asString(raw['gender']);
  int? get age => asInt(raw['age']);
  String? get phone => asString(raw['phone']);
  String? get email => asString(raw['email']);
  String? get city => asString(raw['city']);
  String? get woreda => asString(raw['woreda']);
  String? get address => asString(raw['address']);
  String? get occupation => asString(raw['occupation']);
  String? get maritalStatus => asString(raw['maritalStatus']);
  List<String> get allergies => asStringList(raw['knownAllergies']);
  List<String> get chronicDiseases => asStringList(raw['chronicDiseases']);
  DateTime? get createdAt => asDate(raw['createdAt']);
  bool get hasAlerts => allergies.isNotEmpty || chronicDiseases.isNotEmpty;

  String get ageGender {
    final parts = <String>[
      if (age != null) '$age yrs',
      if (gender != null) Fmt.titleCase(gender),
    ];
    return parts.isEmpty ? '—' : parts.join(' · ');
  }

  List<Visit> get visits {
    final list = asMapList(raw['visits']).map(Visit.new).toList();
    list.sort((a, b) => b.sortKey.compareTo(a.sortKey));
    return list;
  }
}

class VisitStatus {
  VisitStatus._();
  static const scheduled = 'scheduled';
  static const waiting = 'waiting';
  static const inConsultation = 'in_consultation';
  static const pendingPayment = 'pending_payment';
  static const completed = 'completed';
  static const cancelled = 'cancelled';

  static String label(String? s) => switch (s) {
        scheduled => 'Scheduled',
        waiting => 'Waiting',
        inConsultation => 'In consultation',
        pendingPayment => 'Pending payment',
        completed => 'Completed',
        cancelled => 'Cancelled',
        _ => Fmt.titleCase(s),
      };
}

class Visit {
  Visit(this.raw);
  final Map<String, dynamic> raw;

  String get id => asString(raw['id']) ?? '';
  String get visitNumber => asString(raw['visitNumber']) ?? '';
  String get status => asString(raw['status']) ?? '';
  DateTime? get visitDate => asDate(raw['visitDate']);
  String? get arrivalTime => asString(raw['arrivalTime']);
  String? get scheduledTime => asString(raw['scheduledTime']);
  String? get chiefComplaint => asString(raw['chiefComplaint']);
  List<String> get symptoms => asStringList(raw['symptoms']);
  String? get historyOfPresentIllness =>
      asString(raw['historyOfPresentIllness']);
  String? get pastHistory => asString(raw['pastHistory']);
  String? get physicalExamination => asString(raw['physicalExamination']);
  List<String> get diagnosis => asStringList(raw['diagnosis']);
  String? get treatmentPlan => asString(raw['treatmentPlan']);
  String? get doctorNotes => asString(raw['doctorNotes']);
  String? get followUpDate => asString(raw['followUpDate']);
  Patient? get patient => Patient.maybe(raw['patient']);
  PersonRef? get doctor => PersonRef.maybe(raw['doctor']);
  DateTime? get createdAt => asDate(raw['createdAt']);
  List<Prescription> get prescriptions =>
      asMapList(raw['prescriptions']).map(Prescription.new).toList();

  String get sortKey =>
      '${asString(raw['visitDate']) ?? ''} ${arrivalTime ?? scheduledTime ?? ''}';
}

class Prescription {
  Prescription(this.raw);
  final Map<String, dynamic> raw;

  String get id => asString(raw['id']) ?? '';
  String get status => asString(raw['status']) ?? '';
  int get quantity => asInt(raw['quantity']) ?? 0;
  double get unitPrice => asDouble(raw['unitPrice']) ?? 0;
  double get totalAmount =>
      asDouble(raw['totalAmount']) ?? unitPrice * quantity;
  String? get instructions => asString(raw['instructions']);
  String? get dosage => asString(raw['dosage']);
  String? get frequency => asString(raw['frequency']);
  Medicine? get medicine => Medicine.maybe(raw['medicine']);
  DateTime? get prescribedDate => asDate(raw['prescribedDate']);
  String get medicineName => medicine?.name ?? 'Medicine';
}

class Medicine {
  Medicine(this.raw);
  final Map<String, dynamic> raw;
  static Medicine? maybe(dynamic v) {
    final m = asMap(v);
    return m == null ? null : Medicine(m);
  }

  String get id => asString(raw['id']) ?? '';
  String get name => asString(raw['name']) ?? '';
  String? get code => asString(raw['code']);
  String? get genericName => asString(raw['genericName']);
  String? get strength => asString(raw['strength']);
  String? get dosageForm => asString(raw['dosageForm']);
  String? get category => asString(raw['category']);
  double? get sellingPrice => asDouble(raw['sellingPrice']);
  int get availableQuantity => asInt(raw['availableQuantity']) ?? 0;
  int get minimumStock => asInt(raw['minimumStock']) ?? 0;
  String? get status => asString(raw['status']);
  DateTime? get expiryDate => asDate(raw['expiryDate']);

  bool get isOut => availableQuantity <= 0 || status == 'out_of_stock';
  bool get isLow =>
      !isOut && (status == 'low_stock' || availableQuantity <= minimumStock);
  bool get isExpired => status == 'expired';
}

class Payment {
  Payment(this.raw);
  final Map<String, dynamic> raw;

  String get id => asString(raw['id']) ?? '';
  String get paymentNumber => asString(raw['paymentNumber']) ?? '';
  double get amount => asDouble(raw['amount']) ?? 0;
  String? get method => asString(raw['paymentMethod']);
  String? get transactionId => asString(raw['transactionId']);
  DateTime? get paidAt => asDate(raw['paidAt']) ?? asDate(raw['createdAt']);
  Patient? get patient => Patient.maybe(raw['patient']);

  static String methodLabel(String? m) => switch (m) {
        'cash' => 'Cash',
        'transfer' => 'Bank transfer',
        'mobile_money' => 'Mobile money',
        'telebirr' => 'Telebirr',
        'other' => 'Other',
        _ => Fmt.titleCase(m),
      };
}

class BookingRequest {
  BookingRequest(this.raw);
  final Map<String, dynamic> raw;

  String get id => asString(raw['id']) ?? '';
  String get fullName => asString(raw['fullName']) ?? '';
  String get phone => asString(raw['phone']) ?? '';
  String? get email => asString(raw['email']);
  DateTime? get preferredDate => asDate(raw['preferredDate']);
  String? get preferredTime => asString(raw['preferredTime']);
  String? get reason => asString(raw['reason']);
  String get status => asString(raw['status']) ?? 'pending';
  DateTime? get createdAt => asDate(raw['createdAt']);

  static const statuses = [
    'pending',
    'contacted',
    'confirmed',
    'declined',
    'converted',
  ];
}

class AppNotification {
  AppNotification(this.raw);
  final Map<String, dynamic> raw;

  String get id => asString(raw['id']) ?? '';
  String get title => asString(raw['title']) ?? asString(raw['message']) ?? '';
  String? get message => asString(raw['message']);
  String? get type => asString(raw['type']);
  String? get priority => asString(raw['priority']);
  bool get isRead => asBool(raw['isRead']);
  DateTime? get createdAt => asDate(raw['createdAt']);
}
