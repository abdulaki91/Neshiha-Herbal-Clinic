// User Roles
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  STAFF_MANAGER: "staff_manager",
  DATA_CLERK: "data_clerk",
  DOCTOR: "doctor",
  CASHIER: "cashier",
};

// User Status
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
};

// Visit Status
export const VISIT_STATUS = {
  WAITING: "waiting",
  IN_CONSULTATION: "in_consultation",
  PENDING_PAYMENT: "pending_payment",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Gender
export const GENDER = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
};

// Blood Group
export const BLOOD_GROUP = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
};

// Marital Status
export const MARITAL_STATUS = {
  SINGLE: "single",
  MARRIED: "married",
  DIVORCED: "divorced",
  WIDOWED: "widowed",
};

// Medicine Status
export const MEDICINE_STATUS = {
  AVAILABLE: "available",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock",
  EXPIRED: "expired",
};

// Prescription Status
export const PRESCRIPTION_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  DISPENSED: "dispensed",
  COMPLETED: "completed",
  STOPPED: "stopped",
  EXPIRED: "expired",
  REFILLED: "refilled",
};

// Medicine Route
export const MEDICINE_ROUTE = {
  ORAL: "oral",
  INJECTION: "injection",
  TOPICAL: "topical",
  INHALATION: "inhalation",
  SUBLINGUAL: "sublingual",
  RECTAL: "rectal",
  VAGINAL: "vaginal",
  OPHTHALMIC: "ophthalmic",
  OTIC: "otic",
  NASAL: "nasal",
};

// Medicine Frequency
export const MEDICINE_FREQUENCY = {
  ONCE_DAILY: "once_daily",
  TWICE_DAILY: "twice_daily",
  THREE_TIMES_DAILY: "three_times_daily",
  FOUR_TIMES_DAILY: "four_times_daily",
  EVERY_4_HOURS: "every_4_hours",
  EVERY_6_HOURS: "every_6_hours",
  EVERY_8_HOURS: "every_8_hours",
  EVERY_12_HOURS: "every_12_hours",
  AS_NEEDED: "as_needed",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

// Investigation Status
export const INVESTIGATION_STATUS = {
  REQUESTED: "requested",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Lifestyle Choices
export const LIFESTYLE = {
  SMOKING: {
    NEVER: "never",
    FORMER: "former",
    CURRENT: "current",
  },
  ALCOHOL: {
    NEVER: "never",
    OCCASIONAL: "occasional",
    REGULAR: "regular",
  },
};

// Permissions by Role
export const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    "manage_all",
    "create_staff",
    "edit_staff",
    "delete_staff",
    "view_reports",
    "manage_settings",
    "manage_medicines",
    "manage_departments",
    "view_logs",
    "backup_database",
  ],
  [ROLES.STAFF_MANAGER]: [
    "create_doctor",
    "create_data_clerk",
    "create_cashier",
    "edit_staff",
    "deactivate_staff",
    "reset_password",
    "view_staff_list",
  ],
  [ROLES.DATA_CLERK]: [
    "register_patient",
    "edit_patient",
    "upload_patient_photo",
    "search_patient",
    "print_patient_card",
    "create_visit",
    "send_to_doctor",
    "view_patient_history",
  ],
  [ROLES.DOCTOR]: [
    "view_waiting_patients",
    "accept_patient",
    "investigate_patient",
    "write_diagnosis",
    "write_symptoms",
    "write_physical_exam",
    "write_vital_signs",
    "write_lab_request",
    "write_lab_results",
    "write_treatment_plan",
    "write_doctor_notes",
    "prescribe_medicine",
    "dispense_medicine",
    "view_patient_history",
    "view_previous_medicines",
    "view_allergies",
    "view_chronic_diseases",
  ],
  [ROLES.CASHIER]: [
    "view_pending_payments",
    "process_payment",
    "view_payment_history",
    "print_receipt",
  ],
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden - Insufficient permissions",
  NOT_FOUND: "Resource not found",
  BAD_REQUEST: "Bad request",
  VALIDATION_ERROR: "Validation error",
  DUPLICATE_ENTRY: "Duplicate entry",
  SERVER_ERROR: "Internal server error",
  INVALID_CREDENTIALS: "Invalid credentials",
  ACCOUNT_LOCKED: "Account locked due to multiple failed attempts",
  ACCOUNT_INACTIVE: "Account is inactive",
  TOKEN_EXPIRED: "Token expired",
  INVALID_TOKEN: "Invalid token",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  PASSWORD_CHANGED: "Password changed successfully",
  PASSWORD_RESET_EMAIL_SENT: "Password reset email sent",
  PASSWORD_RESET_SUCCESS: "Password reset successful",
};
