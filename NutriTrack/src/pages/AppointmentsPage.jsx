import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

function formatDate(dateValue) {
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function AppointmentsPage() {
    const {
        auth,
        patients,
        appointments,
        addAppointment,
        updateAppointment,
        cancelAppointment
    } = useApp();

    const [editingId, setEditingId] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [form, setForm] = useState({
        patientId: auth.patientId ? String(auth.patientId) : String(patients[0]?.id ?? ""),
        date: "",
        time: "",
        status: "Pendiente",
        notes: ""
    });

    const visibleAppointments = useMemo(() => {
        const source =
            auth.role === "usuario"
                ? appointments.filter((item) => item.patientId === auth.patientId)
                : appointments;

        return [...source].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    }, [appointments, auth.patientId, auth.role]);

    const patientName = (patientId) =>
        patients.find((item) => item.id === patientId)?.name ?? "Paciente";

    const startCreate = (notify = false) => {
        setEditingId(null);
        setForm({
            patientId: auth.role === "usuario" ? String(auth.patientId) : String(patients[0]?.id ?? ""),
            date: "",
            time: "",
            status: "Pendiente",
            notes: ""
        });
        if (notify) {
            setFeedback(
                auth.role === "nutriologo"
                    ? "Formulario listo para agregar cita."
                    : "Completa la solicitud de cita."
            );
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!form.patientId || !form.date || !form.time) {
            setFeedback("Debes completar paciente, fecha y hora.");
            return;
        }

        const payload = {
            ...form,
            patientId: auth.role === "usuario" ? auth.patientId : Number(form.patientId),
            status: auth.role === "usuario" ? "Pendiente" : form.status
        };

        if (editingId) {
            updateAppointment(editingId, payload);
            setFeedback("Cita modificada correctamente.");
        } else {
            addAppointment(payload);
            setFeedback(
                auth.role === "nutriologo"
                    ? "Cita registrada correctamente."
                    : "Solicitud enviada correctamente."
            );
        }
        startCreate();
    };

    const handleEdit = (appointment) => {
        setEditingId(appointment.id);
        setForm({
            patientId: String(appointment.patientId),
            date: appointment.date,
            time: appointment.time,
            status: appointment.status,
            notes: appointment.notes ?? ""
        });
        setFeedback("Editando cita seleccionada.");
    };

    const handleCancel = (appointment) => {
        if (appointment.status === "Cancelada") {
            setFeedback("La cita ya esta cancelada.");
            return;
        }
        cancelAppointment(appointment.id);
        setFeedback("Cita cancelada correctamente.");
    };

    return (
        <section className="split-layout">
            <article className="panel">
                <div className="panel-header">
                    <div>
                        <h3 className="panel-title">
                            {auth.role === "nutriologo" ? "Agenda de citas" : "Mis citas"}
                        </h3>
                        <p className="panel-subtitle">
                            {auth.role === "nutriologo"
                                ? "Administra, modifica o cancela citas por paciente."
                                : "Consulta tus citas y solicita nuevas fechas."}
                        </p>
                    </div>
                    <button className="btn" type="button" onClick={() => startCreate(true)}>
                        <i className="bi bi-calendar-plus" />
                        {auth.role === "nutriologo" ? "Agregar cita" : "Solicitar cita"}
                    </button>
                </div>

                {feedback ? <p className="alert-inline success">{feedback}</p> : null}

                <div className="calendar-grid">
                    {visibleAppointments.length ? (
                        visibleAppointments.map((slot) => (
                            <article className="slot-card" key={slot.id}>
                                <h4>{formatDate(slot.date)}</h4>
                                <p>{slot.time}</p>
                                <p>{patientName(slot.patientId)}</p>
                                <span className={`status-pill ${slot.status.toLowerCase()}`}>
                                    {slot.status}
                                </span>
                                <p className="slot-note">{slot.notes || "Sin observaciones"}</p>
                                <div className="slot-actions">
                                    <button
                                        className="btn secondary"
                                        type="button"
                                        onClick={() => handleEdit(slot)}
                                    >
                                        Modificar
                                    </button>
                                    <button
                                        className="btn danger"
                                        type="button"
                                        onClick={() => handleCancel(slot)}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </article>
                        ))
                    ) : (
                        <p className="empty-state">No hay citas registradas.</p>
                    )}
                </div>
            </article>

            <article className="panel">
                <div className="panel-header">
                    <h3 className="panel-title">
                        {editingId ? "Modificar cita" : auth.role === "nutriologo" ? "Crear cita" : "Nueva solicitud"}
                    </h3>
                </div>
                <form className="form-grid" onSubmit={handleSubmit}>
                    {auth.role === "nutriologo" ? (
                        <div className="field">
                            <label htmlFor="patientId">Paciente</label>
                            <select
                                id="patientId"
                                name="patientId"
                                value={form.patientId}
                                onChange={handleChange}
                            >
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="field">
                            <label>Paciente</label>
                            <input value={auth.fullName} readOnly />
                        </div>
                    )}

                    <div className="field">
                        <label htmlFor="date">Fecha</label>
                        <input id="date" name="date" type="date" value={form.date} onChange={handleChange} />
                    </div>
                    <div className="field">
                        <label htmlFor="time">Hora</label>
                        <input id="time" name="time" type="time" value={form.time} onChange={handleChange} />
                    </div>
                    <div className="field">
                        <label htmlFor="status">Estado</label>
                        {auth.role === "nutriologo" ? (
                            <select id="status" name="status" value={form.status} onChange={handleChange}>
                                <option>Pendiente</option>
                                <option>Confirmada</option>
                                <option>Completada</option>
                                <option>Cancelada</option>
                            </select>
                        ) : (
                            <input value="Pendiente" readOnly />
                        )}
                    </div>
                    <div className="field">
                        <label htmlFor="notes">Observaciones</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Detalle de la cita"
                        />
                    </div>

                    <div className="action-row">
                        <button type="submit" className="btn">
                            {editingId ? "Guardar cambios" : auth.role === "nutriologo" ? "Crear cita" : "Enviar solicitud"}
                        </button>
                        {editingId ? (
                            <button
                                type="button"
                                className="btn ghost"
                                onClick={() => {
                                    startCreate();
                                    setFeedback("Edicion cancelada.");
                                }}
                            >
                                Cancelar edicion
                            </button>
                        ) : null}
                    </div>
                </form>
            </article>
        </section>
    );
}

export default AppointmentsPage;
