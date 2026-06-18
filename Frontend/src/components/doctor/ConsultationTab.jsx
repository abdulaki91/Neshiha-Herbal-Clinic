import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const ConsultationTab = ({ data, onChange }) => {
  const { t } = useTranslation();
  const [newSymptom, setNewSymptom] = useState("");
  const [newDiagnosis, setNewDiagnosis] = useState("");

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      onChange({
        ...data,
        symptoms: [...data.symptoms, newSymptom.trim()],
      });
      setNewSymptom("");
    }
  };

  const handleRemoveSymptom = (index) => {
    onChange({
      ...data,
      symptoms: data.symptoms.filter((_, i) => i !== index),
    });
  };

  const handleAddDiagnosis = () => {
    if (newDiagnosis.trim()) {
      onChange({
        ...data,
        diagnosis: [...data.diagnosis, newDiagnosis.trim()],
      });
      setNewDiagnosis("");
    }
  };

  const handleRemoveDiagnosis = (index) => {
    onChange({
      ...data,
      diagnosis: data.diagnosis.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Chief Complaint */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("consultation.chiefComplaintLabel")}
        </label>
        <textarea
          value={data.chiefComplaint}
          onChange={(e) =>
            onChange({ ...data, chiefComplaint: e.target.value })
          }
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder={t("consultation.chiefComplaintPlaceholder")}
        />
      </div>

      {/* Symptoms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("consultation.symptomsLabel")}
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newSymptom}
            onChange={(e) => setNewSymptom(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddSymptom()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={t("consultation.addSymptomPlaceholder")}
          />
          <button
            onClick={handleAddSymptom}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <FiPlus />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.symptoms.map((symptom, index) => (
            <span
              key={index}
              className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span>{symptom}</span>
              <button
                onClick={() => handleRemoveSymptom(index)}
                className="hover:text-blue-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* History of Present Illness */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("consultation.historyOfPresentIllnessLabel")}
        </label>
        <textarea
          value={data.historyOfPresentIllness}
          onChange={(e) =>
            onChange({ ...data, historyOfPresentIllness: e.target.value })
          }
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder={t("consultation.historyOfPresentIllnessPlaceholder")}
        />
      </div>

      {/* Physical Examination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("consultation.physicalExaminationLabel")}
        </label>
        <textarea
          value={data.physicalExamination}
          onChange={(e) =>
            onChange({ ...data, physicalExamination: e.target.value })
          }
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder={t("consultation.physicalExaminationPlaceholder")}
        />
      </div>

      {/* Diagnosis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("consultation.diagnosisLabel")}
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newDiagnosis}
            onChange={(e) => setNewDiagnosis(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddDiagnosis()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={t("consultation.addDiagnosisPlaceholder")}
          />
          <button
            onClick={handleAddDiagnosis}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <FiPlus />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.diagnosis.map((diag, index) => (
            <span
              key={index}
              className="inline-flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
            >
              <span>{diag}</span>
              <button
                onClick={() => handleRemoveDiagnosis(index)}
                className="hover:text-red-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Treatment Plan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("consultation.treatmentPlanLabel")}
        </label>
        <textarea
          value={data.treatmentPlan}
          onChange={(e) => onChange({ ...data, treatmentPlan: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder={t("consultation.treatmentPlanPlaceholder")}
        />
      </div>

      {/* Doctor Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("consultation.doctorNotesLabel")}
        </label>
        <textarea
          value={data.doctorNotes}
          onChange={(e) => onChange({ ...data, doctorNotes: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder={t("consultation.doctorNotesPlaceholder")}
        />
      </div>

      {/* Follow-up Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("consultation.followUpDateLabel")}
        </label>
        <input
          type="date"
          value={data.followUpDate}
          onChange={(e) => onChange({ ...data, followUpDate: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default ConsultationTab;
