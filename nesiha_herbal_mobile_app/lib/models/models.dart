import '../core/format.dart';
import '../core/json.dart';
import '../i18n/i18n.dart';

/// Staff roles, mirroring ROLES in api/src/config/constants.js.
class Roles {
  Roles._();
  static const superAdmin = 'super_admin';
  static const staffManager = 'staff_manager';
  static const dataClerk = 'data_clerk';
  static const doctor = 'doctor';
  static const cashier = 'cashier';

  static const all = [superAdmin, staffManager, doctor, dataClerk, cashier];

  static String label(String? role) =>
      I18n.instance.maybe('roles.$role') ?? Fmt.titleCase(role);
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
  String? get licenseNumber => asString(raw['licenseNumber']);
  String? get address => asString(raw['address']);
  String? get gender => asString(raw['gender']);
  String? get dateOfBirth => asString(raw['dateOfBirth']);
  DateTime? get lastLogin => asDate(raw['lastLogin']);
  DateTime? get createdAt => asDate(raw['createdAt']);
  String get initials => Fmt.initials(firstName, lastName);
  bool get isActive => status == 'active';

  static String statusLabel(String? s) =>
      I18n.instance.maybe('staff.status.$s') ?? Fmt.titleCase(s);
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

  String? get bloodGroup => asString(raw['bloodGroup']);

  String get ageGender {
    final parts = <String>[
      if (age != null) tr('mobile.common.ageYears', {'age': age}),
      if (gender != null) genderLabel(gender),
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
        scheduled => tr('visits.status.scheduled'),
        waiting => tr('visits.status.waiting'),
        inConsultation => tr('visits.status.inConsultation'),
        pendingPayment => tr('mobile.visitStatus.pendingPayment'),
        completed => tr('visits.status.completed'),
        cancelled => tr('visits.status.cancelled'),
        _ => Fmt.titleCase(s),
      };
}

/// "male" → localized label (patientForm.gender.* on the web).
String genderLabel(String? g) =>
    I18n.instance.maybe('patientForm.gender.${g?.toLowerCase()}') ??
    Fmt.titleCase(g);

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
  String? get doctorId => asString(raw['doctorId']);
  String? get visitType => asString(raw['visitType']);
  DateTime? get createdAt => asDate(raw['createdAt']);
  List<Prescription> get prescriptions =>
      asMapList(raw['prescriptions']).map(Prescription.new).toList();

  // Vital signs (stored on the visit row; see VitalSignsForm.jsx).
  double? get temperature => asDouble(raw['temperature']);
  int? get bloodPressureSystolic => asInt(raw['bloodPressureSystolic']);
  int? get bloodPressureDiastolic => asInt(raw['bloodPressureDiastolic']);
  int? get heartRate => asInt(raw['heartRate']);
  int? get respiratoryRate => asInt(raw['respiratoryRate']);
  double? get oxygenSaturation => asDouble(raw['oxygenSaturation']);
  double? get weight => asDouble(raw['weight']);
  double? get height => asDouble(raw['height']);
  double? get bmi => asDouble(raw['bmi']);
  bool get hasVitals => [
        temperature,
        bloodPressureSystolic,
        heartRate,
        respiratoryRate,
        oxygenSaturation,
        weight,
        height,
      ].any((v) => v != null);

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
  String? get duration => asString(raw['duration']);
  String? get route => asString(raw['route']);
  String? get stopReason => asString(raw['stopReason']);
  String? get visitId => asString(raw['visitId']);
  Medicine? get medicine => Medicine.maybe(raw['medicine']);
  Patient? get patient => Patient.maybe(raw['patient']);
  Visit? get visit {
    final m = asMap(raw['visit']);
    return m == null ? null : Visit(m);
  }

  PersonRef? get doctor => PersonRef.maybe(raw['doctor']);
  DateTime? get prescribedDate => asDate(raw['prescribedDate']);
  DateTime? get dispensedDate => asDate(raw['dispensedDate']);
  String get medicineName => medicine?.name ?? tr('prescription.medicineFallback');

  static String statusLabel(String? s) {
    final v = I18n.instance.maybe('prescription.status.$s');
    return v == null ? Fmt.titleCase(s) : Fmt.capitalize(v);
  }
}

/// A lab/imaging request on a visit (Backend/src/models/Investigation.js).
class Investigation {
  Investigation(this.raw);
  final Map<String, dynamic> raw;

  static const types = [
    ('Blood Test', 'bloodTest'),
    ('Urine Test', 'urineTest'),
    ('Stool Test', 'stoolTest'),
    ('X-Ray', 'xray'),
    ('Ultrasound', 'ultrasound'),
    ('CT Scan', 'ctScan'),
    ('MRI', 'mri'),
    ('ECG', 'ecg'),
    ('Biopsy', 'biopsy'),
    ('Culture', 'cultureTest'),
    ('Other', 'other'),
  ];
  static const urgencies = ['routine', 'urgent', 'stat'];

  String get id => asString(raw['id']) ?? '';
  String? get visitId => asString(raw['visitId']);
  String? get patientId => asString(raw['patientId']);
  String get type => asString(raw['investigationType']) ?? '';
  String get testName => asString(raw['testName']) ?? '';
  String? get instructions => asString(raw['instructions']);
  String get urgency => asString(raw['urgency']) ?? 'routine';
  String get status => asString(raw['status']) ?? 'requested';
  DateTime? get requestedDate => asDate(raw['requestedDate']) ?? asDate(raw['createdAt']);
  DateTime? get scheduledDate => asDate(raw['scheduledDate']);
  DateTime? get completedDate => asDate(raw['completedDate']);
  String? get results => asString(raw['results']);
  String? get resultFile => asString(raw['resultFile']);
  String? get interpretation => asString(raw['interpretation']);
  String? get notes => asString(raw['notes']);
  String? get performedBy => asString(raw['performedBy']);
  Patient? get patient => Patient.maybe(raw['patient']);
  bool get isPending => status == 'requested' || status == 'in_progress';

  static String typeLabel(String type) {
    for (final (value, key) in types) {
      if (value == type) return tr('investigation.type.$key');
    }
    return type;
  }

  static String statusLabel(String s) =>
      tr('investigation.status.${s == 'in_progress' ? 'inProgress' : s}');
  static String urgencyLabel(String u) => tr('laboratory.urgency.$u');
}

/// A document uploaded against a patient or visit.
class Attachment {
  Attachment(this.raw);
  final Map<String, dynamic> raw;

  String get id => asString(raw['id']) ?? '';
  String get fileName => asString(raw['fileName']) ?? asString(raw['originalName']) ?? '';
  String? get filePath => asString(raw['filePath']) ?? asString(raw['path']);
  String? get fileType => asString(raw['fileType']) ?? asString(raw['mimeType']);
  int? get fileSize => asInt(raw['fileSize']) ?? asInt(raw['size']);
  String? get description => asString(raw['description']);
  String? get visitId => asString(raw['visitId']);
  DateTime? get createdAt => asDate(raw['createdAt']);
  PersonRef? get uploader => PersonRef.maybe(raw['uploader'] ?? raw['uploadedByUser']);
  bool get isImage => (fileType ?? '').startsWith('image/') ||
      RegExp(r'\.(png|jpe?g|gif|webp)$', caseSensitive: false).hasMatch(fileName);
  bool get isPdf => (fileType ?? '').contains('pdf') ||
      fileName.toLowerCase().endsWith('.pdf');
}

/// Text stored once per interface language: `{"en": "...", "am": "..."}`
/// (website content and some settings). Reads tolerate double-encoded JSON.
class Localized {
  Localized(this.values);
  final Map<String, String> values;

  static Localized from(dynamic v) {
    if (v is String) {
      final s = v.trim();
      if (s.startsWith('{')) {
        try {
          return from(jsonDecodeSafe(s));
        } catch (_) {}
      }
      return Localized({'en': v});
    }
    final m = asMap(v);
    if (m == null) return Localized({});
    return Localized({
      for (final e in m.entries)
        if (e.value != null) e.key: e.value.toString(),
    });
  }

  /// Current language, else English, else any non-empty value.
  String get text {
    final code = I18n.instance.code;
    final pick = values[code];
    if (pick != null && pick.trim().isNotEmpty) return pick;
    final en = values['en'];
    if (en != null && en.trim().isNotEmpty) return en;
    return values.values.firstWhere((s) => s.trim().isNotEmpty, orElse: () => '');
  }

  Map<String, String> toJson() => {
        for (final l in I18n.languages) l.code: values[l.code] ?? '',
      };
}

/// One row of a website-content collection (testimonials, FAQs, …).
class ContentItem {
  ContentItem(this.raw);
  final Map<String, dynamic> raw;

  String get id => asString(raw['id']) ?? '';
  String get status => asString(raw['status']) ?? 'draft';
  bool get isPublished => status == 'published';
  int get sortOrder => asInt(raw['sortOrder']) ?? 0;
  Localized loc(String field) => Localized.from(raw[field]);
  String? str(String field) => asString(raw[field]);
}

/// Clinic-wide settings (Backend/src/models/Setting.js).
class ClinicSettings {
  ClinicSettings(this.raw);
  final Map<String, dynamic> raw;

  String? str(String k) => asString(raw[k]);
  int? integer(String k) => asInt(raw[k]);
  bool flag(String k) => asBool(raw[k]);
  Localized loc(String k) => Localized.from(raw[k]);
  List<String> get workingDays => asStringList(raw['workingDays']);
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
  String? get expiryDateRaw => asString(raw['expiryDate']);
  String? get barcode => asString(raw['barcode']);
  String? get manufacturer => asString(raw['manufacturer']);
  String? get supplier => asString(raw['supplier']);
  String? get batchNumber => asString(raw['batchNumber']);
  double? get purchasePrice => asDouble(raw['purchasePrice']);
  String? get storageLocation => asString(raw['storageLocation']);
  bool get requiresPrescription => asBool(raw['requiresPrescription'], fallback: true);
  String? get sideEffects => asString(raw['sideEffects']);
  String? get contraindications => asString(raw['contraindications']);
  String? get instructions => asString(raw['instructions']);
  String? get notes => asString(raw['notes']);

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

  String? get notes => asString(raw['notes']);
  Visit? get visit {
    final m = asMap(raw['visit']);
    return m == null ? null : Visit(m);
  }

  PersonRef? get cashier => PersonRef.maybe(raw['cashier'] ?? raw['processedByUser']);

  static String methodLabel(String? m) => switch (m) {
        'cash' => tr('cashier.paymentMethods.cash'),
        'transfer' || 'bank_transfer' => tr('cashier.paymentMethods.bankTransfer'),
        'mobile_money' || 'telebirr' => tr('cashier.paymentMethods.mobileMoney'),
        'other' => tr('cashier.paymentMethods.other'),
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
