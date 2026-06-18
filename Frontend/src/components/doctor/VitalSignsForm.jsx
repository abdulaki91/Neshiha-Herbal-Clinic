import { useState, useEffect } from "react";
import { FiSave, FiActivity } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { useTranslation } from "react-i18next";

const VitalSignsForm = ({ visitId, onSave }) => {
  const { t } = useTranslation();
  const [vitals, setVitals] = useState({
    temperature: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
  });
  const [bmi, setBmi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVitals();
  }, [visitId]);

  useEffect(() => {
    // Calculate BMI when weight and height change
    if (vitals.weight && vitals.height) {
      const heightInMeters = parseFloat(vitals.height) / 100;
      const weightInKg = parseFloat(vitals.weight);
      const calculatedBmi = (
        weightInKg /
        (heightInMeters * heightInMeters)
      ).toFixed(2);
      setBmi(calculatedBmi);
    } else {
      setBmi(null);
    }
  }, [vitals.weight, vitals.height]);

  const fetchVitals = async () => {
    try {
      const response = await axiosInstance.get(`/visits/${visitId}`);
      const visit = response.data;

      setVitals({
        temperature: visit.temperature || "",
        bloodPressureSystolic: visit.bloodPressureSystolic || "",
        bloodPressureDiastolic: visit.bloodPressureDiastolic || "",
        heartRate: visit.heartRate || "",
        respiratoryRate: visit.respiratoryRate || "",
        oxygenSaturation: visit.oxygenSaturation || "",
        weight: visit.weight || "",
        height: visit.height || "",
      });
    } catch (error) {
      console.error("Failed to fetch vitals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVitals = async () => {
    try {
      const vitalData = {
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
        bloodPressureSystolic: vitals.bloodPressureSystolic
          ? parseInt(vitals.bloodPressureSystolic)
          : null,
        bloodPressureDiastolic: vitals.bloodPressureDiastolic
          ? parseInt(vitals.bloodPressureDiastolic)
          : null,
        heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : null,
        respiratoryRate: vitals.respiratoryRate
          ? parseInt(vitals.respiratoryRate)
          : null,
        oxygenSaturation: vitals.oxygenSaturation
          ? parseFloat(vitals.oxygenSaturation)
          : null,
        weight: vitals.weight ? parseFloat(vitals.weight) : null,
        height: vitals.height ? parseFloat(vitals.height) : null,
        bmi: bmi ? parseFloat(bmi) : null,
      };

      await axiosInstance.put(`/visits/${visitId}`, vitalData);
      toast.success(t("vitalSigns.saveSuccess"));
      onSave && onSave();
    } catch (error) {
      toast.error(t("vitalSigns.saveError"));
    }
  };

  const getBmiCategory = (bmiValue) => {
    if (!bmiValue) return "";
    const bmi = parseFloat(bmiValue);
    if (bmi < 18.5) return t("bmi.category.underweight");
    if (bmi < 25) return t("bmi.category.normal");
    if (bmi < 30) return t("bmi.category.overweight");
    return t("bmi.category.obese");
  };

  const getBmiColor = (bmiValue) => {
    if (!bmiValue) return "text-gray-600";
    const bmi = parseFloat(bmiValue);
    if (bmi < 18.5) return "text-blue-600";
    if (bmi < 25) return "text-green-600";
    if (bmi < 30) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return <div className="text-center py-8">{t("vitalSigns.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <FiActivity className="text-emerald-600" />
          <span>{t("vitalSigns.title")}</span>
        </h4>
        <button
          onClick={handleSaveVitals}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <FiSave />
          <span>{t("vitalSigns.saveButton")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("vitalSigns.temperatureLabel")}
          </label>
          <input
            type="number"
            step="0.1"
            value={vitals.temperature}
            onChange={(e) =>
              setVitals({ ...vitals, temperature: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={t("vitalSigns.temperaturePlaceholder")}
          />
          <p className="mt-1 text-xs text-gray-500">{t("vitalSigns.temperatureNormal")}</p>
        </div>

        {/* Blood Pressure */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("vitalSigns.bloodPressureLabel")}
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={vitals.bloodPressureSystolic}
              onChange={(e) =>
                setVitals({ ...vitals, bloodPressureSystolic: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={t("vitalSigns.systolicPlaceholder")}
            />
            <span className="flex items-center text-gray-500">/</span>
            <input
              type="number"
              value={vitals.bloodPressureDiastolic}
              onChange={(e) =>
                setVitals({
                  ...vitals,
                  bloodPressureDiastolic: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={t("vitalSigns.diastolicPlaceholder")}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">{t("vitalSigns.bloodPressureNormal")}</p>
        </div>

        {/* Heart Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("vitalSigns.heartRateLabel")}
          </label>
          <input
            type="number"
            value={vitals.heartRate}
            onChange={(e) =>
              setVitals({ ...vitals, heartRate: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={t("vitalSigns.heartRatePlaceholder")}
          />
          <p className="mt-1 text-xs text-gray-500">{t("vitalSigns.heartRateNormal")}</p>
        </div>

        {/* Respiratory Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("vitalSigns.respiratoryRateLabel")}
          </label>
          <input
            type="number"
            value={vitals.respiratoryRate}
            onChange={(e) =>
              setVitals({ ...vitals, respiratoryRate: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={t("vitalSigns.respiratoryRatePlaceholder")}
          />
          <p className="mt-1 text-xs text-gray-500">{t("vitalSigns.respiratoryRateNormal")}</p>
        </div>

        {/* Oxygen Saturation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("vitalSigns.oxygenSaturationLabel")}
          </label>
          <input
            type="number"
            step="0.1"
            value={vitals.oxygenSaturation}
            onChange={(e) =>
              setVitals({ ...vitals, oxygenSaturation: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={t("vitalSigns.oxygenSaturationPlaceholder")}
          />
          <p className="mt-1 text-xs text-gray-500">{t("vitalSigns.oxygenSaturationNormal")}</p>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("vitalSigns.weightLabel")}
          </label>
          <input
            type="number"
            step="0.1"
            value={vitals.weight}
            onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={t("vitalSigns.weightPlaceholder")}
          />
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("vitalSigns.heightLabel")}
          </label>
          <input
            type="number"
            step="0.1"
            value={vitals.height}
            onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={t("vitalSigns.heightPlaceholder")}
          />
        </div>

        {/* BMI Display */}
        {bmi && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("vitalSigns.bmiLabel")}
            </label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
              <p className={`text-2xl font-bold ${getBmiColor(bmi)}`}>{bmi}</p>
              <p className="text-sm text-gray-600 mt-1">
                {t("vitalSigns.categoryPrefix")}{getBmiCategory(bmi)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reference Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-900 mb-2">
          {t("vitalSigns.reference.title")}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
          <div>{t("vitalSigns.reference.temperature")}</div>
          <div>{t("vitalSigns.reference.bloodPressure")}</div>
          <div>{t("vitalSigns.reference.heartRate")}</div>
          <div>{t("vitalSigns.reference.respiratoryRate")}</div>
          <div>{t("vitalSigns.reference.oxygenSaturation")}</div>
          <div>{t("vitalSigns.reference.bmi")}</div>
        </div>
      </div>
    </div>
  );
};

export default VitalSignsForm;
