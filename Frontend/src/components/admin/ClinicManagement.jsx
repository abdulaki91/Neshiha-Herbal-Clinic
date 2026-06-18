import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ClinicManagement() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
        {t("clinicManagement.title")}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">{t("clinicManagement.doctors")}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t("clinicManagement.doctorsDesc")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">{t("clinicManagement.patients")}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t("clinicManagement.patientsDesc")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">{t("clinicManagement.appointments")}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t("clinicManagement.appointmentsDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
