import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import LineChart from "./charts/LineChart";
import PlanModal from "./PlanModal";

function formatDate(dateValue) {
    if (!dateValue) return "";
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function samePatientId(a, b) {
    return Number(a) === Number(b);
}

function PatientClinicalPanel({ patient, onUpdate, onDelete }) {
    const { showSuccess, showError } = useToast();
    const {
        patients,
        appointments,
        plans,
        reports,
        addReport,
        addPlan,
        updatePlan,
        removePlan
    } = useApp();

    const [activeTab, setActiveTab] = useState("resumen");
    const [isEditingDemographics, setIsEditingDemographics] = useState(false);
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [planModalMode, setPlanModalMode] = useState("add");
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Demographics form state
    const [demoForm, setDemoForm] = useState({
        name: "",
        age: "",
        gender: "femenino",
        weight: "",
        height: "",
        target: "Reducir IMC",
        email: "",
        phone: ""
    });

    // Notes state
    const [notesText, setNotesText] = useState("");

    // Consultation form state
    const [consultForm, setConsultForm] = useState({
        weight: "",
        height: "",
        feeling: "bien", // 'bien', 'regular', 'mal'
        observations: "",
        diagnosis: "",
        recommendations: "",
        calories: "2000",
        date: new Date().toISOString().split("T")[0]
    });

    // Sync demographic fields when patient data updates (without resetting active tab)
    useEffect(() => {
        if (!patient) return;
        setDemoForm({
            name: patient.name || "",
            age: patient.age || "",
            gender: patient.gender || "femenino",
            weight: patient.weight || "",
            height: patient.height || "",
            target: patient.target || "Reducir IMC",
            email: patient.email || "",
            phone: patient.phone || ""
        });
        setNotesText(patient.notes || "");
    }, [patient]);

    // Only reset UI when switching to a different patient
    useEffect(() => {
        if (!patient) return;
        setConsultForm((prev) => ({
            ...prev,
            weight: "",
            height: patient.height || "",
            feeling: "bien",
            observations: "",
            diagnosis: "",
            recommendations: "",
            calories: "2000",
            date: new Date().toISOString().split("T")[0]
        }));
        setIsEditingDemographics(false);
        setActiveTab("resumen");
        setPlanModalOpen(false);
        setSelectedPlan(null);
    }, [patient]);

    // Derived states — compare IDs loosely so string/number mismatches still match
    const patientReports = useMemo(() => {
        if (!patient) return [];
        return reports
            .filter((item) => samePatientId(item.patientId, patient.id))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [patient, reports]);

    const patientPlans = useMemo(() => {
        if (!patient) return [];
        return plans.filter((item) => samePatientId(item.patientId, patient.id));
    }, [patient, plans]);

    const patientAppointments = useMemo(() => {
        if (!patient) return [];
        return appointments
            .filter((item) => samePatientId(item.patientId, patient.id) && !item.archived)
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    }, [patient, appointments]);

    const imc = useMemo(() => {
        if (!patient) return "0.0";
        const w = Number(patient.weight);
        const h = Number(patient.height) / 100;
        if (w && h) {
            return (w / (h * h)).toFixed(1);
        }
        return "0.0";
    }, [patient]);

    const imcStatus = (val) => {
        const n = Number(val);
        if (n < 18.5) return { label: "Bajo peso", color: "warning" };
        if (n < 25) return { label: "Normal", color: "success" };
        if (n < 30) return { label: "Sobrepeso", color: "warning" };
        return { label: "Obesidad", color: "danger" };
    };

    // Calculate weight change vs last consultation
    const weightEvolution = useMemo(() => {
        if (patientReports.length < 2) return null;
        const last = patientReports[patientReports.length - 1];
        const prev = patientReports[patientReports.length - 2];
        const diff = Number((last.weight - prev.weight).toFixed(1));
        return {
            diff,
            descended: diff < 0,
            text: diff < 0 ? `Descendió ${Math.abs(diff)} kg` : diff > 0 ? `Aumentó ${diff} kg` : "Estable"
        };
    }, [patientReports]);

    const timelineEvents = useMemo(() => {
        if (!patient) return [];
        const events = [];

        // 1. Initial creation
        events.push({
            id: 'init',
            title: 'Consulta Inicial',
            date: patient.created_at ? patient.created_at.split('T')[0] : '2026-01-01',
            desc: 'Expediente clínico del paciente aperturado.',
            icon: 'bi-person-plus-fill'
        });

        // 2. Mediciones (Reports)
        patientReports.forEach(r => {
            events.push({
                id: `report-${r.id}`,
                title: 'Nueva Medición',
                date: r.date,
                desc: `Peso: ${r.weight} kg • IMC: ${r.bmi} • Calorías: ${r.calories || 2000} kcal. Observaciones: ${r.observations || 'Sin observaciones.'}`,
                icon: 'bi-activity'
            });
        });

        // 3. Planes alimenticios (Plans)
        patientPlans.forEach(p => {
            events.push({
                id: `plan-${p.id}`,
                title: 'Asignación de Plan Alimenticio',
                date: p.created_at ? p.created_at.split('T')[0] : '2026-02-01',
                desc: `Plan: "${p.name}" (${p.calories} kcal) para ${p.duration || 4} semanas.`,
                icon: 'bi-apple'
            });
        });

        // 4. Citas de control (Appointments completed)
        patientAppointments.forEach(a => {
            if (a.status?.toLowerCase() === 'completada') {
                events.push({
                    id: `appt-${a.id}`,
                    title: 'Control Clínico',
                    date: a.date,
                    desc: `Cita presencial/virtual finalizada. Tipo: ${a.type || 'seguimiento'}.`,
                    icon: 'bi-check-circle-fill'
                });
            }
        });

        // Sort events by date ascending
        return events.sort((a, b) => a.date.localeCompare(b.date));
    }, [patient, patientReports, patientPlans, patientAppointments]);

    if (!patient) {
        return (
            <div className="panel" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", minHeight: "450px", textAlign: "center", padding: "2rem" }}>
                <i className="bi bi-people" style={{ fontSize: "3rem", color: "var(--muted)", marginBottom: "1rem" }} />
                <h4 style={{ color: "var(--text-light)" }}>No se ha seleccionado ningún paciente</h4>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", maxWidth: "320px", marginTop: "0.5rem" }}>
                    Selecciona un paciente del directorio de la izquierda o haz clic en "Registrar paciente" para comenzar.
                </p>
            </div>
        );
    }

    const initials = patient.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0]?.toUpperCase())
        .join("");

    // Action handlers
    const handleSaveDemographics = (e) => {
        e.preventDefault();
        const updated = {
            ...patient,
            name: demoForm.name,
            age: Number(demoForm.age),
            gender: demoForm.gender,
            weight: Number(demoForm.weight),
            height: Number(demoForm.height),
            target: demoForm.target,
            email: demoForm.email,
            phone: demoForm.phone
        };
        onUpdate(updated);
        setIsEditingDemographics(false);
    };

    const handleSaveNotes = () => {
        const updated = { ...patient, notes: notesText };
        onUpdate(updated);
    };

    const handleAddConsultation = (e) => {
        e.preventDefault();
        const w = Number(consultForm.weight);
        const h = Number(consultForm.height);
        if (!w || !h) {
            showError("Ingresa peso y altura válidos.");
            return;
        }

        const calculatedBmi = (w / ((h / 100) * (h / 100))).toFixed(1);

        const newReport = {
            patientId: patient.id,
            date: consultForm.date,
            weight: w,
            bmi: Number(calculatedBmi),
            calories: Number(consultForm.calories),
            notes: consultForm.recommendations,
            feeling: consultForm.feeling,
            observations: consultForm.observations,
            diagnosis: consultForm.diagnosis
        };

        addReport(newReport);

        // Auto update patient weight/height
        const updatedPatient = {
            ...patient,
            weight: w,
            height: h
        };
        onUpdate(updatedPatient);

        // Clear Form & Show Success
        setConsultForm(prev => ({
            ...prev,
            weight: "",
            feeling: "bien",
            observations: "",
            diagnosis: "",
            recommendations: "",
            calories: "2000"
        }));
        showSuccess("Consulta registrada exitosamente.");
    };

    const openCreatePlan = () => {
        setSelectedPlan({ patientId: patient.id });
        setPlanModalMode("add");
        setPlanModalOpen(true);
    };

    const openEditPlan = (plan) => {
        setSelectedPlan(plan);
        setPlanModalMode("edit");
        setPlanModalOpen(true);
    };

    const openViewPlan = (plan) => {
        setSelectedPlan(plan);
        setPlanModalMode("view");
        setPlanModalOpen(true);
    };

    const handleSavePlan = (planData) => {
        if (planModalMode === "add") {
            addPlan(planData);
            showSuccess("Plan alimenticio creado y asignado al paciente.");
        } else {
            updatePlan(planData.id, planData);
            showSuccess("Plan alimenticio actualizado.");
        }
        setPlanModalOpen(false);
    };

    const handleDeletePlan = (planId) => {
        if (window.confirm("¿Eliminar este plan alimenticio?")) {
            removePlan(planId);
            showSuccess("Plan eliminado.");
        }
    };

    return (
        <div className="panel" style={{ height: "100%", display: "flex", flexDirection: "column", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: "1.25rem", background: "var(--surface)", minHeight: "600px" }}>
            
            {/* Header: Demographics Summary */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary-strong)", display: "grid", placeItems: "center", fontSize: "1.25rem", fontWeight: "800" }}>
                        {initials}
                    </div>
                    <div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text)", margin: 0 }}>{patient.name}</h3>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginTop: "0.2rem" }}>
                            ID: #{patient.id} • {patient.age} años • {patient.gender === 'femenino' ? 'Femenino' : 'Masculino'}
                        </span>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span className={`status-pill status-${imcStatus(imc).color}`} style={{ display: "inline-flex", alignSelf: "center" }}>
                        IMC: {imc} ({imcStatus(imc).label})
                    </span>
                    <button
                        onClick={() => {
                            if (window.confirm(`¿Estás seguro de eliminar permanentemente a ${patient.name}?`)) {
                                onDelete(patient.id);
                            }
                        }}
                        className="btn danger small"
                        style={{ padding: "0.4rem 0.6rem" }}
                    >
                        <i className="bi bi-person-x-fill" />
                    </button>
                </div>
            </div>

            {/* Tab Navigation Menu */}
            <nav className="tab-menu" style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem", marginBottom: "1rem", overflowX: "auto", whiteSpace: "nowrap" }}>
                {[
                    { key: "resumen", label: "Resumen", icon: "bi-card-list" },
                    { key: "consultas", label: "Consultas", icon: "bi-journal-medical" },
                    { key: "dieta", label: "Plan Alimenticio", icon: "bi-apple" },
                    { key: "seguimiento", label: "Seguimiento", icon: "bi-graph-up-arrow" },
                    { key: "notas", label: "Notas", icon: "bi-sticky-fill" }
                ].map(t => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        className={`tab-item ${activeTab === t.key ? "active" : ""}`}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "0.5rem 0.75rem",
                            fontSize: "0.85rem",
                            fontWeight: activeTab === t.key ? "600" : "500",
                            color: activeTab === t.key ? "var(--primary-strong)" : "var(--muted)",
                            borderBottom: activeTab === t.key ? "2px solid var(--primary)" : "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            flexShrink: 0
                        }}
                    >
                        <i className={`bi ${t.icon}`} />
                        {t.label}
                    </button>
                ))}
            </nav>

            {/* Tab Panels Contents */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.25rem" }}>
                
                {/* 1. RESUMEN TAB */}
                {activeTab === "resumen" && (
                    <div style={{ display: "grid", gap: "1rem" }}>
                        {isEditingDemographics ? (
                            <form onSubmit={handleSaveDemographics} style={{ display: "grid", gap: "1rem" }}>
                                <h5 style={{ fontWeight: "700" }}>Editar Expediente Demográfico</h5>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="field">
                                        <label>Nombre Completo</label>
                                        <input value={demoForm.name} onChange={e => setDemoForm(p => ({ ...p, name: e.target.value }))} required />
                                    </div>
                                    <div className="field">
                                        <label>Edad</label>
                                        <input type="number" value={demoForm.age} onChange={e => setDemoForm(p => ({ ...p, age: e.target.value }))} required />
                                    </div>
                                    <div className="field">
                                        <label>Género</label>
                                        <select value={demoForm.gender} onChange={e => setDemoForm(p => ({ ...p, gender: e.target.value }))}>
                                            <option value="femenino">Femenino</option>
                                            <option value="masculino">Masculino</option>
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Objetivo</label>
                                        <select value={demoForm.target} onChange={e => setDemoForm(p => ({ ...p, target: e.target.value }))}>
                                            <option value="Reducir IMC">Reducir IMC</option>
                                            <option value="Control calórico">Control calórico</option>
                                            <option value="Masa muscular">Masa muscular</option>
                                            <option value="Plan deportivo">Plan deportivo</option>
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Peso Inicial (kg)</label>
                                        <input type="number" value={demoForm.weight} onChange={e => setDemoForm(p => ({ ...p, weight: e.target.value }))} required />
                                    </div>
                                    <div className="field">
                                        <label>Altura Inicial (cm)</label>
                                        <input type="number" value={demoForm.height} onChange={e => setDemoForm(p => ({ ...p, height: e.target.value }))} required />
                                    </div>
                                    <div className="field">
                                        <label>Correo electrónico</label>
                                        <input type="email" value={demoForm.email} onChange={e => setDemoForm(p => ({ ...p, email: e.target.value }))} />
                                    </div>
                                    <div className="field">
                                        <label>Teléfono</label>
                                        <input value={demoForm.phone} onChange={e => setDemoForm(p => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                    <button type="button" className="btn secondary" onClick={() => setIsEditingDemographics(false)}>Cancelar</button>
                                    <button type="submit" className="btn success" style={{ background: "var(--primary)", border: "none" }}>Guardar cambios de paciente</button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                                    <div className="panel" style={{ padding: "1rem", border: "1px solid var(--line)" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Peso / Altura</span>
                                        <strong style={{ fontSize: "1.2rem" }}>{patient.weight} kg / {patient.height} cm</strong>
                                    </div>
                                    <div className="panel" style={{ padding: "1rem", border: "1px solid var(--line)" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>IMC</span>
                                        <strong style={{ fontSize: "1.2rem" }}>{imc}</strong>
                                    </div>
                                    <div className="panel" style={{ padding: "1rem", border: "1px solid var(--line)" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Objetivo Nutricional</span>
                                        <strong style={{ fontSize: "1.1rem", color: "var(--primary-strong)" }}>{patient.target || "Control"}</strong>
                                    </div>
                                    <div className="panel" style={{ padding: "1rem", border: "1px solid var(--line)" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>Próxima Cita</span>
                                        <strong style={{ fontSize: "0.95rem" }}>
                                            {patientAppointments.length ? `${formatDate(patientAppointments[0].date)}` : "Sin agendar"}
                                        </strong>
                                    </div>
                                </div>
                                <div className="panel" style={{ padding: "1rem", border: "1px solid var(--line)", display: "grid", gap: "0.5rem" }}>
                                    <h5 style={{ fontWeight: "700" }}>Contacto y Datos Generales</h5>
                                    <div><strong>Email:</strong> {patient.email || "No registrado"}</div>
                                    <div><strong>Teléfono:</strong> {patient.phone || "No registrado"}</div>
                                    <div><strong>Estado del tratamiento:</strong> <span style={{ color: "var(--primary)", fontWeight: "600" }}>Activo</span></div>
                                </div>
                                
                                <div className="panel" style={{ padding: "1.25rem", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)" }}>
                                    <h5 style={{ fontWeight: "700", marginBottom: "1rem" }}>Historial Clínico (Línea de Tiempo)</h5>
                                    <div className="clinical-timeline">
                                        {timelineEvents.map(evt => (
                                            <div key={evt.id} className="timeline-event">
                                                <div className="timeline-event-header">
                                                    <span className="timeline-event-title">{evt.title}</span>
                                                    <span className="timeline-event-date">{formatDate(evt.date)}</span>
                                                </div>
                                                <div className="timeline-event-card">
                                                    {evt.desc}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button className="btn" onClick={() => setIsEditingDemographics(true)} style={{ background: "var(--primary)", border: "none", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}>
                                    <i className="bi bi-pencil-square" />
                                    Editar datos de paciente
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. CONSULTAS TAB */}
                {activeTab === "consultas" && (
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        {/* New Consultation Quick Form */}
                        <form onSubmit={handleAddConsultation} className="panel" style={{ padding: "1.25rem", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", display: "grid", gap: "1rem", background: "var(--surface-soft)" }}>
                            <h5 style={{ fontWeight: "800", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem", margin: 0 }}>
                                Nueva Consulta
                            </h5>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
                                <div className="field">
                                    <label>Peso Actual (kg) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ej: 75.5"
                                        value={consultForm.weight}
                                        onChange={e => setConsultForm(c => ({ ...c, weight: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label>Altura (cm)</label>
                                    <input
                                        type="number"
                                        value={consultForm.height}
                                        onChange={e => setConsultForm(c => ({ ...c, height: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label>Estado de ánimo</label>
                                    <select value={consultForm.feeling} onChange={e => setConsultForm(c => ({ ...c, feeling: e.target.value }))}>
                                        <option value="bien">Bien 😊</option>
                                        <option value="regular">Regular 😐</option>
                                        <option value="mal">Mal 😔</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Calorías diarias</label>
                                    <input
                                        type="number"
                                        value={consultForm.calories}
                                        onChange={e => setConsultForm(c => ({ ...c, calories: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gap: "0.75rem" }}>
                                <div className="field">
                                    <label>Observaciones clínicas</label>
                                    <input
                                        placeholder="Síntomas, hábitos, hidratación..."
                                        value={consultForm.observations}
                                        onChange={e => setConsultForm(c => ({ ...c, observations: e.target.value }))}
                                    />
                                </div>
                                <div className="field">
                                    <label>Diagnóstico</label>
                                    <input
                                        placeholder="Diagnóstico nutricional preliminar..."
                                        value={consultForm.diagnosis}
                                        onChange={e => setConsultForm(c => ({ ...c, diagnosis: e.target.value }))}
                                    />
                                </div>
                                <div className="field">
                                    <label>Recomendaciones médicas</label>
                                    <textarea
                                        placeholder="Pautas específicas para el paciente..."
                                        value={consultForm.recommendations}
                                        onChange={e => setConsultForm(c => ({ ...c, recommendations: e.target.value }))}
                                        rows="2"
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button type="submit" className="btn success" style={{ background: "var(--primary)", border: "none" }}>
                                    Registrar consulta clínica
                                </button>
                            </div>
                        </form>

                        {/* Consultation history timeline */}
                        <div>
                            <h5 style={{ fontWeight: "800", marginBottom: "0.75rem" }}>Historial Clínico</h5>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {patientReports.length > 0 ? (
                                    [...patientReports].reverse().map((report) => (
                                        <div key={report.id} className="panel" style={{ padding: "1rem", border: "1px solid var(--line)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                                <strong>Consulta del: {formatDate(report.date)}</strong>
                                                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                                                    Peso: {report.weight} kg • IMC: {report.bmi} • {report.calories} kcal
                                                </span>
                                            </div>
                                            {report.observations && <p style={{ fontSize: "0.8rem", margin: "0.2rem 0" }}><strong>Obs:</strong> {report.observations}</p>}
                                            {report.diagnosis && <p style={{ fontSize: "0.8rem", margin: "0.2rem 0" }}><strong>Diagnóstico:</strong> {report.diagnosis}</p>}
                                            {report.notes && <p style={{ fontSize: "0.8rem", margin: "0.2rem 0", color: "var(--primary-strong)" }}><strong>Indicaciones:</strong> {report.notes}</p>}
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "1rem" }}>No hay consultas clínicas previas.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. DIETA TAB */}
                {activeTab === "dieta" && (
                    <div style={{ display: "grid", gap: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            <h5 style={{ fontWeight: "800", margin: 0 }}>Plan Alimenticio</h5>
                            <button
                                className="btn success small"
                                type="button"
                                onClick={openCreatePlan}
                                style={{ fontSize: "0.8rem", background: "var(--primary)", border: "none" }}
                            >
                                <i className="bi bi-plus-circle" style={{ marginRight: "0.3rem" }} />
                                Nuevo plan
                            </button>
                        </div>

                        {patientPlans.length > 0 ? (
                            patientPlans.map((plan) => (
                                <div key={plan.id} style={{ padding: "1.25rem", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem", marginBottom: "1rem", gap: "0.75rem", flexWrap: "wrap" }}>
                                        <div>
                                            <strong style={{ fontSize: "1.1rem" }}>{plan.name}</strong>
                                            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)" }}>
                                                Objetivo: {plan.target} | Duración: {plan.duration} semanas
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
                                            <span className="badge" style={{ background: "var(--primary-soft)", color: "var(--primary-strong)" }}>
                                                {plan.calories} kcal
                                            </span>
                                            <button type="button" className="btn secondary small" onClick={() => openViewPlan(plan)} title="Ver">
                                                <i className="bi bi-eye" />
                                            </button>
                                            <button type="button" className="btn ghost small" onClick={() => openEditPlan(plan)} title="Editar">
                                                <i className="bi bi-pencil" />
                                            </button>
                                            <button type="button" className="btn danger small" onClick={() => handleDeletePlan(plan.id)} title="Eliminar">
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                                        {Object.entries(plan.meals || {}).map(([mealKey, foods]) => {
                                            const labelsMap = {
                                                desayuno: "Desayuno",
                                                mediaManana: "Media Mañana",
                                                almuerzo: "Almuerzo",
                                                merienda: "Merienda",
                                                cena: "Cena",
                                                snack: "Snack"
                                            };
                                            return (
                                                <div key={mealKey} style={{ padding: "0.65rem", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--surface-soft)" }}>
                                                    <strong style={{ display: "block", marginBottom: "0.4rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                                                        {labelsMap[mealKey] || mealKey}
                                                    </strong>
                                                    {foods && foods.length > 0 ? (
                                                        <ul style={{ paddingLeft: "1rem", margin: 0, fontSize: "0.8rem", listStyle: "disc" }}>
                                                            {foods.map((food, i) => (
                                                                <li key={i} style={{ marginBottom: "0.25rem" }}>
                                                                    <strong>{food.name || food}</strong>{" "}
                                                                    <span style={{ color: "var(--muted)" }}>({food.qty} {food.unit})</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span style={{ fontStyle: "italic", color: "var(--muted)", fontSize: "0.75rem" }}>Sin alimentos</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: "center", padding: "2rem", border: "1px dashed var(--line)", borderRadius: "var(--radius-lg)" }}>
                                <p style={{ color: "var(--muted)", fontStyle: "italic", marginBottom: "1rem" }}>
                                    El paciente no tiene un plan alimenticio activo.
                                </p>
                                <button type="button" className="btn" onClick={openCreatePlan} style={{ background: "var(--primary)", border: "none" }}>
                                    Crear plan alimenticio
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. SEGUIMIENTO TAB */}
                {activeTab === "seguimiento" && (
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            {weightEvolution && (
                                <div className="panel" style={{ padding: "1rem", border: "1px solid var(--line)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                    <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: weightEvolution.descended ? "#16a34a15" : "#ef444415", color: weightEvolution.descended ? "#16a34a" : "#ef4444", display: "grid", placeItems: "center" }}>
                                        <i className={`bi ${weightEvolution.descended ? 'bi-arrow-down-right' : 'bi-arrow-up-right'}`} />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>EVOLUCIÓN DE PESO</span>
                                        <strong style={{ display: "block" }}>{weightEvolution.text}</strong>
                                    </div>
                                </div>
                            )}
                            <div className="panel" style={{ padding: "1rem", border: "1px solid var(--line)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary-strong)", display: "grid", placeItems: "center" }}>
                                    <i className="bi bi-activity" />
                                </div>
                                <div>
                                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>TOTAL CONSULTAS</span>
                                    <strong style={{ display: "block" }}>{patientReports.length} sesiones</strong>
                                </div>
                            </div>
                        </div>

                        {patientReports.length > 1 ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                                <div className="panel" style={{ padding: "1.25rem", border: "1px solid var(--line)" }}>
                                    <h5 style={{ fontWeight: "700", marginBottom: "1rem" }}>Curva de Peso (kg)</h5>
                                    <div style={{ height: "140px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        <LineChart values={patientReports.map(r => r.weight)} color="var(--primary)" />
                                    </div>
                                </div>
                                <div className="panel" style={{ padding: "1.25rem", border: "1px solid var(--line)" }}>
                                    <h5 style={{ fontWeight: "700", marginBottom: "1rem" }}>Evolución del IMC</h5>
                                    <div style={{ height: "140px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        <LineChart values={patientReports.map(r => r.bmi)} color="var(--secondary)" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "2rem" }}>
                                Se necesitan al menos 2 consultas registradas para graficar el seguimiento del progreso.
                            </p>
                        )}
                    </div>
                )}

                {/* 5. NOTAS TAB */}
                {activeTab === "notas" && (
                    <div style={{ display: "grid", gap: "1rem" }}>
                        <div className="field">
                            <label>Notas Clínicas Privadas (Historial del especialista)</label>
                            <textarea
                                value={notesText}
                                onChange={e => setNotesText(e.target.value)}
                                placeholder="Escribe aquí notas rápidas, antecedentes o síntomas relevantes que no requieran registrarse en la consulta formal..."
                                rows="6"
                            />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => {
                                    handleSaveNotes();
                                    showSuccess("Notas guardadas exitosamente.");
                                }}
                                className="btn success"
                                style={{ background: "var(--primary)", border: "none" }}
                            >
                                Guardar notas clínicas
                            </button>
                        </div>
                    </div>
                )}

            </div>

            <PlanModal
                plan={selectedPlan}
                patients={patients}
                isOpen={planModalOpen}
                onClose={() => setPlanModalOpen(false)}
                onSave={handleSavePlan}
                mode={planModalMode}
            />
            
        </div>
    );
}

export default PatientClinicalPanel;
