import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function formatDate(dateValue) {
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function DashboardPage() {
    const navigate = useNavigate();
    const { auth, patients, appointments, plans, reports } = useApp();

    const visibleAppointments = useMemo(() => {
        if (auth.role === "usuario") {
            return appointments.filter((item) => item.patientId === auth.patientId);
        }
        return appointments;
    }, [appointments, auth.patientId, auth.role]);

    const visiblePlans = useMemo(() => {
        if (auth.role === "usuario") {
            return plans.filter((item) => item.patientId === auth.patientId);
        }
        return plans;
    }, [plans, auth.patientId, auth.role]);

    const visibleReports = useMemo(() => {
        if (auth.role === "usuario") {
            return reports.filter((item) => item.patientId === auth.patientId);
        }
        return reports;
    }, [reports, auth.patientId, auth.role]);

    const progressPercent = useMemo(() => {
        if (!visibleReports.length) {
            return 0;
        }

        if (auth.role === "usuario") {
            const sorted = [...visibleReports].sort((a, b) => a.date.localeCompare(b.date));
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const start = first.weight || 1;
            const diff = Math.max(0, start - last.weight);
            return Math.min(100, Math.round((diff / start) * 100 * 3));
        }

        const grouped = patients.map((patient) => {
            const patientReports = visibleReports
                .filter((item) => item.patientId === patient.id)
                .sort((a, b) => a.date.localeCompare(b.date));

            if (patientReports.length < 2) {
                return false;
            }
            return patientReports[patientReports.length - 1].bmi <= patientReports[0].bmi;
        });

        const positive = grouped.filter(Boolean).length;
        return Math.round((positive / (grouped.length || 1)) * 100);
    }, [auth.role, patients, visibleReports]);

    const stats = auth.role === "nutriologo"
        ? [
              { label: "Pacientes registrados", value: patients.length, icon: "bi-people-fill" },
              {
                  label: "Citas activas",
                  value: visibleAppointments.filter((item) => item.status !== "Cancelada").length,
                  icon: "bi-calendar-check-fill"
              },
              { label: "Planes activos", value: visiblePlans.length, icon: "bi-clipboard2-pulse-fill" }
          ]
        : [
              {
                  label: "Mis citas",
                  value: visibleAppointments.filter((item) => item.status !== "Cancelada").length,
                  icon: "bi-calendar-check-fill"
              },
              { label: "Mis planes", value: visiblePlans.length, icon: "bi-apple" },
              {
                  label: "Controles registrados",
                  value: visibleReports.length,
                  icon: "bi-graph-up-arrow"
              }
          ];

    const quickActions = auth.role === "nutriologo"
        ? [
              { label: "Gestionar pacientes", path: "/pacientes", icon: "bi-people" },
              { label: "Administrar citas", path: "/citas", icon: "bi-calendar3" },
              { label: "Crear plan", path: "/planes", icon: "bi-apple" },
              { label: "Ver reportes", path: "/reportes", icon: "bi-bar-chart-line" }
          ]
        : [
              { label: "Mis citas", path: "/citas", icon: "bi-calendar3" },
              { label: "Mi plan", path: "/planes", icon: "bi-apple" },
              { label: "Mi seguimiento", path: "/reportes", icon: "bi-bar-chart-line" },
              { label: "Mi perfil", path: "/perfil", icon: "bi-person-circle" }
          ];

    const upcoming = [...visibleAppointments]
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
        .slice(0, 3);

    const getPatientName = (patientId) => patients.find((item) => item.id === patientId)?.name ?? "Paciente";

    return (
        <>
            <article className="panel">
                <div className="panel-header">
                    <div>
                        <h3 className="panel-title">Bienvenido, {auth.fullName}</h3>
                        <p className="panel-subtitle">
                            {auth.role === "nutriologo"
                                ? "Vista general de pacientes, citas y adherencia nutricional."
                                : "Consulta tu avance nutricional y gestiona tus interacciones."}
                        </p>
                    </div>
                    <span className="badge">
                        <i className="bi bi-check2-circle" />
                        Sesion activa
                    </span>
                </div>
                <div className="stats-grid">
                    {stats.map((stat) => (
                        <article className="stat-card" key={stat.label}>
                            <i className={`bi ${stat.icon} icon`} />
                            <p className="label">{stat.label}</p>
                            <p className="value">{stat.value}</p>
                        </article>
                    ))}
                </div>
                <div className="quick-actions">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            className="btn secondary"
                            type="button"
                            onClick={() => navigate(action.path)}
                        >
                            <i className={`bi ${action.icon}`} />
                            {action.label}
                        </button>
                    ))}
                </div>
            </article>

            <section className="split-layout">
                <article className="panel">
                    <div className="panel-header">
                        <h3 className="panel-title">Progreso general</h3>
                        <span className="badge">Actualizado</span>
                    </div>
                    <div className="progress-box">
                        <div className="progress-ring" style={{ "--progress": `${progressPercent}%` }}>
                            <span className="progress-value">{progressPercent}%</span>
                        </div>
                        <div className="metric-list">
                            <article className="metric-item">
                                <span>Registros de seguimiento</span>
                                <strong>{visibleReports.length}</strong>
                            </article>
                            <article className="metric-item">
                                <span>Citas pendientes</span>
                                <strong>
                                    {visibleAppointments.filter((item) => item.status === "Pendiente").length}
                                </strong>
                            </article>
                            <article className="metric-item">
                                <span>Ultimo control</span>
                                <strong>
                                    {visibleReports.length
                                        ? formatDate(
                                              [...visibleReports].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0]
                                                  .date
                                          )
                                        : "Sin datos"}
                                </strong>
                            </article>
                            <article className="metric-item">
                                <span>Estado general</span>
                                <strong>{progressPercent >= 50 ? "Favorable" : "En proceso"}</strong>
                            </article>
                        </div>
                    </div>
                </article>

                <article className="panel">
                    <div className="panel-header">
                        <h3 className="panel-title">
                            {auth.role === "nutriologo" ? "Proximas citas" : "Mis proximas citas"}
                        </h3>
                    </div>
                    <div className="simple-list">
                        {upcoming.length ? (
                            upcoming.map((item) => (
                                <article key={item.id}>
                                    <h4>
                                        {formatDate(item.date)} - {item.time}
                                    </h4>
                                    <p>
                                        {auth.role === "nutriologo" ? getPatientName(item.patientId) : item.notes}
                                    </p>
                                    <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                                </article>
                            ))
                        ) : (
                            <p className="empty-state">No hay citas registradas.</p>
                        )}
                    </div>
                </article>
            </section>
        </>
    );
}

export default DashboardPage;
