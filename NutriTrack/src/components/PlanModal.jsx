import { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import FoodSearchModal from './FoodSearchModal';

const DEFAULT_MEAL_TYPES = [
    { id: 'desayuno', name: 'Desayuno', icon: 'bi-brightness-high-fill', color: '#f59e0b', defaultTime: '08:00', defaultPct: 25 },
    { id: 'mediaManana', name: 'Media Mañana', icon: 'bi-sun-fill', color: '#eab308', defaultTime: '11:00', defaultPct: 10 },
    { id: 'almuerzo', name: 'Almuerzo', icon: 'bi-egg-fried', color: '#16a34a', defaultTime: '14:00', defaultPct: 30 },
    { id: 'merienda', name: 'Merienda', icon: 'bi-cup-hot-fill', color: '#2563eb', defaultTime: '17:00', defaultPct: 10 },
    { id: 'cena', name: 'Cena', icon: 'bi-moon-stars-fill', color: '#8b5cf6', defaultTime: '20:00', defaultPct: 20 },
    { id: 'snack', name: 'Snack', icon: 'bi-cookie', color: '#ec4899', defaultTime: '22:00', defaultPct: 5 }
];

const DEFAULT_RECOMMENDATIONS = `- Mantener una hidratación adecuada consumiendo al menos 2 litros de agua natural al día.
- Respetar los horarios recomendados y las porciones indicadas.
- Priorizar alimentos frescos, proteínas magras y cereales integrales.
- Ante cualquier duda, síntoma o ajuste necesario, consultar directamente al nutricionista.`;

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
    const { auth, plans, dietTemplates, saveDietTemplate, generateWhatsAppPlanMessage } = useApp();

    const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'add');
    const [creationMode, setCreationMode] = useState('custom'); // 'custom', 'template', 'copy'
    
    // Almacenamiento del plan en formulario
    const [form, setForm] = useState({
        patientId: '',
        name: '',
        target: 'Reducir IMC',
        calories: '2000',
        duration: '8',
        proteinPct: 30,
        carbsPct: 45,
        fatPct: 25,
        recommendations: DEFAULT_RECOMMENDATIONS,
        meals: createDefaultMeals()
    });

    // Acordeones abiertos/cerrados por ID de comida
    const [openMeals, setOpenMeals] = useState({});

    // Modal de búsqueda de alimentos
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [targetMealId, setTargetMealId] = useState(null);

    // Edición manual de alimento en fila
    const [editingFoodKey, setEditingFoodKey] = useState(null); // { mealId, foodIndex }

    // Plantilla o plan copiado seleccionado
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [selectedCopyPlanId, setSelectedCopyPlanId] = useState('');
    const [newMealName, setNewMealName] = useState('');
    const [isAddingMeal, setIsAddingMeal] = useState(false);

    // Paciente actualmente seleccionado
    const selectedPatient = useMemo(() => {
        if (!form.patientId) return null;
        return patients.find((p) => Number(p.id) === Number(form.patientId)) || null;
    }, [patients, form.patientId]);

    // Inicializar estado al abrir o cambiar de plan
    useEffect(() => {
        if (!isOpen) return;

        if (plan && (mode === 'edit' || mode === 'view')) {
            // Normalizar comidas si vienen como diccionario u objeto
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
                proteinPct: Number(plan.macros?.protein) || 30,
                carbsPct: Number(plan.macros?.carbs) || 45,
                fatPct: Number(plan.macros?.fat) || 25,
                recommendations: plan.recommendations || DEFAULT_RECOMMENDATIONS,
                meals: normalizedMeals
            });

            // Abrir todos los acordeones por defecto
            const initialOpen = {};
            normalizedMeals.forEach((m) => { initialOpen[m.id] = true; });
            setOpenMeals(initialOpen);
        } else if (mode === 'add') {
            // Revisar si existe borrador en LocalStorage
            const pId = plan?.patientId ? String(plan.patientId) : (patients[0]?.id ? String(patients[0].id) : '');
            const draftKey = `nutritrack_draft_plan_${pId}`;
            const savedDraft = localStorage.getItem(draftKey);

            let initialForm = {
                patientId: pId,
                name: 'Nuevo Plan Alimenticio',
                target: 'Reducir IMC',
                calories: '2000',
                duration: '8',
                proteinPct: 30,
                carbsPct: 45,
                fatPct: 25,
                recommendations: DEFAULT_RECOMMENDATIONS,
                meals: createDefaultMeals()
            };

            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    if (parsed && parsed.meals) {
                        initialForm = { ...initialForm, ...parsed, patientId: pId };
                    }
                } catch {
                    // ignore draft error
                }
            }

            setForm(initialForm);
            const initialOpen = {};
            initialForm.meals.forEach((m) => { initialOpen[m.id] = true; });
            setOpenMeals(initialOpen);
        }

        setIsEditing(mode === 'edit' || mode === 'add');
        setCreationMode('custom');
        setEditingFoodKey(null);
    }, [plan, mode, isOpen, patients]);

    // Auto-guardar borrador al editar en modo add
    useEffect(() => {
        if (!isOpen || mode !== 'add' || !form.patientId) return;
        const draftKey = `nutritrack_draft_plan_${form.patientId}`;
        const timer = setTimeout(() => {
            localStorage.setItem(draftKey, JSON.stringify(form));
        }, 1000);
        return () => clearTimeout(timer);
    }, [form, isOpen, mode]);

    // Cálculo de macros meta en gramos
    const targetMacrosGrams = useMemo(() => {
        const cal = Number(form.calories) || 2000;
        const pGrams = Math.round((cal * (Number(form.proteinPct) / 100)) / 4);
        const cGrams = Math.round((cal * (Number(form.carbsPct) / 100)) / 4);
        const fGrams = Math.round((cal * (Number(form.fatPct) / 100)) / 9);
        return { protein: pGrams, carbs: cGrams, fat: fGrams };
    }, [form.calories, form.proteinPct, form.carbsPct, form.fatPct]);

    // Resumen nutricional actual en tiempo real
    const liveNutrition = useMemo(() => {
        let totalCal = 0;
        let totalP = 0;
        let totalC = 0;
        let totalF = 0;

        (form.meals || []).forEach((meal) => {
            (meal.foods || []).forEach((f) => {
                totalCal += Number(f.calories) || 0;
                totalP += Number(f.protein) || 0;
                totalC += Number(f.carbohydrates) || 0;
                totalF += Number(f.fat) || 0;
            });
        });

        const targetCal = Number(form.calories) || 2000;
        const calPct = targetCal > 0 ? Math.round((totalCal / targetCal) * 100) : 0;
        const pPct = targetMacrosGrams.protein > 0 ? Math.round((totalP / targetMacrosGrams.protein) * 100) : 0;
        const cPct = targetMacrosGrams.carbs > 0 ? Math.round((totalC / targetMacrosGrams.carbs) * 100) : 0;
        const fPct = targetMacrosGrams.fat > 0 ? Math.round((totalF / targetMacrosGrams.fat) * 100) : 0;

        return {
            calories: Math.round(totalCal),
            protein: +totalP.toFixed(1),
            carbohydrates: +totalC.toFixed(1),
            fat: +totalF.toFixed(1),
            calPct,
            pPct,
            cPct,
            fPct,
            calDiff: Math.round(totalCal - targetCal)
        };
    }, [form.meals, form.calories, targetMacrosGrams]);

    if (!isOpen) return null;

    const toggleMealAccordion = (mealId) => {
        setOpenMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
    };

    const expandAllMeals = () => {
        const next = {};
        form.meals.forEach((m) => { next[m.id] = true; });
        setOpenMeals(next);
    };

    const collapseAllMeals = () => {
        setOpenMeals({});
    };

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // ── Acciones de Creación Rápida ──
    const handleStartFromScratch = () => {
        setCreationMode('custom');
        setForm((prev) => ({
            ...prev,
            meals: createDefaultMeals()
        }));
        showSuccess('Estructura limpia lista para personalizar desde cero.');
    };

    const handleApplyTemplate = (tplId) => {
        setSelectedTemplateId(tplId);
        if (!tplId) return;
        const found = (dietTemplates || []).find((t) => t.id === tplId);
        if (found) {
            let loadedMeals = [];
            if (Array.isArray(found.meals)) {
                loadedMeals = JSON.parse(JSON.stringify(found.meals));
            } else if (found.meals && typeof found.meals === 'object') {
                loadedMeals = DEFAULT_MEAL_TYPES.map((def) => ({
                    id: def.id,
                    name: def.name,
                    time: def.defaultTime,
                    targetPct: def.defaultPct,
                    icon: def.icon,
                    color: def.color,
                    notes: '',
                    foods: found.meals[def.id] ? JSON.parse(JSON.stringify(found.meals[def.id])) : []
                }));
            }

            setForm((prev) => ({
                ...prev,
                name: found.name,
                target: found.target || prev.target,
                calories: String(found.calories || prev.calories),
                duration: String(found.duration || prev.duration),
                proteinPct: Number(found.macros?.protein) || 30,
                carbsPct: Number(found.macros?.carbs) || 45,
                fatPct: Number(found.macros?.fat) || 25,
                meals: loadedMeals
            }));

            const nextOpen = {};
            loadedMeals.forEach((m) => { nextOpen[m.id] = true; });
            setOpenMeals(nextOpen);

            showSuccess(`Plantilla "${found.name}" cargada. Ahora puedes editar todo libremente.`);
        }
    };

    const handleCopyPlan = (planId) => {
        setSelectedCopyPlanId(planId);
        if (!planId) return;
        const found = (plans || []).find((p) => p.id === Number(planId) || p.id === planId);
        if (found) {
            let copiedMeals = [];
            if (Array.isArray(found.meals)) {
                copiedMeals = JSON.parse(JSON.stringify(found.meals));
            } else if (found.meals && typeof found.meals === 'object') {
                copiedMeals = DEFAULT_MEAL_TYPES.map((def) => ({
                    id: def.id,
                    name: def.name,
                    time: def.defaultTime,
                    targetPct: def.defaultPct,
                    icon: def.icon,
                    color: def.color,
                    notes: '',
                    foods: found.meals[def.id] ? JSON.parse(JSON.stringify(found.meals[def.id])) : []
                }));
            }

            setForm((prev) => ({
                ...prev,
                name: `${found.name} (Copia)`,
                target: found.target || prev.target,
                calories: String(found.calories || prev.calories),
                duration: String(found.duration || prev.duration),
                recommendations: found.recommendations || prev.recommendations,
                meals: copiedMeals
            }));

            const nextOpen = {};
            copiedMeals.forEach((m) => { nextOpen[m.id] = true; });
            setOpenMeals(nextOpen);

            showSuccess(`Plan copiado como nueva instancia independiente. Puedes modificarlo libremente.`);
        }
    };

    // ── Distribución Automática de Calorías ──
    const handleDistributeCalories = () => {
        const totalMeals = form.meals.length;
        if (totalMeals === 0) return;

        // Si son las 6 estándar, aplicar proporción equilibrada
        let updatedMeals = [];
        if (totalMeals === 6) {
            const defaultPcts = [25, 10, 30, 10, 20, 5];
            updatedMeals = form.meals.map((m, idx) => ({
                ...m,
                targetPct: defaultPcts[idx] || Math.round(100 / totalMeals)
            }));
        } else {
            const evenPct = Math.round(100 / totalMeals);
            updatedMeals = form.meals.map((m) => ({
                ...m,
                targetPct: evenPct
            }));
        }

        setForm((prev) => ({ ...prev, meals: updatedMeals }));
        showSuccess('Distribución calórica optimizada por tiempo de comida.');
    };

    // ── Estructura Dinámica de Comidas ──
    const handleAddMealTime = () => {
        if (!newMealName.trim()) {
            showError('Escribe un nombre para el nuevo tiempo de comida.');
            return;
        }

        const newId = `custom-meal-${Date.now()}`;
        const newMeal = {
            id: newId,
            name: newMealName.trim(),
            time: '16:00',
            targetPct: 10,
            icon: 'bi-cup-straw',
            color: '#10b981',
            notes: '',
            foods: []
        };

        setForm((prev) => ({
            ...prev,
            meals: [...prev.meals, newMeal]
        }));
        setOpenMeals((prev) => ({ ...prev, [newId]: true }));
        setNewMealName('');
        setIsAddingMeal(false);
        showSuccess(`Tiempo de comida "${newMeal.name}" agregado.`);
    };

    const handleRemoveMeal = (mealId) => {
        if (form.meals.length <= 1) {
            showError('El plan debe tener al menos un tiempo de comida.');
            return;
        }
        setForm((prev) => ({
            ...prev,
            meals: prev.meals.filter((m) => m.id !== mealId)
        }));
    };

    const handleMoveMeal = (index, direction) => {
        const list = [...form.meals];
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === list.length - 1) return;
        const swapIdx = direction === 'up' ? index - 1 : index + 1;
        [list[index], list[swapIdx]] = [list[swapIdx], list[index]];
        setForm((prev) => ({ ...prev, meals: list }));
    };

    const handleUpdateMealField = (mealId, field, value) => {
        setForm((prev) => ({
            ...prev,
            meals: prev.meals.map((m) => (m.id === mealId ? { ...m, [field]: value } : m))
        }));
    };

    // ── Manejo de Alimentos dentro de Comida ──
    const openFoodSearch = (mealId) => {
        setTargetMealId(mealId);
        setIsSearchOpen(true);
    };

    const handleAddFoodFromSearch = (foodItem) => {
        if (!targetMealId) return;

        setForm((prev) => ({
            ...prev,
            meals: prev.meals.map((m) =>
                m.id === targetMealId
                    ? { ...m, foods: [...m.foods, { ...foodItem, id: `f-${Date.now()}-${Math.random().toString(36).substring(7)}` }] }
                    : m
            )
        }));
    };

    const handleRemoveFoodFromMeal = (mealId, foodIndex) => {
        setForm((prev) => ({
            ...prev,
            meals: prev.meals.map((m) =>
                m.id === mealId
                    ? { ...m, foods: m.foods.filter((_, idx) => idx !== foodIndex) }
                    : m
            )
        }));
    };

    const handleDuplicateFood = (mealId, foodIndex) => {
        setForm((prev) => ({
            ...prev,
            meals: prev.meals.map((m) => {
                if (m.id !== mealId) return m;
                const copy = { ...m.foods[foodIndex], id: `f-${Date.now()}` };
                return {
                    ...m,
                    foods: [
                        ...m.foods.slice(0, foodIndex + 1),
                        copy,
                        ...m.foods.slice(foodIndex + 1)
                    ]
                };
            })
        }));
        showSuccess('Alimento duplicado.');
    };

    const handleMoveFood = (mealId, foodIndex, direction) => {
        setForm((prev) => ({
            ...prev,
            meals: prev.meals.map((m) => {
                if (m.id !== mealId) return m;
                const list = [...m.foods];
                if (direction === 'up' && foodIndex === 0) return m;
                if (direction === 'down' && foodIndex === list.length - 1) return m;
                const swapIdx = direction === 'up' ? foodIndex - 1 : foodIndex + 1;
                [list[foodIndex], list[swapIdx]] = [list[swapIdx], list[foodIndex]];
                return { ...m, foods: list };
            })
        }));
    };

    const handleUpdateFoodQty = (mealId, foodIndex, newQty) => {
        const qtyNum = Number(newQty) || 0;
        setForm((prev) => ({
            ...prev,
            meals: prev.meals.map((m) => {
                if (m.id !== mealId) return m;
                const list = [...m.foods];
                const current = list[foodIndex];
                const baseQty = Number(current.qty) || 100;
                const ratio = baseQty > 0 && qtyNum > 0 ? qtyNum / baseQty : 1;

                list[foodIndex] = {
                    ...current,
                    qty: String(newQty),
                    calories: Math.round(Number(current.calories || 0) * ratio),
                    protein: +(Number(current.protein || 0) * ratio).toFixed(1),
                    carbohydrates: +(Number(current.carbohydrates || 0) * ratio).toFixed(1),
                    fat: +(Number(current.fat || 0) * ratio).toFixed(1)
                };
                return { ...m, foods: list };
            })
        }));
    };

    // ── Guardado como Plantilla ──
    const handleSaveAsDietTemplate = () => {
        if (!form.name.trim()) {
            showError('Ingresa un nombre para la plantilla.');
            return;
        }

        saveDietTemplate({
            name: form.name.trim(),
            description: `Plantilla basada en ${form.calories} kcal para ${form.target}.`,
            target: form.target,
            calories: Number(form.calories) || 2000,
            duration: Number(form.duration) || 4,
            macros: {
                protein: Number(form.proteinPct) || 30,
                carbs: Number(form.carbsPct) || 45,
                fat: Number(form.fatPct) || 25
            },
            meals: form.meals
        });

        showSuccess('¡Plan guardado exitosamente en tu biblioteca de plantillas!');
    };

    // ── Guardar Borrador Manual ──
    const handleSaveDraft = () => {
        if (!form.patientId) {
            showError('Selecciona un paciente antes de guardar un borrador.');
            return;
        }
        localStorage.setItem(`nutritrack_draft_plan_${form.patientId}`, JSON.stringify(form));
        showSuccess('Borrador guardado localmente. Puedes continuar luego sin perder tus cambios.');
    };

    // ── Guardar Plan Final ──
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.patientId) {
            showError('Selecciona un paciente.');
            return;
        }
        if (!form.name.trim()) {
            showError('Ingresa el nombre del plan.');
            return;
        }
        if (!form.calories || Number(form.calories) <= 0) {
            showError('Ingresa una meta calórica válida mayor a 0.');
            return;
        }
        if (!form.duration || Number(form.duration) <= 0) {
            showError('Ingresa una duración en semanas válida.');
            return;
        }

        // Limpiar borrador local al guardar definitivo
        localStorage.removeItem(`nutritrack_draft_plan_${form.patientId}`);

        onSave({
            id: plan?.id || Date.now(),
            patientId: Number(form.patientId),
            name: form.name.trim(),
            target: form.target,
            calories: Number(form.calories),
            duration: Number(form.duration),
            macros: {
                protein: Number(form.proteinPct),
                carbs: Number(form.carbsPct),
                fat: Number(form.fatPct)
            },
            recommendations: form.recommendations,
            meals: form.meals
        });

        onClose();
    };

    const targetMealObject = form.meals.find((m) => m.id === targetMealId);

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={mode === 'add' ? '🥗 Crear Nuevo Plan Alimenticio Inteligente' : `🥗 Plan: ${form.name}`}
                size="large"
            >
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                    {/* ── 1. Barra de Creación Rápida ── */}
                    {isEditing && (
                        <div
                            style={{
                                background: 'linear-gradient(135deg, rgba(73, 181, 76, 0.12), rgba(56, 47, 253, 0.08))',
                                border: '1px solid rgba(73, 181, 76, 0.25)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1rem 1.25rem',
                                display: 'grid',
                                gap: '0.75rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span style={{ fontSize: '1.4rem' }}>⚡</span>
                                    <div>
                                        <strong style={{ fontSize: '0.95rem', color: 'var(--text)', display: 'block' }}>
                                            CREACIÓN RÁPIDA DE PLANES
                                        </strong>
                                        <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                                            Comienza desde cero, parte de una plantilla clínica o copia un plan previo
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className={`btn small ${creationMode === 'custom' ? '' : 'secondary'}`}
                                        onClick={handleStartFromScratch}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        <i className="bi bi-pencil-square" /> Desde cero
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn small ${creationMode === 'template' ? '' : 'secondary'}`}
                                        onClick={() => setCreationMode('template')}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        <i className="bi bi-journal-bookmark-fill" /> Usar plantilla
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn small ${creationMode === 'copy' ? '' : 'secondary'}`}
                                        onClick={() => setCreationMode('copy')}
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        <i className="bi bi-files" /> Copiar plan
                                    </button>
                                </div>
                            </div>

                            {/* Opciones desplegadas según el modo de creación rápida */}
                            {creationMode === 'template' && (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--surface)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Seleccionar Plantilla:</span>
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => handleApplyTemplate(e.target.value)}
                                        style={{ flex: 1, minWidth: '220px', fontSize: '0.82rem', height: '2.4rem' }}
                                    >
                                        <option value="">Elige una plantilla clínica...</option>
                                        {(dietTemplates || []).map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} ({t.calories} kcal · {t.target})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {creationMode === 'copy' && (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--surface)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Copiar de:</span>
                                    <select
                                        value={selectedCopyPlanId}
                                        onChange={(e) => handleCopyPlan(e.target.value)}
                                        style={{ flex: 1, minWidth: '220px', fontSize: '0.82rem', height: '2.4rem' }}
                                    >
                                        <option value="">Selecciona un plan existente...</option>
                                        {(plans || []).map((p) => {
                                            const pat = patients.find((pt) => pt.id === p.patientId);
                                            return (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} — Paciente: {pat?.name || 'Paciente'} ({p.calories} kcal)
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 2. Datos del Paciente (Referencia Visual Real) ── */}
                    {selectedPatient && (
                        <div
                            style={{
                                background: 'var(--surface-soft)',
                                border: '1px solid var(--line)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '0.85rem 1.15rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        color: '#fff',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    {selectedPatient.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <strong style={{ fontSize: '0.95rem', color: 'var(--text)', display: 'block' }}>
                                        {selectedPatient.name}
                                    </strong>
                                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                                        {selectedPatient.email || 'Sin correo'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                                <div>
                                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem' }}>PESO ACTUAL</span>
                                    <strong>{selectedPatient.weight ? `${selectedPatient.weight} kg` : '—'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem' }}>ESTATURA</span>
                                    <strong>{selectedPatient.height ? `${selectedPatient.height} cm` : '—'}</strong>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem' }}>IMC</span>
                                    <strong>
                                        {selectedPatient.weight && selectedPatient.height
                                            ? (selectedPatient.weight / ((selectedPatient.height / 100) ** 2)).toFixed(1)
                                            : '—'}
                                    </strong>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem' }}>OBJETIVO CLÍNICO</span>
                                    <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-strong)', fontWeight: 700 }}>
                                        {selectedPatient.target || 'Control calórico'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── 3. Información General del Plan ── */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                                Parámetros Generales
                            </h4>

                            {!isEditing && (
                                <a
                                    href={generateWhatsAppPlanMessage(selectedPatient?.name, form)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn small"
                                    style={{ background: '#25D366', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', textDecoration: 'none' }}
                                >
                                    <i className="bi bi-whatsapp" /> Enviar plan por WhatsApp
                                </a>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                            <div className="field">
                                <label>Nombre del Plan *</label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleFieldChange}
                                    placeholder="Ej: Plan Déficit Calórico 1800 kcal"
                                    required
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="field">
                                <label>Paciente Asignado *</label>
                                {isEditing && mode === 'add' ? (
                                    <select name="patientId" value={form.patientId} onChange={handleFieldChange} required>
                                        <option value="">Selecciona un paciente...</option>
                                        {patients.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input value={selectedPatient?.name || 'Paciente'} disabled />
                                )}
                            </div>

                            <div className="field">
                                <label>Calorías Diarias Meta (kcal) *</label>
                                <input
                                    name="calories"
                                    type="number"
                                    min="500"
                                    max="10000"
                                    value={form.calories}
                                    onChange={handleFieldChange}
                                    required
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="field">
                                <label>Duración (semanas) *</label>
                                <input
                                    name="duration"
                                    type="number"
                                    min="1"
                                    max="52"
                                    value={form.duration}
                                    onChange={handleFieldChange}
                                    required
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="field">
                                <label>Objetivo</label>
                                <select name="target" value={form.target} onChange={handleFieldChange} disabled={!isEditing}>
                                    <option value="Reducir IMC">Reducir IMC / Pérdida de grasa</option>
                                    <option value="Control calórico">Control calórico / Mantenimiento</option>
                                    <option value="Masa muscular">Ganancia de masa muscular</option>
                                    <option value="Plan deportivo">Rendimiento deportivo</option>
                                    <option value="Salud digestiva">Salud digestiva / Low FODMAP</option>
                                </select>
                            </div>
                        </div>

                        {/* Distribución de Macronutrientes % y g */}
                        <div style={{ background: 'var(--surface-soft)', padding: '0.85rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', display: 'grid', gap: '0.65rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' }}>
                                    🎯 Distribución de Macronutrientes Objetivo
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                    Total: {Number(form.proteinPct) + Number(form.carbsPct) + Number(form.fatPct)}%
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                <div style={{ background: 'var(--surface)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(22, 163, 74, 0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.3rem' }}>
                                        <strong style={{ color: '#16a34a' }}>Proteínas</strong>
                                        <span>{targetMacrosGrams.protein} g</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <input
                                            type="number"
                                            name="proteinPct"
                                            value={form.proteinPct}
                                            onChange={handleFieldChange}
                                            disabled={!isEditing}
                                            style={{ height: '2rem', fontSize: '0.85rem', fontWeight: 700 }}
                                        />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>%</span>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--surface)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(37, 99, 235, 0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.3rem' }}>
                                        <strong style={{ color: '#2563eb' }}>Carbohidratos</strong>
                                        <span>{targetMacrosGrams.carbs} g</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <input
                                            type="number"
                                            name="carbsPct"
                                            value={form.carbsPct}
                                            onChange={handleFieldChange}
                                            disabled={!isEditing}
                                            style={{ height: '2rem', fontSize: '0.85rem', fontWeight: 700 }}
                                        />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>%</span>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--surface)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.3rem' }}>
                                        <strong style={{ color: '#f59e0b' }}>Grasas</strong>
                                        <span>{targetMacrosGrams.fat} g</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <input
                                            type="number"
                                            name="fatPct"
                                            value={form.fatPct}
                                            onChange={handleFieldChange}
                                            disabled={!isEditing}
                                            style={{ height: '2rem', fontSize: '0.85rem', fontWeight: 700 }}
                                        />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 4. Resumen Nutricional en Tiempo Real (Barras de Progreso) ── */}
                    <div
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.25rem',
                            display: 'grid',
                            gap: '1rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                                    📊 Balance Nutricional en Tiempo Real
                                </h4>
                                <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                                    Suma acumulada de todos los alimentos registrados vs objetivos del plan
                                </span>
                            </div>

                            {/* Advertencia visual informativa */}
                            {liveNutrition.calDiff > 100 && (
                                <span className="badge" style={{ background: 'var(--warning-soft)', color: '#b45309', fontWeight: 700 }}>
                                    ⚠️ Excediendo meta calórica (+{liveNutrition.calDiff} kcal)
                                </span>
                            )}
                            {liveNutrition.calDiff < -200 && liveNutrition.calories > 0 && (
                                <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-strong)', fontWeight: 700 }}>
                                    💡 Faltan {Math.abs(liveNutrition.calDiff)} kcal para la meta
                                </span>
                            )}
                        </div>

                        {/* 4 Barras de Progreso (Calorías, Proteína, Carbos, Grasas) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {/* Calorías */}
                            <div style={{ background: 'var(--surface-soft)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                                    <strong>Calorías</strong>
                                    <span>{liveNutrition.calories} / {form.calories} kcal</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'var(--surface-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${Math.min(100, liveNutrition.calPct)}%`,
                                            background: liveNutrition.calPct > 105 ? '#ef4444' : 'var(--primary)',
                                            transition: 'width 0.3s ease'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.68rem', color: 'var(--muted)', display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>
                                    {liveNutrition.calPct}% alcanzado
                                </span>
                            </div>

                            {/* Proteínas */}
                            <div style={{ background: 'var(--surface-soft)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                                    <strong style={{ color: '#16a34a' }}>Proteínas</strong>
                                    <span>{liveNutrition.protein} / {targetMacrosGrams.protein} g</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'var(--surface-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${Math.min(100, liveNutrition.pPct)}%`,
                                            background: '#16a34a',
                                            transition: 'width 0.3s ease'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.68rem', color: 'var(--muted)', display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>
                                    {liveNutrition.pPct}% del objetivo
                                </span>
                            </div>

                            {/* Carbohidratos */}
                            <div style={{ background: 'var(--surface-soft)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                                    <strong style={{ color: '#2563eb' }}>Carbohidratos</strong>
                                    <span>{liveNutrition.carbohydrates} / {targetMacrosGrams.carbs} g</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'var(--surface-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${Math.min(100, liveNutrition.cPct)}%`,
                                            background: '#2563eb',
                                            transition: 'width 0.3s ease'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.68rem', color: 'var(--muted)', display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>
                                    {liveNutrition.cPct}% del objetivo
                                </span>
                            </div>

                            {/* Grasas */}
                            <div style={{ background: 'var(--surface-soft)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                                    <strong style={{ color: '#f59e0b' }}>Grasas</strong>
                                    <span>{liveNutrition.fat} / {targetMacrosGrams.fat} g</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'var(--surface-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${Math.min(100, liveNutrition.fPct)}%`,
                                            background: '#f59e0b',
                                            transition: 'width 0.3s ease'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.68rem', color: 'var(--muted)', display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>
                                    {liveNutrition.fPct}% del objetivo
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── 5. Estructura Dinámica de Comidas (Acordeones Plegables) ── */}
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                                    🍳 Estructura de Comidas y Tiempos
                                </h4>
                                <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                                    {form.meals.length} tiempos configurados. Personaliza alimentos, horarios y porciones.
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="btn ghost small"
                                    onClick={handleDistributeCalories}
                                    title="Calcular metas calóricas proporcionales para cada comida"
                                    style={{ fontSize: '0.76rem', border: '1px solid var(--line)' }}
                                >
                                    ⚡ Distribuir automáticamente
                                </button>
                                <button
                                    type="button"
                                    className="btn ghost small"
                                    onClick={expandAllMeals}
                                    style={{ fontSize: '0.76rem' }}
                                >
                                    Desplegar todo
                                </button>
                                <button
                                    type="button"
                                    className="btn ghost small"
                                    onClick={collapseAllMeals}
                                    style={{ fontSize: '0.76rem' }}
                                >
                                    Plegar
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        className="btn small"
                                        onClick={() => setIsAddingMeal(true)}
                                        style={{ background: 'var(--primary)', border: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                        <i className="bi bi-plus-circle" /> Agregar tiempo
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Formulario flotante para agregar nuevo tiempo de comida */}
                        {isAddingMeal && (
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-soft)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--primary)', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Nuevo tiempo:</span>
                                <input
                                    type="text"
                                    value={newMealName}
                                    onChange={(e) => setNewMealName(e.target.value)}
                                    placeholder="Ej: Pre-entreno, Colación nocturna, Merienda 2..."
                                    style={{ flex: 1, minWidth: '180px', height: '2.2rem', fontSize: '0.85rem' }}
                                    autoFocus
                                />
                                <button type="button" className="btn small" onClick={handleAddMealTime} style={{ background: 'var(--primary)', border: 'none' }}>
                                    Guardar
                                </button>
                                <button type="button" className="btn secondary small" onClick={() => setIsAddingMeal(false)}>
                                    Cancelar
                                </button>
                            </div>
                        )}

                        {/* Acordeones de cada Comida */}
                        {form.meals.map((meal, mealIdx) => {
                            const isOpenAccordion = !!openMeals[meal.id];
                            const mealTotalCal = (meal.foods || []).reduce((sum, f) => sum + (Number(f.calories) || 0), 0);
                            const mealTargetCal = Math.round((Number(form.calories) * (Number(meal.targetPct) || 0)) / 100);

                            return (
                                <div
                                    key={meal.id}
                                    style={{
                                        border: '1px solid var(--line)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--surface)',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {/* Cabecera del Acordeón */}
                                    <div
                                        onClick={() => toggleMealAccordion(meal.id)}
                                        style={{
                                            padding: '0.85rem 1.15rem',
                                            background: isOpenAccordion ? 'var(--surface-soft)' : 'var(--surface)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            borderBottom: isOpenAccordion ? '1px solid var(--line)' : 'none',
                                            gap: '0.75rem',
                                            flexWrap: 'wrap'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <i
                                                className={`bi ${isOpenAccordion ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                                                style={{ fontSize: '0.85rem', color: 'var(--muted)' }}
                                            />
                                            <div
                                                style={{
                                                    width: '30px',
                                                    height: '30px',
                                                    borderRadius: '50%',
                                                    background: `${meal.color || '#49b54c'}18`,
                                                    color: meal.color || '#49b54c',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                <i className={`bi ${meal.icon || 'bi-egg-fried'}`} />
                                            </div>

                                            {/* Nombre y Horario editables en click */}
                                            {isEditing ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        value={meal.name}
                                                        onChange={(e) => handleUpdateMealField(meal.id, 'name', e.target.value)}
                                                        style={{ fontWeight: 800, fontSize: '0.92rem', height: '2rem', padding: '0.2rem 0.5rem', width: '150px' }}
                                                    />
                                                    <input
                                                        type="time"
                                                        value={meal.time}
                                                        onChange={(e) => handleUpdateMealField(meal.id, 'time', e.target.value)}
                                                        style={{ fontSize: '0.8rem', height: '2rem', padding: '0.2rem 0.4rem', width: '90px' }}
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>
                                                        {meal.name}
                                                    </strong>
                                                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)', marginLeft: '0.4rem' }}>
                                                        ({meal.time})
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Metas y Acciones de Comida */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                                                <strong>{mealTotalCal}</strong>
                                                <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}> / {mealTargetCal} kcal</span>
                                            </div>

                                            {isEditing && (
                                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveMeal(mealIdx, 'up')}
                                                        disabled={mealIdx === 0}
                                                        title="Mover arriba"
                                                        style={{ border: 'none', background: 'none', color: mealIdx === 0 ? '#cbd5e1' : 'var(--muted)', cursor: 'pointer', padding: '0.2rem' }}
                                                    >
                                                        <i className="bi bi-arrow-up" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveMeal(mealIdx, 'down')}
                                                        disabled={mealIdx === form.meals.length - 1}
                                                        title="Mover abajo"
                                                        style={{ border: 'none', background: 'none', color: mealIdx === form.meals.length - 1 ? '#cbd5e1' : 'var(--muted)', cursor: 'pointer', padding: '0.2rem' }}
                                                    >
                                                        <i className="bi bi-arrow-down" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMeal(meal.id)}
                                                        title="Eliminar comida"
                                                        style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                                                    >
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

<<<<<<< HEAD
                                    {/* Contenido Desplegado del Acordeón */}
                                    {isOpenAccordion && (
                                        <div style={{ padding: '1rem 1.25rem', display: 'grid', gap: '0.85rem' }}>
                                            {/* Lista de alimentos agregados a esta comida */}
                                            {meal.foods && meal.foods.length > 0 ? (
                                                <div style={{ display: 'grid', gap: '0.45rem' }}>
                                                    {meal.foods.map((food, fIdx) => (
                                                        <div
                                                            key={food.id || fIdx}
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '0.55rem 0.85rem',
                                                                borderRadius: 'var(--radius)',
                                                                border: '1px solid var(--line)',
                                                                background: 'var(--surface-soft)',
                                                                gap: '0.75rem',
                                                                flexWrap: 'wrap'
                                                            }}
                                                        >
                                                            <div style={{ flex: 1, minWidth: '180px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
                                                                        {food.name}
                                                                    </strong>
                                                                    {food.brand && (
                                                                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                                                                            ({food.brand})
=======
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                        {foods.length > 0 ? foods.map((food, idx) => {
                                            const isRowEditing = isEditing && editingFood?.category === cat.key && editingFood?.index === idx;
                                            return (
                                                <div key={idx} className={`meal-food-row${isRowEditing ? ' editing' : ''}`}>
                                                    {isRowEditing ? (
                                                        <>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.35rem' }}>
                                                                <input
                                                                    type="time"
                                                                    aria-label="Hora"
                                                                    value={food.time || defaultTimes[cat.key]}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'time', e.target.value)}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    aria-label="Nombre del alimento"
                                                                    value={food.name || ''}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'name', e.target.value)}
                                                                    placeholder="Alimento"
                                                                />
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '0.35rem' }}>
                                                                <input
                                                                    type="text"
                                                                    aria-label="Cantidad"
                                                                    value={food.qty || ''}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'qty', e.target.value)}
                                                                    placeholder="Cantidad"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    aria-label="Unidad"
                                                                    value={food.unit || ''}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'unit', e.target.value)}
                                                                    placeholder="Unidad"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    aria-label="Calorías"
                                                                    value={food.calories ?? ''}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'calories', e.target.value)}
                                                                    placeholder="kcal"
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                aria-label="Notas"
                                                                value={food.notes || ''}
                                                                onChange={(e) => handleUpdateFoodField(cat.key, idx, 'notes', e.target.value)}
                                                                placeholder="Notas (opcional)"
                                                            />
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    type="button"
                                                                    className="btn success small"
                                                                    style={{ background: 'var(--primary)', border: 'none' }}
                                                                    onClick={() => setEditingFood(null)}
                                                                >
                                                                    Listo
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                    {food.time && (
                                                                        <span style={{
                                                                            background: 'var(--primary-soft)', color: 'var(--primary-strong)',
                                                                            fontSize: '0.7rem', padding: '0.05rem 0.3rem', borderRadius: '4px', fontWeight: 700
                                                                        }}>
                                                                            {food.time}
>>>>>>> 147b06ab9c19c6da98d091ed2ebe1c028c3339c2
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {food.notes && (
                                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: '0.1rem' }}>
                                                                        📝 {food.notes}
                                                                    </div>
                                                                )}
                                                            </div>
<<<<<<< HEAD

                                                            {/* Cantidad y Calorías */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                {isEditing ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                        <input
                                                                            type="number"
                                                                            value={food.qty}
                                                                            onChange={(e) => handleUpdateFoodQty(meal.id, fIdx, e.target.value)}
                                                                            style={{ width: '70px', height: '1.9rem', fontSize: '0.82rem', padding: '0.2rem 0.4rem', fontWeight: 700 }}
                                                                        />
                                                                        <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                                                                            {food.unit}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                                        {food.qty} {food.unit}
                                                                    </span>
                                                                )}

                                                                <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-strong)', fontWeight: 700, fontSize: '0.76rem' }}>
                                                                    {food.calories} kcal
                                                                </span>

                                                                {isEditing && (
                                                                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDuplicateFood(meal.id, fIdx)}
                                                                            title="Duplicar"
                                                                            style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.15rem' }}
                                                                        >
                                                                            <i className="bi bi-files" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveFoodFromMeal(meal.id, fIdx)}
                                                                            title="Eliminar"
                                                                            style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.15rem' }}
                                                                        >
                                                                            <i className="bi bi-trash" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ margin: '0.5rem 0', color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center' }}>
                                                    Sin alimentos todavía en {meal.name}. Usa el buscador o la biblioteca para agregar alimentos reales.
                                                </p>
                                            )}

                                            {/* Botones de acción dentro de la comida */}
                                            {isEditing && (
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px dashed var(--line)', paddingTop: '0.65rem' }}>
                                                    <button
                                                        type="button"
                                                        className="btn small"
                                                        onClick={() => openFoodSearch(meal.id)}
                                                        style={{ background: 'var(--primary)', border: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                                    >
                                                        <i className="bi bi-search" /> Buscar en Biblioteca / API
                                                    </button>
                                                    <input
                                                        type="text"
                                                        placeholder="Nota u horario específico para esta comida..."
                                                        value={meal.notes || ''}
                                                        onChange={(e) => handleUpdateMealField(meal.id, 'notes', e.target.value)}
                                                        style={{ flex: 1, minWidth: '220px', height: '2.1rem', fontSize: '0.78rem' }}
                                                    />
                                                </div>
                                            )}
=======
                                                            {isEditing && (
                                                                <div style={{ display: 'flex', gap: '0.15rem', flexShrink: 0 }}>
                                                                    <button type="button" title="Editar" aria-label="Editar" onClick={() => setEditingFood({ category: cat.key, index: idx })}
                                                                        style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.15rem' }}>
                                                                        <i className="bi bi-pencil" />
                                                                    </button>
                                                                    <button type="button" title="Subir" aria-label="Subir" onClick={() => handleMoveFood(cat.key, idx, 'up')} disabled={idx === 0}
                                                                        style={{ border: 'none', background: 'none', color: idx === 0 ? '#cbd5e1' : 'var(--muted)', cursor: 'pointer', padding: '0.15rem' }}>
                                                                        <i className="bi bi-arrow-up-short" />
                                                                    </button>
                                                                    <button type="button" title="Bajar" aria-label="Bajar" onClick={() => handleMoveFood(cat.key, idx, 'down')} disabled={idx === foods.length - 1}
                                                                        style={{ border: 'none', background: 'none', color: idx === foods.length - 1 ? '#cbd5e1' : 'var(--muted)', cursor: 'pointer', padding: '0.15rem' }}>
                                                                        <i className="bi bi-arrow-down-short" />
                                                                    </button>
                                                                    <button type="button" title="Duplicar" aria-label="Duplicar" onClick={() => handleDuplicateFood(cat.key, idx)}
                                                                        style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.15rem' }}>
                                                                        <i className="bi bi-files" />
                                                                    </button>
                                                                    <button type="button" title="Eliminar" aria-label="Eliminar" onClick={() => handleRemoveFood(cat.key, idx)}
                                                                        style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.15rem' }}>
                                                                        <i className="bi bi-trash" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }) : (
                                            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center', margin: '0.5rem 0' }}>
                                                Sin alimentos todavía.
                                            </p>
                                        )}
                                    </div>

                                    {isEditing && (
                                        <div className="meal-add-form">
                                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.35rem' }}>
                                                <input
                                                    type="time"
                                                    aria-label="Hora"
                                                    value={foodForm.time}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'time', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    aria-label="Nombre del alimento"
                                                    placeholder="Nombre del alimento..."
                                                    value={foodForm.name}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'name', e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddFood(cat.key);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px auto', gap: '0.35rem' }}>
                                                <input
                                                    type="text"
                                                    aria-label="Cantidad"
                                                    placeholder="Cant."
                                                    value={foodForm.qty}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'qty', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    aria-label="Unidad"
                                                    placeholder="Unidad"
                                                    value={foodForm.unit}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'unit', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    aria-label="Calorías"
                                                    placeholder="kcal"
                                                    value={foodForm.calories}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'calories', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn success"
                                                    onClick={() => handleAddFood(cat.key)}
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: 'var(--primary)', border: 'none', whiteSpace: 'nowrap' }}
                                                >
                                                    Agregar
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                aria-label="Notas"
                                                placeholder="Notas u observaciones (opcional)"
                                                value={foodForm.notes}
                                                onChange={(e) => handleFoodInputChange(cat.key, 'notes', e.target.value)}
                                            />
>>>>>>> 147b06ab9c19c6da98d091ed2ebe1c028c3339c2
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── 6. Recomendaciones Generales del Plan ── */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'grid', gap: '0.65rem' }}>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                            📝 Recomendaciones Generales para el Paciente
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                            Instrucciones sobre hidratación, preparación de alimentos, suplementación o descansos.
                        </span>
                        <textarea
                            name="recommendations"
                            rows="4"
                            value={form.recommendations}
                            onChange={handleFieldChange}
                            disabled={!isEditing}
                            placeholder="Escribe aquí las pautas generales del tratamiento nutricional..."
                            style={{ width: '100%', fontSize: '0.85rem', lineHeight: '1.4' }}
                        />
                    </div>

                    {/* ── 7. Barra de Acciones y Guardado ── */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid var(--line)',
                            paddingTop: '1rem',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                        }}
                    >
                        {isEditing && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="btn secondary small"
                                    onClick={handleSaveAsDietTemplate}
                                    title="Guardar como nueva plantilla en tu biblioteca"
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    <i className="bi bi-bookmark-star" /> Guardar como plantilla
                                </button>
                                <button
                                    type="button"
                                    className="btn secondary small"
                                    onClick={handleSaveDraft}
                                    title="Guardar avance temporalmente sin cerrar"
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    <i className="bi bi-save2" /> Guardar borrador
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                            <button type="button" className="btn secondary" onClick={onClose}>
                                {isEditing ? 'Cancelar' : 'Cerrar'}
                            </button>

                            {isEditing ? (
                                <button
                                    type="submit"
                                    className="btn"
                                    style={{ background: 'var(--primary)', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <i className="bi bi-check-circle-fill" /> Guardar Plan Alimenticio
                                </button>
                            ) : (
                                auth?.role === 'nutriologo' && (
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ background: 'var(--primary)', border: 'none' }}
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <i className="bi bi-pencil" style={{ marginRight: '0.35rem' }} />
                                        Editar plan
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal de búsqueda en biblioteca de alimentos y APIs */}
            <FoodSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelectFood={handleAddFoodFromSearch}
                targetMealName={targetMealObject?.name || 'Comida'}
            />
        </>
    );
};

export default PlanModal;
