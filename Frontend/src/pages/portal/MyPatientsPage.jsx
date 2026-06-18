import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2, FiUser, FiPhone, FiMapPin } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import useAuthStore from "../../store/authStore";

const MyPatientsPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  console.log("[MyPatientsPage] Current user:", user);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      console.log("[MyPatientsPage] Fetching patients with:", { consultedBy: user.id, search, page, pageSize: 10 });
      const response = await axiosInstance.get("/patients", {
        params: {
          consultedBy: user.id,
          search: search || undefined,
          page,
          pageSize: 10,
        },
      });
      console.log("[MyPatientsPage] Raw response:", response);
      console.log("[MyPatientsPage] response.data:", response.data);
      console.log("[MyPatientsPage] response.pagination:", response.pagination);

      const data = response.data || [];
      console.log("[MyPatientsPage] Extracted data array:", data);
      setPatients(data);
      const pagination = response.pagination;
      if (pagination) {
        console.log("[MyPatientsPage] Pagination:", pagination);
        setTotalPages(Math.ceil(pagination.totalItems / pagination.pageSize));
      }
    } catch (err) {
      console.error("[MyPatientsPage] Fetch error:", err);
      toast.error("Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPatients();
    }
  }, [page, search, user?.id]);

  const handleDelete = async (patient) => {
    if (
      !confirm(
        `Delete patient ${patient.firstName} ${patient.lastName}? This cannot be undone.`,
      )
    )
      return;

    try {
      await axiosInstance.delete(`/patients/${patient.id}`);
      toast.success("Patient deleted successfully");
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete patient");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Patients</h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, ID, or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12">
          <FiUser className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No patients consulted yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold">
                      {patient.firstName?.[0]}
                      {patient.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {patient.firstName} {patient.middleName && `${patient.middleName} `}{patient.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      #{patient.patientId}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiPhone className="w-3.5 h-3.5" />
                        {patient.phone}
                      </span>
                      {patient.city && (
                        <span className="flex items-center gap-1">
                          <FiMapPin className="w-3.5 h-3.5" />
                          {patient.city}
                        </span>
                      )}
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {patient.gender}
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {patient.age} yrs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/portal/patients/${patient.id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="View patient details"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(patient)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete patient"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default MyPatientsPage;
