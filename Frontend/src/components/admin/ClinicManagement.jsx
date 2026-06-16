import React, { useState } from "react";

export default function ClinicManagement() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
        Clinic Management
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Doctors</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage doctors here...
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Patients</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage patients here...
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Appointments</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage appointments...
          </p>
        </div>
      </div>
    </div>
  );
}
