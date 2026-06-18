import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiPlus, FiClock, FiCheckCircle } from "react-icons/fi";
import axiosInstance from "../../lib/axios";
import VisitForm from "../../components/visits/VisitForm";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const VisitsPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get("patientId");

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!patientIdParam);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchVisits();
  }, [filter]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== "all") params.status = filter;

      const response = await axiosInstance.get("/visits", { params });
      setVisits(response.data.data || response.data || []);
    } catch (error) {
      toast.error(t("visits.toast.loadError"));
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      waiting: "bg-yellow-100 text-yellow-800",
      in_consultation: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const labels = {
      waiting: t("visits.status.waiting"),
      in_consultation: t("visits.status.inConsultation"),
      completed: t("visits.status.completed"),
      cancelled: t("visits.status.cancelled"),
    };
    return labels[status] || status.replace("_", " ");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t("visits.title")}</h1>
          <p className="text-gray-500 mt-1">{t("visits.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition shadow-lg"
        >
          <FiPlus />
          <span>{t("visits.newVisitButton")}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        {["all", "waiting", "in_consultation", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? "bg-emerald-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {status === "all" ? t("common.all") : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Visit List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : visits.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">
                      {visit.patient?.firstName?.[0]}
                      {visit.patient?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {visit.patient?.firstName} {visit.patient?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t("common.visitNumber")}{visit.visitNumber}
                    </p>
                    {visit.chiefComplaint && (
                      <p className="text-sm text-gray-600 mt-2">
                        {visit.chiefComplaint}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}
                  >
                    {getStatusLabel(visit.status)}
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(visit.visitDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">{visit.arrivalTime}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t("visits.empty")}</p>
        </div>
      )}

      {/* Visit Form Modal */}
      {showForm && (
        <VisitForm
          defaultPatientId={patientIdParam}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchVisits();
            toast.success(t("visits.toast.createSuccess"));
          }}
        />
      )}
    </div>
  );
};

export default VisitsPage;
