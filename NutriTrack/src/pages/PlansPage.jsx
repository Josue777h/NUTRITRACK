import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

const emptyForm = {
    patientId: "",
    day: "Lunes",
    breakfast: "",
    lunch: "",
    dinner: "",
    snack: ""
};

function PlansPage() {
    const { auth, patients, plans, addPlan, updatePlan, removePlan } = useApp();
    const [editingId, setEditingId] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [form, setForm] = useState({
        ...emptyForm,
        patientId: auth.role === "usuario" ? String(auth.patientId) : String(patients[0]?.id ?? "")
    });

    const visiblePlans = useMemo(() => {
        if (auth.role === "usuario") {
            return plans.filter((item) => item.patientId === auth.patientId);
        }
        return plans;
    }, [plans, auth.patientId, auth.role]);

    const patientName = (patientId) =>
        patients.find((item) => item.id === patientId)?.name ?? "Paciente";

    const startCreate = () => {
        setEditingId(null);
        setForm({
            ...emptyForm,
            patientId:
                auth.role === "usuario" ? String(auth.patientId) : String(patients[0]?.id ?? "")
        });
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!form.breakfast.trim() || !form.lunch.trim() || !form.dinner.trim() || !form.snack.trim()) {
            setFeedback("Completa las cuatro comidas para guardar el plan.");
            return;
        }

        const payload = {
            ...form,
            patientId: auth.role === "usuario" ? auth.patientId : Number(form.patientId)
        };

        if (editingId) {
            updatePlan(editingId, payload);
            setFeedback("Plan alimenticio actualizado.");
        } else {
            addPlan(payload);
            setFeedback(
                auth.role === "nutriologo"
                    ? "Plan alimenticio creado."
                    : "Solicitud de ajuste enviada al nutriologo."
            );
        }
        startCreate();
    };

    const handleEdit = (plan) => {
        setEditingId(plan.id);
        setForm({
            patientId: String(plan.patientId),
            day: plan.day,
            breakfast: plan.breakfast,
            lunch: plan.lunch,
            dinner: plan.dinner,
            snack: plan.snack
        });
        setFeedback("Editando plan seleccionado.");
    };

    const handleDelete = (planId) => {
        removePlan(planId);
        setFeedback("Plan eliminado correctamente.");
        if (editingId === planId) {
            startCreate();
        }
    };

    return (
        <section className="split-layout">
            <article className="panel">
                <div className="panel-header">
                    <div>
                        <h3 className="panel-title">
                            {auth.role === "nutriologo" ? "Planes activos" : "Mi plan alimenticio"}
                        </h3>
                        <p className="panel-subtitle">
                            {auth.role === "nutriologo"
                                ? "Gestion de comidas por paciente y por dia."
                                : "Consulta tus comidas asignadas por dia."}
                        </p>
                    </div>
                    <span className="badge">
                        <i className="bi bi-apple" />
                        Nutricion balanceada
                    </span>
                </div>

                <div className="plan-grid">
                    {visiblePlans.length ? (
                        visiblePlans.map((plan) => (
                            <article className="meal-card" key={plan.id}>
                                <h4>
                                    {plan.day} - {patientName(plan.patientId)}
                                </h4>
                                <p className="meal-line">
                                    <span>Desayuno:</span> {plan.breakfast}
                                </p>
                                <p className="meal-line">
                                    <span>Almuerzo:</span> {plan.lunch}
                                </p>
                                <p className="meal-line">
                                    <span>Cena:</span> {plan.dinner}
                                </p>
                                <p className="meal-line">
                                    <span>Snack:</span> {plan.snack}
                                </p>
                                <div className="table-actions">
                                    {auth.role === "nutriologo" ? (
                                        <>
                                            <button
                                                className="btn ghost small"
                                                type="button"
                                                onClick={() => handleEdit(plan)}
                                            >
                                                Modificar
                                            </button>
                                            <button
                                                className="btn danger small"
                                                type="button"
                                                onClick={() => handleDelete(plan.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="btn secondary small"
                                            type="button"
                                            onClick={() =>
                                                setFeedback("Solicitud de ajuste enviada al nutriologo.")
                                            }
                                        >
                                            Solicitar ajuste
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))
                    ) : (
                        <p className="empty-state">No hay planes registrados.</p>
                    )}
                </div>
            </article>

            <article className="panel">
                <div className="panel-header">
                    <h3 className="panel-title">
                        {editingId
                            ? "Modificar plan"
                            : auth.role === "nutriologo"
                              ? "Crear nuevo plan"
                              : "Solicitar ajuste de plan"}
                    </h3>
                </div>

                {feedback ? <p className="alert-inline success">{feedback}</p> : null}

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
                        <label htmlFor="day">Dia</label>
                        <select id="day" name="day" value={form.day} onChange={handleChange}>
                            <option>Lunes</option>
                            <option>Martes</option>
                            <option>Miercoles</option>
                            <option>Jueves</option>
                            <option>Viernes</option>
                            <option>Sabado</option>
                            <option>Domingo</option>
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="breakfast">Desayuno</label>
                        <textarea
                            id="breakfast"
                            name="breakfast"
                            value={form.breakfast}
                            onChange={handleChange}
                            placeholder="Comida de la maniana"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="lunch">Almuerzo</label>
                        <textarea
                            id="lunch"
                            name="lunch"
                            value={form.lunch}
                            onChange={handleChange}
                            placeholder="Comida del mediodia"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="dinner">Cena</label>
                        <textarea
                            id="dinner"
                            name="dinner"
                            value={form.dinner}
                            onChange={handleChange}
                            placeholder="Comida de la noche"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="snack">Snack</label>
                        <textarea
                            id="snack"
                            name="snack"
                            value={form.snack}
                            onChange={handleChange}
                            placeholder="Merienda"
                        />
                    </div>

                    <div className="action-row">
                        <button type="submit" className="btn">
                            {editingId
                                ? "Guardar cambios"
                                : auth.role === "nutriologo"
                                  ? "Crear plan"
                                  : "Enviar ajuste"}
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

export default PlansPage;
