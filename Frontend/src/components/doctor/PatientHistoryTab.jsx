import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";

const PatientHistoryTab = ({ patientId }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const fetchHistory = async () => {
    try {
      const response = await axiosInstance.get(`/visits`, {
        params: {
          patientId,
          status: "completed",
          sortBy: "visitDate",
          sortOrder: "DESC",
          pageSize: 100,
        },
      });
      setHistory(response.data?.data || response.data || []);
    } catch {
      toast.error(t("patientHistory.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t("patientHistory.loading")}</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t("patientHistory.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((visit) => (
        <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-800">
                {t("patientHistory.visitNumberPrefix")}{visit.visitNumber}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(visit.visitDate).toLocaleDateString()} •{" "}
                {visit.doctor?.firstName} {visit.doctor?.lastName}
              </p>
            </div>
          </div>
          {visit.diagnosis && (
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700">
                {t("patientHistory.diagnosisLabel")}
              </p>
              <p className="text-sm text-gray-600">
                {Array.isArray(visit.diagnosis)
                  ? visit.diagnosis.join(", ")
                  : visit.diagnosis}
              </p>
            </div>
          )}
          {visit.treatmentPlan && (
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("patientHistory.treatmentLabel")}
              </p>
              <p className="text-sm text-gray-600">{visit.treatmentPlan}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PatientHistoryTab;
