import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import AppointmentModal from "../components/AppointmentModal";

const STATUS_MAP = {
    pendiente:  { label: "Pendiente",  icon: "bi-clock",            stripe: "var(--warning)" },
    confirmada: { label: "Confirmada", icon: "bi-check-circle-fill", stripe: "var(--success)" },
    completada: { label: "Completada", icon: "bi-check2-all",        stripe: "var(--info)" },
    cancelada:  { label: "Cancelada",  icon: "bi-x-circle-fill",     stripe: "var(--danger)" },
};

const STATUS_PILL_CLASS = {
    pendiente:  "pendiente",
    confirmada: "confirmada",
    completada: "completada",
    cancelada:  "cancelada",
};

const TYPE_LABELS = {
    consulta:       { label: "Primera Consulta",          icon: "bi-calendar-heart" },
    seguimiento:    { label: "Control y Seguimiento",     icon: "bi-graph-up" },
    antropometria:  { label: "Evaluación Antropométrica", icon: "bi-rulers" },
    planificacion:  { label: "Revisión de Plan",          icon: "bi-journal-check" },
};

const FILTERS = [
    { key: "todas",     label: "Todas",     icon: "bi-calendar3" },
    { key: "pendiente", label: "Pendientes",icon: "bi-clock" },
    { key: "confirmada",label: "Confirmadas",icon: "bi-check-circle" },
    { key: "completada",label: "Completadas",icon: "bi-check2-all" },
    { key: "cancelada", label: "Canceladas", icon: "bi-x-circle" },
];

function formatDate(dateValue) {
    if (!dateValue) return "—";
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
    });
}

function AppointmentCard({ slot, isNutri, patientName, onView, onEdit, onConfirm, onCancel }) {
    const statusKey = slot.status?.toLowerCase() ?? "pendiente";
    const si  = STATUS_MAP[statusKey] ?? STATUS_MAP.pendiente;
    const pillClass = STATUS_PILL_CLASS[statusKey] ?? "pendiente";
    const typeInfo  = TYPE_LABELS[slot.type] ?? { label: slot.type || "Consulta Nutricional", icon: "bi-calendar-event" };

    const isMutable = statusKey !== "cancelada" && statusKey !== "completada";

    return (
        <article className="appt-card-v2">
            {/* Header: fecha + estado */}
            <div className="appt-card-header">
                <div className="appt-date-block">
                    <div className="appt-calendar-icon">
                        <i className="bi bi-calendar-event-fill" />
                    </div>
                    <div className="appt-date-text">
                        <h4>{formatDate(slot.date)}</h4>
                        <span>
                            <i className="bi bi-clock" />
                            {slot.time}
                            {slot.duration ? ` · ${slot.duration} min` : ""}
                        </span>
                    </div>
                </div>
                <span className={`status-pill ${pillClass}`}>
                    <i className={`bi ${si.icon}`} />
                    {si.label}
                </span>
            </div>

            {/* Details box */}
            <div className="appt-details-box">
                {isNutri && (
                    <div className="appt-patient-row">
                        <i className="bi bi-person-circle" style={{ color: "var(--primary)" }} />
                        {patientName}
                    </div>
                )}
                <div className="appt-type-row">
                    <i className={`bi ${typeInfo.icon}`} />
                    {typeInfo.label}
                </div>
                {slot.reason && (
                    <div className="appt-reason-row">
                        <strong>Motivo: </strong>{slot.reason}
                    </div>
                )}
            </div>

            {/* Notes */}
            {slot.notes && (
                <p className="appt-notes-row">
                    <i className="bi bi-chat-left-quote" />
                    {slot.notes}
                </p>
            )}

            {/* Actions */}
            <div className="appt-actions-row">
                <button className="btn secondary small" type="button" onClick={onView}>
                    <i className="bi bi-eye" /> Detalles
                </button>
                {isNutri && (
                    <>
                        {statusKey === "pendiente" && (
                            <button className="btn success small" type="button" onClick={onConfirm}>
                                <i className="bi bi-check-circle" /> Confirmar
                            </button>
                        )}
                        <button className="btn ghost small" type="button" onClick={onEdit}>
                            <i className="bi bi-pencil" /> Editar
                        </button>
                        {isMutable && (
                            <button className="btn danger small" type="button" onClick={onCancel}>
                                <i className="bi bi-x-circle" /> Cancelar
                            </button>
                        )}
                    </>
                )}
            </div>
        </article>
    );
}

function AppointmentsPage() {
    const { auth, patients, appointments, addAppointment, updateAppointment, cancelAppointment } = useApp();
    const { showSuccess, showWarning } = useToast();
    const isNutri = auth.role === "nutriologo";

    const [isModalOpen,    setIsModalOpen]    = useState(false);
    const [selectedAppt,   setSelectedAppt]   = useState(null);
    const [modalMode,      setModalMode]      = useState("view");
    const [activeFilter,   setActiveFilter]   = useState("todas");
    const [searchQuery,    setSearchQuery]    = useState("");

    const allVisible = useMemo(() => {
        const source = isNutri
            ? appointments
            : appointments.filter((a) => Number(a.patientId) === Number(auth.patientId));
        return [...source].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    }, [appointments, auth.patientId, isNutri]);

    const filteredAppointments = useMemo(() => {
        let list = allVisible;
        if (activeFilter !== "todas") {
            list = list.filter((a) => a.status?.toLowerCase() === activeFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((a) => {
                const name = patients.find((p) => p.id === a.patientId)?.name ?? "";
                return (
                    name.toLowerCase().includes(q) ||
                    formatDate(a.date).toLowerCase().includes(q) ||
                    (a.type ?? "").toLowerCase().includes(q)
                );
            });
        }
        return list;
    }, [allVisible, activeFilter, searchQuery, patients]);

    const getPatientName = (id) => patients.find((p) => p.id === id)?.name ?? "Paciente";

    const upcoming = filteredAppointments.filter(
        (a) => a.status?.toLowerCase() !== "cancelada" && a.status?.toLowerCase() !== "completada"
    );
    const past = filteredAppointments.filter(
        (a) => a.status?.toLowerCase() === "completada" || a.status?.toLowerCase() === "cancelada"
    );

    const openModal = (mode, appt = null) => {
        if (mode === "add" && isNutri && (!patients || patients.length === 0)) {
            showWarning("Primero registra al menos un paciente para agendar una cita.");
            return;
        }
        setSelectedAppt(appt);
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAppt(null);
        setModalMode("view");
    };

    const handleSave = (data) => {
        if (modalMode === "add") {
            addAppointment(data);
            showSuccess("Cita agendada correctamente.");
        } else {
            updateAppointment(data.id, data);
            showSuccess("Cita actualizada correctamente.");
        }
    };

    const handleDelete = (id) => {
        cancelAppointment(id);
        showWarning("Cita cancelada.");
        closeModal();
    };

    return (
        <section className="single-panel">
            <article className="panel">
                {/* ── Header ── */}
                <div className="panel-header">
                    <div>
                        <h3 className="panel-title">
                            <i className="bi bi-calendar3-event-fill" style={{ color: "var(--primary)", marginRight: "0.5rem" }} />
                            {isNutri ? "Agenda de citas" : "Mis citas"}
                        </h3>
                        <p className="panel-subtitle">
                            {isNutri
                                ? "Administra, agenda y gestiona todas las citas con tus pacientes."
                                : "Consulta las citas agendadas por tu nutricionista."}
                        </p>
                    </div>
                    {isNutri && (
                        <button className="btn" type="button" onClick={() => openModal("add")}>
                            <i className="bi bi-calendar-plus" />
                            Agregar cita
                        </button>
                    )}
                </div>

                {/* ── Search + Filter bar ── */}
                {allVisible.length > 0 && (
                    <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {/* Search input */}
                        {isNutri && (
                            <div className="field" style={{ maxWidth: "320px", margin: 0 }}>
                                <div style={{ position: "relative" }}>
                                    <i className="bi bi-search" style={{
                                        position: "absolute", left: "0.75rem", top: "50%",
                                        transform: "translateY(-50%)", color: "var(--muted)", fontSize: "0.85rem"
                                    }} />
                                    <input
                                        type="search"
                                        placeholder="Buscar paciente, fecha..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ paddingLeft: "2.2rem" }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Filter pills */}
                        <div className="filter-pills-bar">
                            {FILTERS.map((f) => {
                                const count = f.key === "todas"
                                    ? allVisible.length
                                    : allVisible.filter((a) => a.status?.toLowerCase() === f.key).length;
                                return (
                                    <button
                                        key={f.key}
                                        type="button"
                                        className={`filter-pill${activeFilter === f.key ? " active" : ""}`}
                                        onClick={() => setActiveFilter(f.key)}
                                    >
                                        <i className={`bi ${f.icon}`} />
                                        {f.label}
                                        {count > 0 && (
                                            <span style={{
                                                background: activeFilter === f.key ? "rgba(255,255,255,0.25)" : "var(--surface-elevated)",
                                                color: activeFilter === f.key ? "#fff" : "var(--muted)",
                                                borderRadius: "999px",
                                                padding: "0 0.4rem",
                                                fontSize: "0.7rem",
                                                fontWeight: 800,
                                                minWidth: "1.2rem",
                                                textAlign: "center",
                                                lineHeight: "1.5",
                                            }}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Upcoming ── */}
                {upcoming.length > 0 && (
                    <>
                        <p className="appt-section-label">
                            <i className="bi bi-calendar3-event-fill" />
                            {isNutri ? "Próximas y activas" : "Mis próximas citas"}
                            <span className="appt-count">{upcoming.length}</span>
                        </p>
                        <div className="appt-grid" style={{ marginBottom: past.length > 0 ? "1.75rem" : 0 }}>
                            {upcoming.map((slot) => (
                                <AppointmentCard
                                    key={slot.id}
                                    slot={slot}
                                    isNutri={isNutri}
                                    patientName={getPatientName(slot.patientId)}
                                    onView={() => openModal("view", slot)}
                                    onEdit={() => openModal("edit", slot)}
                                    onConfirm={() => {
                                        updateAppointment(slot.id, { ...slot, status: "Confirmada" });
                                        showSuccess("Cita confirmada.");
                                    }}
                                    onCancel={() => handleDelete(slot.id)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* ── History ── */}
                {past.length > 0 && (
                    <>
                        <p className="appt-section-label">
                            <i className="bi bi-clock-history" />
                            Historial
                            <span className="appt-count">{past.length}</span>
                        </p>
                        <div className="appt-grid">
                            {past.map((slot) => (
                                <AppointmentCard
                                    key={slot.id}
                                    slot={slot}
                                    isNutri={isNutri}
                                    patientName={getPatientName(slot.patientId)}
                                    onView={() => openModal("view", slot)}
                                    onEdit={() => openModal("edit", slot)}
                                    onConfirm={() => {}}
                                    onCancel={() => handleDelete(slot.id)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* ── Empty state ── */}
                {filteredAppointments.length === 0 && (
                    <div className="empty-state-block">
                        <div className="empty-state-icon">
                            <i className="bi bi-calendar3-event" />
                        </div>
                        <h4>
                            {activeFilter !== "todas"
                                ? `Sin citas ${FILTERS.find((f) => f.key === activeFilter)?.label.toLowerCase()}`
                                : "No hay citas registradas"}
                        </h4>
                        <p>
                            {isNutri
                                ? "Agrega la primera cita para comenzar a gestionar tu agenda."
                                : "Aquí aparecerán tus citas agendadas por tu nutricionista."}
                        </p>
                        {isNutri && activeFilter === "todas" && (
                            <button className="btn" onClick={() => openModal("add")}>
                                <i className="bi bi-calendar-plus" />
                                Agregar primera cita
                            </button>
                        )}
                        {activeFilter !== "todas" && (
                            <button className="btn secondary" onClick={() => setActiveFilter("todas")}>
                                <i className="bi bi-x-circle" />
                                Ver todas
                            </button>
                        )}
                    </div>
                )}
            </article>

            <AppointmentModal
                appointment={selectedAppt}
                patients={patients}
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSave}
                onDelete={isNutri ? handleDelete : undefined}
                mode={isNutri ? modalMode : "view"}
            />
        </section>
    );
}

export default AppointmentsPage;
