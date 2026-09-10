import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import PlanModal from "../components/PlanModal";
import MacroDonutChart from "../components/charts/MacroDonutChart";
import ShoppingListModal from "../components/ShoppingListModal";

function PlansPage() {
    const { auth, patients, plans, addPlan, updatePlan, removePlan, copyPlan, generateWhatsAppPlanMessage } = useApp();
    const { showSuccess, showWarning, showError } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'add'
    const [shoppingPlan, setShoppingPlan] = useState(null);
    const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState(
        auth.role === "nutriologo" ? String(patients[0]?.id || "") : String(auth.patientId)
    );

    const visiblePlans = useMemo(() => {
        const patientIdNum = Number(selectedPatientId);
        if (!patientIdNum) return [];
        return plans.filter((item) => Number(item.patientId) === patientIdNum);
    }, [plans, selectedPatientId]);

    const getPatientName = (patientId) =>
        patients.find((item) => Number(item.id) === Number(patientId))?.name ?? "Paciente";

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

    const handleDuplicatePlan = async (plan) => {
        try {
            await copyPlan(plan.id, plan.patientId, `${plan.name} (Copia)`);
            showSuccess('Plan duplicado como nueva instancia independiente.');
        } catch (err) {
            showError('Error al duplicar el plan: ' + err.message);
        }
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

                <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
                    {visiblePlans.length ? (
                        visiblePlans.map((plan) => (
                            <div className="panel" key={plan.id} style={{ display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid var(--line)", padding: "1.25rem", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)", paddingBottom: "0.75rem" }}>
                                    <div>
                                        <h4 style={{ fontWeight: "800", color: "var(--text)", margin: 0, fontSize: "1.05rem" }}>{plan.name || "Plan Alimenticio"}</h4>
                                        <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginTop: "0.2rem" }}>Para: <strong>{getPatientName(plan.patientId)}</strong></span>
                                    </div>
                                    <span className="badge" style={{ background: "var(--primary-soft)", color: "var(--primary-strong)", fontWeight: "700" }}>
                                        {plan.calories || 2000} kcal
                                    </span>
                                </div>
                                
                                <div style={{ fontSize: "0.84rem", display: "grid", gap: "0.4rem" }}>
                                    <div><strong>🎯 Objetivo:</strong> {plan.target || "Control calórico"}</div>
                                    <div><strong>⏱ Duración:</strong> {plan.duration || 4} semanas</div>
                                </div>

                                {/* Macro distribution donut */}
                                <div style={{ background: "var(--surface-soft)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
                                    <MacroDonutChart calories={plan.calories} macros={plan.macros} size={110} />
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.5rem", flexWrap: "wrap" }}>
                                    <button
                                        className="btn secondary small"
                                        type="button"
                                        onClick={() => handleViewDetails(plan)}
                                        style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.3rem", justifyContent: "center", fontSize: "0.8rem" }}
                                    >
                                        <i className="bi bi-eye" />
                                        Ver Plan
                                    </button>

                                    <button
                                        className="btn ghost small"
                                        type="button"
                                        onClick={() => { setShoppingPlan(plan); setIsShoppingModalOpen(true); }}
                                        title="Generar lista de compras para el supermercado"
                                        style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", border: "1px solid var(--line)" }}
                                    >
                                        <i className="bi bi-cart3" />
                                        Lista Súper
                                    </button>

                                    {auth.role === "nutriologo" && (
                                        <>
                                            <a
                                                href={generateWhatsAppPlanMessage(getPatientName(plan.patientId), plan)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn small"
                                                title="Enviar plan por WhatsApp al paciente"
                                                style={{ background: "#25D366", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", textDecoration: "none" }}
                                            >
                                                <i className="bi bi-whatsapp" />
                                            </a>
                                            <button
                                                className="btn ghost small"
                                                type="button"
                                                onClick={() => handleDuplicatePlan(plan)}
                                                style={{ padding: "0.4rem 0.6rem" }}
                                                title="Duplicar plan como copia independiente"
                                            >
                                                <i className="bi bi-files" />
                                            </button>
                                            <button
                                                className="btn ghost small"
                                                type="button"
                                                onClick={() => handleEdit(plan)}
                                                style={{ padding: "0.4rem 0.6rem" }}
                                                title="Editar plan"
                                            >
                                                <i className="bi bi-pencil" />
                                            </button>
                                            <button
                                                className="btn danger small"
                                                type="button"
                                                onClick={() => { if(window.confirm("¿Eliminar este plan nutricional?")) handleDelete(plan.id); }}
                                                style={{ padding: "0.4rem 0.6rem" }}
                                                title="Eliminar plan"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="panel" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)" }}>
                            <div className="empty-state">
                                <i className="bi bi-apple" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: 'var(--primary)' }} />
                                <h4 style={{ fontWeight: "800", marginBottom: "0.5rem" }}>
                                    {auth.role === "nutriologo" ? "No hay planes alimenticios registrados" : "Sin plan alimenticio asignado"}
                                </h4>
                                <p style={{ color: "var(--muted)", maxWidth: "36ch", margin: "0 auto 1.25rem", fontSize: "0.88rem" }}>
                                    {auth.role === "nutriologo"
                                        ? "Crea el primer plan personalizado o usa una de nuestras plantillas clínicas predefinidas."
                                        : "Tu nutricionista cargará aquí tu plan de alimentación y porciones recomendadas."}
                                </p>
                                {auth.role === "nutriologo" && (
                                    <button className="btn large" onClick={handleAdd} style={{ background: "var(--primary)", border: "none" }}>
                                        <i className="bi bi-plus-circle" /> Crear primer plan
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

            <ShoppingListModal
                plan={shoppingPlan}
                isOpen={isShoppingModalOpen}
                onClose={() => { setIsShoppingModalOpen(false); setShoppingPlan(null); }}
            />
        </section>
    );
}

export default PlansPage;
