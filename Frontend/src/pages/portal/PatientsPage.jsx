import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiUser } from "react-icons/fi";
import axiosInstance from "../../lib/axios";
import PatientForm from "../../components/patients/PatientForm";
import PatientCard from "../../components/patients/PatientCard";
import toast from "react-hot-toast";

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, [page, search]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/patients", {
        params: { page, pageSize: 10, search },
      });
      setPatients(response.data.patients || response.data || []);
      setPagination(response.data.pagination || null);
    } catch (error) {
      toast.error("Failed to load patients");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientCreated = () => {
    setShowForm(false);
    fetchPatients();
    toast.success("Patient registered successfully!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
          <p className="text-gray-500 mt-1">Manage patient records</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition shadow-lg"
        >
          <FiPlus />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search patients by name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
        </div>
      </div>

      {/* Patient List */}
      {loading ? (
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
                onUpdate={fetchPatients}
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
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <FiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No patients found</p>
          <p className="text-gray-400 text-sm mt-2">
            Register your first patient to get started
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
