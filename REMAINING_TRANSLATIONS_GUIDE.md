# Remaining Component Translations Guide

## Components That Need Translation Implementation

The following components have hardcoded English text that needs to be replaced with `t()` translation function calls:

### 1. FollowUpIndicator.jsx

**Location**: `Frontend/src/components/doctor/FollowUpIndicator.jsx`

**Texts to translate**:

- "First Visit - No previous medical history"
- "✓ Scheduled Follow-up Visit"
- "Return Visit"
- "X days since last visit"
- "Last Visit:"
- "Follow-up was scheduled for:"
- "Previous Diagnosis:"
- "Previous Treatment:"
- "Previous Notes:"
- "View Full History"

**Translation keys to add to am/ar JSON**:

```json
"followUpIndicator": {
  "firstVisit": "First Visit - No previous medical history",
  "scheduledFollowUp": "✓ Scheduled Follow-up Visit",
  "returnVisit": "Return Visit",
  "daysSinceLast": "{{days}} days since last visit",
  "lastVisit": "Last Visit:",
  "followUpScheduled": "Follow-up was scheduled for:",
  "previousDiagnosis": "Previous Diagnosis:",
  "previousTreatment": "Previous Treatment:",
  "previousNotes": "Previous Notes:",
  "viewFullHistory": "View Full History"
}
```

### 2. ActivePrescriptions.jsx

**Location**: `Frontend/src/components/doctor/ActivePrescriptions.jsx`

**Texts to translate**:

- "No active prescriptions"
- "Recent Prescriptions (Last 90 days)"
- "Medicine"
- "Prescribed: Jun 19"
- "X days left"
- "Ends today"
- "Expired"
- "Duration:"
- "Instructions:"
- "Reason:"
- "Medication ending soon - consider refill if needed"
- "Medication period has ended"
- "dispensed", "pending", "completed" (status labels)

**Translation keys to add**:

```json
"prescriptions": {
  "noActive": "No active prescriptions",
  "recentTitle": "Recent Prescriptions (Last 90 days)",
  "medicine": "Medicine",
  "prescribed": "Prescribed:",
  "daysLeft": "{{days}} days left",
  "endsToday": "Ends today",
  "expired": "Expired",
  "duration": "Duration:",
  "instructions": "Instructions:",
  "reason": "Reason:",
  "endingSoon": "Medication ending soon - consider refill if needed",
  "periodEnded": "Medication period has ended",
  "status": {
    "pending": "pending",
    "dispensed": "dispensed",
    "completed": "completed",
    "stopped": "stopped"
  }
}
```

### 3. PendingInvestigations.jsx

**Location**: `Frontend/src/components/doctor/PendingInvestigations.jsx`

**Texts to translate**:

- "No recent investigations"
- "Pending Investigations"
- "Recent Results Available"
- "Requested: Jun 19"
- "Scheduled: Jun 20"
- "Completed: Jun 21"
- "Instructions:"
- "STAT - Immediate attention required"
- "Results Ready"
- "Results:"
- "Interpretation:"
- "View Result File"
- "Performed by:"
- Status labels: "requested", "in_progress", "completed", "cancelled"
- Urgency levels: "routine", "urgent", "stat"

**Translation keys to add**:

```json
"investigations": {
  "noRecent": "No recent investigations",
  "pendingTitle": "Pending Investigations",
  "recentResults": "Recent Results Available",
  "requested": "Requested:",
  "scheduled": "Scheduled:",
  "completed": "Completed:",
  "instructions": "Instructions:",
  "statAlert": "STAT - Immediate attention required",
  "resultsReady": "Results Ready",
  "results": "Results:",
  "interpretation": "Interpretation:",
  "viewFile": "View Result File",
  "performedBy": "Performed by:",
  "status": {
    "requested": "requested",
    "in_progress": "in progress",
    "completed": "completed",
    "cancelled": "cancelled"
  },
  "urgency": {
    "routine": "routine",
    "urgent": "urgent",
    "stat": "STAT"
  }
}
```

---

## Quick Fix Instructions

### Step 1: Add Translation Keys to JSON Files

Add the above translation keys to:

1. `Frontend/src/i18n/locales/am/translation.json`
2. `Frontend/src/i18n/locales/ar/translation.json`
3. `Frontend/src/i18n/locales/om/translation.json` (if needed)

### Step 2: Update Components

For each component file, add:

**At the top (imports)**:

```javascript
import { useTranslation } from "react-i18next";
```

**Inside the component function**:

```javascript
const ComponentName = ({ props }) => {
  const { t } = useTranslation();
  // ... rest of code
```

**Replace hardcoded text**:

```javascript
// Before:
<p>No active prescriptions</p>

// After:
<p>{t("prescriptions.noActive")}</p>
```

---

## Amharic Translations

```json
"followUpIndicator": {
  "firstVisit": "የመጀመሪያ ጉብኝት - ቀዳሚ የሕክምና ታሪክ የለም",
  "scheduledFollowUp": "✓ የተያዘ ክትትል ጉብኝት",
  "returnVisit": "ተመላሽ ጉብኝት",
  "daysSinceLast": "{{days}} ቀናት ከመጨረሻው ጉብኝት ጀምሮ",
  "lastVisit": "የመጨረሻው ጉብኝት:",
  "followUpScheduled": "ክትትል የተያዘለት:",
  "previousDiagnosis": "ቀዳሚ ምርመራ:",
  "previousTreatment": "ቀዳሚ ህክምና:",
  "previousNotes": "ቀዳሚ ማስታወሻዎች:",
  "viewFullHistory": "ሙሉ ታሪክ ይመልከቱ"
},
"prescriptions": {
  "noActive": "ንቁ ትዕዛዞች የሉም",
  "recentTitle": "የቅርብ ጊዜ ትዕዛዞች (ባለፉት 90 ቀናት)",
  "medicine": "መድሃኒት",
  "prescribed": "ተታዝዟል:",
  "daysLeft": "{{days}} ቀናት ቀርተዋል",
  "endsToday": "ዛሬ ያበቃል",
  "expired": "ጊዜው አልፎበታል",
  "duration": "ጊዜ:",
  "instructions": "መመሪያዎች:",
  "reason": "ምክንያት:",
  "endingSoon": "መድሃኒት በቅርቡ ያበቃል - ማሻሻያ ካስፈለገ ያስቡበት",
  "periodEnded": "የመድሃኒት ጊዜ አብቅቷል",
  "status": {
    "pending": "በመጠባበቅ ላይ",
    "dispensed": "ተሰጥቷል",
    "completed": "ተጠናቅቋል",
    "stopped": "ቆሟል"
  }
},
"investigations": {
  "noRecent": "የቅርብ ጊዜ ምርመራዎች የሉም",
  "pendingTitle": "በመጠባበቅ ላይ ያሉ ምርመራዎች",
  "recentResults": "የቅርብ ጊዜ ውጤቶች ተገኝተዋል",
  "requested": "ተጠይቋል:",
  "scheduled": "ተይዟል:",
  "completed": "ተጠናቅቋል:",
  "instructions": "መመሪያዎች:",
  "statAlert": "በጣም አስቸኳይ - ወዲያውኑ ትኩረት ያስፈልጋል",
  "resultsReady": "ውጤቶች ዝግጁ ናቸው",
  "results": "ውጤቶች:",
  "interpretation": "ትርጉም:",
  "viewFile": "የውጤት ፋይል ይመልከቱ",
  "performedBy": "ያከናወነው:",
  "status": {
    "requested": "ተጠይቋል",
    "in_progress": "በሂደት ላይ",
    "completed": "ተጠናቅቋል",
    "cancelled": "ተሰርዟል"
  },
  "urgency": {
    "routine": "መደበኛ",
    "urgent": "አስቸኳይ",
    "stat": "በጣም አስቸኳይ"
  }
}
```

## Arabic Translations

```json
"followUpIndicator": {
  "firstVisit": "الزيارة الأولى - لا يوجد تاريخ طبي سابق",
  "scheduledFollowUp": "✓ زيارة متابعة مجدولة",
  "returnVisit": "زيارة عودة",
  "daysSinceLast": "{{days}} يوم منذ آخر زيارة",
  "lastVisit": "آخر زيارة:",
  "followUpScheduled": "تم جدولة المتابعة لـ:",
  "previousDiagnosis": "التشخيص السابق:",
  "previousTreatment": "العلاج السابق:",
  "previousNotes": "ملاحظات سابقة:",
  "viewFullHistory": "عرض السجل الكامل"
},
"prescriptions": {
  "noActive": "لا توجد وصفات نشطة",
  "recentTitle": "الوصفات الأخيرة (آخر 90 يوماً)",
  "medicine": "دواء",
  "prescribed": "موصوف:",
  "daysLeft": "{{days}} يوم متبقي",
  "endsToday": "ينتهي اليوم",
  "expired": "منتهي الصلاحية",
  "duration": "المدة:",
  "instructions": "التعليمات:",
  "reason": "السبب:",
  "endingSoon": "الدواء ينتهي قريباً - فكر في التجديد إذا لزم الأمر",
  "periodEnded": "انتهت فترة الدواء",
  "status": {
    "pending": "معلق",
    "dispensed": "تم الصرف",
    "completed": "مكتمل",
    "stopped": "متوقف"
  }
},
"investigations": {
  "noRecent": "لا توجد فحوصات حديثة",
  "pendingTitle": "الفحوصات المعلقة",
  "recentResults": "النتائج الأخيرة متاحة",
  "requested": "مطلوب:",
  "scheduled": "مجدول:",
  "completed": "مكتمل:",
  "instructions": "التعليمات:",
  "statAlert": "عاجل جداً - يتطلب اهتماماً فورياً",
  "resultsReady": "النتائج جاهزة",
  "results": "النتائج:",
  "interpretation": "التفسير:",
  "viewFile": "عرض ملف النتيجة",
  "performedBy": "تم إجراؤه بواسطة:",
  "status": {
    "requested": "مطلوب",
    "in_progress": "قيد التنفيذ",
    "completed": "مكتمل",
    "cancelled": "ملغي"
  },
  "urgency": {
    "routine": "روتيني",
    "urgent": "عاجل",
    "stat": "عاجل جداً"
  }
}
```

---

## Implementation Priority

1. **HIGH**: FollowUpIndicator - Shows return visit info (very visible)
2. **HIGH**: ActivePrescriptions - Shows medicine info
3. **MEDIUM**: PendingInvestigations - Shows lab results

---

## Testing

After implementing translations:

1. Login as doctor
2. Open patient queue
3. Start a consultation
4. Switch language to Amharic/Arabic
5. Verify all text is translated in:
   - Return Visit indicator
   - Recent Prescriptions section
   - Pending Investigations section
