import { useState, useMemo } from "react";
import Modal from "./Modal";
import { useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";
import LineChart from "./charts/LineChart";

function formatDate(dateValue) {
    if (!dateValue) return "";
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

const PatientDetailsModal = ({ patient, isOpen, onClose, onUpdate, onDelete, showEditMode, onEdit }) => {
    const { showSuccess, showError } = useToast();
    const { appointments, plans, reports, addReport, deleteReport } = useApp();
    const [isEditing, setIsEditing] = useState(showEditMode || false);
    const [editForm, setEditForm] = useState({});
    const [activeTab, setActiveTab] = useState("resumen");
    
    // Notes tab state
    const [notesText, setNotesText] = useState(patient?.notes || "");

    // Consultation Form State
    const [isAddingConsultation, setIsAddingConsultation] = useState(false);
    const [consultationForm, setConsultationForm] = useState({
        weight: "",
        height: patient?.height || "",
        calories: "",
        notes: "",
        date: new Date().toISOString().split("T")[0]
    });

    // Mock Files State
    const [files, setFiles] = useState([
        { id: 1, name: "Analítica de Sangre - Enero 2026.pdf", size: "1.2 MB", date: "2026-01-10" },
        { id: 2, name: "Estudio Composición DXA.pdf", size: "4.5 MB", date: "2026-02-15" }
    ]);

    useMemo(() => {
        if (patient) {
            setEditForm({
                name: patient.name || "",
                email: patient.email || "",
                phone: patient.phone || "",
                age: patient.age || "",
                gender: patient.gender || "femenino",
                weight: patient.weight || "",
                height: patient.height || "",
                target: patient.target || patient.goal || "Reducir IMC"
            });
            setNotesText(patient.notes || "");
            setConsultationForm(prev => ({
                ...prev,
                height: patient.height || ""
            }));
        }
    }, [patient]);

    if (!isOpen) return null;
    if (!patient) return null;

    const initials = patient.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0]?.toUpperCase())
        .join("");

    const imc = (patient.weight / ((patient.height / 100) ** 2)).toFixed(1);

    // Fetch related clinical details
    const patientAppointments = appointments.filter((a) => a.patientId === patient.id);
    const patientPlans = plans.filter((p) => p.patientId === patient.id);
    const patientReports = reports
        .filter((r) => r.patientId === patient.id)
        .sort((a, b) => a.date.localeCompare(b.date));

    const handleEditToggle = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        try {
            const updatedPatient = {
                ...patient,
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                age: Number(editForm.age),
                gender: editForm.gender,
                weight: Number(editForm.weight),
                height: Number(editForm.height),
                target: editForm.target,
                notes: notesText
            };
            onUpdate(updatedPatient);
            setIsEditing(false);
        } catch (error) {
            showError("Error al guardar la información.");
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm({
            name: patient.name || "",
            email: patient.email || "",
            phone: patient.phone || "",
            age: patient.age || "",
            gender: patient.gender || "femenino",
            weight: patient.weight || "",
            height: patient.height || "",
            target: patient.target || patient.goal || "Reducir IMC"
        });
    };

    const handleSaveNotes = () => {
        const updatedPatient = {
            ...patient,
            notes: notesText
        };
        onUpdate(updatedPatient);
        showSuccess("Notas clínicas actualizadas.");
    };

    const handleAddConsultation = (e) => {
        e.preventDefault();
        const weightNum = Number(consultationForm.weight);
        const heightNum = Number(consultationForm.height);
        const calculatedBmi = Number((weightNum / ((heightNum / 100) ** 2)).toFixed(1));

        const newReport = {
            patientId: patient.id,
            date: consultationForm.date,
            weight: weightNum,
            bmi: calculatedBmi,
            calories: Number(consultationForm.calories) || 2000,
            notes: consultationForm.notes
        };

        addReport(newReport);

        // Update patient weight in the patient file too
        const updatedPatient = {
            ...patient,
            weight: weightNum,
            height: heightNum
        };
        onUpdate(updatedPatient);

        setIsAddingConsultation(false);
        setConsultationForm({
            weight: "",
            height: patient.height,
            calories: "",
            notes: "",
            date: new Date().toISOString().split("T")[0]
        });
        showSuccess("Consulta clínica guardada con éxito.");
    };

    const handleUploadFile = () => {
        const fileName = window.prompt("Ingrese el nombre del archivo:");
        if (!fileName) return;
        const newFile = {
            id: Date.now(),
            name: fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`,
            size: "1.8 MB",
            date: new Date().toISOString().split("T")[0]
        };
        setFiles((prev) => [...prev, newFile]);
        showSuccess("Archivo subido con éxito (Simulado).");
    };

    // Tab Render Functions
    const renderResumen = () => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
            {isEditing ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="field">
                        <label>Nombre completo</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Correo electrónico</label>
                        <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Teléfono</label>
                        <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Edad</label>
                        <input
                            type="number"
                            value={editForm.age}
                            onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Género</label>
                        <select
                            value={editForm.gender}
                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        >
                            <option value="masculino">Masculino</option>
                            <option value="femenino">Femenino</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Objetivo</label>
                        <select
                            value={editForm.target}
                            onChange={(e) => setEditForm({ ...editForm, target: e.target.value })}
                        >
                            <option value="Reducir IMC">Reducir IMC</option>
                            <option value="Control calórico">Control calórico</option>
                            <option value="Masa muscular">Masa muscular</option>
                            <option value="Plan deportivo">Plan deportivo</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Peso (kg)</label>
                        <input
                            type="number"
                            value={editForm.weight}
                            onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Altura (cm)</label>
                        <input
                            type="number"
                            value={editForm.height}
                            onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                        />
                    </div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "1.5rem", alignItems: "center" }}>
                    <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "var(--primary-soft)", display: "grid", placeItems: "center", color: "var(--primary-strong)", fontSize: "2.5rem", fontWeight: "700" }}>
                        {initials}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem" }}>
                        <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Nombre</span>
                            <strong style={{ fontSize: "1.1rem", color: "var(--text)" }}>{patient.name}</strong>
                        </div>
                        <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Edad / Género</span>
                            <strong style={{ fontSize: "1rem", color: "var(--text)", textTransform: "capitalize" }}>{patient.age} años, {patient.gender || "femenino"}</strong>
                        </div>
                        <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Peso / Altura</span>
                            <strong style={{ fontSize: "1rem", color: "var(--text)" }}>{patient.weight} kg / {patient.height} cm</strong>
                        </div>
                        <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>IMC</span>
                            <strong style={{ fontSize: "1rem", color: "var(--text)" }}>{imc} ({Number(imc) < 25 ? "Normal" : "Sobrepeso"})</strong>
                        </div>
                        <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Objetivo Nutricional</span>
                            <strong style={{ fontSize: "1rem", color: "var(--primary)" }}>{patient.target || patient.goal || "Control"}</strong>
                        </div>
                        <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Contacto</span>
                            <strong style={{ fontSize: "0.9rem", color: "var(--text)" }}>{patient.email || "Sin email"} <br /> {patient.phone || ""}</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderConsultas = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4>Historia de Consultas Clínicas</h4>
                {!isAddingConsultation && (
                    <button className="btn" onClick={() => setIsAddingConsultation(true)} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem", background: "var(--primary)", border: "none" }}>
                        <i className="bi bi-file-medical-fill" style={{ marginRight: "0.3rem" }} />
                        Registrar Consulta
                    </button>
                )}
            </div>

            {isAddingConsultation ? (
                <form onSubmit={handleAddConsultation} className="panel" style={{ padding: "1.25rem", border: "1px solid var(--line)", display: "grid", gap: "1rem", borderRadius: "var(--radius)" }}>
                    <h5 style={{ fontWeight: "600", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem" }}>
                        Nueva Consulta Nutricional
                    </h5>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                        <div className="field">
                            <label>Peso Actual (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={consultationForm.weight}
                                onChange={(e) => setFormVal("weight", e.target.value)}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Altura (cm)</label>
                            <input
                                type="number"
                                value={consultationForm.height}
                                onChange={(e) => setFormVal("height", e.target.value)}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Calorías Planificadas</label>
                            <input
                                type="number"
                                value={consultationForm.calories}
                                onChange={(e) => setFormVal("calories", e.target.value)}
                                placeholder="2000"
                            />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="field">
                            <label>Fecha de Consulta</label>
                            <input
                                type="date"
                                value={consultationForm.date}
                                onChange={(e) => setFormVal("date", e.target.value)}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Diagnóstico / Recomendaciones</label>
                            <input
                                type="text"
                                value={consultationForm.notes}
                                onChange={(e) => setFormVal("notes", e.target.value)}
                                placeholder="Bajar azúcares, plan deportivo"
                            />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button type="button" className="btn secondary" onClick={() => setIsAddingConsultation(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn success">
                            Guardar Consulta
                        </button>
                    </div>
                </form>
            ) : null}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {patientReports.length > 0 ? (
                    patientReports.map((report) => (
                        <div key={report.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
                            <div>
                                <strong style={{ display: "block", fontSize: "0.9rem" }}>
                                    {formatDate(report.date)}
                                </strong>
                                <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                                    Peso: {report.weight} kg | IMC: {report.bmi} | Calorías: {report.calories} kcal
                                </span>
                                {report.notes && (
                                    <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0.25rem 0 0" }}>
                                        Recomendación: {report.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>
                        No hay consultas clínicas registradas para este paciente.
                    </p>
                )}
            </div>
        </div>
    );

    const setFormVal = (key, val) => {
        setConsultationForm(prev => ({ ...prev, [key]: val }));
    };

    const renderSeguimiento = () => {
        const weights = patientReports.map((r) => r.weight);
        const dates = patientReports.map((r) => r.date.split("-")[2]); // days

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h4>Seguimiento y Antropometría</h4>
                {weights.length > 1 ? (
                    <div style={{ height: "150px", display: "flex", justifyContent: "center", alignItems: "center", margin: "1rem 0" }}>
                        <LineChart values={weights} color="var(--primary)" />
                    </div>
                ) : null}

                <table className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Peso (kg)</th>
                            <th>IMC</th>
                            <th>Calorías</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patientReports.map((r) => (
                            <tr key={r.id}>
                                <td>{formatDate(r.date)}</td>
                                <td>{r.weight} kg</td>
                                <td>{r.bmi}</td>
                                <td>{r.calories} kcal</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderDietas = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h4>Planes Alimenticios Asignados</h4>
            {patientPlans.length > 0 ? (
                patientPlans.map((plan) => (
                    <div key={plan.id} className="panel" style={{ padding: "1.25rem", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                            <div>
                                <strong style={{ fontSize: "1.1rem", color: "var(--text)", display: "block" }}>{plan.name}</strong>
                                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                                    Objetivo: {plan.target} | Duración: {plan.duration} semanas
                                </span>
                            </div>
                            <span className="badge" style={{ background: "var(--primary-soft)", color: "var(--primary-strong)" }}>
                                {plan.calories} kcal
                            </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", fontSize: "0.85rem" }}>
                            {plan.meals && Object.entries(plan.meals).map(([category, items]) => {
                                const labelsMap = {
                                    desayuno: "Desayuno",
                                    mediaManana: "Media Mañana",
                                    almuerzo: "Almuerzo",
                                    merienda: "Merienda",
                                    cena: "Cena",
                                    snack: "Snack Nocturno"
                                };
                                return (
                                    <div key={category} style={{ padding: "0.5rem", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--surface-soft)" }}>
                                        <strong style={{ display: "block", marginBottom: "0.25rem", color: "var(--primary)" }}>
                                            {labelsMap[category] || category}
                                        </strong>
                                        {items && items.length > 0 ? (
                                            <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                                                {items.map((food, i) => (
                                                    <li key={i}>{food}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span style={{ fontStyle: "italic", color: "var(--muted)" }}>Sin alimentos</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            ) : (
                <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>
                    No hay planes alimenticios asignados para este paciente.
                </p>
            )}
        </div>
    );

    const renderCitas = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h4>Citas Clínicas</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {patientAppointments.length > 0 ? (
                    patientAppointments.map((appt) => (
                        <div key={appt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
                            <div>
                                <strong style={{ display: "block" }}>{formatDate(appt.date)} a las {appt.time}</strong>
                                <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>{appt.notes || "Sin notas"}</span>
                            </div>
                            <span className={`status-pill ${appt.status.toLowerCase()}`}>
                                {appt.status}
                            </span>
                        </div>
                    ))
                ) : (
                    <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>
                        No hay citas agendadas para este paciente.
                    </p>
                )}
            </div>
        </div>
    );

    const renderArchivos = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4>Expediente de Archivos</h4>
                <button className="btn secondary" onClick={handleUploadFile} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                    <i className="bi bi-cloud-upload-fill" style={{ marginRight: "0.3rem" }} />
                    Subir Archivo
                </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {files.map((file) => (
                    <div key={file.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--surface-soft)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: "1.25rem", color: "var(--danger)" }}></i>
                            <div>
                                <strong style={{ display: "block", fontSize: "0.85rem" }}>{file.name}</strong>
                                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{file.size} | Subido: {file.date}</span>
                            </div>
                        </div>
                        <button className="btn ghost small" style={{ padding: "0.25rem" }}>
                            <i className="bi bi-download"></i>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderNotas = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h4>Notas Clínicas Privadas</h4>
            <textarea
                style={{ width: "100%", minHeight: "150px", borderRadius: "var(--radius)", border: "1px solid var(--line)", padding: "0.75rem" }}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Escriba antecedentes, recomendaciones, tolerancia digestiva o metas a mediano plazo..."
            />
            <button className="btn success" onClick={handleSaveNotes} style={{ alignSelf: "flex-end", background: "var(--primary)", border: "none" }}>
                Guardar Notas
            </button>
        </div>
    );

    const modalActions = isEditing ? (
        <div className="modal-actions" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button className="btn secondary" onClick={handleCancel}>
                Cancelar
            </button>
            <button className="btn success" onClick={handleSave}>
                Guardar Cambios
            </button>
        </div>
    ) : (
        <div className="modal-actions" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button className="btn secondary" onClick={handleEditToggle} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <i className="bi bi-pencil" />
                Editar Ficha
            </button>
            <button className="btn danger" onClick={() => { if(window.confirm("¿Eliminar ficha de paciente?")) { onDelete(patient.id); onClose(); } }}>
                <i className="bi bi-trash" />
                Eliminar
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Ficha Clínica - ${patient.name}`}
            size="large"
        >
            <div className="modal-tabs">
                <div className="tab-navigation" style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem", overflowX: "auto", whiteSpace: "nowrap", marginBottom: "1rem" }}>
                    <button
                        className={`tab-btn ${activeTab === "resumen" ? "active" : ""}`}
                        onClick={() => { setActiveTab("resumen"); setIsAddingConsultation(false); }}
                        style={{ border: "none", background: "none", cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.85rem", fontWeight: activeTab === "resumen" ? "600" : "400", borderBottom: activeTab === "resumen" ? "2px solid var(--primary)" : "none", color: activeTab === "resumen" ? "var(--primary)" : "var(--text)" }}
                    >
                        Resumen
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "consultas" ? "active" : ""}`}
                        onClick={() => { setActiveTab("consultas"); setIsAddingConsultation(false); }}
                        style={{ border: "none", background: "none", cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.85rem", fontWeight: activeTab === "consultas" ? "600" : "400", borderBottom: activeTab === "consultas" ? "2px solid var(--primary)" : "none", color: activeTab === "consultas" ? "var(--primary)" : "var(--text)" }}
                    >
                        Consultas
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "seguimiento" ? "active" : ""}`}
                        onClick={() => { setActiveTab("seguimiento"); setIsAddingConsultation(false); }}
                        style={{ border: "none", background: "none", cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.85rem", fontWeight: activeTab === "seguimiento" ? "600" : "400", borderBottom: activeTab === "seguimiento" ? "2px solid var(--primary)" : "none", color: activeTab === "seguimiento" ? "var(--primary)" : "var(--text)" }}
                    >
                        Seguimiento
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "dietas" ? "active" : ""}`}
                        onClick={() => { setActiveTab("dietas"); setIsAddingConsultation(false); }}
                        style={{ border: "none", background: "none", cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.85rem", fontWeight: activeTab === "dietas" ? "600" : "400", borderBottom: activeTab === "dietas" ? "2px solid var(--primary)" : "none", color: activeTab === "dietas" ? "var(--primary)" : "var(--text)" }}
                    >
                        Dietas
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "citas" ? "active" : ""}`}
                        onClick={() => { setActiveTab("citas"); setIsAddingConsultation(false); }}
                        style={{ border: "none", background: "none", cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.85rem", fontWeight: activeTab === "citas" ? "600" : "400", borderBottom: activeTab === "citas" ? "2px solid var(--primary)" : "none", color: activeTab === "citas" ? "var(--primary)" : "var(--text)" }}
                    >
                        Citas
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "archivos" ? "active" : ""}`}
                        onClick={() => { setActiveTab("archivos"); setIsAddingConsultation(false); }}
                        style={{ border: "none", background: "none", cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.85rem", fontWeight: activeTab === "archivos" ? "600" : "400", borderBottom: activeTab === "archivos" ? "2px solid var(--primary)" : "none", color: activeTab === "archivos" ? "var(--primary)" : "var(--text)" }}
                    >
                        Archivos
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "notas" ? "active" : ""}`}
                        onClick={() => { setActiveTab("notas"); setIsAddingConsultation(false); }}
                        style={{ border: "none", background: "none", cursor: "pointer", padding: "0.5rem 0.75rem", fontSize: "0.85rem", fontWeight: activeTab === "notas" ? "600" : "400", borderBottom: activeTab === "notas" ? "2px solid var(--primary)" : "none", color: activeTab === "notas" ? "var(--primary)" : "var(--text)" }}
                    >
                        Notas
                    </button>
                </div>
                
                <div className="tab-content" style={{ minHeight: "220px" }}>
                    {activeTab === "resumen" && renderResumen()}
                    {activeTab === "consultas" && renderConsultas()}
                    {activeTab === "seguimiento" && renderSeguimiento()}
                    {activeTab === "dietas" && renderDietas()}
                    {activeTab === "citas" && renderCitas()}
                    {activeTab === "archivos" && renderArchivos()}
                    {activeTab === "notas" && renderNotas()}
                </div>
            </div>
            
            {modalActions}
        </Modal>
    );
};

export default PatientDetailsModal;
