import { useEffect, useState } from "react";
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import axiosInstance from "../../lib/axios";

/**
 * Component to display pending and recent investigation results
 */
const PendingInvestigations = ({ patientId }) => {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestigations();
  }, [patientId]);

  const fetchInvestigations = async () => {
    try {
      // Get investigations from last 90 days
      const response = await axiosInstance.get("/investigations", {
        params: {
          patientId,
          sortBy: "requestedDate",
          sortOrder: "DESC",
          pageSize: 10,
        },
      });

      const allInvestigations =
        response.data?.investigations || response.data || [];

      // Filter for investigations from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const recentInvestigations = allInvestigations.filter((inv) => {
        const requestedDate = new Date(inv.requestedDate);
        return requestedDate >= ninetyDaysAgo;
      });

      setInvestigations(recentInvestigations);
    } catch (error) {
      console.error("Failed to fetch investigations:", error);
      setInvestigations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "requested":
        return <FiClock className="w-4 h-4" />;
      case "in_progress":
        return <FiAlertCircle className="w-4 h-4" />;
      case "completed":
        return <FiCheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <FiX className="w-4 h-4" />;
      default:
        return <FiFileText className="w-4 h-4" />;
    }
  };

  const getUrgencyBadge = (urgency) => {
    const styles = {
      routine: "bg-gray-100 text-gray-700",
      urgent: "bg-orange-100 text-orange-700",
      stat: "bg-red-100 text-red-700",
    };
    return styles[urgency] || styles.routine;
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

  if (investigations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <FiFileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No recent investigations</p>
      </div>
    );
  }

  // Separate pending and completed
  const pending = investigations.filter((inv) =>
    ["requested", "in_progress"].includes(inv.status),
  );
  const completed = investigations.filter((inv) => inv.status === "completed");

  return (
    <div className="space-y-4">
      {/* Pending Investigations */}
      {pending.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-yellow-50">
            <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
              <FiClock className="w-5 h-5 text-yellow-600" />
              <span>Pending Investigations</span>
              <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                {pending.length}
              </span>
            </h4>
          </div>

          <div className="divide-y divide-gray-200">
            {pending.map((investigation) => (
              <div
                key={investigation.id}
                className="p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-semibold text-gray-800">
                        {investigation.testName}
                      </h5>
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(investigation.status)}`}
                      >
                        {getStatusIcon(investigation.status)}
                        <span className="capitalize">
                          {investigation.status.replace("_", " ")}
                        </span>
                      </span>
                      {investigation.urgency !== "routine" && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${getUrgencyBadge(investigation.urgency)}`}
                        >
                          {investigation.urgency}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {investigation.investigationType}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p className="text-gray-500">
                      Requested:{" "}
                      {new Date(investigation.requestedDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                    {investigation.scheduledDate && (
                      <p className="text-blue-600 font-medium">
                        Scheduled:{" "}
                        {new Date(
                          investigation.scheduledDate,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {investigation.instructions && (
                  <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                    <span className="font-medium">Instructions:</span>{" "}
                    {investigation.instructions}
                  </div>
                )}

                {/* Alert for urgent/stat investigations */}
                {investigation.urgency === "stat" && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                    <FiAlertCircle className="inline w-3 h-3 mr-1" />
                    STAT - Immediate attention required
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Investigations */}
      {completed.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
            <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
              <FiCheckCircle className="w-5 h-5 text-green-600" />
              <span>Recent Results Available</span>
              <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                {completed.length}
              </span>
            </h4>
          </div>

          <div className="divide-y divide-gray-200">
            {completed.map((investigation) => (
              <div
                key={investigation.id}
                className="p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-semibold text-gray-800">
                        {investigation.testName}
                      </h5>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FiCheckCircle className="w-3 h-3" />
                        <span>Results Ready</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {investigation.investigationType}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p className="text-gray-500">
                      Completed:{" "}
                      {new Date(investigation.completedDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                {investigation.results && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs font-medium text-green-800 mb-1">
                      Results:
                    </p>
                    <p className="text-sm text-gray-700">
                      {investigation.results}
                    </p>
                  </div>
                )}

                {investigation.interpretation && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs font-medium text-blue-800 mb-1">
                      Interpretation:
                    </p>
                    <p className="text-sm text-gray-700">
                      {investigation.interpretation}
                    </p>
                  </div>
                )}

                {investigation.resultFile && (
                  <div className="mt-2">
                    <a
                      href={investigation.resultFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <FiFileText className="w-3 h-3" />
                      <span>View Result File</span>
                    </a>
                  </div>
                )}

                {investigation.performedBy && (
                  <div className="mt-2 text-xs text-gray-500">
                    Performed by: {investigation.performedBy}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingInvestigations;
