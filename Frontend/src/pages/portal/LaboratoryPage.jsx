import { useEffect, useState } from "react";
import {
  FiFileText,
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiUser,
  FiCalendar,
  FiAlertCircle,
  FiUpload,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import useAuthStore from "../../store/authStore";
import { getSocket } from "../../lib/socket";

const LaboratoryPage = () => {
  const { user } = useAuthStore();
  const [investigations, setInvestigations] = useState([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("requested");
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [resultData, setResultData] = useState({
    results: "",
    interpretation: "",
    performedBy: "",
    notes: "",
  });

  useEffect(() => {
    fetchInvestigations();
  }, [statusFilter]);

  useEffect(() => {
    filterInvestigations();
  }, [searchTerm, investigations]);

  // Real-time: a new test request or a result posted from another session
  // (or another doctor) should show up here without a manual reload
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => fetchInvestigations();
    socket.on("investigation:created", refresh);
    socket.on("investigation:result-added", refresh);
    return () => {
      socket.off("investigation:created", refresh);
      socket.off("investigation:result-added", refresh);
    };
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/investigations", {
        params: {
          status: statusFilter,
          sortBy: "requestedDate",
          sortOrder: "DESC",
          pageSize: 100,
        },
      });

      const data = response.data?.investigations || response.data || [];
      setInvestigations(data);
      setFilteredInvestigations(data);
    } catch (error) {
      console.error("Failed to fetch investigations:", error);
      toast.error("Failed to load investigations");
      setInvestigations([]);
      setFilteredInvestigations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInvestigations = () => {
    if (!searchTerm.trim()) {
      setFilteredInvestigations(investigations);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = investigations.filter((investigation) => {
      const patientName =
        `${investigation.patient?.firstName || ""} ${investigation.patient?.lastName || ""}`.toLowerCase();
      const patientId = investigation.patient?.patientId?.toLowerCase() || "";
      const testName = investigation.testName?.toLowerCase() || "";
      const investigationType =
        investigation.investigationType?.toLowerCase() || "";

      return (
        patientName.includes(term) ||
        patientId.includes(term) ||
        testName.includes(term) ||
        investigationType.includes(term)
      );
    });

    setFilteredInvestigations(filtered);
  };

  const handleEnterResultsClick = (investigation) => {
    setSelectedInvestigation(investigation);
    setResultData({
      results: investigation.results || "",
      interpretation: investigation.interpretation || "",
      performedBy: investigation.performedBy || "",
      notes: investigation.notes || "",
    });
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axiosInstance.put(`/investigations/${id}`, { status });
      toast.success(`Investigation marked as ${status}`);
      fetchInvestigations();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleSubmitResults = async () => {
    if (!selectedInvestigation) return;

    if (!resultData.results.trim()) {
      toast.error("Please enter investigation results");
      return;
    }

    if (!resultData.performedBy.trim()) {
      toast.error("Please enter who performed the investigation");
      return;
    }

    try {
      await axiosInstance.put(`/investigations/${selectedInvestigation.id}`, {
        ...resultData,
        status: "completed",
        completedDate: new Date().toISOString(),
        reviewedBy: user.id,
      });

      toast.success("Investigation results submitted successfully");
      setSelectedInvestigation(null);
      setResultData({
        results: "",
        interpretation: "",
        performedBy: "",
        notes: "",
      });
      fetchInvestigations();
    } catch (error) {
      console.error("Failed to submit results:", error);
      toast.error(error.response?.data?.message || "Failed to submit results");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: "bg-yellow-100 text-yellow-800 border-yellow-300",
      in_progress: "bg-blue-100 text-blue-800 border-blue-300",
      completed: "bg-green-100 text-green-800 border-green-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      routine: "bg-gray-100 text-gray-700",
      urgent: "bg-orange-100 text-orange-700",
      stat: "bg-red-100 text-red-700",
    };
    return colors[urgency] || colors.routine;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Laboratory</h1>
        <p className="text-gray-600 mt-1">
          Manage investigation requests and results
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name, ID, or test..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {["requested", "in_progress", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Investigations List */}
      {filteredInvestigations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-12 text-center">
          <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm
              ? "No investigations found matching your search"
              : `No ${statusFilter.replace("_", " ")} investigations`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInvestigations.map((investigation) => (
            <div
              key={investigation.id}
              className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Patient Info */}
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FiUser className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {investigation.patient?.firstName}{" "}
                          {investigation.patient?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ID: {investigation.patient?.patientId} • Age:{" "}
                          {investigation.patient?.age}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Investigation Details */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-blue-900 text-lg">
                            {investigation.testName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${getUrgencyColor(investigation.urgency)}`}
                          >
                            {investigation.urgency}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 mb-2">
                          {investigation.investigationType}
                        </p>
                        {investigation.instructions && (
                          <div className="text-xs text-blue-800 p-2 bg-blue-100 rounded">
                            <span className="font-medium">Instructions:</span>{" "}
                            {investigation.instructions}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Results if completed */}
                    {investigation.status === "completed" &&
                      investigation.results && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-xs font-medium text-green-800 mb-1">
                            Results:
                          </p>
                          <p className="text-sm text-gray-700">
                            {investigation.results}
                          </p>
                          {investigation.interpretation && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-green-800 mb-1">
                                Interpretation:
                              </p>
                              <p className="text-sm text-gray-700">
                                {investigation.interpretation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Investigation Info */}
                  <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <FiCalendar className="w-4 h-4" />
                      <span>
                        Requested:{" "}
                        {new Date(
                          investigation.requestedDate,
                        ).toLocaleDateString()}
                      </span>
                    </span>
                    {investigation.scheduledDate && (
                      <span className="flex items-center space-x-1">
                        <FiClock className="w-4 h-4" />
                        <span>
                          Scheduled:{" "}
                          {new Date(
                            investigation.scheduledDate,
                          ).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                    {investigation.completedDate && (
                      <span className="flex items-center space-x-1">
                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                        <span>
                          Completed:{" "}
                          {new Date(
                            investigation.completedDate,
                          ).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(investigation.status)}`}
                    >
                      {investigation.status
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </span>
                  </div>

                  {investigation.performedBy && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Performed by:</span>{" "}
                      {investigation.performedBy}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="ml-6 flex flex-col space-y-2">
                  {investigation.status === "requested" && (
                    <>
                      <button
                        onClick={() =>
                          handleUpdateStatus(investigation.id, "in_progress")
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                      >
                        Start Processing
                      </button>
                      <button
                        onClick={() => handleEnterResultsClick(investigation)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 font-medium text-sm"
                      >
                        Enter Results
                      </button>
                    </>
                  )}

                  {investigation.status === "in_progress" && (
                    <button
                      onClick={() => handleEnterResultsClick(investigation)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 font-medium text-sm"
                    >
                      Enter Results
                    </button>
                  )}

                  {investigation.status === "completed" && (
                    <div className="text-center">
                      <FiCheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" />
                      <p className="text-sm text-green-600 font-medium">
                        Completed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Entry Modal */}
      {selectedInvestigation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                Enter Investigation Results
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedInvestigation.patient?.firstName}{" "}
                {selectedInvestigation.patient?.lastName} •{" "}
                {selectedInvestigation.testName}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Investigation Details Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Investigation Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Type</p>
                    <p className="font-medium">
                      {selectedInvestigation.investigationType}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Test Name</p>
                    <p className="font-medium">
                      {selectedInvestigation.testName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Urgency</p>
                    <p className="font-medium uppercase">
                      {selectedInvestigation.urgency}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Requested Date</p>
                    <p className="font-medium">
                      {new Date(
                        selectedInvestigation.requestedDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {selectedInvestigation.instructions && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <span className="font-medium text-blue-800">
                      Instructions:
                    </span>{" "}
                    <span className="text-blue-900">
                      {selectedInvestigation.instructions}
                    </span>
                  </div>
                )}
              </div>

              {/* Results Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investigation Results *
                </label>
                <textarea
                  value={resultData.results}
                  onChange={(e) =>
                    setResultData({ ...resultData, results: e.target.value })
                  }
                  rows={6}
                  placeholder="Enter detailed test results, measurements, observations..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinical Interpretation
                </label>
                <textarea
                  value={resultData.interpretation}
                  onChange={(e) =>
                    setResultData({
                      ...resultData,
                      interpretation: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Doctor's interpretation of results (optional)..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performed By *
                </label>
                <input
                  type="text"
                  value={resultData.performedBy}
                  onChange={(e) =>
                    setResultData({
                      ...resultData,
                      performedBy: e.target.value,
                    })
                  }
                  placeholder="Lab technician or radiologist name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={resultData.notes}
                  onChange={(e) =>
                    setResultData({ ...resultData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Any additional notes or comments..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedInvestigation(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResults}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 font-medium"
              >
                Submit Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaboratoryPage;
