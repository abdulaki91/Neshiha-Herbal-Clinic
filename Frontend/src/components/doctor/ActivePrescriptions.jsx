import { useEffect, useState } from "react";
import {
  FiPackage,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import axiosInstance from "../../lib/axios";

/**
 * Component to display active/recent prescriptions for a patient
 */
const ActivePrescriptions = ({ patientId }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePrescriptions();
  }, [patientId]);

  const fetchActivePrescriptions = async () => {
    try {
      // Get prescriptions from last 90 days
      const response = await axiosInstance.get("/prescriptions", {
        params: {
          patientId,
          sortBy: "prescribedDate",
          sortOrder: "DESC",
          pageSize: 10,
        },
      });

      const allPrescriptions =
        response.data?.data || response.data || [];

      // Filter for prescriptions from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const recentPrescriptions = allPrescriptions.filter((rx) => {
        const prescribedDate = new Date(rx.prescribedDate);
        return prescribedDate >= ninetyDaysAgo;
      });

      setPrescriptions(recentPrescriptions);
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      dispensed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      stopped: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock className="w-4 h-4" />;
      case "dispensed":
      case "completed":
        return <FiCheckCircle className="w-4 h-4" />;
      case "stopped":
      case "expired":
        return <FiAlertCircle className="w-4 h-4" />;
      default:
        return <FiPackage className="w-4 h-4" />;
    }
  };

  const calculateDaysRemaining = (prescribedDate, duration) => {
    if (!duration) return null;

    // Extract number of days from duration string (e.g., "7 days", "2 weeks")
    const match = duration.match(/(\d+)\s*(day|week|month)/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    let durationDays = value;
    if (unit.startsWith("week")) durationDays = value * 7;
    if (unit.startsWith("month")) durationDays = value * 30;

    const prescribed = new Date(prescribedDate);
    const endDate = new Date(prescribed);
    endDate.setDate(endDate.getDate() + durationDays);

    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    return daysRemaining;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <FiPackage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No active prescriptions</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
          <FiPackage className="w-5 h-5" />
          <span>Recent Prescriptions (Last 90 days)</span>
        </h4>
      </div>

      <div className="divide-y divide-gray-200">
        {prescriptions.map((prescription) => {
          const daysRemaining = calculateDaysRemaining(
            prescription.prescribedDate,
            prescription.duration,
          );

          return (
            <div
              key={prescription.id}
              className="p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-semibold text-gray-800">
                      {prescription.medicine?.name || "Medicine"}
                    </h5>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}
                    >
                      {getStatusIcon(prescription.status)}
                      <span className="capitalize">{prescription.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {prescription.dosage} • {prescription.frequency} •{" "}
                    {prescription.route}
                  </p>
                </div>

                <div className="text-right text-sm">
                  <p className="text-gray-500">
                    Prescribed:{" "}
                    {new Date(prescription.prescribedDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </p>
                  {daysRemaining !== null && (
                    <p
                      className={`font-medium ${
                        daysRemaining > 0
                          ? daysRemaining <= 3
                            ? "text-orange-600"
                            : "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {daysRemaining > 0
                        ? `${daysRemaining} days left`
                        : daysRemaining === 0
                          ? "Ends today"
                          : "Expired"}
                    </p>
                  )}
                </div>
              </div>

              {prescription.duration && (
                <div className="text-xs text-gray-600 mb-1">
                  <span className="font-medium">Duration:</span>{" "}
                  {prescription.duration}
                </div>
              )}

              {prescription.instructions && (
                <div className="text-xs text-gray-600 mb-1">
                  <span className="font-medium">Instructions:</span>{" "}
                  {prescription.instructions}
                </div>
              )}

              {prescription.reason && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Reason:</span>{" "}
                  {prescription.reason}
                </div>
              )}

              {/* Alert for medications ending soon or expired */}
              {daysRemaining !== null &&
                daysRemaining <= 3 &&
                daysRemaining > 0 && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                    <FiAlertCircle className="inline w-3 h-3 mr-1" />
                    Medication ending soon - consider refill if needed
                  </div>
                )}

              {daysRemaining !== null && daysRemaining < 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                  <FiAlertCircle className="inline w-3 h-3 mr-1" />
                  Medication period has ended
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivePrescriptions;
