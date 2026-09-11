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

function AppointmentRowCompact({ slot, isNutri, patient, onView, onEdit, onConfirm, onComplete, onCancel, onRemove }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusKey = slot.status?.toLowerCase() ?? "pendiente";
    const si = STATUS_MAP[statusKey] ?? STATUS_MAP.pendiente;
    const pillClass = STATUS_PILL_CLASS[statusKey] ?? "pendiente";
    const typeInfo = TYPE_LABELS[slot.type] ?? { label: slot.type || "Consulta", icon: "bi-calendar-event" };
    const isMutable = statusKey !== "cancelada" && statusKey !== "completada";

    const patientName = isNutri ? (patient?.name ?? "Paciente sin asignar") : "Tu Nutriólogo";
    const docId = patient?.documentId || patient?.document_id || patient?.cedula || patient?.dni;
    const clinicalCode = patient?.clinicalCode || patient?.clinical_code || (patient?.id ? `PAC-${patient.id}` : null);

    return (
        <div className={`appt-row-compact status-${statusKey} ${isExpanded ? "is-expanded" : ""}`}>
            <div
                className="appt-row-header"
                onClick={() => setIsExpanded(p => !p)}
                title="Haz clic para ver u ocultar detalles y acciones"
            >
                <div className="appt-row-primary">
                    <div className="appt-row-time">
                        <span className="appt-date-text">{formatDate(slot.date)}</span>
                        <span className="appt-time-text">
                            <i className="bi bi-clock" style={{ marginRight: "0.25rem" }} />
                            {slot.time}
                        </span>
                    </div>

                    <div className="appt-row-patient">
                        <div className="appt-patient-name-wrap">
                            <span className="appt-patient-name">{patientName}</span>
                            {isNutri && (clinicalCode || docId) && (
                                <div className="appt-patient-tags">
                                    {clinicalCode && <span className="appt-badge-code">{clinicalCode}</span>}
                                    {docId && <span className="appt-badge-doc"><i className="bi bi-person-vcard" /> {docId}</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    <span className="appt-row-type">
                        <i className={`bi ${typeInfo.icon}`} />
                        {typeInfo.label}
                    </span>

                    <span className={`status-pill ${pillClass}`}>
                        <i className={`bi ${si.icon}`} />
                        {si.label}
                    </span>
                </div>

                <div className="appt-row-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="btn ghost small appt-expand-btn"
                        type="button"
                        onClick={() => setIsExpanded(p => !p)}
                        title={isExpanded ? "Ocultar panel" : "Gestionar cita y ver detalles"}
                    >
                        <span>{isExpanded ? "Ocultar" : "Gestionar"}</span>
                        <i className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`} />
                    </button>
                </div>
            </div>

            {/* Acordeón desplegable de detalles y gestión */}
            {isExpanded && (
                <div className="appt-row-details">
                    <div className="appt-details-grid">
                        <div className="appt-details-info">
                            <div className="appt-info-line">
                                <strong><i className="bi bi-card-text" /> Motivo:</strong>
                                <span>{slot.reason || "Consulta médica general"}</span>
                            </div>

                            {slot.notes ? (
                                <div className="appt-info-line notes">
                                    <strong><i className="bi bi-chat-left-quote" /> Notas:</strong>
                                    <span>{slot.notes}</span>
                                </div>
                            ) : (
                                <span className="appt-no-notes">Sin notas adicionales registradas</span>
                            )}

                            <div className="appt-info-meta">
                                <span><i className="bi bi-stopwatch" /> Duración: {slot.duration || 30} min</span>
                                {clinicalCode && <span><i className="bi bi-upc-scan" /> Código: {clinicalCode}</span>}
                                {docId && <span><i className="bi bi-person-vcard" /> Cédula: {docId}</span>}
                            </div>
                        </div>

                        <div className="appt-details-actions">
                            {isNutri ? (
                                <>
                                    {statusKey === "pendiente" && (
                                        <button className="btn success small" type="button" onClick={onConfirm} title="Confirmar asistencia del paciente">
                                            <i className="bi bi-check-circle-fill" /> Confirmar
                                        </button>
                                    )}
                                    {statusKey === "confirmada" && onComplete && (
                                        <button className="btn primary small" type="button" onClick={onComplete} title="Marcar consulta realizada">
                                            <i className="bi bi-check2-all" /> Completar
                                        </button>
                                    )}
                                    {isMutable && (
                                        <button className="btn ghost small" type="button" onClick={onEdit} title="Cambiar fecha u hora">
                                            <i className="bi bi-calendar-event" /> Reprogramar
                                        </button>
                                    )}
                                    {isMutable && (
                                        <button className="btn danger small" type="button" onClick={onCancel} title="Cancelar cita">
                                            <i className="bi bi-x-circle" /> Cancelar
                                        </button>
                                    )}
                                    <button className="btn secondary small" type="button" onClick={onView} title="Ver expediente o ficha completa">
                                        <i className="bi bi-arrows-fullscreen" /> Ficha
                                    </button>
                                    {!slot.archived && (
                                        <button
                                            className="btn ghost small"
                                            type="button"
                                            onClick={onRemove}
                                            title="Eliminar de la agenda y archivar"
                                            style={{ color: "var(--danger)" }}
                                        >
                                            <i className="bi bi-trash" />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button className="btn secondary small" type="button" onClick={onView}>
                                    <i className="bi bi-eye" /> Ver detalles completos
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AppointmentCard({ slot, isNutri, patient, onView, onEdit, onConfirm, onComplete, onCancel, onRemove }) {
    const statusKey = slot.status?.toLowerCase() ?? "pendiente";
    const si  = STATUS_MAP[statusKey] ?? STATUS_MAP.pendiente;
    const pillClass = STATUS_PILL_CLASS[statusKey] ?? "pendiente";
    const typeInfo  = TYPE_LABELS[slot.type] ?? { label: slot.type || "Consulta Nutricional", icon: "bi-calendar-event" };

    const isMutable = statusKey !== "cancelada" && statusKey !== "completada";
    const patientName = isNutri ? (patient?.name ?? "Paciente sin asignar") : "Tu Nutriólogo";
    const docId = patient?.documentId || patient?.document_id || patient?.cedula || patient?.dni;
    const clinicalCode = patient?.clinicalCode || patient?.clinical_code || (patient?.id ? `PAC-${patient.id}` : null);

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
                    <div className="appt-patient-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600 }}>
                            <i className="bi bi-person-circle" style={{ color: "var(--primary)", marginRight: "0.35rem" }} />
                            {patientName}
                        </span>
                        {clinicalCode && <span className="appt-badge-code">{clinicalCode}</span>}
                    </div>
                )}
                {docId && (
                    <div style={{ fontSize: "0.74rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                        <i className="bi bi-person-vcard" style={{ marginRight: "0.25rem" }} /> CC: {docId}
                    </div>
                )}
                <div className="appt-type-row" style={{ marginTop: "0.35rem" }}>
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
                    <i className="bi bi-eye" /> Ficha
                </button>
                {isNutri && (
                    <>
                        {statusKey === "pendiente" && (
                            <button className="btn success small" type="button" onClick={onConfirm} title="Confirmar asistencia">
                                <i className="bi bi-check-circle-fill" /> Confirmar
                            </button>
                        )}
                        {statusKey === "confirmada" && onComplete && (
                            <button className="btn primary small" type="button" onClick={onComplete} title="Marcar consulta realizada">
                                <i className="bi bi-check2-all" /> Completar
                            </button>
                        )}
                        {isMutable && (
                            <button className="btn ghost small" type="button" onClick={onEdit} title="Reprogramar fecha u hora">
                                <i className="bi bi-calendar-event" />
                            </button>
                        )}
                        {isMutable && (
                            <button className="btn danger small" type="button" onClick={onCancel} title="Cancelar cita">
                                <i className="bi bi-x-circle" />
                            </button>
                        )}
                        {!slot.archived && (
                            <button
                                className="btn ghost small"
                                type="button"
                                onClick={onRemove}
                                title="Quitar de la agenda"
                                style={{ color: "var(--danger)" }}
                            >
                                <i className="bi bi-trash" />
                            </button>
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
    const [viewMode,       setViewMode]       = useState("list");
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

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

    const getPatient = (id) =>
        patients.find((p) => Number(p.id) === Number(id));

    const getPatientName = (id) =>
        getPatient(id)?.name ?? "Paciente";

    const filteredAppointments = useMemo(() => {
        let list = allVisible;
        if (activeFilter !== "todas") {
            list = list.filter((a) => a.status?.toLowerCase() === activeFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter((a) => {
                const pat = getPatient(a.patientId);
                const name = (pat?.name ?? "").toLowerCase();
                const docId = String(pat?.documentId || pat?.document_id || pat?.cedula || pat?.dni || "").toLowerCase();
                const code = String(pat?.clinicalCode || pat?.clinical_code || (pat?.id ? `PAC-${pat.id}` : "")).toLowerCase();
                const rawId = String(pat?.id ?? "").toLowerCase();
                const dateFmt = formatDate(a.date).toLowerCase();
                const dateRaw = String(a.date ?? "").toLowerCase();
                const type = String(a.type ?? "").toLowerCase();
                const reason = String(a.reason ?? "").toLowerCase();

                return (
                    name.includes(q) ||
                    docId.includes(q) ||
                    code.includes(q) ||
                    rawId === q ||
                    dateFmt.includes(q) ||
                    dateRaw.includes(q) ||
                    type.includes(q) ||
                    reason.includes(q)
                );
            });
        }
        return list;
    }, [allVisible, activeFilter, searchQuery, patients]);

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
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        {/* Selector de visualización compacta / cuadrícula */}
                        <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--surface)" }}>
                            <button
                                type="button"
                                className={`btn small ${viewMode === "list" ? "primary" : "ghost"}`}
                                onClick={() => setViewMode("list")}
                                style={{ borderRadius: 0, padding: "0.3rem 0.65rem", fontSize: "0.78rem" }}
                                title="Vista compacta en lista (ocupa menos espacio)"
                            >
                                <i className="bi bi-list-ul" /> Lista
                            </button>
                            <button
                                type="button"
                                className={`btn small ${viewMode === "grid" ? "primary" : "ghost"}`}
                                onClick={() => setViewMode("grid")}
                                style={{ borderRadius: 0, padding: "0.3rem 0.65rem", fontSize: "0.78rem" }}
                                title="Vista en tarjetas cuadrícula"
                            >
                                <i className="bi bi-grid-fill" /> Tarjetas
                            </button>
                        </div>

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
                    <div className="appt-toolbar">
                        <div className="appt-search-wrapper">
                            <i className="bi bi-search appt-search-icon" />
                            <input
                                type="search"
                                className="appt-search-input"
                                placeholder="Buscar por nombre, cédula (DNI) o código PAC..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="appt-search-clear"
                                    onClick={() => setSearchQuery("")}
                                    title="Limpiar búsqueda"
                                >
                                    <i className="bi bi-x-lg" />
                                </button>
                            )}
                        </div>

                        <div className="filter-pills-bar" style={{ margin: 0 }}>
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
                                            <span className="filter-pill-count">
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Render de citas activas */}
                {upcoming.length > 0 && (
                    <div style={{ marginBottom: pastOnAgenda.length > 0 || historyList.length > 0 ? "1.5rem" : 0 }}>
                        <p className="appt-section-label">
                            <i className="bi bi-calendar3-event-fill" />
                            {isNutri ? "Próximas y activas" : "Mis próximas citas"}
                            <span className="appt-count">{upcoming.length}</span>
                        </p>
                        {viewMode === "list" ? (
                            <div className="appt-list-compact">
                                {upcoming.map((slot) => (
                                    <AppointmentRowCompact
                                        key={slot.id}
                                        slot={slot}
                                        isNutri={isNutri}
                                        patient={getPatient(slot.patientId)}
                                        onView={() => openModal("view", slot)}
                                        onEdit={() => openModal("edit", slot)}
                                        onConfirm={() => {
                                            updateAppointment(slot.id, { ...slot, status: "Confirmada" });
                                            showSuccess("Cita confirmada.");
                                        }}
                                        onComplete={() => {
                                            updateAppointment(slot.id, { ...slot, status: "Completada" });
                                            showSuccess("¡Consulta marcada como completada!");
                                        }}
                                        onCancel={() => handleCancel(slot.id)}
                                        onRemove={() => confirmRemove(slot.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="appt-grid">
                                {upcoming.map((slot) => (
                                    <AppointmentCard
                                        key={slot.id}
                                        slot={slot}
                                        isNutri={isNutri}
                                        patient={getPatient(slot.patientId)}
                                        onView={() => openModal("view", slot)}
                                        onEdit={() => openModal("edit", slot)}
                                        onConfirm={() => {
                                            updateAppointment(slot.id, { ...slot, status: "Confirmada" });
                                            showSuccess("Cita confirmada.");
                                        }}
                                        onComplete={() => {
                                            updateAppointment(slot.id, { ...slot, status: "Completada" });
                                            showSuccess("¡Consulta marcada como completada!");
                                        }}
                                        onCancel={() => handleCancel(slot.id)}
                                        onRemove={() => confirmRemove(slot.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Render de citas pasadas / Historial (Acordeón colapsable para no ocupar espacio innecesario) */}
                {(pastOnAgenda.length > 0 || historyList.length > 0) && (
                    <div style={{ marginTop: "1rem", borderTop: "1px solid var(--line)", paddingTop: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                            <button
                                type="button"
                                className="btn ghost"
                                onClick={() => setIsHistoryExpanded(p => !p)}
                                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.6rem", fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}
                            >
                                <i className="bi bi-clock-history" style={{ color: "var(--primary)" }} />
                                <span>Historial (Completadas / Canceladas)</span>
                                <span className="appt-count">{historyList.length}</span>
                                <i className={`bi ${isHistoryExpanded ? "bi-chevron-up" : "bi-chevron-down"}`} style={{ fontSize: "0.75rem", color: "var(--muted)" }} />
                            </button>

                            <button className="btn secondary small" type="button" onClick={downloadHistory}>
                                <i className="bi bi-download" />
                                Descargar CSV
                            </button>
                        </div>

                        {isHistoryExpanded && (
                            viewMode === "list" ? (
                                <div className="appt-list-compact" style={{ animation: "fadeIn 0.2s ease-out" }}>
                                    {historyList.map((slot) => (
                                        <AppointmentRowCompact
                                            key={`hist-${slot.id}-${slot.archivedAt || slot.status}`}
                                            slot={slot}
                                            isNutri={isNutri}
                                            patient={getPatient(slot.patientId)}
                                            onView={() => openModal("view", slot)}
                                            onEdit={() => openModal("edit", slot)}
                                            onConfirm={() => {}}
                                            onCancel={() => handleCancel(slot.id)}
                                            onRemove={() => confirmRemove(slot.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="appt-grid" style={{ animation: "fadeIn 0.2s ease-out" }}>
                                    {historyList.map((slot) => (
                                        <AppointmentCard
                                            key={`hist-${slot.id}-${slot.archivedAt || slot.status}`}
                                            slot={slot}
                                            isNutri={isNutri}
                                            patient={getPatient(slot.patientId)}
                                            onView={() => openModal("view", slot)}
                                            onEdit={() => openModal("edit", slot)}
                                            onConfirm={() => {}}
                                            onCancel={() => handleCancel(slot.id)}
                                            onRemove={() => confirmRemove(slot.id)}
                                        />
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}

                {filteredAppointments.length === 0 && (
                    <div className="empty-state-block" style={{ padding: "2.5rem 1rem", marginTop: "1rem" }}>
                        <div className="empty-state-icon">
                            <i className="bi bi-calendar3-event" />
                        </div>
                        <h4>
                            {searchQuery
                                ? "No se encontraron resultados"
                                : activeFilter !== "todas"
                                    ? `Sin citas ${FILTERS.find((f) => f.key === activeFilter)?.label.toLowerCase()}`
                                    : "No hay citas registradas"}
                        </h4>
                        <p>
                            {searchQuery
                                ? `No encontramos ninguna cita para "${searchQuery}". Puedes buscar por nombre, cédula o código (ej: PAC-...).`
                                : isNutri
                                    ? "Agrega la primera cita para comenzar a gestionar tu agenda."
                                    : "Aquí aparecerán tus citas agendadas por tu nutricionista."}
                        </p>
                        {searchQuery ? (
                            <button className="btn secondary small" type="button" onClick={() => setSearchQuery("")}>
                                <i className="bi bi-x-circle" /> Limpiar búsqueda
                            </button>
                        ) : activeFilter !== "todas" ? (
                            <button className="btn secondary" onClick={() => setActiveFilter("todas")}>
                                <i className="bi bi-x-circle" />
                                Ver todas
                            </button>
                        ) : (
                            isNutri && (
                                <button className="btn" type="button" onClick={() => openModal("add")}>
                                    <i className="bi bi-calendar-plus" />
                                    Agregar primera cita
                                </button>
                            )
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
