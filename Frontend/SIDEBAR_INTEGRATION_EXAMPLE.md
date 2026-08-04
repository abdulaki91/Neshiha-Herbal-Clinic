# Sidebar Integration Example

## Complete Doctor Portal with Completed Consultations Sidebar

Here's a complete example of integrating the Completed Consultations Sidebar into your doctor portal:

## Full Example Component

```jsx
// DoctorPortal.jsx
import { useState } from "react";
import { useQueue, useVisit, useUpdateVisit } from "../hooks/useVisits";
import CompletedConsultationsSidebar from "../components/visits/CompletedConsultationsSidebar";
import VisitAttachmentUpload from "../components/visits/VisitAttachmentUpload";
import "./DoctorPortal.css";

const DoctorPortal = () => {
  const [activeTab, setActiveTab] = useState("queue"); // 'queue' or 'history'
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const { data: queue, isLoading: queueLoading } = useQueue();
  const { data: currentVisit } = useVisit(selectedVisit);
  const updateVisitMutation = useUpdateVisit();

  const handleSelectFromQueue = (visit) => {
    setSelectedVisit(visit.id);
    setActiveTab("queue");
  };

  const handleSelectFromHistory = (consultation) => {
    setSelectedConsultation(consultation);
    // Optionally load into main view
    console.log("Selected consultation:", consultation);
  };

  const handleCompleteConsultation = async () => {
    if (!currentVisit) return;

    try {
      await updateVisitMutation.mutateAsync({
        id: currentVisit.id,
        status: "completed",
      });
      setSelectedVisit(null);
      alert("Consultation completed successfully!");
    } catch (error) {
      alert("Failed to complete consultation: " + error.message);
    }
  };

  return (
    <div className="doctor-portal">
      {/* Main Navigation */}
      <nav className="portal-nav">
        <button
          className={activeTab === "queue" ? "active" : ""}
          onClick={() => setActiveTab("queue")}
        >
          📋 Today's Queue
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          📚 Consultation History
        </button>
      </nav>

      <div className="portal-content">
        {/* Left Sidebar */}
        <aside className="portal-sidebar">
          {activeTab === "queue" ? (
            /* Queue List */
            <div className="queue-sidebar">
              <h3>Today's Queue ({queue?.length || 0})</h3>
              {queueLoading ? (
                <p>Loading queue...</p>
              ) : queue?.length === 0 ? (
                <p>No patients in queue</p>
              ) : (
                <ul className="queue-list">
                  {queue?.map((visit) => (
                    <li
                      key={visit.id}
                      className={selectedVisit === visit.id ? "active" : ""}
                      onClick={() => handleSelectFromQueue(visit)}
                    >
                      <div className="queue-item">
                        <h4>
                          {visit.patient.firstName} {visit.patient.lastName}
                        </h4>
                        <p>ID: {visit.patient.patientId}</p>
                        <span className={`status-badge status-${visit.status}`}>
                          {visit.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            /* Completed Consultations Sidebar */
            <CompletedConsultationsSidebar
              onSelectConsultation={handleSelectFromHistory}
            />
          )}
        </aside>

        {/* Main Content Area */}
        <main className="portal-main">
          {activeTab === "queue" ? (
            currentVisit ? (
              /* Consultation View */
              <div className="consultation-view">
                <div className="consultation-header">
                  <h2>
                    Consultation: {currentVisit.patient.firstName}{" "}
                    {currentVisit.patient.lastName}
                  </h2>
                  <button
                    onClick={handleCompleteConsultation}
                    className="complete-btn"
                    disabled={updateVisitMutation.isLoading}
                  >
                    ✓ Complete Consultation
                  </button>
                </div>

                {/* Patient Info Card */}
                <section className="patient-info-card">
                  <h3>Patient Information</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Age:</strong> {currentVisit.patient.age}
                    </div>
                    <div>
                      <strong>Gender:</strong> {currentVisit.patient.gender}
                    </div>
                    <div>
                      <strong>Blood Group:</strong>{" "}
                      {currentVisit.patient.bloodGroup || "N/A"}
                    </div>
                    <div>
                      <strong>Phone:</strong> {currentVisit.patient.phone}
                    </div>
                    {currentVisit.patient.knownAllergies?.length > 0 && (
                      <div className="full-width alert">
                        <strong>⚠️ Allergies:</strong>{" "}
                        {currentVisit.patient.knownAllergies.join(", ")}
                      </div>
                    )}
                  </div>
                </section>

                {/* Vital Signs */}
                <section className="vital-signs-section">
                  <h3>Vital Signs</h3>
                  <div className="vitals-grid">
                    <div>
                      <label>Blood Pressure:</label>
                      <input type="text" placeholder="120/80" />
                    </div>
                    <div>
                      <label>Temperature (°C):</label>
                      <input type="number" placeholder="37.0" />
                    </div>
                    <div>
                      <label>Heart Rate:</label>
                      <input type="number" placeholder="72" />
                    </div>
                    <div>
                      <label>Weight (kg):</label>
                      <input type="number" placeholder="70" />
                    </div>
                  </div>
                </section>

                {/* Diagnosis */}
                <section className="diagnosis-section">
                  <h3>Diagnosis & Notes</h3>
                  <textarea
                    placeholder="Enter diagnosis and notes..."
                    rows="5"
                  ></textarea>
                </section>

                {/* Attachments */}
                <section className="attachments-section">
                  <VisitAttachmentUpload
                    visitId={currentVisit.id}
                    patientId={currentVisit.patient.id}
                  />
                </section>

                {/* Prescription */}
                <section className="prescription-section">
                  <h3>Prescription</h3>
                  <button className="add-medicine-btn">+ Add Medicine</button>
                  {/* Prescription form would go here */}
                </section>
              </div>
            ) : (
              /* No Visit Selected */
              <div className="no-selection">
                <h2>Select a patient from the queue</h2>
                <p>Choose a patient to start or continue consultation</p>
              </div>
            )
          ) : (
            /* History View */
            <div className="history-view">
              {selectedConsultation ? (
                <div className="consultation-detail">
                  <h2>
                    Consultation Details -{" "}
                    {selectedConsultation.patient.firstName}{" "}
                    {selectedConsultation.patient.lastName}
                  </h2>
                  <p>
                    Date:{" "}
                    {new Date(
                      selectedConsultation.visitDate,
                    ).toLocaleDateString()}
                  </p>
                  <p>Diagnosis: {selectedConsultation.diagnosis}</p>
                  {/* More details */}
                </div>
              ) : (
                <div className="no-selection">
                  <h2>Select a consultation from history</h2>
                  <p>View complete patient records and consultation details</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorPortal;
```

## Styling (DoctorPortal.css)

```css
/* DoctorPortal.css */
.doctor-portal {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* Navigation */
.portal-nav {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: white;
  border-bottom: 2px solid #e0e0e0;
}

.portal-nav button {
  padding: 12px 24px;
  border: none;
  background: #f0f0f0;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.portal-nav button:hover {
  background: #e0e0e0;
}

.portal-nav button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

/* Content Layout */
.portal-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.portal-sidebar {
  width: 400px;
  background: white;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
}

.queue-sidebar {
  padding: 20px;
}

.queue-sidebar h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.queue-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.queue-list li {
  cursor: pointer;
  margin-bottom: 12px;
}

.queue-item {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.queue-list li:hover .queue-item {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.queue-list li.active .queue-item {
  border-color: #667eea;
  background: #f0f3ff;
}

.queue-item h4 {
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.queue-item p {
  margin: 0;
  font-size: 0.9rem;
  color: #7f8c8d;
}

/* Main Content */
.portal-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #95a5a6;
  text-align: center;
}

.no-selection h2 {
  color: #2c3e50;
  margin-bottom: 8px;
}

/* Consultation View */
.consultation-view {
  max-width: 1200px;
  margin: 0 auto;
}

.consultation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}

.consultation-header h2 {
  margin: 0;
  color: #2c3e50;
}

.complete-btn {
  padding: 12px 24px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.complete-btn:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.complete-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

/* Sections */
section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.info-grid,
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-grid div,
.vitals-grid div {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-grid div.full-width {
  grid-column: span 2;
}

.info-grid div.alert {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  color: #856404;
}

.vitals-grid label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #495057;
}

.vitals-grid input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.vitals-grid input:focus {
  outline: none;
  border-color: #667eea;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: #667eea;
}

.add-medicine-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.add-medicine-btn:hover {
  background: #2980b9;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 8px;
}

.status-waiting {
  background: #fff3cd;
  color: #856404;
}

.status-in_consultation {
  background: #d1ecf1;
  color: #0c5460;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

/* Responsive */
@media (max-width: 1024px) {
  .portal-sidebar {
    width: 320px;
  }

  .info-grid,
  .vitals-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .portal-content {
    flex-direction: column;
  }

  .portal-sidebar {
    width: 100%;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .consultation-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .complete-btn {
    width: 100%;
  }
}
```

## Simple Two-Column Layout Example

If you prefer a simpler layout:

```jsx
// SimpleDoctorPortal.jsx
import CompletedConsultationsSidebar from "../components/visits/CompletedConsultationsSidebar";

const SimpleDoctorPortal = () => {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left: Completed Consultations */}
      <div style={{ width: "400px", overflowY: "auto", background: "#fff" }}>
        <CompletedConsultationsSidebar />
      </div>

      {/* Right: Main Content */}
      <div style={{ flex: 1, padding: "24px", background: "#f5f7fa" }}>
        <h1>Doctor Dashboard</h1>
        {/* Your main content here */}
      </div>
    </div>
  );
};

export default SimpleDoctorPortal;
```

## With React Router

```jsx
import { Routes, Route } from "react-router-dom";
import CompletedConsultationsSidebar from "../components/visits/CompletedConsultationsSidebar";

const DoctorPortalWithRoutes = () => {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar - Always visible */}
      <aside style={{ width: "400px" }}>
        <CompletedConsultationsSidebar />
      </aside>

      {/* Main content - Routes */}
      <main style={{ flex: 1, padding: "24px" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/queue" element={<QueueView />} />
          <Route path="/consultation/:id" element={<ConsultationView />} />
          <Route path="/history/:patientId" element={<PatientHistory />} />
        </Routes>
      </main>
    </div>
  );
};
```

## Tips

1. **Fixed vs. Flexible Width**: Use `width: 400px` for fixed or `flex: 0 0 400px` for better flex control
2. **Scroll Container**: Always wrap in a container with `overflow-y: auto` and defined height
3. **Mobile**: Consider hiding sidebar on mobile or making it a modal
4. **State Management**: Use Context or Redux if you need to share selected consultation across components
5. **Performance**: The sidebar uses React Query caching, so it won't refetch unnecessarily

## Next Steps

1. Copy the example code
2. Adjust styling to match your design system
3. Add additional features as needed
4. Test on different screen sizes
5. Deploy!

That's it! Your doctor portal now has a professional consultation history sidebar. 🎉
