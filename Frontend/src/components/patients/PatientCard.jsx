import { useNavigate } from "react-router-dom";
import { FiUser, FiPhone, FiCalendar, FiMapPin } from "react-icons/fi";

const PatientCard = ({ patient, onUpdate }) => {
  const navigate = useNavigate();

  const getInitials = () => {
    return `${patient.firstName?.[0] || ""}${patient.lastName?.[0] || ""}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {getInitials()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">
            {patient.firstName} {patient.middleName} {patient.lastName}
          </h3>
          <p className="text-sm text-gray-500">ID: {patient.patientId}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <FiUser className="w-4 h-4 mr-2" />
          <span>
            {patient.age} years • {patient.gender}
          </span>
        </div>
        <div className="flex items-center text-gray-600">
          <FiPhone className="w-4 h-4 mr-2" />
          <span>{patient.phone}</span>
        </div>
        {patient.city && (
          <div className="flex items-center text-gray-600">
            <FiMapPin className="w-4 h-4 mr-2" />
            <span>{patient.city}</span>
          </div>
        )}
        <div className="flex items-center text-gray-600">
          <FiCalendar className="w-4 h-4 mr-2" />
          <span>
            Registered: {new Date(patient.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-2">
        <button
          onClick={() => navigate(`/portal/patients/${patient.id}`)}
          className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition text-sm font-medium"
        >
          View Details
        </button>
        <button
          onClick={() => navigate(`/portal/visits/new?patientId=${patient.id}`)}
          className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
        >
          New Visit
        </button>
      </div>
    </div>
  );
};

export default PatientCard;
