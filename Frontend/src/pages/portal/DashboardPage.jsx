import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiCalendar, FiActivity, FiTrendingUp } from "react-icons/fi";
import useAuthStore from "../../store/authStore";
import axiosInstance from "../../lib/axios";

const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const endpoint = {
        super_admin: "/dashboard/admin",
        staff_manager: "/dashboard/admin",
        doctor: "/dashboard/doctor",
        data_clerk: "/dashboard/clerk",
      }[user?.role];

      const response = await axiosInstance.get(endpoint);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Admin Dashboard
  if (user?.role === "super_admin" || user?.role === "staff_manager") {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value={stats?.summary?.totalPatients || 0}
            icon={FiUsers}
            color="emerald"
          />
          <StatCard
            title="Today's Patients"
            value={stats?.summary?.todayPatients || 0}
            icon={FiCalendar}
            color="blue"
          />
          <StatCard
            title="Today's Visits"
            value={stats?.summary?.todayVisits || 0}
            icon={FiActivity}
            color="purple"
          />
          <StatCard
            title="Waiting Now"
            value={stats?.summary?.waitingPatients || 0}
            icon={FiTrendingUp}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <StatRow
                label="Total Doctors"
                value={stats?.summary?.totalDoctors || 0}
              />
              <StatRow
                label="Total Staff"
                value={stats?.summary?.totalStaff || 0}
              />
              <StatRow
                label="Completed Today"
                value={stats?.summary?.completedVisits || 0}
              />
              <StatRow
                label="Low Stock Items"
                value={stats?.summary?.lowStockMedicines || 0}
                color="orange"
              />
              <StatRow
                label="Expired Medicines"
                value={stats?.summary?.expiredMedicines || 0}
                color="red"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Real-time Updates</span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Backup</span>
                <span>2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Doctor Dashboard
  if (user?.role === "doctor") {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Doctor Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="In Queue"
            value={stats?.todayQueue || 0}
            icon={FiUsers}
            color="emerald"
          />
          <StatCard
            title="Completed Today"
            value={stats?.todayCompleted || 0}
            icon={FiActivity}
            color="blue"
          />
          <StatCard
            title="Prescriptions"
            value={stats?.todayPrescriptions || 0}
            icon={FiCalendar}
            color="purple"
          />
          <StatCard
            title="Dispensed"
            value={stats?.todayDispensed || 0}
            icon={FiTrendingUp}
            color="orange"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Waiting Patients
          </h3>
          {stats?.waitingPatients?.length > 0 ? (
            <div className="space-y-3">
              {stats.waitingPatients.map((visit, idx) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-bold">
                        {idx + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {visit.patient?.firstName} {visit.patient?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {visit.patient?.age} years • {visit.patient?.gender}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/portal/queue?visitId=${visit.id}`)
                    }
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    Start Consultation
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No patients waiting
            </p>
          )}
        </div>
      </div>
    );
  }

  // Data Clerk Dashboard
  if (user?.role === "data_clerk") {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Data Clerk Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Registered Today"
            value={stats?.todayRegistrations || 0}
            icon={FiUsers}
            color="emerald"
          />
          <StatCard
            title="Today's Visits"
            value={stats?.todayVisits || 0}
            icon={FiCalendar}
            color="blue"
          />
          <StatCard
            title="Waiting Patients"
            value={stats?.waitingPatients || 0}
            icon={FiActivity}
            color="orange"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Registrations
          </h3>
          {stats?.recentPatients?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {patient.patientId}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(patient.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No recent registrations
            </p>
          )}
        </div>
      </div>
    );
  }

  return <div>Dashboard</div>;
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    emerald: "from-emerald-600 to-teal-600",
    blue: "from-blue-600 to-cyan-600",
    purple: "from-purple-600 to-pink-600",
    orange: "from-orange-600 to-red-600",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} rounded-xl shadow-sm p-6 text-white`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 opacity-80" />
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90">{title}</p>
    </div>
  );
};

const StatRow = ({ label, value, color = "gray" }) => {
  const colors = {
    gray: "text-gray-800",
    orange: "text-orange-600",
    red: "text-red-600",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${colors[color]}`}>{value}</span>
    </div>
  );
};

export default DashboardPage;
