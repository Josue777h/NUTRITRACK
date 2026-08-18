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

function AppointmentCard({ slot, isNutri, patientName, onView, onEdit, onConfirm, onCancel, onRemove }) {
    const statusKey = slot.status?.toLowerCase() ?? "pendiente";
    const si  = STATUS_MAP[statusKey] ?? STATUS_MAP.pendiente;
    const pillClass = STATUS_PILL_CLASS[statusKey] ?? "pendiente";
    const typeInfo  = TYPE_LABELS[slot.type] ?? { label: slot.type || "Consulta Nutricional", icon: "bi-calendar-event" };

    const isMutable = statusKey !== "cancelada" && statusKey !== "completada";

    return (
        <article className="appt-card-v2">
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

            {slot.notes && (
                <p className="appt-notes-row">
                    <i className="bi bi-chat-left-quote" />
                    {slot.notes}
                </p>
            )}

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
                        {isMutable && (
                            <button className="btn ghost small" type="button" onClick={onEdit}>
                                <i className="bi bi-pencil" /> Editar
                            </button>
                        )}
                        {isMutable && (
                            <button className="btn danger small" type="button" onClick={onCancel}>
                                <i className="bi bi-x-circle" /> Cancelar
                            </button>
                        )}
                        {!slot.archived && (
                            <button
                                className="btn danger small"
                                type="button"
                                onClick={onRemove}
                                title="Quitar de la agenda (se guarda en historial)"
                                style={{ background: "transparent", color: "var(--danger)", border: "1px solid var(--danger)" }}
                            >
                                <i className="bi bi-trash" /> Eliminar
                            </button>
                        )}
                        {slot.archived && (
                            <span style={{ fontSize: "0.72rem", color: "var(--muted)", alignSelf: "center" }}>
                                Guardada en historial
                            </span>
                        )}
                    </>
                )}
            </div>
        </article>
    );
}

function AppointmentsPage() {
    const {
        auth,
        patients,
        appointments,
        appointmentHistory,
        addAppointment,
        updateAppointment,
        cancelAppointment,
        archiveAppointment
    } = useApp();
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

    const historyList = useMemo(() => {
        const fromActive = allVisible.filter(
            (a) => a.status?.toLowerCase() === "completada" || a.status?.toLowerCase() === "cancelada"
        );
        const archived = (appointmentHistory || []).filter((a) =>
            isNutri || Number(a.patientId) === Number(auth.patientId)
        );
        const byId = new Map();
        [...fromActive, ...archived].forEach((item) => {
            byId.set(item.id, item);
        });
        return [...byId.values()].sort((a, b) =>
            `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
        );
    }, [allVisible, appointmentHistory, auth.patientId, isNutri]);

    const filteredAppointments = useMemo(() => {
        let list = allVisible;
        if (activeFilter !== "todas") {
            list = list.filter((a) => a.status?.toLowerCase() === activeFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((a) => {
                const name = patients.find((p) => Number(p.id) === Number(a.patientId))?.name ?? "";
                return (
                    name.toLowerCase().includes(q) ||
                    formatDate(a.date).toLowerCase().includes(q) ||
                    (a.type ?? "").toLowerCase().includes(q)
                );
            });
        }
        return list;
    }, [allVisible, activeFilter, searchQuery, patients]);

    const getPatientName = (id) =>
        patients.find((p) => Number(p.id) === Number(id))?.name ?? "Paciente";

    const upcoming = filteredAppointments.filter(
        (a) => a.status?.toLowerCase() !== "cancelada" && a.status?.toLowerCase() !== "completada"
    );
    const pastOnAgenda = filteredAppointments.filter(
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

    const handleCancel = (id) => {
        cancelAppointment(id);
        showWarning("Cita cancelada. Queda en el historial.");
        closeModal();
    };

    const handleRemove = (id) => {
        archiveAppointment(id);
        showSuccess("Cita eliminada de la agenda y guardada en historial.");
        closeModal();
    };

    const confirmRemove = (id) => {
        if (!window.confirm("¿Quitar esta cita de la agenda? Se guardará en el historial para poder descargarla.")) {
            return;
        }
        handleRemove(id);
    };

    const downloadHistory = () => {
        if (!historyList.length) {
            showWarning("No hay citas en el historial para descargar.");
            return;
        }

        const rows = [
            ["ID", "Paciente", "Fecha", "Hora", "Estado", "Tipo", "Duracion", "Motivo", "Notas", "Archivado"]
        ];

        historyList.forEach((a) => {
            rows.push([
                a.id,
                getPatientName(a.patientId),
                a.date,
                a.time,
                a.status,
                a.type || "",
                a.duration || "",
                (a.reason || "").replace(/"/g, '""'),
                (a.notes || "").replace(/"/g, '""'),
                a.archivedAt || ""
            ]);
        });

        const csv = rows
            .map((row) => row.map((cell) => `"${cell ?? ""}"`).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `historial-citas-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showSuccess("Historial de citas descargado.");
    };

    return (
        <section className="single-panel">
            <article className="panel">
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
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {historyList.length > 0 && (
                            <button className="btn secondary" type="button" onClick={downloadHistory}>
                                <i className="bi bi-download" />
                                Descargar historial
                            </button>
                        )}
                        {isNutri && (
                            <button className="btn" type="button" onClick={() => openModal("add")}>
                                <i className="bi bi-calendar-plus" />
                                Agregar cita
                            </button>
                        )}
                    </div>
                </div>

                {allVisible.length > 0 && (
                    <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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

                {upcoming.length > 0 && (
                    <>
                        <p className="appt-section-label">
                            <i className="bi bi-calendar3-event-fill" />
                            {isNutri ? "Próximas y activas" : "Mis próximas citas"}
                            <span className="appt-count">{upcoming.length}</span>
                        </p>
                        <div className="appt-grid" style={{ marginBottom: pastOnAgenda.length > 0 || historyList.length > 0 ? "1.75rem" : 0 }}>
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
                                    onCancel={() => handleCancel(slot.id)}
                                    onRemove={() => confirmRemove(slot.id)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {(pastOnAgenda.length > 0 || historyList.length > 0) && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                            <p className="appt-section-label" style={{ margin: 0 }}>
                                <i className="bi bi-clock-history" />
                                Historial
                                <span className="appt-count">{historyList.length}</span>
                            </p>
                            <button className="btn secondary small" type="button" onClick={downloadHistory}>
                                <i className="bi bi-download" />
                                Descargar CSV
                            </button>
                        </div>
                        <div className="appt-grid">
                            {historyList.map((slot) => (
                                <AppointmentCard
                                    key={`hist-${slot.id}-${slot.archivedAt || slot.status}`}
                                    slot={slot}
                                    isNutri={isNutri}
                                    patientName={getPatientName(slot.patientId)}
                                    onView={() => openModal("view", slot)}
                                    onEdit={() => openModal("edit", slot)}
                                    onConfirm={() => {}}
                                    onCancel={() => handleCancel(slot.id)}
                                    onRemove={() => confirmRemove(slot.id)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {filteredAppointments.length === 0 && historyList.length === 0 && (
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
                onDelete={isNutri ? handleRemove : undefined}
                mode={isNutri ? modalMode : "view"}
            />
        </section>
    );
}

export default AppointmentsPage;
