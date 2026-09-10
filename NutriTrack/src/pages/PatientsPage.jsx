import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import AddPatientModal from "../components/AddPatientModal";
import PatientClinicalPanel from "../components/PatientClinicalPanel";
import { emailService } from "../services/emailService";

function PatientsPage() {
    const { patients, addPatient, updatePatient, removePatient, reports, auth } = useApp();
    const { showSuccess, showWarning, showError } = useToast();
    
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGoal, setFilterGoal] = useState("");

    // Find the currently selected patient object
    const selectedPatient = useMemo(() => {
        return patients.find(p => Number(p.id) === Number(selectedPatientId)) || null;
    }, [selectedPatientId, patients]);

    const handleAddPatient = async (patientData) => {
        const saved = await addPatient(patientData);
        setIsAddModalOpen(false);

        if (saved) {
            setSelectedPatientId(saved.id);
        }

        const targetEmail = (patientData.email || "").trim().toLowerCase();
        // Si el paciente tiene correo y está marcada la opción de enviar automático
        if (targetEmail && patientData.sendEmailInvite !== false) {
            if (emailService.isConfigured()) {
                try {
                    const inviteUrl = emailService.generateInviteUrl({
                        email: targetEmail,
                        name: patientData.name,
                        clinicalCode: patientData.clinicalCode || patientData.clinical_code || (saved?.id ? `PAC-${saved.id}` : ""),
                        documentId: patientData.documentId || patientData.document_id || "",
                        nutriologoId: auth?.uid || auth?.id
                    });

                    const emailRes = await emailService.sendPatientInvite({
                        patientName: patientData.name,
                        patientEmail: targetEmail,
                        inviteUrl,
                        nutriologoName: auth?.fullName || "Tu Nutriólogo",
                        clinicalCode: patientData.clinicalCode || patientData.clinical_code || (saved?.id ? `PAC-${saved.id}` : "PACIENTE"),
                        nutriologoId: auth?.uid || auth?.id
                    });

                    if (emailRes.success) {
                        showSuccess(`¡Paciente registrado y correo de activación enviado automáticamente a ${patientData.email}!`);
                    } else {
                        showSuccess(`¡Paciente registrado con éxito! (Nota: ${emailRes.message})`);
                    }
                } catch (emailErr) {
                    console.error("Error al enviar email automático:", emailErr);
                    showSuccess(`¡Paciente registrado con éxito! (No se pudo enviar el correo: ${emailErr.message})`);
                }
            } else {
                showSuccess("¡Paciente registrado con éxito! Para envío automático por correo, añade tus credenciales de EmailJS en .env.local.");
            }
        } else {
            showSuccess("Paciente registrado con éxito.");
        }
    };

    const handlePatientUpdate = (updatedPatient) => {
        updatePatient(updatedPatient.id, updatedPatient);
        showSuccess("Ficha del paciente actualizada.");
    };

    const handlePatientDelete = (patientId) => {
        removePatient(patientId);
        showWarning("Expediente eliminado correctamente.");
        setSelectedPatientId(null);
    };

    // Filter patients based on search and target goal
    const filteredPatients = useMemo(() => {
        if (!patients) return [];
        const term = searchTerm.toLowerCase().trim();
        return patients.filter((patient) => {
            const matchesSearch = !term ||
                patient.name?.toLowerCase().includes(term) ||
                patient.email?.toLowerCase().includes(term) ||
                patient.document_id?.toLowerCase().includes(term) ||
                patient.documentId?.toLowerCase().includes(term) ||
                patient.clinical_code?.toLowerCase().includes(term) ||
                patient.clinicalCode?.toLowerCase().includes(term) ||
                String(patient.id).includes(term);

            const matchesGoal = filterGoal === "" || 
                               (patient.target && patient.target.toLowerCase().includes(filterGoal.toLowerCase())) ||
                               (patient.goal && patient.goal.toLowerCase().includes(filterGoal.toLowerCase()));
            return matchesSearch && matchesGoal;
        });
    }, [patients, searchTerm, filterGoal]);

    // Find last report date for each patient to show in the list card
    const getLastConsultation = (patientId) => {
        const patientReports = reports.filter(r => Number(r.patientId) === Number(patientId));
        if (patientReports.length === 0) return "Sin consultas";
        const sorted = [...patientReports].sort((a, b) => b.date.localeCompare(a.date));
        return formatDate(sorted[0].date);
    };

    function formatDate(dateValue) {
        if (!dateValue) return "";
        return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short"
        });
    }

    return (
        <section className="patients-split-view" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", height: "calc(100vh - 120px)", minHeight: "600px", alignItems: "stretch" }}>
            
            {/* Left Pane: Directory (Always visible on desktop, responsive hides on mobile details) */}
            <article className={`directory-pane ${selectedPatient ? "hide-on-mobile" : ""}`} style={{ display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: "1.25rem", background: "var(--surface)", height: "100%", overflowY: "hidden" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0 }}>Directorio</h3>
                    <button
                        className="btn success small"
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        style={{ background: "var(--primary)", border: "none", display: "flex", gap: "0.25rem", alignItems: "center", fontSize: "0.8rem" }}
                    >
                        <i className="bi bi-person-plus-fill" />
                        Registrar paciente
                    </button>
                </div>

                {/* Search & Filters */}
                <div style={{ display: "grid", gap: "0.5rem" }}>
                    <div className="field" style={{ margin: 0 }}>
                        <div style={{ position: "relative" }}>
                            <i className="bi bi-search" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: "0.9rem" }} />
                            <input
                                placeholder="Buscar por nombre, cédula/DNI, código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: "2.25rem", fontSize: "0.85rem", height: "2.4rem" }}
                            />
                        </div>
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                        <select
                            value={filterGoal}
                            onChange={(e) => setFilterGoal(e.target.value)}
                            style={{ fontSize: "0.85rem", height: "2.4rem" }}
                        >
                            <option value="">Todos los objetivos</option>
                            <option value="Reducir IMC">Reducir IMC</option>
                            <option value="Control calórico">Control calórico</option>
                            <option value="Masa muscular">Masa muscular</option>
                            <option value="Plan deportivo">Plan deportivo</option>
                        </select>
                    </div>
                </div>

                {/* Directory Scroll List */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", paddingRight: "0.25rem" }}>
                    {filteredPatients.length ? (
                        filteredPatients.map((patient) => {
                            const isSelected = selectedPatientId === patient.id;
                            const docDisplay = patient.documentId || patient.document_id;
                            const codeDisplay = patient.clinicalCode || patient.clinical_code || `PAC-${patient.id}`;

                            return (
                                <div
                                    key={patient.id}
                                    onClick={() => setSelectedPatientId(patient.id)}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "0.75rem",
                                        border: isSelected ? "1px solid var(--primary)" : "1px solid var(--line)",
                                        borderRadius: "var(--radius-sm)",
                                        background: isSelected ? "var(--primary-soft)" : "var(--surface)",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        boxShadow: isSelected ? "0 2px 8px rgba(22, 163, 74, 0.05)" : "none"
                                    }}
                                    className="patient-card-item"
                                >
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <strong style={{ fontSize: "0.85rem", display: "block", color: isSelected ? "var(--primary-strong)" : "var(--text)" }}>
                                                {patient.name}
                                            </strong>
                                            <span className="badge" style={{ fontSize: "0.62rem", padding: "0.1rem 0.35rem", background: "var(--primary-soft)", color: "var(--primary-strong)", fontWeight: "600" }}>
                                                {codeDisplay}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: "0.72rem", color: "var(--muted)", display: "block", marginTop: "0.2rem" }}>
                                            {docDisplay ? `DNI: ${docDisplay} • ` : ""}{patient.age} años • {patient.target || "Control"}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
                                        <span style={{ fontSize: "0.75rem", fontWeight: "700", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", background: "var(--primary-soft)", color: "var(--primary-strong)", border: "1px solid var(--line)" }}>
                                            {getLastConsultation(patient.id)}
                                        </span>
                                        <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-light)", fontWeight: "500" }}>Últ. Consulta</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p style={{ color: "var(--muted)", fontSize: "0.85rem", textAlign: "center", marginTop: "2rem", fontStyle: "italic" }}>
                            No se encontraron pacientes.
                        </p>
                    )}
                </div>
            </article>

            {/* Right Pane: Clinical Details Pane */}
            <article className={`clinical-pane ${!selectedPatient ? "hide-on-mobile" : ""}`} style={{ height: "100%" }}>
                {selectedPatient && (
                    <button
                        className="btn secondary small show-on-mobile"
                        onClick={() => setSelectedPatientId(null)}
                        style={{ marginBottom: "0.75rem", display: "flex", gap: "0.25rem", alignItems: "center", fontSize: "0.8rem", width: "fit-content" }}
                    >
                        <i className="bi bi-arrow-left" />
                        Volver al directorio
                    </button>
                )}
                <PatientClinicalPanel
                    patient={selectedPatient}
                    onUpdate={handlePatientUpdate}
                    onDelete={handlePatientDelete}
                />
            </article>

            <AddPatientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddPatient}
            />
        </section>
    );
}

export default PatientsPage;
