import { useEffect, useState } from "react";
import { FiCalendar, FiClock, FiFileText } from "react-icons/fi";
import axiosInstance from "../../lib/axios";

/**
 * Component to show if current visit is a follow-up and display previous visit summary
 */
const FollowUpIndicator = ({ patientId, currentVisitDate }) => {
  const [followUpInfo, setFollowUpInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFollowUp();
  }, [patientId]);

  const checkFollowUp = async () => {
    try {
      // Get last completed visit for this patient
      const response = await axiosInstance.get("/visits", {
        params: {
          patientId,
          status: "completed",
          sortBy: "visitDate",
          sortOrder: "DESC",
          pageSize: 1,
        },
      });

      const visits = response.data?.visits || response.data || [];

      if (visits.length > 0) {
        const lastVisit = visits[0];
        const isScheduledFollowUp = lastVisit.followUpDate === currentVisitDate;

        // Calculate days since last visit
        const lastVisitDate = new Date(lastVisit.visitDate);
        const currentDate = new Date(currentVisitDate);
        const daysSinceLastVisit = Math.floor(
          (currentDate - lastVisitDate) / (1000 * 60 * 60 * 24),
        );

        setFollowUpInfo({
          hasHistory: true,
          isScheduledFollowUp,
          lastVisit,
          daysSinceLastVisit,
        });
      } else {
        setFollowUpInfo({ hasHistory: false });
      }
    } catch (error) {
      console.error("Failed to check follow-up:", error);
      setFollowUpInfo({ hasHistory: false });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
      </div>
    );
  }

  if (!followUpInfo?.hasHistory) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <FiFileText className="w-5 h-5 text-blue-600" />
          <p className="text-sm font-medium text-blue-800">
            First Visit - No previous medical history
          </p>
        </div>
      </div>
    );
  }

  const { isScheduledFollowUp, lastVisit, daysSinceLastVisit } = followUpInfo;

  return (
    <div
      className={`border rounded-lg p-4 ${
        isScheduledFollowUp
          ? "bg-green-50 border-green-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FiCalendar
            className={`w-5 h-5 ${
              isScheduledFollowUp ? "text-green-600" : "text-blue-600"
            }`}
          />
          <h4
            className={`font-semibold ${
              isScheduledFollowUp ? "text-green-800" : "text-blue-800"
            }`}
          >
            {isScheduledFollowUp
              ? "✓ Scheduled Follow-up Visit"
              : "Return Visit"}
          </h4>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            daysSinceLastVisit <= 30
              ? "bg-green-100 text-green-800"
              : daysSinceLastVisit <= 90
                ? "bg-yellow-100 text-yellow-800"
                : "bg-orange-100 text-orange-800"
          }`}
        >
          {daysSinceLastVisit} days since last visit
        </span>
      </div>

      {/* Previous Visit Summary */}
      <div
        className={`space-y-2 text-sm ${
          isScheduledFollowUp ? "text-green-700" : "text-blue-700"
        }`}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Last Visit:</p>
            <p>
              {new Date(lastVisit.visitDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {lastVisit.followUpDate && (
            <div>
              <p className="font-medium">Follow-up was scheduled for:</p>
              <p>
                {new Date(lastVisit.followUpDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {lastVisit.diagnosis && (
          <div className="pt-2 border-t border-current border-opacity-20">
            <p className="font-medium">Previous Diagnosis:</p>
            <p className="mt-1">
              {Array.isArray(lastVisit.diagnosis)
                ? lastVisit.diagnosis.join(", ")
                : lastVisit.diagnosis}
            </p>
          </div>
        )}

        {lastVisit.treatmentPlan && (
          <div>
            <p className="font-medium">Previous Treatment:</p>
            <p className="mt-1">{lastVisit.treatmentPlan}</p>
          </div>
        )}

        {lastVisit.doctorNotes && (
          <div>
            <p className="font-medium">Previous Notes:</p>
            <p className="mt-1 italic">"{lastVisit.doctorNotes}"</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-3 border-t border-current border-opacity-20 flex space-x-2">
        <button
          onClick={() => {
            // Navigate to full history
            window.scrollTo({ top: 0, behavior: "smooth" });
            // Trigger history tab click (you'll need to pass this as a prop)
          }}
          className={`text-xs font-medium px-3 py-1 rounded ${
            isScheduledFollowUp
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          } transition`}
        >
          View Full History
        </button>
      </div>
    </div>
  );
};

export default FollowUpIndicator;
