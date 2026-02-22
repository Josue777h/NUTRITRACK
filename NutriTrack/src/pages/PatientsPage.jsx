import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

const emptyForm = {
    name: "",
    age: "",
    weight: "",
    height: "",
    target: "Reducir peso",
    notes: ""
};

function PatientsPage() {
    const { patients, addPatient, updatePatient, removePatient } = useApp();
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ?? null);
    const [feedback, setFeedback] = useState("");

    const selectedPatient = useMemo(
        () => patients.find((item) => item.id === selectedPatientId) ?? null,
        [patients, selectedPatientId]
    );

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!form.name.trim() || !form.age || !form.weight || !form.height) {
            setFeedback("Completa los campos obligatorios del formulario.");
            return;
        }

        if (editingId) {
            updatePatient(editingId, form);
            setFeedback("Paciente actualizado correctamente.");
            setSelectedPatientId(editingId);
        } else {
            const created = addPatient(form);
            setFeedback("Paciente creado correctamente.");
            setSelectedPatientId(created.id);
        }
        resetForm();
    };

    const handleEdit = (patient) => {
        setEditingId(patient.id);
        setSelectedPatientId(patient.id);
        setForm({
            name: patient.name,
            age: String(patient.age),
            weight: String(patient.weight),
            height: String(patient.height),
            target: patient.target,
            notes: patient.notes ?? ""
        });
        setFeedback("Modo edicion activado.");
    };

    const handleDelete = (patient) => {
        const confirmDelete = window.confirm(
            `Se eliminara a ${patient.name} y sus citas/planes/reportes asociados.`
        );
        if (!confirmDelete) {
            return;
        }
        removePatient(patient.id);
        if (selectedPatientId === patient.id) {
            setSelectedPatientId(null);
        }
        if (editingId === patient.id) {
            resetForm();
        }
        setFeedback("Paciente eliminado correctamente.");
    };

    return (
        <section className="split-layout">
            <article className="panel">
                <div className="panel-header">
                    <div>
                        <h3 className="panel-title">Lista de pacientes</h3>
                        <p className="panel-subtitle">
                            Gestion completa de registro, detalle, edicion y eliminacion.
                        </p>
                    </div>
                    <button
                        className="btn"
                        type="button"
                        onClick={() => {
                            resetForm();
                            setFeedback("Formulario listo para nuevo paciente.");
                        }}
                    >
                        <i className="bi bi-plus-lg" />
                        Nuevo paciente
                    </button>
                </div>

                {feedback ? <p className="alert-inline success">{feedback}</p> : null}

                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Edad</th>
                                <th>Peso</th>
                                <th>Objetivo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((patient) => (
                                <tr key={patient.id}>
                                    <td>{patient.name}</td>
                                    <td>{patient.age}</td>
                                    <td>{patient.weight} kg</td>
                                    <td>{patient.target}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="btn secondary small"
                                                type="button"
                                                onClick={() => setSelectedPatientId(patient.id)}
                                            >
                                                Ver detalles
                                            </button>
                                            <button
                                                className="btn ghost small"
                                                type="button"
                                                onClick={() => handleEdit(patient)}
                                            >
                                                Modificar
                                            </button>
                                            <button
                                                className="btn danger small"
                                                type="button"
                                                onClick={() => handleDelete(patient)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="details-box">
                    <h4>Detalles del paciente</h4>
                    {selectedPatient ? (
                        <div className="details-grid">
                            <article>
                                <span>Nombre</span>
                                <strong>{selectedPatient.name}</strong>
                            </article>
                            <article>
                                <span>Edad</span>
                                <strong>{selectedPatient.age} anios</strong>
                            </article>
                            <article>
                                <span>Peso</span>
                                <strong>{selectedPatient.weight} kg</strong>
                            </article>
                            <article>
                                <span>Altura</span>
                                <strong>{selectedPatient.height} cm</strong>
                            </article>
                            <article>
                                <span>Objetivo</span>
                                <strong>{selectedPatient.target}</strong>
                            </article>
                            <article className="full-row">
                                <span>Notas</span>
                                <strong>{selectedPatient.notes || "Sin observaciones"}</strong>
                            </article>
                        </div>
                    ) : (
                        <p className="empty-state">Selecciona un paciente para ver su ficha.</p>
                    )}
                </div>
            </article>

            <article className="panel">
                <div className="panel-header">
                    <h3 className="panel-title">
                        {editingId ? "Editar paciente" : "Registrar paciente"}
                    </h3>
                </div>
                <form className="form-grid two-columns" onSubmit={handleSubmit}>
                    <div className="field full">
                        <label htmlFor="name">Nombre completo</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Ej: Laura Gutierrez"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="age">Edad</label>
                        <input
                            id="age"
                            name="age"
                            type="number"
                            value={form.age}
                            onChange={handleChange}
                            placeholder="28"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="weight">Peso (kg)</label>
                        <input
                            id="weight"
                            name="weight"
                            type="number"
                            value={form.weight}
                            onChange={handleChange}
                            placeholder="67"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="height">Altura (cm)</label>
                        <input
                            id="height"
                            name="height"
                            type="number"
                            value={form.height}
                            onChange={handleChange}
                            placeholder="168"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="target">Objetivo</label>
                        <select id="target" name="target" value={form.target} onChange={handleChange}>
                            <option>Reducir peso</option>
                            <option>Ganar masa muscular</option>
                            <option>Mantenimiento</option>
                            <option>Control calorico</option>
                            <option>Plan deportivo</option>
                        </select>
                    </div>
                    <div className="field full">
                        <label htmlFor="notes">Notas iniciales</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Alergias, habitos y observaciones..."
                        />
                    </div>
                    <div className="action-row full">
                        <button type="submit" className="btn">
                            {editingId ? "Guardar cambios" : "Guardar paciente"}
                        </button>
                        {editingId ? (
                            <button
                                type="button"
                                className="btn ghost"
                                onClick={() => {
                                    resetForm();
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

export default PatientsPage;
