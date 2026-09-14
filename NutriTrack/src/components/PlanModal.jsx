import { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import FoodSearchModal from './FoodSearchModal';
import PatientSearchPicker from './PatientSearchPicker';
import { PRESET_DIET_TEMPLATES } from '../data/dietTemplates';


const DEFAULT_MEAL_TYPES = [
    { id: 'desayuno', name: 'Desayuno', icon: 'bi-brightness-high', color: '#f59e0b', defaultTime: '08:00', defaultPct: 25 },
    { id: 'mediaManana', name: 'Media Mañana', icon: 'bi-sun', color: '#eab308', defaultTime: '11:00', defaultPct: 10 },
    { id: 'almuerzo', name: 'Almuerzo', icon: 'bi-egg-fried', color: '#16a34a', defaultTime: '14:00', defaultPct: 30 },
    { id: 'merienda', name: 'Merienda', icon: 'bi-cup-hot', color: '#2563eb', defaultTime: '17:00', defaultPct: 10 },
    { id: 'cena', name: 'Cena', icon: 'bi-moon-stars', color: '#8b5cf6', defaultTime: '20:00', defaultPct: 20 },
    { id: 'snack', name: 'Snack / Colación', icon: 'bi-cookie', color: '#ec4899', defaultTime: '22:00', defaultPct: 5 }
];

const DEFAULT_RECOMMENDATIONS = `- Mantener una hidratación adecuada consumiendo al menos 2 litros de agua natural al día.
- Respetar los horarios recomendados y las porciones indicadas.
- Priorizar alimentos frescos, proteínas magras y cereales integrales.
- Ante cualquier duda, síntoma o ajuste necesario, consultar directamente al nutricionista.`;

const MACRO_PRESETS = [
    { label: "Equilibrada (50C / 25P / 25G)", carbs: 50, protein: 25, fat: 25 },
    { label: "Alta en Proteína (40C / 35P / 25G)", carbs: 40, protein: 35, fat: 25 },
    { label: "Baja en Carbohidratos (25C / 35P / 40G)", carbs: 25, protein: 35, fat: 40 },
    { label: "Keto / Cetogénica (5C / 25P / 70G)", carbs: 5, protein: 25, fat: 70 }
];

function createDefaultMeals() {
    return DEFAULT_MEAL_TYPES.map((t) => ({
        id: t.id,
        name: t.name,
        time: t.defaultTime,
        targetPct: t.defaultPct,
        icon: t.icon,
        color: t.color,
        notes: '',
        foods: []
    }));
}

const PlanModal = ({ plan, patients = [], isOpen, onClose, onSave, mode = 'view' }) => {
    const { showError, showSuccess } = useToast();
    const { auth, dietTemplates, saveDietTemplate, generateWhatsAppPlanMessage } = useApp();

    const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'add');
    const [currentStep, setCurrentStep] = useState(1);

    // Formulario principal
    const [form, setForm] = useState({
        patientId: '',
        name: '',
        target: 'Reducir IMC',
        calories: '2000',
        duration: '8',
        proteinPct: 25,
        carbsPct: 50,
        fatPct: 25,
        recommendations: DEFAULT_RECOMMENDATIONS,
        meals: createDefaultMeals()
    });

    // Pestaña activa en Paso 3 (Comidas)
    const [activeMealId, setActiveMealId] = useState('desayuno');

    // Modal de búsqueda de alimentos
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTargetMealId, setSearchTargetMealId] = useState('desayuno');

    // Input rápido de alimento manual en comida activa
    const [manualFood, setManualFood] = useState({ name: '', qty: '100', unit: 'g', calories: '100' });
    const [isAddingManual, setIsAddingManual] = useState(false);

    // Opción para guardar como plantilla reutilizable en paso 4
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');

    // Paciente actualmente seleccionado
    const selectedPatient = useMemo(() => {
        if (!form.patientId) return null;
        return patients.find((p) => Number(p.id) === Number(form.patientId)) || null;
    }, [patients, form.patientId]);

    // Todas las plantillas disponibles (incorporadas + personalizadas del usuario)
    const allTemplates = useMemo(() => {
        const custom = Array.isArray(dietTemplates) ? dietTemplates : [];
        const builtIn = PRESET_DIET_TEMPLATES || [];
        const byId = new Map();
        [...builtIn, ...custom].forEach((t) => byId.set(t.id, t));
        return Array.from(byId.values());
    }, [dietTemplates]);

    // Inicializar estado al abrir o cambiar de plan
    useEffect(() => {
        if (!isOpen) return;

        setCurrentStep(1);
        setIsEditing(mode === 'edit' || mode === 'add');

        if (plan && (mode === 'edit' || mode === 'view')) {
            let normalizedMeals = [];
            if (Array.isArray(plan.meals)) {
                normalizedMeals = plan.meals.map((m) => ({
                    id: m.id || `meal-${Math.random().toString(36).substring(7)}`,
                    name: m.name || 'Comida',
                    time: m.time || '12:00',
                    targetPct: Number(m.targetPct) || 15,
                    icon: m.icon || 'bi-clock',
                    color: m.color || '#49b54c',
                    notes: m.notes || '',
                    foods: Array.isArray(m.foods) ? m.foods : []
                }));
            } else if (plan.meals && typeof plan.meals === 'object') {
                normalizedMeals = DEFAULT_MEAL_TYPES.map((def) => ({
                    id: def.id,
                    name: def.name,
                    time: def.defaultTime,
                    targetPct: def.defaultPct,
                    icon: def.icon,
                    color: def.color,
                    notes: '',
                    foods: Array.isArray(plan.meals[def.id]) ? plan.meals[def.id] : []
                }));
            } else {
                normalizedMeals = createDefaultMeals();
            }

            setForm({
                patientId: String(plan.patientId || ''),
                name: plan.name || 'Plan Alimenticio',
                target: plan.target || 'Reducir IMC',
                calories: String(plan.calories || 2000),
                duration: String(plan.duration || 8),
                proteinPct: Number(plan.macros?.protein) || 25,
                carbsPct: Number(plan.macros?.carbs) || 50,
                fatPct: Number(plan.macros?.fat) || 25,
                recommendations: plan.recommendations || DEFAULT_RECOMMENDATIONS,
                meals: normalizedMeals
            });
            setActiveMealId(normalizedMeals[0]?.id || 'desayuno');
        } else {
            // Modo nuevo: intentar preseleccionar el primer paciente si existe
            const firstPat = patients[0]?.id ? String(patients[0].id) : '';
            setForm({
                patientId: firstPat,
                name: firstPat ? `Plan Nutricional - ${patients[0]?.name || ''}` : 'Plan Nutricional',
                target: patients[0]?.target || patients[0]?.goal || 'Reducir IMC',
                calories: '2000',
                duration: '8',
                proteinPct: 25,
                carbsPct: 50,
                fatPct: 25,
                recommendations: DEFAULT_RECOMMENDATIONS,
                meals: createDefaultMeals()
            });
            setActiveMealId('desayuno');
        }
        setSaveAsTemplate(false);
        setTemplateName('');
    }, [isOpen, plan, mode, patients]);

    // Cuando cambia el paciente en el paso 1, actualizar nombre del plan si está genérico
    const handlePatientChange = (patientId) => {
        const pat = patients.find((p) => Number(p.id) === Number(patientId));
        setForm((prev) => ({
            ...prev,
            patientId,
            name: pat ? `Plan Nutricional - ${pat.name}` : prev.name,
            target: pat?.target || pat?.goal || prev.target
        }));
    };

    // Aplicar plantilla clínica predeterminada con 1 clic
    const handleApplyTemplate = (template) => {
        if (!template) return;

        let normalizedMeals = [];
        if (Array.isArray(template.meals)) {
            normalizedMeals = template.meals.map((m) => ({
                id: m.id || `meal-${Math.random().toString(36).substring(7)}`,
                name: m.name || 'Comida',
                time: m.time || '12:00',
                targetPct: Number(m.targetPct) || 15,
                icon: m.icon || 'bi-clock',
                color: m.color || '#49b54c',
                notes: m.notes || '',
                foods: Array.isArray(m.foods) ? m.foods : []
            }));
        } else if (template.meals && typeof template.meals === 'object') {
            normalizedMeals = DEFAULT_MEAL_TYPES.map((def) => ({
                id: def.id,
                name: def.name,
                time: def.defaultTime,
                targetPct: def.defaultPct,
                icon: def.icon,
                color: def.color,
                notes: '',
                foods: Array.isArray(template.meals[def.id]) ? template.meals[def.id] : []
            }));
        } else {
            normalizedMeals = createDefaultMeals();
        }

        setForm((prev) => ({
            ...prev,
            name: selectedPatient ? `Plan: ${template.name} - ${selectedPatient.name}` : template.name,
            target: template.target || prev.target,
            calories: String(template.calories || 2000),
            duration: String(template.duration || 8),
            proteinPct: Number(template.macros?.protein) || 25,
            carbsPct: Number(template.macros?.carbs) || 50,
            fatPct: Number(template.macros?.fat) || 25,
            recommendations: template.recommendations || prev.recommendations,
            meals: normalizedMeals
        }));

        showSuccess(`Plantilla "${template.name}" cargada con éxito.`);
    };

    // Cálculos de macronutrientes en gramos
    const calculatedMacros = useMemo(() => {
        const totalKcal = Number(form.calories) || 2000;
        const pKcal = totalKcal * ((Number(form.proteinPct) || 0) / 100);
        const cKcal = totalKcal * ((Number(form.carbsPct) || 0) / 100);
        const fKcal = totalKcal * ((Number(form.fatPct) || 0) / 100);

        return {
            proteinGrams: Math.round(pKcal / 4),
            carbsGrams: Math.round(cKcal / 4),
            fatGrams: Math.round(fKcal / 9),
            totalPct: Number(form.proteinPct) + Number(form.carbsPct) + Number(form.fatPct)
        };
    }, [form.calories, form.proteinPct, form.carbsPct, form.fatPct]);

    // Cálculo del total de calorías y alimentos configurados en el plan
    const planStats = useMemo(() => {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalFoods = 0;

        form.meals.forEach((m) => {
            (m.foods || []).forEach((f) => {
                totalCalories += Number(f.calories) || 0;
                totalProtein += Number(f.protein) || 0;
                totalCarbs += Number(f.carbohydrates) || 0;
                totalFat += Number(f.fat) || 0;
                totalFoods += 1;
            });
        });

        return { totalCalories, totalProtein: Math.round(totalProtein), totalCarbs: Math.round(totalCarbs), totalFat: Math.round(totalFat), totalFoods };
    }, [form.meals]);

    // Comida activa en Paso 3
    const activeMeal = useMemo(() => {
        return form.meals.find((m) => m.id === activeMealId) || form.meals[0] || null;
    }, [form.meals, activeMealId]);

    // Calorías de la comida activa
    const activeMealKcal = useMemo(() => {
        if (!activeMeal || !Array.isArray(activeMeal.foods)) return 0;
        return activeMeal.foods.reduce((acc, f) => acc + (Number(f.calories) || 0), 0);
    }, [activeMeal]);

    // Agregar alimento desde el buscador
    const handleAddFoodFromSearch = (foodItem) => {
        setForm((prev) => {
            const updatedMeals = prev.meals.map((m) => {
                if (m.id === searchTargetMealId) {
                    return {
                        ...m,
                        foods: [...(m.foods || []), foodItem]
                    };
                }
                return m;
            });
            return { ...prev, meals: updatedMeals };
        });
    };

    // Agregar alimento manual rápido
    const handleAddManualFood = () => {
        if (!manualFood.name.trim()) {
            showError('Ingresa el nombre del alimento.');
            return;
        }

        const newFood = {
            name: manualFood.name.trim(),
            qty: String(manualFood.qty || 100),
            unit: manualFood.unit || 'g',
            calories: Number(manualFood.calories) || 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            notes: ''
        };

        setForm((prev) => {
            const updatedMeals = prev.meals.map((m) => {
                if (m.id === activeMealId) {
                    return { ...m, foods: [...(m.foods || []), newFood] };
                }
                return m;
            });
            return { ...prev, meals: updatedMeals };
        });

        setManualFood({ name: '', qty: '100', unit: 'g', calories: '100' });
        setIsAddingManual(false);
        showSuccess(`"${newFood.name}" agregado a ${activeMeal?.name}.`);
    };

    // Eliminar alimento de una comida
    const handleRemoveFood = (mealId, foodIndex) => {
        setForm((prev) => {
            const updatedMeals = prev.meals.map((m) => {
                if (m.id === mealId) {
                    return {
                        ...m,
                        foods: m.foods.filter((_, idx) => idx !== foodIndex)
                    };
                }
                return m;
            });
            return { ...prev, meals: updatedMeals };
        });
    };

    // Validar y avanzar de paso en modo edición
    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!form.patientId) {
                showError('Por favor selecciona el paciente para este plan.');
                return;
            }
            if (!form.name.trim()) {
                showError('Por favor ingresa un nombre para el plan.');
                return;
            }
        } else if (currentStep === 2) {
            if (!form.calories || Number(form.calories) <= 0) {
                showError('Ingresa una meta calórica válida (ej: 2000).');
                return;
            }
        }
        setCurrentStep((prev) => Math.min(prev + 1, 4));
    };

    const handlePrevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    // Guardar plan definitivo
    const handleSubmitFinal = (e) => {
        if (e) e.preventDefault();

        if (!form.patientId) {
            showError('Selecciona un paciente.');
            setCurrentStep(1);
            return;
        }

        const payload = {
            id: plan?.id || Date.now(),
            patientId: Number(form.patientId),
            name: form.name.trim(),
            target: form.target,
            calories: Number(form.calories),
            duration: Number(form.duration) || 8,
            macros: {
                protein: Number(form.proteinPct),
                carbs: Number(form.carbsPct),
                fat: Number(form.fatPct)
            },
            recommendations: form.recommendations,
            meals: form.meals
        };

        // Si marcó guardar como plantilla reutilizable
        if (saveAsTemplate) {
            const nameToSave = (templateName || form.name || 'Plantilla Clínica').trim();
            saveDietTemplate({
                name: nameToSave,
                description: `Plantilla creada a partir de ${form.name} (${form.calories} kcal)`,
                target: form.target,
                calories: Number(form.calories),
                duration: Number(form.duration) || 8,
                macros: payload.macros,
                meals: form.meals
            });
            showSuccess(`¡Plantilla "${nameToSave}" guardada para uso futuro!`);
        }

        onSave(payload);
        showSuccess('Plan alimenticio guardado correctamente.');
        onClose();
    };

    const isNutri = auth?.role === 'nutriologo';

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={
                    isEditing
                        ? (mode === 'add' ? 'Crear Plan Alimenticio' : `Editar: ${form.name}`)
                        : `Plan: ${form.name}`
                }
                size="large"
                closeOnOverlayClick={false}
            >
                {/* ==============================================================
                    VISTA 1: FICHA COMPLETA DEL PLAN (MODO CONSULTA DIRECTA)
                    ============================================================== */}
                {!isEditing ? (
                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        {/* Cabecera clínica del plan */}
                        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '1rem', display: 'grid', gap: '0.65rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text)', fontWeight: 800 }}>{form.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginTop: '0.2rem' }}>
                                        Paciente: <strong>{selectedPatient?.name || 'No asignado'}</strong>
                                        {selectedPatient?.clinicalCode || selectedPatient?.clinical_code ? ` · ${selectedPatient.clinicalCode || selectedPatient.clinical_code}` : ''}
                                        {selectedPatient?.documentId || selectedPatient?.document_id ? ` · CC: ${selectedPatient.documentId || selectedPatient.document_id}` : ''}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-strong)' }}>{form.calories} kcal</span>
                                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted)' }}>Meta diaria prescrita</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.25rem', borderTop: '1px dashed var(--line)', paddingTop: '0.55rem', fontSize: '0.8rem', color: 'var(--text-light)', flexWrap: 'wrap' }}>
                                <span><i className="bi bi-bullseye" style={{ color: 'var(--primary)', marginRight: '0.3rem' }} />Objetivo: <strong>{form.target}</strong></span>
                                <span><i className="bi bi-calendar3" style={{ color: 'var(--muted)', marginRight: '0.3rem' }} />Duración: <strong>{form.duration} semanas</strong></span>
                                <span><i className="bi bi-shield-check" style={{ color: 'var(--success-text)', marginRight: '0.3rem' }} />Prot: <strong>{calculatedMacros.proteinGrams}g ({form.proteinPct}%)</strong></span>
                                <span><i className="bi bi-pie-chart" style={{ color: 'var(--info-text)', marginRight: '0.3rem' }} />Carbs: <strong>{calculatedMacros.carbsGrams}g ({form.carbsPct}%)</strong></span>
                                <span><i className="bi bi-droplet-half" style={{ color: 'var(--warning-text)', marginRight: '0.3rem' }} />Grasas: <strong>{calculatedMacros.fatGrams}g ({form.fatPct}%)</strong></span>
                            </div>
                        </div>

                        {/* Menú Estructurado del Día */}
                        <div>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <i className="bi bi-card-checklist" style={{ color: 'var(--primary)' }} />
                                Distribución de Comidas y Alimentos
                            </h4>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                                {form.meals.map((meal) => {
                                    const mealKcal = (meal.foods || []).reduce((acc, f) => acc + (Number(f.calories) || 0), 0);
                                    return (
                                        <div key={meal.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '0.35rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <i className={`bi ${meal.icon || 'bi-clock'}`} style={{ color: meal.color || 'var(--primary)', fontSize: '0.95rem' }} />
                                                    <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{meal.name}</strong>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>({meal.time || '12:00'})</span>
                                                </div>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-strong)' }}>
                                                    {mealKcal} kcal
                                                </span>
                                            </div>

                                            {/* Lista de alimentos */}
                                            <div style={{ display: 'grid', gap: '0.3rem', fontSize: '0.78rem' }}>
                                                {(meal.foods || []).length > 0 ? (
                                                    meal.foods.map((food, fIdx) => (
                                                        <div key={`${food.name}-${fIdx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.2rem 0' }}>
                                                            <span style={{ color: 'var(--text)' }}>
                                                                • {food.name} <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>({food.qty} {food.unit})</span>
                                                            </span>
                                                            <span style={{ fontWeight: 600, color: 'var(--muted)', fontSize: '0.74rem' }}>
                                                                {food.calories} kcal
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.74rem' }}>
                                                        Sin alimentos asignados
                                                    </span>
                                                )}
                                            </div>

                                            {meal.notes && (
                                                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontStyle: 'italic', borderTop: '1px dashed var(--line)', paddingTop: '0.3rem', marginTop: 'auto' }}>
                                                    {meal.notes}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recomendaciones Generales */}
                        {form.recommendations && (
                            <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.85rem 1rem' }}>
                                <strong style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block', marginBottom: '0.35rem' }}>
                                    <i className="bi bi-chat-left-text" style={{ marginRight: '0.3rem' }} />
                                    Recomendaciones Clínicas e Hidratación:
                                </strong>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                                    {form.recommendations}
                                </p>
                            </div>
                        )}

                        {/* Botones de acción en vista */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <button type="button" className="btn secondary" onClick={onClose}>
                                Cerrar
                            </button>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {isNutri && (
                                    <>
                                        <a
                                            href={generateWhatsAppPlanMessage(selectedPatient?.name || 'Paciente', form)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn"
                                            style={{ background: '#25D366', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                                        >
                                            <i className="bi bi-whatsapp" /> Enviar WhatsApp
                                        </a>

                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={() => setIsEditing(true)}
                                            style={{ background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                        >
                                            <i className="bi bi-pencil" /> Editar Plan
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ==============================================================
                        VISTA 2: ASISTENTE PASO A PASO (MODO CREACIÓN / EDICIÓN)
                        ============================================================== */
                    <div className="wizard-container">
                        {/* Barra de progreso de 4 pasos */}
                        <nav className="wizard-steps-bar" aria-label="Progreso del asistente">
                            <button
                                type="button"
                                className={`wizard-step-btn ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
                                onClick={() => setCurrentStep(1)}
                            >
                                <span className="wizard-step-num">{currentStep > 1 ? <i className="bi bi-check-lg" /> : '1'}</span>
                                <span>1. Paciente & Base</span>
                            </button>

                            <button
                                type="button"
                                className={`wizard-step-btn ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
                                onClick={() => handleNextStep && setCurrentStep(2)}
                            >
                                <span className="wizard-step-num">{currentStep > 2 ? <i className="bi bi-check-lg" /> : '2'}</span>
                                <span>2. Calorías & Macros</span>
                            </button>

                            <button
                                type="button"
                                className={`wizard-step-btn ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
                                onClick={() => setCurrentStep(3)}
                            >
                                <span className="wizard-step-num">{currentStep > 3 ? <i className="bi bi-check-lg" /> : '3'}</span>
                                <span>3. Comidas & Menú</span>
                            </button>

                            <button
                                type="button"
                                className={`wizard-step-btn ${currentStep === 4 ? 'active' : ''}`}
                                onClick={() => setCurrentStep(4)}
                            >
                                <span className="wizard-step-num">4</span>
                                <span>4. Guardar</span>
                            </button>
                        </nav>

                        {/* PASO 1: PACIENTE, OBJETIVO Y PLANTILLAS RÁPIDAS */}
                        {currentStep === 1 && (
                            <div className="wizard-content">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'start' }}>
                                    <div className="field">
                                        <PatientSearchPicker
                                            id="patient-select"
                                            label="Selecciona el Paciente"
                                            required
                                            patients={patients}
                                            selectedId={form.patientId}
                                            onSelect={(newId) => handlePatientChange(newId)}
                                            placeholder="Buscar por nombre, cédula o código..."
                                        />
                                    </div>

                                    <div className="field">
                                        <label htmlFor="plan-name">
                                            <i className="bi bi-journal-text" style={{ color: 'var(--primary)', marginRight: '0.35rem' }} />
                                            Nombre o Título del Plan *
                                        </label>
                                        <input
                                            id="plan-name"
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                            placeholder="Ej: Plan de Pérdida de Grasa y Saciedad"
                                        />
                                    </div>
                                </div>

                                {/* Resumen clínico del paciente */}
                                {selectedPatient && (
                                    <div
                                        style={{
                                            background: 'var(--surface-soft)',
                                            border: '1px solid var(--line)',
                                            borderRadius: 'var(--radius)',
                                            padding: '0.75rem 1rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '0.75rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary-strong)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                                                <i className="bi bi-person" />
                                            </div>
                                            <div>
                                                <strong style={{ fontSize: '0.9rem', color: 'var(--text)', display: 'block' }}>{selectedPatient.name}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                                    {selectedPatient.clinicalCode || selectedPatient.clinical_code || `PAC-${selectedPatient.id}`}
                                                    {selectedPatient.documentId || selectedPatient.document_id ? ` · CC: ${selectedPatient.documentId || selectedPatient.document_id}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                            {selectedPatient.weight && <span><strong>Peso:</strong> {selectedPatient.weight} kg</span>}
                                            {selectedPatient.height && <span><strong>Talla:</strong> {selectedPatient.height} cm</span>}
                                            {selectedPatient.bmi && <span><strong>IMC:</strong> {selectedPatient.bmi}</span>}
                                            <span><strong>Objetivo:</strong> <span style={{ color: 'var(--primary-strong)', fontWeight: 600 }}>{selectedPatient.target || selectedPatient.goal || 'General'}</span></span>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                    <div className="field">
                                        <label htmlFor="plan-target">Objetivo Nutricional</label>
                                        <select
                                            id="plan-target"
                                            value={form.target}
                                            onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
                                        >
                                            <option value="Reducir IMC">Reducir IMC / Pérdida de Grasa</option>
                                            <option value="Control calórico">Control calórico / Mantenimiento</option>
                                            <option value="Masa muscular">Masa muscular / Hipertrofia</option>
                                            <option value="Plan deportivo">Plan deportivo / Rendimiento</option>
                                        </select>
                                    </div>

                                    <div className="field">
                                        <label htmlFor="plan-duration">Duración del Plan</label>
                                        <select
                                            id="plan-duration"
                                            value={form.duration}
                                            onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                                        >
                                            <option value="4">4 semanas (1 mes)</option>
                                            <option value="6">6 semanas</option>
                                            <option value="8">8 semanas (2 meses)</option>
                                            <option value="12">12 semanas (3 meses)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Plantillas clínicas predeterminadas */}
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
                                            <i className="bi bi-folder-check" style={{ color: 'var(--primary)', marginRight: '0.35rem' }} />
                                            Plantillas clínicas predeterminadas
                                        </strong>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Carga alimentos y macros en 1 clic</span>
                                    </div>

                                    <div className="preset-templates-grid">
                                        {allTemplates.slice(0, 4).map((tpl) => (
                                            <button
                                                key={tpl.id}
                                                type="button"
                                                className="preset-card"
                                                onClick={() => handleApplyTemplate(tpl)}
                                                title={`Cargar ${tpl.name}`}
                                            >
                                                <div className="preset-card-title">
                                                    <i className="bi bi-bookmark-check" style={{ color: 'var(--primary)' }} />
                                                    <span>{tpl.name.split('(')[0].trim()}</span>
                                                </div>
                                                <span className="preset-card-kcal">
                                                    <i className="bi bi-activity" style={{ marginRight: '0.25rem' }} />
                                                    {tpl.calories} kcal · {tpl.duration || 8} sem
                                                </span>
                                                <span className="preset-card-desc">{tpl.description || 'Plan balanceado listo para personalizar.'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 2: METAS CALÓRICAS Y MACROS */}
                        {currentStep === 2 && (
                            <div className="wizard-content">
                                <div style={{ background: 'var(--surface-soft)', padding: '1rem 1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                                    <div className="field" style={{ maxWidth: '360px' }}>
                                        <label htmlFor="daily-calories">
                                            <i className="bi bi-activity" style={{ color: 'var(--primary)', marginRight: '0.35rem' }} />
                                            Meta Calórica Diaria (kcal) *
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                id="daily-calories"
                                                type="number"
                                                step="50"
                                                min="800"
                                                max="6000"
                                                value={form.calories}
                                                onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
                                                style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-strong)' }}
                                            />
                                            <span style={{ fontWeight: 700, color: 'var(--muted)' }}>kcal / día</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.74rem', color: 'var(--muted)', marginRight: '0.25rem' }}>Metas sugeridas:</span>
                                        {['1500', '1800', '2000', '2200', '2500'].map((kcal) => (
                                            <button
                                                key={kcal}
                                                type="button"
                                                className="btn secondary small"
                                                onClick={() => setForm((p) => ({ ...p, calories: kcal }))}
                                                style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                                            >
                                                {kcal} kcal
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
                                            <i className="bi bi-pie-chart" style={{ color: 'var(--primary)', marginRight: '0.35rem' }} />
                                            Distribución de Macronutrientes (% del total)
                                        </strong>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: calculatedMacros.totalPct === 100 ? 'var(--primary)' : 'var(--danger)' }}>
                                            Total: {calculatedMacros.totalPct}% {calculatedMacros.totalPct !== 100 && '(Debe sumar 100%)'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                                        {MACRO_PRESETS.map((mp) => (
                                            <button
                                                key={mp.label}
                                                type="button"
                                                className="btn ghost small"
                                                onClick={() => setForm((p) => ({ ...p, carbsPct: mp.carbs, proteinPct: mp.protein, fatPct: mp.fat }))}
                                                style={{ border: '1px solid var(--line)', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                            >
                                                {mp.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                        {/* Proteínas */}
                                        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.85rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--success-text)', fontSize: '0.85rem' }}>
                                                    <i className="bi bi-shield-check" style={{ marginRight: '0.3rem' }} />
                                                    Proteína
                                                </span>
                                                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{form.proteinPct}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="60"
                                                step="5"
                                                value={form.proteinPct}
                                                onChange={(e) => setForm((p) => ({ ...p, proteinPct: Number(e.target.value) }))}
                                                style={{ width: '100%', accentColor: 'var(--success)' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                                                <span>Equivale a:</span>
                                                <strong style={{ color: 'var(--text)' }}>{calculatedMacros.proteinGrams} g / día</strong>
                                            </div>
                                        </div>

                                        {/* Carbohidratos */}
                                        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.85rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--info-text)', fontSize: '0.85rem' }}>
                                                    <i className="bi bi-pie-chart" style={{ marginRight: '0.3rem' }} />
                                                    Carbohidratos
                                                </span>
                                                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{form.carbsPct}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="5"
                                                max="75"
                                                step="5"
                                                value={form.carbsPct}
                                                onChange={(e) => setForm((p) => ({ ...p, carbsPct: Number(e.target.value) }))}
                                                style={{ width: '100%', accentColor: 'var(--info)' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                                                <span>Equivale a:</span>
                                                <strong style={{ color: 'var(--text)' }}>{calculatedMacros.carbsGrams} g / día</strong>
                                            </div>
                                        </div>

                                        {/* Grasas */}
                                        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.85rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--warning-text)', fontSize: '0.85rem' }}>
                                                    <i className="bi bi-droplet-half" style={{ marginRight: '0.3rem' }} />
                                                    Grasas Saludables
                                                </span>
                                                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{form.fatPct}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="70"
                                                step="5"
                                                value={form.fatPct}
                                                onChange={(e) => setForm((p) => ({ ...p, fatPct: Number(e.target.value) }))}
                                                style={{ width: '100%', accentColor: 'var(--warning)' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                                                <span>Equivale a:</span>
                                                <strong style={{ color: 'var(--text)' }}>{calculatedMacros.fatGrams} g / día</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 3: COMIDAS Y MENÚ */}
                        {currentStep === 3 && (
                            <div className="wizard-content">
                                <div className="meal-tabs-bar">
                                    {form.meals.map((meal) => {
                                        const count = (meal.foods || []).length;
                                        const mealKcal = (meal.foods || []).reduce((acc, f) => acc + (Number(f.calories) || 0), 0);
                                        return (
                                            <button
                                                key={meal.id}
                                                type="button"
                                                className={`meal-tab-btn ${activeMealId === meal.id ? 'active' : ''}`}
                                                onClick={() => setActiveMealId(meal.id)}
                                            >
                                                <i className={`bi ${meal.icon || 'bi-clock'}`} style={{ color: meal.color || 'var(--primary)' }} />
                                                <span>{meal.name}</span>
                                                {count > 0 && <span className="meal-tab-badge">{mealKcal} kcal</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {activeMeal && (
                                    <div style={{ display: 'grid', gap: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-soft)', padding: '0.65rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{activeMeal.name}</strong>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                                                    <i className="bi bi-clock" />
                                                    <input
                                                        type="time"
                                                        value={activeMeal.time || '12:00'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                meals: prev.meals.map((m) => m.id === activeMeal.id ? { ...m, time: val } : m)
                                                            }));
                                                        }}
                                                        style={{ border: '1px solid var(--line)', borderRadius: '4px', padding: '0.15rem 0.4rem', fontSize: '0.78rem' }}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                                    Aporte actual: <strong style={{ color: 'var(--primary-strong)', fontSize: '0.9rem' }}>{activeMealKcal} kcal</strong>
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn primary small"
                                                    onClick={() => {
                                                        setSearchTargetMealId(activeMeal.id);
                                                        setIsSearchOpen(true);
                                                    }}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                                                >
                                                    <i className="bi bi-search" /> Buscar alimento
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gap: '0.45rem', maxHeight: '280px', overflowY: 'auto' }}>
                                            {(activeMeal.foods || []).length > 0 ? (
                                                activeMeal.foods.map((food, fIdx) => (
                                                    <div key={`${food.name}-${fIdx}`} className="food-item-clean-row">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface-soft)', display: 'grid', placeItems: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                                                                <i className="bi bi-egg" />
                                                            </div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <strong style={{ fontSize: '0.86rem', color: 'var(--text)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                                    {food.name}
                                                                </strong>
                                                                <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                                                                    Porción: {food.qty} {food.unit} {food.notes ? ` · (${food.notes})` : ''}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-strong)' }}>
                                                                {food.calories} kcal
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="btn ghost small"
                                                                onClick={() => handleRemoveFood(activeMeal.id, fIdx)}
                                                                title="Eliminar de esta comida"
                                                                style={{ color: 'var(--danger)', padding: '0.2rem 0.45rem' }}
                                                            >
                                                                <i className="bi bi-trash" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
                                                    <i className="bi bi-card-checklist" style={{ fontSize: '1.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.35rem' }} />
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block' }}>
                                                        Aún no has agregado alimentos a {activeMeal.name}.
                                                    </span>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.65rem' }}>
                                                        <button
                                                            type="button"
                                                            className="btn secondary small"
                                                            onClick={() => {
                                                                setSearchTargetMealId(activeMeal.id);
                                                                setIsSearchOpen(true);
                                                            }}
                                                        >
                                                            <i className="bi bi-search" /> Abrir biblioteca
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn ghost small"
                                                            onClick={() => setIsAddingManual(true)}
                                                        >
                                                            <i className="bi bi-pencil" /> Agregar manual
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {isAddingManual && (
                                            <div style={{ background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', padding: '0.75rem', display: 'grid', gap: '0.5rem', animation: 'fadeIn 0.15s ease' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong style={{ fontSize: '0.82rem', color: 'var(--primary-strong)' }}>Añadir alimento manual rápido</strong>
                                                    <button type="button" onClick={() => setIsAddingManual(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                                                        <i className="bi bi-x-lg" />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.45rem' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre del alimento"
                                                        value={manualFood.name}
                                                        onChange={(e) => setManualFood((p) => ({ ...p, name: e.target.value }))}
                                                        style={{ fontSize: '0.82rem' }}
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Cantidad"
                                                        value={manualFood.qty}
                                                        onChange={(e) => setManualFood((p) => ({ ...p, qty: e.target.value }))}
                                                        style={{ fontSize: '0.82rem' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Unidad (g, ml)"
                                                        value={manualFood.unit}
                                                        onChange={(e) => setManualFood((p) => ({ ...p, unit: e.target.value }))}
                                                        style={{ fontSize: '0.82rem' }}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Calorías"
                                                        value={manualFood.calories}
                                                        onChange={(e) => setManualFood((p) => ({ ...p, calories: e.target.value }))}
                                                        style={{ fontSize: '0.82rem' }}
                                                    />
                                                </div>
                                                <button type="button" className="btn small" onClick={handleAddManualFood} style={{ background: 'var(--primary)', border: 'none' }}>
                                                    Guardar en {activeMeal.name}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-soft)', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text)' }}>
                                    <span>Total Alimentos en el Plan: <strong>{planStats.totalFoods}</strong></span>
                                    <span>Calorías acumuladas: <strong style={{ color: 'var(--primary-strong)' }}>{planStats.totalCalories} kcal</strong> / Meta: <strong>{form.calories} kcal</strong></span>
                                </div>
                            </div>
                        )}

                        {/* PASO 4: RECOMENDACIONES & GUARDAR */}
                        {currentStep === 4 && (
                            <div className="wizard-content">
                                <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '1rem', display: 'grid', gap: '0.65rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)', fontWeight: 800 }}>{form.name}</h4>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                                Paciente: <strong>{selectedPatient?.name || 'No asignado'}</strong> · Duración: <strong>{form.duration} semanas</strong>
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-strong)' }}>{form.calories} kcal</span>
                                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)' }}>Meta diaria recomendada</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', borderTop: '1px dashed var(--line)', paddingTop: '0.5rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                                        <span><i className="bi bi-bullseye" style={{ color: 'var(--primary)', marginRight: '0.25rem' }} />Objetivo: <strong>{form.target}</strong></span>
                                        <span><i className="bi bi-card-checklist" style={{ marginRight: '0.25rem' }} />Total alimentos: <strong>{planStats.totalFoods} ítems</strong></span>
                                        <span><i className="bi bi-shield-check" style={{ color: 'var(--success-text)', marginRight: '0.25rem' }} />Prot: <strong>{calculatedMacros.proteinGrams}g ({form.proteinPct}%)</strong></span>
                                        <span><i className="bi bi-pie-chart" style={{ color: 'var(--info-text)', marginRight: '0.25rem' }} />Carbs: <strong>{calculatedMacros.carbsGrams}g ({form.carbsPct}%)</strong></span>
                                        <span><i className="bi bi-droplet-half" style={{ color: 'var(--warning-text)', marginRight: '0.25rem' }} />Grasas: <strong>{calculatedMacros.fatGrams}g ({form.fatPct}%)</strong></span>
                                    </div>
                                </div>

                                <div className="field">
                                    <label htmlFor="recommendations">
                                        <i className="bi bi-chat-left-text" style={{ color: 'var(--primary)', marginRight: '0.35rem' }} />
                                        Recomendaciones Clínicas y Hábitos de Hidratación
                                    </label>
                                    <textarea
                                        id="recommendations"
                                        rows="4"
                                        value={form.recommendations}
                                        onChange={(e) => setForm((p) => ({ ...p, recommendations: e.target.value }))}
                                        style={{ fontSize: '0.82rem', lineHeight: 1.4 }}
                                    />
                                </div>

                                <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '0.85rem 1rem', display: 'grid', gap: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, fontWeight: 700, fontSize: '0.86rem', color: 'var(--text)' }}>
                                        <input
                                            type="checkbox"
                                            checked={saveAsTemplate}
                                            onChange={(e) => {
                                                setSaveAsTemplate(e.target.checked);
                                                if (e.target.checked && !templateName) {
                                                    setTemplateName(form.name);
                                                }
                                            }}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                        />
                                        <span><i className="bi bi-bookmark-plus" style={{ marginRight: '0.35rem', color: 'var(--primary)' }} />Guardar este plan en mis plantillas predeterminadas para otros pacientes</span>
                                    </label>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '1.75rem' }}>
                                        Te permitirá cargar esta misma estructura con un solo clic en futuros pacientes con objetivos clínicos similares.
                                    </span>

                                    {saveAsTemplate && (
                                        <div style={{ marginLeft: '1.75rem', marginTop: '0.35rem' }}>
                                            <input
                                                type="text"
                                                value={templateName}
                                                onChange={(e) => setTemplateName(e.target.value)}
                                                placeholder="Nombre de la plantilla (ej: Plan Hipocalórico Estándar 1800 kcal)"
                                                style={{ fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navegación del Asistente Wizard (Footer) */}
                        <footer className="wizard-footer">
                            <div>
                                {currentStep > 1 ? (
                                    <button type="button" className="btn secondary" onClick={handlePrevStep}>
                                        <i className="bi bi-arrow-left" /> Anterior
                                    </button>
                                ) : (
                                    <button type="button" className="btn ghost" onClick={onClose}>
                                        Cancelar
                                    </button>
                                )}
                            </div>

                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>
                                Paso {currentStep} de 4
                            </span>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {currentStep < 4 ? (
                                    <button type="button" className="btn" onClick={handleNextStep} style={{ background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        Siguiente paso <i className="bi bi-arrow-right" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={handleSubmitFinal}
                                        style={{ background: 'var(--primary)', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <i className="bi bi-check-circle" /> Guardar Plan Alimenticio
                                    </button>
                                )}
                            </div>
                        </footer>
                    </div>
                )}
            </Modal>

            {/* Modal de búsqueda en biblioteca de alimentos y APIs */}
            <FoodSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelectFood={handleAddFoodFromSearch}
                targetMealName={form.meals.find((m) => m.id === searchTargetMealId)?.name || 'Comida'}
            />
        </>
    );
};

export default PlanModal;
