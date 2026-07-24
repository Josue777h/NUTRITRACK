import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';

const PlanModal = ({ plan, patients, isOpen, onClose, onSave, onDelete, mode = 'view' }) => {
    const { showError, showSuccess } = useToast();
    const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'add');
    const [form, setForm] = useState({
        patientId: '',
        name: '',
        target: 'Reducir IMC',
        calories: '2000',
        duration: '8',
        meals: {
            desayuno: [],
            mediaManana: [],
            almuerzo: [],
            merienda: [],
            cena: [],
            snack: []
        }
    });

    const defaultTimes = {
        desayuno: '08:00',
        mediaManana: '11:00',
        almuerzo: '14:00',
        merienda: '17:00',
        cena: '20:00',
        snack: '22:00'
    };

    // Form inputs for adding new foods to each category
    const [newFoodForms, setNewFoodForms] = useState({
        desayuno: { time: '08:00', name: '', qty: '', unit: '', calories: '', notes: '' },
        mediaManana: { time: '11:00', name: '', qty: '', unit: '', calories: '', notes: '' },
        almuerzo: { time: '14:00', name: '', qty: '', unit: '', calories: '', notes: '' },
        merienda: { time: '17:00', name: '', qty: '', unit: '', calories: '', notes: '' },
        cena: { time: '20:00', name: '', qty: '', unit: '', calories: '', notes: '' },
        snack: { time: '22:00', name: '', qty: '', unit: '', calories: '', notes: '' }
    });

    const mealCategories = [
        { key: 'desayuno', label: 'Desayuno', icon: 'bi-brightness-high-fill', color: '#f59e0b' },
        { key: 'mediaManana', label: 'Media Mañana', icon: 'bi-sun-fill', color: '#eab308' },
        { key: 'almuerzo', label: 'Almuerzo', icon: 'bi-egg-fried', color: '#16a34a' },
        { key: 'merienda', label: 'Merienda', icon: 'bi-cup-hot-fill', color: '#2563eb' },
        { key: 'cena', label: 'Cena', icon: 'bi-moon-stars-fill', color: '#8b5cf6' },
        { key: 'snack', label: 'Snack', icon: 'bi-cookie', color: '#ec4899' }
    ];

    useEffect(() => {
        if (plan && (mode === 'edit' || mode === 'view')) {
            setForm({
                patientId: plan.patientId?.toString() || '',
                name: plan.name || '',
                target: plan.target || 'Reducir IMC',
                calories: plan.calories?.toString() || '2000',
                duration: plan.duration?.toString() || '8',
                meals: {
                    desayuno: plan.meals?.desayuno || [],
                    mediaManana: plan.meals?.mediaManana || [],
                    almuerzo: plan.meals?.almuerzo || [],
                    merienda: plan.meals?.merienda || [],
                    cena: plan.meals?.cena || [],
                    snack: plan.meals?.snack || []
                }
            });
        } else if (mode === 'add') {
            setForm({
                patientId: plan?.patientId?.toString() || '',
                name: '',
                target: 'Reducir IMC',
                calories: '2000',
                duration: '8',
                meals: {
                    desayuno: [],
                    mediaManana: [],
                    almuerzo: [],
                    merienda: [],
                    cena: [],
                    snack: []
                }
            });
        }
        setIsEditing(mode === 'edit' || mode === 'add');
    }, [plan, mode, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFoodInputChange = (category, field, value) => {
        setNewFoodForms(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    const handleAddFood = (category) => {
        const itemForm = newFoodForms[category];
        if (!itemForm.name.trim()) {
            showError('El nombre del alimento es requerido.');
            return;
        }

        const newFood = {
            time: itemForm.time || defaultTimes[category],
            name: itemForm.name.trim(),
            qty: itemForm.qty.trim() || '1',
            unit: itemForm.unit.trim() || 'porción',
            calories: Number(itemForm.calories) || 0,
            notes: itemForm.notes.trim()
        };

        setForm(prev => ({
            ...prev,
            meals: {
                ...prev.meals,
                [category]: [...(prev.meals[category] || []), newFood]
            }
        }));

        setNewFoodForms(prev => ({
            ...prev,
            [category]: { time: defaultTimes[category], name: '', qty: '', unit: '', calories: '', notes: '' }
        }));
    };

    const handleRemoveFood = (category, index) => {
        setForm(prev => ({
            ...prev,
            meals: {
                ...prev.meals,
                [category]: prev.meals[category].filter((_, i) => i !== index)
            }
        }));
    };

    const handleDuplicateFood = (category, index) => {
        const foodToCopy = form.meals[category][index];
        const duplicated = { ...foodToCopy };

        setForm(prev => ({
            ...prev,
            meals: {
                ...prev.meals,
                [category]: [
                    ...prev.meals[category].slice(0, index + 1),
                    duplicated,
                    ...prev.meals[category].slice(index + 1)
                ]
            }
        }));
        showSuccess('Alimento duplicado.');
    };

    const handleMoveFood = (category, index, direction) => {
        const mealList = [...form.meals[category]];
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === mealList.length - 1) return;

        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = mealList[index];
        mealList[index] = mealList[swapIndex];
        mealList[swapIndex] = temp;

        setForm(prev => ({
            ...prev,
            meals: {
                ...prev.meals,
                [category]: mealList
            }
        }));
    };

    const handleCancel = () => {
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.patientId || !form.name.trim() || !form.calories || !form.duration) {
            showError('Completa los campos obligatorios del plan alimenticio.');
            return;
        }

        const planData = {
            id: plan?.id || Date.now(),
            patientId: parseInt(form.patientId),
            name: form.name.trim(),
            target: form.target,
            calories: Number(form.calories),
            duration: Number(form.duration),
            meals: form.meals
        };

        onSave(planData);
        onClose();
    };

    const getPatientName = (patientId) => {
        const patient = patients.find(p => p.id === parseInt(patientId));
        return patient ? patient.name : 'Paciente';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'add' ? 'Crear Nuevo Plan Alimenticio' : `Plan Alimenticio: ${form.name}`}
            size="large"
        >
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                
                {/* General Info Card */}
                <div className="panel" style={{ padding: '1.25rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)' }}>
                    <h4 style={{ fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.4rem' }}>
                        Información General
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div className="field">
                            <label>Nombre del Plan *</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Ej: Dieta Keto Proteica"
                                required
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="field">
                            <label>Paciente *</label>
                            {isEditing && mode === 'add' ? (
                                <select
                                    name="patientId"
                                    value={form.patientId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecciona un paciente</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    value={getPatientName(form.patientId)}
                                    disabled
                                    style={{ background: 'var(--surface-soft)' }}
                                />
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        <div className="field">
                            <label>Calorías Diarias (kcal) *</label>
                            <input
                                name="calories"
                                type="number"
                                value={form.calories}
                                onChange={handleChange}
                                placeholder="2000"
                                required
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="field">
                            <label>Duración (semanas) *</label>
                            <input
                                name="duration"
                                type="number"
                                value={form.duration}
                                onChange={handleChange}
                                placeholder="8"
                                required
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="field">
                            <label>Objetivo</label>
                            <select
                                name="target"
                                value={form.target}
                                onChange={handleChange}
                                disabled={!isEditing}
                            >
                                <option value="Reducir IMC">Reducir IMC</option>
                                <option value="Control calórico">Control calórico</option>
                                <option value="Masa muscular">Masa muscular</option>
                                <option value="Plan deportivo">Plan deportivo</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Grid of Meal Cards */}
                <div>
                    <h4 style={{ fontWeight: '700', marginBottom: '1rem' }}>Estructura de Comidas</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                        {mealCategories.map(cat => {
                            const foods = form.meals[cat.key] || [];
                            const foodForm = newFoodForms[cat.key];
                            return (
                                <div key={cat.key} className="panel" style={{ padding: '1.25rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                                        <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: `${cat.color}15`, display: 'grid', placeItems: 'center', color: cat.color }}>
                                            <i className={`bi ${cat.icon}`} style={{ fontSize: '0.95rem' }} />
                                        </div>
                                        <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{cat.label}</strong>
                                    </div>

                                    {/* Food Items List */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {foods.length > 0 ? (
                                            foods.map((food, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--surface-soft)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                                                    <div style={{ display: 'grid', gap: '0.1rem', flex: 1 }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                            {food.time && <span style={{ background: 'var(--primary-soft)', color: 'var(--primary-strong)', fontSize: '0.7rem', padding: '0.05rem 0.25rem', borderRadius: '4px', fontWeight: '700' }}>{food.time}</span>}
                                                            <strong style={{ color: 'var(--text)' }}>{food.name || food}</strong>
                                                        </div>
                                                        <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                                                            {food.qty} {food.unit} • {food.calories} kcal
                                                        </span>
                                                        {food.notes && <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.7rem' }}>Obs: {food.notes}</span>}
                                                    </div>
                                                    {isEditing && (
                                                        <div style={{ display: 'flex', gap: '0.2rem', marginLeft: '0.5rem' }}>
                                                            <button
                                                                type="button"
                                                                title="Subir orden"
                                                                onClick={() => handleMoveFood(cat.key, idx, 'up')}
                                                                disabled={idx === 0}
                                                                style={{ border: 'none', background: 'none', color: idx === 0 ? '#cbd5e1' : 'var(--muted)', cursor: 'pointer', padding: '0.1rem' }}
                                                            >
                                                                <i className="bi bi-arrow-up-short" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Bajar orden"
                                                                onClick={() => handleMoveFood(cat.key, idx, 'down')}
                                                                disabled={idx === foods.length - 1}
                                                                style={{ border: 'none', background: 'none', color: idx === foods.length - 1 ? '#cbd5e1' : 'var(--muted)', cursor: 'pointer', padding: '0.1rem' }}
                                                            >
                                                                <i className="bi bi-arrow-down-short" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Duplicar"
                                                                onClick={() => handleDuplicateFood(cat.key, idx)}
                                                                style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.1rem' }}
                                                            >
                                                                <i className="bi bi-files" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Eliminar"
                                                                onClick={() => handleRemoveFood(cat.key, idx)}
                                                                style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.1rem' }}
                                                            >
                                                                <i className="bi bi-trash" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontStyle: 'italic', margin: 'auto', textAlign: 'center' }}>
                                                Sin alimentos registrados.
                                            </p>
                                        )}
                                    </div>

                                    {/* Add Food Row Form */}
                                    {isEditing && (
                                        <div style={{ display: 'grid', gap: '0.4rem', borderTop: '1px solid var(--line)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <input
                                                    type="time"
                                                    value={foodForm.time}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'time', e.target.value)}
                                                    style={{ width: '75px', padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Alimento..."
                                                    value={foodForm.name}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'name', e.target.value)}
                                                    style={{ flex: 2, padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Cant."
                                                    value={foodForm.qty}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'qty', e.target.value)}
                                                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Uni."
                                                    value={foodForm.unit}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'unit', e.target.value)}
                                                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Kcal"
                                                    value={foodForm.calories}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'calories', e.target.value)}
                                                    style={{ width: '65px', padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Obs/Notas..."
                                                    value={foodForm.notes}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'notes', e.target.value)}
                                                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn success"
                                                    onClick={() => handleAddFood(cat.key)}
                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'var(--primary)', border: 'none' }}
                                                >
                                                    Agregar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Buttons */}
                {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
                        <button type="button" className="btn secondary" onClick={handleCancel}>
                            Cancelar edición
                        </button>
                        <button type="submit" className="btn success" style={{ background: 'var(--primary)', border: 'none' }}>
                            Guardar plan alimenticio
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
                        <button type="button" className="btn secondary" onClick={onClose}>
                            Cerrar plan
                        </button>
                    </div>
                )}

            </form>
        </Modal>
    );
};

export default PlanModal;
