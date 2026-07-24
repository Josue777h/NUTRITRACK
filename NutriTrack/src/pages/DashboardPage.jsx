import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

import AddPatientModal    from "../components/AddPatientModal";
import AppointmentModal   from "../components/AppointmentModal";
import PlanModal          from "../components/PlanModal";
import ReportModal        from "../components/ReportModal";

function formatDate(dateValue) {
    if (!dateValue) return "";
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
}

function DashboardPage() {
    const navigate = useNavigate();
    const { showSuccess, showWarning } = useToast();
    const { auth, patients, appointments, plans, reports,
            addPatient, addAppointment, addPlan, addReport } = useApp();

    const isNutri = auth.role === "nutriologo";

    const [isPatientModalOpen,     setIsPatientModalOpen]     = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isPlanModalOpen,        setIsPlanModalOpen]        = useState(false);
    const [isReportModalOpen,      setIsReportModalOpen]      = useState(false);

    const currentPatient = useMemo(() => {
        if (auth.role !== "usuario" || !auth.patientId) return null;
        return patients.find((p) => Number(p.id) === Number(auth.patientId)) ?? null;
    }, [auth.patientId, auth.role, patients]);

    const visibleAppointments = useMemo(() => {
        if (auth.role === "usuario") return appointments.filter((a) => a.patientId === auth.patientId);
        return appointments;
    }, [appointments, auth.patientId, auth.role]);

    const upcomingAppointments = useMemo(() => {
        return [...visibleAppointments]
            .filter((a) => a.status !== "Cancelada")
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    }, [visibleAppointments]);

    const getFirstName = (fullName) => {
        if (!fullName) return "Usuario";
        const parts = fullName.split(" ");
        return parts[0] === "Dra." || parts[0] === "Dr." ? parts.slice(0, 2).join(" ") : parts[0];
    };

    const greetingName = getFirstName(auth.fullName);
    const getPatientName = (id) => patients.find((p) => p.id === id)?.name ?? "Paciente";

    /* ── Handlers ── */
    const handleSavePatient     = async (d) => { await addPatient(d); showSuccess("Paciente registrado."); setIsPatientModalOpen(false); };
    const handleSaveAppointment = (d) => { addAppointment(d); showSuccess("Cita agendada."); setIsAppointmentModalOpen(false); };
    const handleSavePlan        = (d) => { addPlan(d); showSuccess("Plan creado."); setIsPlanModalOpen(false); };
    const handleSaveReport      = (d) => { addReport(d); showSuccess("Consulta registrada."); setIsReportModalOpen(false); };

    const openAppointmentModal = () => {
        if (!patients.length) { showWarning("Primero registra un paciente."); setIsPatientModalOpen(true); }
        else setIsAppointmentModalOpen(true);
    };
    const openPlanModal = () => {
        if (!patients.length) { showWarning("Primero registra un paciente."); setIsPatientModalOpen(true); }
        else setIsPlanModalOpen(true);
    };
    const openReportModal = () => {
        if (!patients.length) { showWarning("Primero registra un paciente."); setIsPatientModalOpen(true); }
        else setIsReportModalOpen(true);
    };

    /* ================================================================
       NUTRIÓLOGO DASHBOARD
       ================================================================ */
    if (isNutri) {
        const todayStr = new Date().toISOString().split("T")[0];
        const agendaHoy = upcomingAppointments.filter((a) => a.date === todayStr);

        const newPatientsCount = patients.filter((p) => {
            if (!p.created_at) return true;
            return new Date(p.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
        }).length;

        const pendingSeguimientos = appointments.filter(
            (a) => a.status?.toLowerCase() === "pendiente"
        ).length;

        const metrics = [
            { label: "Pacientes activos", value: patients.length,     icon: "bi-people",        color: "var(--primary)" },
            { label: "Citas de hoy",      value: agendaHoy.length,    icon: "bi-calendar-check", color: "var(--secondary)" },
            { label: "Pendientes",        value: pendingSeguimientos, icon: "bi-chat-left-dots",  color: "var(--accent)" },
            { label: "Nuevos (mes)",      value: newPatientsCount,    icon: "bi-person-plus",     color: "#8b5cf6" },
        ];

        const actions = [
            { label: "Registrar paciente", icon: "bi-person-plus",      bg: "var(--primary)",   onClick: () => setIsPatientModalOpen(true) },
            { label: "Agendar cita",       icon: "bi-calendar-plus",    bg: "var(--secondary)", onClick: openAppointmentModal },
            { label: "Crear plan",         icon: "bi-apple",            bg: "#7c3aed",          onClick: openPlanModal },
            { label: "Registrar consulta", icon: "bi-clipboard2-pulse", bg: "#0ea5e9",          onClick: openReportModal },
        ];

        return (
            <div className="dash-grid">
                {/* Greeting */}
                <div className="dash-greeting">
                    <h3>{getGreeting()}, {greetingName} 👋</h3>
                    <p>Gestiona tus citas del día, interactúa con tus pacientes y consulta tu agenda clínica.</p>
                </div>

                {/* Quick Actions — 2 columns on mobile, 4 on desktop */}
                <div className="dash-actions-grid">
                    {actions.map((a) => (
                        <button
                            key={a.label}
                            className="dash-action-btn"
                            style={{ background: a.bg }}
                            onClick={a.onClick}
                            type="button"
                        >
                            <i className={`bi ${a.icon}`} />
                            {a.label}
                        </button>
                    ))}
                </div>

                {/* Metrics — 2 columns on mobile, 4 on desktop */}
                <div className="dash-metrics-grid">
                    {metrics.map((m) => (
                        <div key={m.label} className="metric-card">
                            <div className="metric-card-label">
                                <span>{m.label}</span>
                                <div
                                    className="metric-card-icon"
                                    style={{ background: `${m.color}18`, color: m.color }}
                                >
                                    <i className={`bi ${m.icon}`} />
                                </div>
                            </div>
                            <strong className="metric-card-value">{m.value}</strong>
                        </div>
                    ))}
                </div>

                {/* Agenda + Próximas — stacks on mobile, side-by-side on desktop */}
                <div className="dash-two-col">
                    {/* Agenda del Día */}
                    <div className="panel">
                        <div className="panel-header">
                            <div>
                                <h4 className="panel-title">Agenda del Día</h4>
                                <p className="panel-subtitle">{formatDate(todayStr)}</p>
                            </div>
                            <span className="badge primary">{agendaHoy.length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            {agendaHoy.length ? agendaHoy.map((item) => (
                                <div key={item.id} className="agenda-item">
                                    <div>
                                        <span className="agenda-item-name">{getPatientName(item.patientId)}</span>
                                        <span className="agenda-item-time">
                                            <i className="bi bi-clock" /> {item.time}
                                            {item.duration ? ` · ${item.duration} min` : ""}
                                        </span>
                                    </div>
                                    <span className={`status-pill ${item.status === "Confirmada" ? "confirmada" : "pendiente"}`}>
                                        {item.status}
                                    </span>
                                </div>
                            )) : (
                                <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "1.25rem 0", fontSize: "0.82rem" }}>
                                    No hay citas para hoy.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Próximas citas */}
                    <div className="panel">
                        <div className="panel-header">
                            <h4 className="panel-title">Próximas citas</h4>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            {upcomingAppointments.slice(0, 4).length ? upcomingAppointments.slice(0, 4).map((item) => (
                                <div key={item.id} className="agenda-item">
                                    <div>
                                        <span className="agenda-item-name">{getPatientName(item.patientId)}</span>
                                        <span className="agenda-item-time">
                                            <i className="bi bi-calendar3" /> {formatDate(item.date)} · {item.time}
                                        </span>
                                    </div>
                                    <span className={`status-pill ${item.status?.toLowerCase() === "confirmada" ? "confirmada" : "pendiente"}`}>
                                        {item.status}
                                    </span>
                                </div>
                            )) : (
                                <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "1.25rem 0", fontSize: "0.82rem" }}>
                                    Sin próximas citas.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <AddPatientModal   isOpen={isPatientModalOpen}     onClose={() => setIsPatientModalOpen(false)}     onSave={handleSavePatient} />
                <AppointmentModal  isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} onSave={handleSaveAppointment} patients={patients} mode="add" />
                <PlanModal         isOpen={isPlanModalOpen}        onClose={() => setIsPlanModalOpen(false)}        onSave={handleSavePlan}        patients={patients} mode="add" />
                <ReportModal       isOpen={isReportModalOpen}      onClose={() => setIsReportModalOpen(false)}      onSave={handleSaveReport}      patients={patients} mode="add" />
            </div>
        );
    }

    /* ================================================================
       PACIENTE DASHBOARD
       ================================================================ */
    const nextAppt = upcomingAppointments[0];

    const patientReports = useMemo(() => {
        if (!auth.patientId) return [];
        return reports
            .filter((r) => Number(r.patientId) === Number(auth.patientId))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [reports, auth.patientId]);

    const latestProgressText = useMemo(() => {
        if (patientReports.length >= 2) {
            const last = patientReports[patientReports.length - 1];
            const prev = patientReports[patientReports.length - 2];
            const diff = Number((last.weight - prev.weight).toFixed(1));
            return diff < 0 ? `Bajaste ${Math.abs(diff)} kg` : diff > 0 ? `Subiste ${diff} kg` : "Sin variaciones";
        }
        return "Medición inicial";
    }, [patientReports]);

    /* No hay ficha clínica todavía */
    if (!currentPatient) {
        return (
            <div className="dash-grid" style={{ maxWidth: 640, margin: "0 auto" }}>
                <div className="patient-welcome">
                    <h3>¡Hola, {getFirstName(auth.fullName)}! 👋</h3>
                    <p>Bienvenido a tu portal de salud NutriTrack.</p>
                </div>
                <div className="panel" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                    <i className="bi bi-person-exclamation" style={{ fontSize: "3rem", color: "var(--muted)", display: "block", marginBottom: "1rem" }} />
                    <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Esperando Ficha Clínica</h4>
                    <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5, maxWidth: "38ch", margin: "0 auto" }}>
                        Pídele a tu nutriólogo que te registre en su directorio usando el correo{" "}
                        <strong>{auth.username}</strong> para ver tus datos aquí.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="dash-grid" style={{ maxWidth: 640, margin: "0 auto" }}>
            {/* Bienvenida */}
            <div className="patient-welcome">
                <h3>¡Hola, {getFirstName(auth.fullName)}! 👋</h3>
                <p>Bienvenido a tu portal de salud NutriTrack.</p>
            </div>

            {/* Metrics 2×2 — stays 2 columns on all sizes */}
            <div className="dash-metrics-grid">
                {/* Próxima cita */}
                <div className="metric-card">
                    <div className="metric-card-label">
                        <span>Próxima cita</span>
                        <div className="metric-card-icon" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                            <i className="bi bi-calendar-heart" />
                        </div>
                    </div>
                    <strong className="metric-card-value" style={{ fontSize: "1.05rem", letterSpacing: 0, lineHeight: 1.2 }}>
                        {nextAppt ? formatDate(nextAppt.date) : "Sin agendar"}
                    </strong>
                    {nextAppt && (
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>a las {nextAppt.time}</span>
                    )}
                </div>

                {/* Peso */}
                <div className="metric-card">
                    <div className="metric-card-label">
                        <span>Peso actual</span>
                        <div className="metric-card-icon" style={{ background: "var(--secondary-soft)", color: "var(--secondary)" }}>
                            <i className="bi bi-activity" />
                        </div>
                    </div>
                    <strong className="metric-card-value">
                        {currentPatient?.weight ? `${currentPatient.weight} kg` : "—"}
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                        Estatura: {currentPatient?.height ? `${currentPatient.height} cm` : "—"}
                    </span>
                </div>

                {/* Objetivo */}
                <div className="metric-card">
                    <div className="metric-card-label">
                        <span>Mi objetivo</span>
                        <div className="metric-card-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                            <i className="bi bi-bullseye" />
                        </div>
                    </div>
                    <strong className="metric-card-value" style={{ fontSize: "1rem", letterSpacing: 0, lineHeight: 1.3 }}>
                        {currentPatient?.target || "Control Calórico"}
                    </strong>
                </div>

                {/* Progreso */}
                <div className="metric-card">
                    <div className="metric-card-label">
                        <span>Último progreso</span>
                        <div className="metric-card-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
                            <i className="bi bi-graph-up" />
                        </div>
                    </div>
                    <strong className="metric-card-value" style={{ fontSize: "0.95rem", letterSpacing: 0, lineHeight: 1.3 }}>
                        {latestProgressText}
                    </strong>
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={() => navigate("/planes")}
                className="btn large"
                style={{ width: "100%", justifyContent: "center", gap: "0.75rem", fontSize: "1rem" }}
            >
                <i className="bi bi-apple" style={{ fontSize: "1.2rem" }} />
                Ver mi plan alimenticio
            </button>
        </div>
    );
}

export default DashboardPage;
