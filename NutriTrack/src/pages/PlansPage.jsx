import { useMemo, useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import PlanModal from "../components/PlanModal";
import ShoppingListModal from "../components/ShoppingListModal";
import PatientSearchPicker from "../components/PatientSearchPicker";


function PlansPage() {
    const { auth, patients, plans, addPlan, updatePlan, removePlan, copyPlan, generateWhatsAppPlanMessage } = useApp();
    const { showSuccess, showWarning, showError } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'add'
    const [shoppingPlan, setShoppingPlan] = useState(null);
    const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState(
        auth.role === "nutriologo" ? String(patients[0]?.id || "") : String(auth.patientId || "")
    );

    useEffect(() => {
        if (auth.role === "nutriologo" && !selectedPatientId && patients.length > 0) {
            setSelectedPatientId(String(patients[0].id));
        } else if (auth.role !== "nutriologo" && auth.patientId) {
            setSelectedPatientId(String(auth.patientId));
        }
    }, [auth.role, auth.patientId, patients, selectedPatientId]);

    const visiblePlans = useMemo(() => {
        if (auth.role !== "nutriologo") {
            const patientIdNum = Number(auth.patientId);
            if (!patientIdNum) return [];
            return plans.filter((item) => Number(item.patientId) === patientIdNum);
        }
        const patientIdNum = Number(selectedPatientId);
        if (!patientIdNum) return [];
        return plans.filter((item) => Number(item.patientId) === patientIdNum);
    }, [plans, selectedPatientId, auth.role, auth.patientId]);

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

                {/* Selector de paciente con búsqueda en tiempo real (solo nutriólogo) */}
                {auth.role === "nutriologo" && (
                    <div style={{ maxWidth: "380px", marginTop: "1rem" }}>
                        <PatientSearchPicker
                            id="patientSelect"
                            label="Ver planes del paciente:"
                            patients={patients}
                            selectedId={selectedPatientId}
                            onSelect={(newId) => setSelectedPatientId(String(newId))}
                            placeholder="Buscar por nombre, cédula o código..."
                        />
                    </div>
                )}

                <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginTop: "1.25rem" }}>
                    {visiblePlans.length ? (
                        visiblePlans.map((plan) => {
                            const pProt = plan.macros?.protein || 25;
                            const pCarb = plan.macros?.carbs || 50;
                            const pFat = plan.macros?.fat || 25;

                            return (
                            <div className="panel" key={plan.id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid var(--line)", padding: "1rem", borderRadius: "var(--radius)", background: "var(--surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)", paddingBottom: "0.55rem" }}>
                                    <div>
                                        <h4 style={{ fontWeight: "700", color: "var(--text)", margin: 0, fontSize: "0.95rem" }}>{plan.name || "Plan Alimenticio"}</h4>
                                        <span style={{ fontSize: "0.76rem", color: "var(--muted)", display: "block", marginTop: "0.15rem" }}>
                                            Paciente: <strong style={{ color: "var(--text)" }}>{getPatientName(plan.patientId)}</strong>
                                        </span>
                                    </div>
                                    <span className="badge" style={{ background: "var(--primary-soft)", color: "var(--primary-strong)", fontWeight: "700", fontSize: "0.78rem" }}>
                                        {plan.calories || 2000} kcal
                                    </span>
                                </div>
                                
                                <div style={{ fontSize: "0.78rem", display: "flex", gap: "1rem", color: "var(--text-light)", flexWrap: "wrap" }}>
                                    <span><i className="bi bi-bullseye" style={{ color: "var(--primary)", marginRight: "0.3rem" }} />{plan.target || "Control calórico"}</span>
                                    <span><i className="bi bi-calendar3" style={{ color: "var(--muted)", marginRight: "0.3rem" }} />{plan.duration || 4} semanas</span>
                                </div>

                                {/* Macro distribution linear bar */}
                                <div style={{ background: "var(--surface-soft)", padding: "0.5rem 0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", display: "grid", gap: "0.35rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted)", fontWeight: 700 }}>
                                        <span style={{ color: "var(--success-text)" }}>Prot: {pProt}%</span>
                                        <span style={{ color: "var(--info-text)" }}>Carb: {pCarb}%</span>
                                        <span style={{ color: "var(--warning-text)" }}>Grasa: {pFat}%</span>
                                    </div>
                                    <div style={{ display: "flex", height: "6px", borderRadius: "999px", overflow: "hidden", background: "var(--line)" }}>
                                        <div style={{ width: `${pProt}%`, background: "var(--success)" }} />
                                        <div style={{ width: `${pCarb}%`, background: "var(--info)" }} />
                                        <div style={{ width: `${pFat}%`, background: "var(--warning)" }} />
                                    </div>
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
                        );
                    })
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
