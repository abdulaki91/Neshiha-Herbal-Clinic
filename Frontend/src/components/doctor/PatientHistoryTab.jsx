import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";

const PatientHistoryTab = ({ patientId }) => {
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
        },
      });
      setHistory(response.data.visits || []);
    } catch (error) {
      toast.error("Failed to fetch patient history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No previous visits found
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
                Visit #{visit.visitNumber}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(visit.visitDate).toLocaleDateString()} •{" "}
                {visit.doctor?.firstName} {visit.doctor?.lastName}
              </p>
            </div>
          </div>
          {visit.diagnosis && (
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
              <p className="text-sm text-gray-600">
                {Array.isArray(visit.diagnosis)
                  ? visit.diagnosis.join(", ")
                  : visit.diagnosis}
              </p>
            </div>
          )}
          {visit.treatmentPlan && (
            <div>
              <p className="text-sm font-medium text-gray-700">Treatment:</p>
              <p className="text-sm text-gray-600">{visit.treatmentPlan}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PatientHistoryTab;
