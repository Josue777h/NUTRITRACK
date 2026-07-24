import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

// Modals for Specialist Quick Actions
import AddPatientModal from "../components/AddPatientModal";
import AppointmentModal from "../components/AppointmentModal";
import PlanModal from "../components/PlanModal";
import ReportModal from "../components/ReportModal";

function formatDate(dateValue) {
    if (!dateValue) return "";
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function DashboardPage() {
    const navigate = useNavigate();
    const { showSuccess, showWarning } = useToast();
    const { auth, patients, appointments, plans, reports, addPatient, addAppointment, addPlan, addReport } = useApp();

    const isNutri = auth.role === "nutriologo";

    // Modal Visibility States
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Specialist Info
    const currentPatient = useMemo(() => {
        if (auth.role === "usuario") {
            if (!auth.patientId) return null;
            return patients.find((p) => Number(p.id) === Number(auth.patientId)) || null;
        }
        return null;
    }, [auth.patientId, auth.role, patients]);

    const visibleAppointments = useMemo(() => {
        if (auth.role === "usuario") {
            return appointments.filter((item) => item.patientId === auth.patientId);
        }
        return appointments;
    }, [appointments, auth.patientId, auth.role]);

    const upcomingAppointments = useMemo(() => {
        return [...visibleAppointments]
            .filter((item) => item.status !== "Cancelada")
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    }, [visibleAppointments]);

    const getGreetingName = (fullName) => {
        if (!fullName) return "Usuario";
        const parts = fullName.split(" ");
        if (parts[0] === "Dra." || parts[0] === "Dr.") {
            return parts.slice(0, 2).join(" ");
        }
        return parts[0];
    };
    const greetingName = getGreetingName(auth.fullName);

    // Recent activity list (Mocked events for UX)
    const recentActivity = [
        { id: 1, text: "Nueva consulta registrada para Ana Mendoza", time: "Hace 2 horas" },
        { id: 2, text: "Carlos Ruiz confirmó su cita de mañana", time: "Hace 4 horas" },
        { id: 3, text: "Creaste un nuevo plan nutricional deportivo", time: "Ayer" }
    ];

    const getPatientName = (patientId) => patients.find((item) => item.id === patientId)?.name ?? "Paciente";

    // Modals handlers
    const handleSavePatient = async (patientData) => {
        await addPatient(patientData);
        showSuccess("Paciente registrado exitosamente.");
        setIsPatientModalOpen(false);
    };

    const handleSaveAppointment = (apptData) => {
        addAppointment(apptData);
        showSuccess("Cita agendada exitosamente.");
        setIsAppointmentModalOpen(false);
    };

    const handleSavePlan = (planData) => {
        addPlan(planData);
        showSuccess("Plan alimenticio creado exitosamente.");
        setIsPlanModalOpen(false);
    };

    const handleSaveReport = (reportData) => {
        addReport(reportData);
        showSuccess("Consulta registrada exitosamente.");
        setIsReportModalOpen(false);
    };

    // ────────────────────────────────────────────────────────
    // 1. RENDER PARA NUTRIÓLOGO (SPECIALIST)
    // ────────────────────────────────────────────────────────
    if (auth.role === "nutriologo") {
        const todayStr = new Date().toISOString().split("T")[0];
        
        // Filter appointments scheduled for today
        const agendaHoy = upcomingAppointments.filter(a => a.date === todayStr);
        const todayCitas = agendaHoy.length;

        // Patients registered in the last 30 days (Nuevos pacientes del mes)
        const newPatientsCount = patients.filter(p => {
            if (!p.created_at) return true; // fallback
            const created = new Date(p.created_at).getTime();
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            return created > thirtyDaysAgo;
        }).length;

        // Pending follow-ups (citas in status 'pendiente')
        const pendingSeguimientos = appointments.filter(a => a.status?.toLowerCase() === "pendiente").length;

        const metrics = [
            { label: "Pacientes activos", value: patients.length, icon: "bi-people", color: "var(--primary)" },
            { label: "Citas de hoy", value: todayCitas, icon: "bi-calendar-check", color: "var(--secondary)" },
            { label: "Consultas pendientes", value: pendingSeguimientos, icon: "bi-chat-left-dots", color: "#f59e0b" },
            { label: "Nuevos pacientes (mes)", value: newPatientsCount, icon: "bi-person-plus", color: "#8b5cf6" }
        ];

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Greeting Banner */}
                <div className="panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)" }}>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>
                        Buenos días, {greetingName} 👋
                    </h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.4rem" }}>
                        Gestiona tus citas del día, interactúa con tus pacientes y consulta tu agenda clínica.
                    </p>
                </div>

                {/* Quick Actions */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <button
                        onClick={() => setIsPatientModalOpen(true)}
                        className="btn success"
                        style={{ height: "4rem", fontSize: "0.95rem", fontWeight: "600", border: "none" }}
                    >
                        <i className="bi bi-person-plus" />
                        Registrar paciente
                    </button>
                    <button
                        onClick={() => {
                            if (isNutri && (!patients || patients.length === 0)) {
                                showWarning("Primero debes registrar al menos un paciente para agendarle una cita.");
                                setIsPatientModalOpen(true);
                            } else {
                                setIsAppointmentModalOpen(true);
                            }
                        }}
                        className="btn"
                        style={{ height: "4rem", fontSize: "0.95rem", fontWeight: "600", background: "var(--secondary)", border: "none" }}
                    >
                        <i className="bi bi-calendar-plus" />
                        Agendar cita
                    </button>
                    <button
                        onClick={() => {
                            if (isNutri && (!patients || patients.length === 0)) {
                                showWarning("Primero debes registrar al menos un paciente para asignarle un plan.");
                                setIsPatientModalOpen(true);
                            } else {
                                setIsPlanModalOpen(true);
                            }
                        }}
                        className="btn"
                        style={{ height: "4rem", fontSize: "0.95rem", fontWeight: "600", background: "#0b0f19", border: "none" }}
                    >
                        <i className="bi bi-apple" />
                        Crear plan nutricional
                    </button>
                    <button
                        onClick={() => {
                            if (isNutri && (!patients || patients.length === 0)) {
                                showWarning("Primero debes registrar al menos un paciente para registrar una consulta.");
                                setIsPatientModalOpen(true);
                            } else {
                                setIsReportModalOpen(true);
                            }
                        }}
                        className="btn secondary"
                        style={{ height: "4rem", fontSize: "0.95rem", fontWeight: "600" }}
                    >
                        <i className="bi bi-clipboard2-pulse" />
                        Registrar consulta
                    </button>
                </div>

                {/* Metrics Cards */}
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    {metrics.map((stat) => (
                        <div className="panel" key={stat.label} style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid var(--line)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase" }}>{stat.label}</span>
                                <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: `${stat.color}10`, display: "grid", placeItems: "center", color: stat.color }}>
                                    <i className={`bi ${stat.icon}`} style={{ fontSize: "1rem" }} />
                                </div>
                            </div>
                            <strong style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--text)" }}>{stat.value}</strong>
                        </div>
                    ))}
                </div>

                {/* Two Column Layout: Agenda vs Activity */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                    {/* Agenda del Día */}
                    <div className="panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h4 style={{ fontWeight: "700", margin: 0 }}>Agenda del Día</h4>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{formatDate(todayStr)}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {agendaHoy.length ? (
                                agendaHoy.map((item) => (
                                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--surface-soft)" }}>
                                        <div>
                                            <strong style={{ display: "block", fontSize: "0.85rem" }}>{getPatientName(item.patientId)}</strong>
                                            <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}><i className="bi bi-clock" /> {item.time} ({item.duration} min)</span>
                                        </div>
                                        <span className={`status-pill status-${item.status === 'Confirmada' ? 'success' : 'warning'}`} style={{ fontSize: "0.65rem" }}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "1.5rem 0", fontSize: "0.8rem" }}>No tienes citas agendadas para hoy.</p>
                            )}
                        </div>
                    </div>

                    {/* Actividad Reciente */}
                    <div className="panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)" }}>
                        <h4 style={{ fontWeight: "700", marginBottom: "1rem" }}>Actividad Reciente</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {recentActivity.map((activity) => (
                                <div key={activity.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.4rem 0" }}>
                                    <i className="bi bi-lightning" style={{ color: "var(--primary)", marginTop: "0.25rem" }} />
                                    <div>
                                        <p style={{ fontSize: "0.8rem", margin: 0, color: "var(--text)" }}>{activity.text}</p>
                                        <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{activity.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <AddPatientModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} />
                <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} onSave={handleSaveAppointment} patients={patients} mode="add" />
                <PlanModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} onSave={handleSavePlan} patients={patients} mode="add" />
                <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSave={handleSaveReport} patients={patients} mode="add" />
            </div>
        );
    }

    // ────────────────────────────────────────────────────────
    // 2. RENDER PARA PACIENTE (USER) - EXTREMADAMENTE SIMPLE
    // ────────────────────────────────────────────────────────
    const nextAppt = upcomingAppointments[0];

    // Calculate weight progress or difference if reports exist
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
            return diff < 0 ? `Has bajado ${Math.abs(diff)} kg` : diff > 0 ? `Has subido ${diff} kg` : "Sin variaciones";
        }
        return "Medición inicial registrada";
    }, [patientReports]);

    if (auth.role === "usuario" && !currentPatient) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "650px", margin: "0 auto" }}>
                <div className="panel" style={{ padding: "2rem 1.5rem", borderRadius: "var(--radius-lg)", border: "none", background: "linear-gradient(135deg, var(--primary-soft) 0%, var(--surface) 100%)", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.04)", textAlign: "center" }}>
                    <h3 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--primary-strong)", margin: 0 }}>
                        ¡Hola, {auth.fullName?.split(" ")[0] || "Paciente"}! 👋
                    </h3>
                    <p style={{ color: "var(--text-light)", fontSize: "0.95rem", marginTop: "0.5rem" }}>
                        Te damos la bienvenida a tu portal de salud NutriTrack.
                    </p>
                </div>
                
                <div className="panel" style={{ padding: "2rem 1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", textAlign: "center" }}>
                    <i className="bi bi-person-exclamation" style={{ fontSize: "3rem", color: "var(--muted)", display: "block", marginBottom: "1rem" }} />
                    <h4 style={{ fontWeight: "700", marginBottom: "0.5rem" }}>Esperando Ficha Clínica</h4>
                    <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: "1.4" }}>
                        Aún no se ha enlazado una ficha clínica de paciente para tu correo electrónico. 
                        Pídele a tu nutriólogo que te registre en su directorio usando tu correo <strong>{auth.username}</strong> para poder ver tus dietas y reportes aquí.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "650px", margin: "0 auto" }}>
            
            {/* Bienvenida */}
            <div className="panel" style={{ padding: "2rem 1.5rem", borderRadius: "var(--radius-lg)", border: "none", background: "linear-gradient(135deg, var(--primary-soft) 0%, var(--surface) 100%)", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.04)" }}>
                <h3 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--primary-strong)", margin: 0 }}>
                    ¡Hola, {auth.fullName?.split(" ")[0] || "Paciente"}! 👋
                </h3>
                <p style={{ color: "var(--text-light)", fontSize: "0.95rem", marginTop: "0.5rem" }}>
                    Te damos la bienvenida a tu portal de salud NutriTrack.
                </p>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Próxima Cita */}
                <div className="panel" style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)" }}>
                    <span style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Próxima Cita</span>
                    <strong style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text)", display: "block" }}>
                        {nextAppt ? `${formatDate(nextAppt.date)}` : "Sin agendar"}
                    </strong>
                    {nextAppt && (
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginTop: "0.15rem" }}>
                            a las {nextAppt.time}
                        </span>
                    )}
                </div>

                {/* Peso Actual */}
                <div className="panel" style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)" }}>
                    <span style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Peso Actual</span>
                    <strong style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)" }}>
                        {currentPatient ? `${currentPatient.weight} kg` : "—"}
                    </strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginTop: "0.15rem" }}>
                        Estatura: {currentPatient ? `${currentPatient.height} cm` : "—"}
                    </span>
                </div>

                {/* Objetivo */}
                <div className="panel" style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)" }}>
                    <span style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Mi Objetivo</span>
                    <strong style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--primary-strong)" }}>
                        {currentPatient?.target || "Control Calórico"}
                    </strong>
                </div>

                {/* Último progreso */}
                <div className="panel" style={{ padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)" }}>
                    <span style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Último Progreso</span>
                    <strong style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text)" }}>
                        {latestProgressText}
                    </strong>
                </div>
            </div>

            {/* Action Button: Ver Plan Alimenticio */}
            <button
                onClick={() => navigate("/planes")}
                className="btn success large"
                style={{ width: "100%", height: "4.5rem", borderRadius: "var(--radius-lg)", fontSize: "1.1rem", fontWeight: "700", display: "flex", gap: "0.75rem", background: "var(--primary)", border: "none", boxShadow: "var(--shadow)" }}
            >
                <i className="bi bi-apple" style={{ fontSize: "1.3rem" }} />
                Ver mi plan alimenticio
            </button>
            
        </div>
    );
}

export default DashboardPage;
