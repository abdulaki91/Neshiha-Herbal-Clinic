// Push notification text in the four interface languages.
// GENERATED from Frontend/src/i18n/locales/*/translation.json and
// nesiha_herbal_mobile_app/assets/i18n/mobile/*.json so pushes use exactly
// the same wording as the web toasts and the app's in-app alerts.
// Keys and {{placeholders}} mirror those files.
export const PUSH_MESSAGES = {
  "en": {
    "title": "Neshiha Clinic",
    "newPatientInQueue": "New patient in queue",
    "billPending": "New bill waiting for payment: {{name}}",
    "paymentReceived": "Payment received: {{amount}} ETB",
    "registrationFee": "Registration fee received: {{amount}} ETB",
    "lowStock": "Low stock: {{name}}",
    "investigationRequested": "New investigation requested: {{test}}",
    "investigationResult": "Results ready: {{test}}",
    "bookingRequest": "New booking request from {{name}}",
    "patientRegistered": "New patient registered: {{firstName}} {{lastName}}",
    "staffCreated": "New staff member added"
  },
  "om": {
    "title": "Kliinika Nesihaa",
    "newPatientInQueue": "Dhukkubstaa haaraa tarree keessatti",
    "billPending": "Kaffaltii haaraa eeggachaa jira: {{name}}",
    "paymentReceived": "Kaffaltii fudhatame: {{amount}} ETB",
    "registrationFee": "Kaffaltiin galmee fudhatame: {{amount}} ETB",
    "lowStock": "Kuusaa xiqqaa: {{name}}",
    "investigationRequested": "Qo'annoon haaraa gaafatame: {{test}}",
    "investigationResult": "Bu'aan qophaa'eera: {{test}}",
    "bookingRequest": "Gaaffiin beellamaa haaraa {{name}} irraa",
    "patientRegistered": "Dhukkubstaa haaraa galmeessame: {{firstName}} {{lastName}}",
    "staffCreated": "Hojjetaan haaraan dabalameera"
  },
  "am": {
    "title": "ነስሃ ክሊኒክ",
    "newPatientInQueue": "አዲስ ታካሚ በወረፋ ውስጥ",
    "billPending": "ለክፍያ የሚጠብቅ አዲስ ሂሳብ: {{name}}",
    "paymentReceived": "ክፍያ ተቀብሏል: {{amount}} ብር",
    "registrationFee": "የምዝገባ ክፍያ ተቀብሏል: {{amount}} ብር",
    "lowStock": "ዝቅተኛ ክምችት: {{name}}",
    "investigationRequested": "አዲስ ምርመራ ተጠይቋል: {{test}}",
    "investigationResult": "ውጤት ዝግጁ ነው: {{test}}",
    "bookingRequest": "አዲስ የቀጠሮ ጥያቄ ከ{{name}}",
    "patientRegistered": "አዲስ ታካሚ ተመዝግቧል: {{firstName}} {{lastName}}",
    "staffCreated": "አዲስ ሰራተኛ ታክሏል"
  },
  "ar": {
    "title": "عيادة نصيحة",
    "newPatientInQueue": "مريض جديد في قائمة الانتظار",
    "billPending": "فاتورة جديدة بانتظار الدفع: {{name}}",
    "paymentReceived": "تم استلام الدفع: {{amount}} بر إثيوبي",
    "registrationFee": "تم استلام رسوم التسجيل: {{amount}} بر إثيوبي",
    "lowStock": "مخزون منخفض: {{name}}",
    "investigationRequested": "طلب فحص جديد: {{test}}",
    "investigationResult": "النتائج جاهزة: {{test}}",
    "bookingRequest": "طلب حجز جديد من {{name}}",
    "patientRegistered": "تم تسجيل مريض جديد: {{firstName}} {{lastName}}",
    "staffCreated": "تمت إضافة موظف جديد"
  }
};

export const translatePush = (language, key, params = {}) => {
  const table = PUSH_MESSAGES[language] || PUSH_MESSAGES.en;
  const template = table[key] ?? PUSH_MESSAGES.en[key] ?? key;
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, name) => params[name] ?? "");
};
