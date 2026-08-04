import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiPackage } from "react-icons/fi";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import MedicineForm from "../../components/medicine/MedicineForm";
import useAuthStore from "../../store/authStore";
import { useTranslation } from "react-i18next";

const MedicinesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/medicines", {
        params: { search },
      });
      setMedicines(response.data.data || response.data || []);
    } catch (error) {
      toast.error(t("medicines.toast.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("medicines.toast.deleteConfirmation"))) return;

    try {
      await axiosInstance.delete(`/medicines/${id}`);
      toast.success(t("medicines.toast.deleteSuccess"));
      fetchMedicines();
    } catch (error) {
      toast.error(t("medicines.toast.deleteError"));
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedMedicine(null);
    fetchMedicines();
  };

  const canManage = ["super_admin", "doctor", "data_clerk"].includes(user?.role);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t("medicines.title")}</h1>
          <p className="text-gray-500 mt-1">{t("medicines.subtitle")}</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setSelectedMedicine(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            <FiPlus />
            <span>{t("medicines.addButton")}</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("medicines.search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && fetchMedicines()}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicines.map((medicine) => (
            <div
              key={medicine.id}
              className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <FiPackage className="w-6 h-6 text-emerald-600" />
                </div>
                {canManage && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedMedicine(medicine);
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(medicine.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {medicine.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t("medicines.card.code")} {medicine.code}
              </p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>{t("medicines.card.category")}</span>
                  <span className="font-medium">{medicine.category || t("common.notAvailable")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("medicines.card.inStock")}</span>
                  <span
                    className={`font-bold ${
                      medicine.availableQuantity <= medicine.minimumStock
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {medicine.availableQuantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("medicines.card.strength")}</span>
                  <span>{medicine.strength || t("common.notAvailable")}</span>
                </div>
              </div>
            </div>
          ))}

          {medicines.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-dashed border-gray-300">
              {t("medicines.empty")}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <MedicineForm
          medicine={selectedMedicine}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default MedicinesPage;
