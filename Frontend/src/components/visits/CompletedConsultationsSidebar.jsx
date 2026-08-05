import { useState } from "react";
import { useCompletedConsultations } from "../../hooks/useVisits";
import { usePatientHistory } from "../../hooks/usePatients";
import "./CompletedConsultationsSidebar.css";

const CompletedConsultationsSidebar = ({ onSelectConsultation }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const { data, isLoading, error } = useCompletedConsultations({
    search: searchTerm,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: patientHistory, isLoading: isLoadingHistory } =
    usePatientHistory(selectedPatientId);

  const handleConsultationClick = (consultation) => {
    setSelectedPatientId(consultation.patient.id);
    if (onSelectConsultation) {
      onSelectConsultation(consultation);
    }
  };

  const handleCloseHistory = () => {
    setSelectedPatientId(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString.substring(0, 5); // HH:MM
  };

  const getGenderIcon = (gender) => {
    return gender?.toLowerCase() === "male" ? "👨" : "👩";
  };

  return (
    <div className="completed-consultations-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h3>📋 Completed Consultations</h3>
      </div>

      {/* Search and Filters */}
      <div className="sidebar-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search patient name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="search-input"
          />
        </div>

        <div className="date-filters">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            className="date-input"
            placeholder="From"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            className="date-input"
            placeholder="To"
          />
        </div>

        {(searchTerm || dateRange.startDate || dateRange.endDate) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setDateRange({ startDate: "", endDate: "" });
            }}
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Consultations List */}
      <div className="consultations-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading consultations...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ Error loading consultations</p>
            <span>{error.message}</span>
          </div>
        ) : data?.consultations?.length === 0 ? (
          <div className="empty-state">
            <p>📭 No completed consultations found</p>
            <span>
              {searchTerm || dateRange.startDate || dateRange.endDate
                ? "Try adjusting your filters"
                : "Complete a consultation to see it here"}
            </span>
          </div>
        ) : (
          <>
            <div className="results-count">
              {data?.pagination?.totalItems || 0} consultation(s) found
            </div>
            <ul className="consultation-items">
              {data?.consultations?.map((consultation) => (
                <li
                  key={consultation.id}
                  className={`consultation-item ${
                    selectedPatientId === consultation.patient.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleConsultationClick(consultation)}
                >
                  <div className="consultation-header">
                    <div className="patient-info">
                      <span className="gender-icon">
                        {getGenderIcon(consultation.patient.gender)}
                      </span>
                      <div className="patient-details">
                        <h4 className="patient-name">
                          {consultation.patient.firstName}{" "}
                          {consultation.patient.lastName}
                        </h4>
                        <span className="patient-id">
                          ID: {consultation.patient.patientId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="consultation-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span>{formatDate(consultation.visitDate)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">⏰</span>
                      <span>
                        {formatTime(consultation.consultationStartTime)} -{" "}
                        {formatTime(consultation.consultationEndTime)}
                      </span>
                    </div>
                  </div>

                  {consultation.diagnosis && (
                    <div className="consultation-diagnosis">
                      <strong>Diagnosis:</strong>{" "}
                      <span>
                        {Array.isArray(consultation.diagnosis)
                          ? consultation.diagnosis.join(", ")
                          : consultation.diagnosis}
                      </span>
                    </div>
                  )}

                  <div className="consultation-actions">
                    <button
                      className="view-history-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConsultationClick(consultation);
                      }}
                    >
                      View Full History →
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Patient History Modal */}
      {selectedPatientId && (
        <div className="history-modal-overlay" onClick={handleCloseHistory}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h3>📊 Patient Complete History</h3>
              <button onClick={handleCloseHistory} className="close-btn">
                ✕
              </button>
            </div>

            <div className="history-modal-content">
              {isLoadingHistory ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading patient history...</p>
                </div>
              ) : patientHistory ? (
                <>
                  {/* Patient Info */}
                  <section className="history-section">
                    <h4>👤 Patient Information</h4>
                    <div className="patient-info-grid">
                      <div className="info-item">
                        <strong>Name:</strong> {patientHistory.firstName}{" "}
                        {patientHistory.lastName}
                      </div>
                      <div className="info-item">
                        <strong>Patient ID:</strong> {patientHistory.patientId}
                      </div>
                      <div className="info-item">
                        <strong>Age:</strong> {patientHistory.age} years
                      </div>
                      <div className="info-item">
                        <strong>Gender:</strong> {patientHistory.gender}
                      </div>
                      <div className="info-item">
                        <strong>Phone:</strong> {patientHistory.phone}
                      </div>
                      {patientHistory.knownAllergies?.length > 0 && (
                        <div className="info-item full-width">
                          <strong>⚠️ Allergies:</strong>{" "}
                          <span className="allergies-list">
                            {patientHistory.knownAllergies.join(", ")}
                          </span>
                        </div>
                      )}
                      {patientHistory.chronicDiseases?.length > 0 && (
                        <div className="info-item full-width">
                          <strong>🏥 Chronic Diseases:</strong>{" "}
                          {patientHistory.chronicDiseases.join(", ")}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Visit History */}
                  <section className="history-section">
                    <h4>
                      🩺 Visit History ({patientHistory.visits?.length || 0})
                    </h4>
                    {patientHistory.visits?.length > 0 ? (
                      <div className="visits-timeline">
                        {patientHistory.visits.map((visit) => (
                          <div key={visit.id} className="timeline-item">
                            <div className="timeline-date">
                              {formatDate(visit.visitDate)}
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <strong>
                                  Dr. {visit.doctor?.firstName}{" "}
                                  {visit.doctor?.lastName}
                                </strong>
                                <span
                                  className={`status-badge status-${visit.status}`}
                                >
                                  {visit.status}
                                </span>
                              </div>
                              {visit.symptoms && (
                                <p>
                                  <strong>Symptoms:</strong>{" "}
                                  {Array.isArray(visit.symptoms)
                                    ? visit.symptoms.join(", ")
                                    : visit.symptoms}
                                </p>
                              )}
                              {visit.diagnosis && (
                                <p>
                                  <strong>Diagnosis:</strong>{" "}
                                  {Array.isArray(visit.diagnosis)
                                    ? visit.diagnosis.join(", ")
                                    : visit.diagnosis}
                                </p>
                              )}
                              {visit.treatmentPlan && (
                                <p>
                                  <strong>Treatment:</strong>{" "}
                                  {visit.treatmentPlan}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">No visits recorded</p>
                    )}
                  </section>

                  {/* Prescriptions */}
                  <section className="history-section">
                    <h4>
                      💊 Prescriptions (
                      {patientHistory.prescriptions?.length || 0})
                    </h4>
                    {patientHistory.prescriptions?.length > 0 ? (
                      <ul className="prescription-list">
                        {patientHistory.prescriptions.map((prescription) => (
                          <li
                            key={prescription.id}
                            className="prescription-item"
                          >
                            <div>
                              <strong>
                                {formatDate(prescription.prescribedDate)}
                              </strong>
                            </div>
                            <div>{prescription.medicineName}</div>
                            <div className="prescription-meta">
                              {prescription.dosage} - {prescription.frequency} -{" "}
                              {prescription.duration}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-data">No prescriptions recorded</p>
                    )}
                  </section>

                  {/* Investigations */}
                  <section className="history-section">
                    <h4>
                      🔬 Investigations (
                      {patientHistory.investigations?.length || 0})
                    </h4>
                    {patientHistory.investigations?.length > 0 ? (
                      <ul className="investigation-list">
                        {patientHistory.investigations.map((investigation) => (
                          <li
                            key={investigation.id}
                            className="investigation-item"
                          >
                            <div>
                              <strong>{investigation.testName}</strong>
                            </div>
                            <div>
                              Requested:{" "}
                              {formatDate(investigation.requestedDate)}
                            </div>
                            <span
                              className={`status-badge status-${investigation.status}`}
                            >
                              {investigation.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-data">No investigations recorded</p>
                    )}
                  </section>
                </>
              ) : (
                <p>No history data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedConsultationsSidebar;
