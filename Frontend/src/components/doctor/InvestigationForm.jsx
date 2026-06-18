import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiFileText } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import useAuthStore from "../../store/authStore";

const InvestigationForm = ({ visitId, patientId, onSave }) => {
  const { user } = useAuthStore();
  const [investigations, setInvestigations] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    investigationType: "",
    testName: "",
    instructions: "",
    urgency: "routine",
    scheduledDate: "",
  });

  useEffect(() => {
    fetchInvestigations();
  }, [visitId]);

  const fetchInvestigations = async () => {
    try {
      const response = await axiosInstance.get("/investigations", {
        params: { visitId },
      });
      setInvestigations(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Failed to fetch investigations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestigation = async () => {
    if (!formData.investigationType || !formData.testName) {
      toast.error("Please fill in investigation type and test name");
      return;
    }

    try {
      await axiosInstance.post("/investigations", {
        visitId,
        patientId,
        requestedBy: user.id,
        investigationType: formData.investigationType,
        testName: formData.testName,
        instructions: formData.instructions,
        urgency: formData.urgency,
        scheduledDate: formData.scheduledDate || null,
        requestedDate: new Date().toISOString(),
        status: "requested",
      });

      toast.success("Investigation requested successfully");
      setFormData({
        investigationType: "",
        testName: "",
        instructions: "",
        urgency: "routine",
        scheduledDate: "",
      });
      setShowAddForm(false);
      fetchInvestigations();
      onSave && onSave();
    } catch (error) {
      toast.error("Failed to request investigation");
    }
  };

  const handleDeleteInvestigation = async (id) => {
    if (!confirm("Are you sure you want to cancel this investigation?")) return;

    try {
      await axiosInstance.put(`/investigations/${id}`, {
        status: "cancelled",
      });
      toast.success("Investigation cancelled");
      fetchInvestigations();
    } catch (error) {
      toast.error("Failed to cancel investigation");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return badges[status] || badges.requested;
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      routine: "bg-gray-100 text-gray-800",
      urgent: "bg-orange-100 text-orange-800",
      stat: "bg-red-100 text-red-800",
    };
    return badges[urgency] || badges.routine;
  };

  if (loading) {
    return <div className="text-center py-8">Loading investigations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add Investigation Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <FiPlus />
          <span>Request Investigation</span>
        </button>
      )}

      {/* Add Investigation Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Request Investigation
            </h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          {/* Investigation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investigation Type *
            </label>
            <select
              value={formData.investigationType}
              onChange={(e) =>
                setFormData({ ...formData, investigationType: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">-- Select Type --</option>
              <option value="Blood Test">Blood Test</option>
              <option value="Urine Test">Urine Test</option>
              <option value="Stool Test">Stool Test</option>
              <option value="X-Ray">X-Ray</option>
              <option value="Ultrasound">Ultrasound</option>
              <option value="CT Scan">CT Scan</option>
              <option value="MRI">MRI</option>
              <option value="ECG">ECG (Electrocardiogram)</option>
              <option value="Biopsy">Biopsy</option>
              <option value="Culture">Culture Test</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Test Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Name *
            </label>
            <input
              type="text"
              value={formData.testName}
              onChange={(e) =>
                setFormData({ ...formData, testName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Complete Blood Count, Liver Function Test"
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency
            </label>
            <select
              value={formData.urgency}
              onChange={(e) =>
                setFormData({ ...formData, urgency: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT (Immediate)</option>
            </select>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Any special instructions or preparation notes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddInvestigation}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Request Investigation
            </button>
          </div>
        </div>
      )}

      {/* Investigations List */}
      {investigations.length > 0 ? (
        <div className="space-y-3">
          {investigations.map((investigation) => (
            <div
              key={investigation.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h5 className="font-semibold text-gray-800">
                      {investigation.testName}
                    </h5>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(
                        investigation.status,
                      )}`}
                    >
                      {investigation.status.replace("_", " ")}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getUrgencyBadge(
                        investigation.urgency,
                      )}`}
                    >
                      {investigation.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Type: {investigation.investigationType}
                  </p>
                  {investigation.instructions && (
                    <p className="text-sm text-gray-600 mb-1">
                      Instructions: {investigation.instructions}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                    <span>
                      Requested:{" "}
                      {new Date(
                        investigation.requestedDate,
                      ).toLocaleDateString()}
                    </span>
                    {investigation.scheduledDate && (
                      <span>
                        Scheduled:{" "}
                        {new Date(
                          investigation.scheduledDate,
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {investigation.status === "requested" && (
                  <button
                    onClick={() => handleDeleteInvestigation(investigation.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              {/* Results Section (if completed) */}
              {investigation.status === "completed" &&
                investigation.results && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Results:
                    </p>
                    <p className="text-sm text-gray-600">
                      {investigation.results}
                    </p>
                    {investigation.interpretation && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Interpretation:</span>{" "}
                        {investigation.interpretation}
                      </p>
                    )}
                    {investigation.completedDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Completed:{" "}
                        {new Date(
                          investigation.completedDate,
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No investigations requested yet</p>
        </div>
      )}
    </div>
  );
};

export default InvestigationForm;
