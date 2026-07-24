import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import PlanModal from "../components/PlanModal";

function PlansPage() {
    const { auth, patients, plans, addPlan, updatePlan, removePlan } = useApp();
    const { showSuccess, showWarning } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'add'
    const [selectedPatientId, setSelectedPatientId] = useState(
        auth.role === "nutriologo" ? String(patients[0]?.id || "") : String(auth.patientId)
    );

    const visiblePlans = useMemo(() => {
        const patientIdNum = Number(selectedPatientId);
        if (!patientIdNum) return [];
        return plans.filter((item) => item.patientId === patientIdNum);
    }, [plans, selectedPatientId]);

    const getPatientName = (patientId) =>
        patients.find((item) => item.id === patientId)?.name ?? "Paciente";

    const handleViewDetails = (plan) => {
        setSelectedPlan(plan);
        setModalMode('view');
        setIsModalOpen(true);
    };

    const handleEdit = (plan) => {
        setSelectedPlan(plan);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedPlan({ patientId: Number(selectedPatientId) });
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedPlan(null);
        setModalMode('view');
    };

    const handleSave = (planData) => {
        if (modalMode === 'add') {
            addPlan(planData);
            showSuccess('Plan nutricional creado con éxito.');
        } else {
            updatePlan(planData.id, planData);
            showSuccess('Plan nutricional actualizado.');
        }
        setIsModalOpen(false);
    };

    const handleDelete = (planId) => {
        removePlan(planId);
        showWarning('Plan eliminado correctamente.');
        setIsModalOpen(false);
    };

    return (
        <section className="single-panel">
            <article className="panel" style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-lg)" }}>
                <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h3 className="panel-title" style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                            {auth.role === "nutriologo" ? "Planes alimenticios de pacientes" : "Mi plan alimenticio"}
                        </h3>
                        <p className="panel-subtitle" style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                            {auth.role === "nutriologo"
                                ? "Crea, edita y ajusta los macronutrientes y planes alimenticios de los pacientes."
                                : "Consulta tu dieta asignada, calorías diarias recomendadas y porciones."}
                        </p>
                    </div>
                    {auth.role === "nutriologo" && (
                        <button className="btn" type="button" onClick={handleAdd} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--primary)", border: "none" }}>
                            <i className="bi bi-plus-circle" />
                            Nuevo Plan
                        </button>
                    )}
                </div>

                {/* Selector de paciente (solo nutriólogo) */}
                {auth.role === "nutriologo" && (
                    <div className="field" style={{ maxWidth: "320px", marginTop: "1rem" }}>
                        <label htmlFor="patientSelect">
                            <i className="bi bi-person" style={{ marginRight: "0.4rem" }} />
                            Ver planes del paciente:
                        </label>
                        <select
                            id="patientSelect"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
                    {visiblePlans.length ? (
                        visiblePlans.map((plan) => (
                            <div className="panel" key={plan.id} style={{ display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid var(--line)", padding: "1.25rem", borderRadius: "var(--radius-lg)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)", paddingBottom: "0.75rem" }}>
                                    <div>
                                        <h4 style={{ fontWeight: "700", color: "var(--text)", margin: 0 }}>{plan.name || "Plan Alimenticio"}</h4>
                                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Para: {getPatientName(plan.patientId)}</span>
                                    </div>
                                    <span className="badge" style={{ background: "var(--primary-soft)", color: "var(--primary-strong)" }}>
                                        {plan.calories || 2000} kcal
                                    </span>
                                </div>
                                <div style={{ fontSize: "0.85rem", display: "grid", gap: "0.5rem" }}>
                                    <div><strong>Objetivo:</strong> {plan.target || "Control calórico"}</div>
                                    <div><strong>Duración:</strong> {plan.duration || 4} semanas</div>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                                    <button
                                        className="btn secondary small"
                                        type="button"
                                        onClick={() => handleViewDetails(plan)}
                                        style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.3rem", justifyContent: "center", fontSize: "0.8rem" }}
                                    >
                                        <i className="bi bi-eye" />
                                        Ver Plan
                                    </button>
                                    {auth.role === "nutriologo" && (
                                        <>
                                            <button
                                                className="btn ghost small"
                                                type="button"
                                                onClick={() => handleEdit(plan)}
                                                style={{ padding: "0.4rem 0.6rem" }}
                                            >
                                                <i className="bi bi-pencil" />
                                            </button>
                                            <button
                                                className="btn danger small"
                                                type="button"
                                                onClick={() => { if(window.confirm("¿Eliminar este plan nutricional?")) handleDelete(plan.id); }}
                                                style={{ padding: "0.4rem 0.6rem" }}
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="panel" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", border: "1px solid var(--line)" }}>
                            <div className="empty-state">
                                <i className="bi bi-apple" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block', color: 'var(--muted)' }} />
                                <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
                                    {auth.role === "nutriologo"
                                        ? "No hay planes alimenticios registrados."
                                        : "Aún no tienes un plan nutricional asignado por tu especialista."}
                                </p>
                                {auth.role === "nutriologo" && (
                                    <button className="btn" onClick={handleAdd}>
                                        Crear primer plan
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </article>
            
            <PlanModal
                plan={selectedPlan}
                patients={patients}
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleSave}
                onDelete={handleDelete}
                mode={modalMode}
            />
        </section>
    );
}

export default PlansPage;
