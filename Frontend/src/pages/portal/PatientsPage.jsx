import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiSearch, FiUser } from "react-icons/fi";
import { getSocket } from "../../lib/socket";
import { usePatients, useCreatePatient } from "../../hooks/usePatients";
import PatientForm from "../../components/patients/PatientForm";
import PatientCard from "../../components/patients/PatientCard";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import { useTranslation } from "react-i18next";

const PatientsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = usePatients({ page, pageSize: 10, search });
  const patients = data?.patients || [];
  const pagination = data?.pagination;
  const createPatient = useCreatePatient();

  // Real-time: invalidate on new patient
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const invalidate = () => qc.invalidateQueries({ queryKey: ["patients"] });
    socket.on("patient:registered", invalidate);
    return () => socket.off("patient:registered", invalidate);
  }, [qc]);

  const handlePatientCreated = () => {
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["patients"] });
    toast.success(t("patients.toast.registerSuccess"));
  };

  const canRegister = ["super_admin", "data_clerk", "doctor"].includes(user?.role);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t("patients.title")}</h1>
          <p className="text-gray-500 mt-1">{t("patients.subtitle")}</p>
        </div>
        {canRegister && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition shadow-lg"
          >
            <FiPlus />
            <span>{t("patients.registerButton")}</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t("patients.search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
        </div>
      </div>

      {/* Patient List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : patients.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onUpdate={() => qc.invalidateQueries({ queryKey: ["patients"] })}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {t("common.previous")}
              </button>
              <span className="px-4 py-2 text-gray-600">
                {t("common.pagination.page")} {page} {t("common.pagination.of")} {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {t("common.next")}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <FiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t("patients.empty.title")}</p>
          <p className="text-gray-400 text-sm mt-2">
            {t("patients.empty.subtitle")}
          </p>
        </div>
      )}

      {/* Patient Form Modal */}
      {showForm && (
        <PatientForm
          onClose={() => setShowForm(false)}
          onSuccess={handlePatientCreated}
        />
      )}
    </div>
  );
};

export default PatientsPage;
