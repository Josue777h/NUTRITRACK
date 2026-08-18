import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';

const EMPTY_MEALS = {
    desayuno: [],
    mediaManana: [],
    almuerzo: [],
    merienda: [],
    cena: [],
    snack: []
};

const defaultTimes = {
    desayuno: '08:00',
    mediaManana: '11:00',
    almuerzo: '14:00',
    merienda: '17:00',
    cena: '20:00',
    snack: '22:00'
};

const emptyFoodForm = (category) => ({
    time: defaultTimes[category],
    name: '',
    qty: '',
    unit: 'porción',
    calories: '',
    notes: ''
});

const PlanModal = ({ plan, patients, isOpen, onClose, onSave, mode = 'view' }) => {
    const { showError, showSuccess } = useToast();
    const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'add');
    const [editingFood, setEditingFood] = useState(null); // { category, index }
    const [form, setForm] = useState({
        patientId: '',
        name: '',
        target: 'Reducir IMC',
        calories: '2000',
        duration: '8',
        meals: { ...EMPTY_MEALS }
    });

    const [newFoodForms, setNewFoodForms] = useState({
        desayuno: emptyFoodForm('desayuno'),
        mediaManana: emptyFoodForm('mediaManana'),
        almuerzo: emptyFoodForm('almuerzo'),
        merienda: emptyFoodForm('merienda'),
        cena: emptyFoodForm('cena'),
        snack: emptyFoodForm('snack')
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
        if (!isOpen) return;

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

        setNewFoodForms({
            desayuno: emptyFoodForm('desayuno'),
            mediaManana: emptyFoodForm('mediaManana'),
            almuerzo: emptyFoodForm('almuerzo'),
            merienda: emptyFoodForm('merienda'),
            cena: emptyFoodForm('cena'),
            snack: emptyFoodForm('snack')
        });
        setEditingFood(null);
        setIsEditing(mode === 'edit' || mode === 'add');
    }, [plan, mode, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFoodInputChange = (category, field, value) => {
        setNewFoodForms((prev) => ({
            ...prev,
            [category]: { ...prev[category], [field]: value }
        }));
    };

    const handleAddFood = (category) => {
        const itemForm = newFoodForms[category];
        if (!itemForm.name.trim()) {
            showError('Escribe el nombre del alimento.');
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

        setForm((prev) => ({
            ...prev,
            meals: {
                ...prev.meals,
                [category]: [...(prev.meals[category] || []), newFood]
            }
        }));
        setNewFoodForms((prev) => ({
            ...prev,
            [category]: emptyFoodForm(category)
        }));
    };

    const handleUpdateFoodField = (category, index, field, value) => {
        setForm((prev) => {
            const list = [...(prev.meals[category] || [])];
            list[index] = {
                ...list[index],
                [field]: field === 'calories' ? (value === '' ? '' : Number(value) || 0) : value
            };
            return {
                ...prev,
                meals: { ...prev.meals, [category]: list }
            };
        });
    };

    const handleRemoveFood = (category, index) => {
        setForm((prev) => ({
            ...prev,
            meals: {
                ...prev.meals,
                [category]: prev.meals[category].filter((_, i) => i !== index)
            }
        }));
        if (editingFood?.category === category && editingFood?.index === index) {
            setEditingFood(null);
        }
    };

    const handleDuplicateFood = (category, index) => {
        const foodToCopy = form.meals[category][index];
        setForm((prev) => ({
            ...prev,
            meals: {
                ...prev.meals,
                [category]: [
                    ...prev.meals[category].slice(0, index + 1),
                    { ...foodToCopy },
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
        [mealList[index], mealList[swapIndex]] = [mealList[swapIndex], mealList[index]];
        setForm((prev) => ({
            ...prev,
            meals: { ...prev.meals, [category]: mealList }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.patientId || !form.name.trim() || !form.calories || !form.duration) {
            showError('Completa los campos obligatorios del plan alimenticio.');
            return;
        }

        onSave({
            id: plan?.id || Date.now(),
            patientId: Number(form.patientId),
            name: form.name.trim(),
            target: form.target,
            calories: Number(form.calories),
            duration: Number(form.duration),
            meals: form.meals
        });
        onClose();
    };

    const getPatientName = (patientId) => {
        const patient = patients.find((p) => Number(p.id) === Number(patientId));
        return patient ? patient.name : 'Paciente';
    };

    const mealCalories = (foods) =>
        (foods || []).reduce((sum, f) => sum + (Number(f.calories) || 0), 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'add' ? 'Crear Nuevo Plan Alimenticio' : `Plan Alimenticio: ${form.name || 'Sin nombre'}`}
            size="large"
        >
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ padding: '1.25rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-soft)' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Información General</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div className="field">
                            <label>Nombre del Plan *</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Ej: Plan hipocalórico 1800 kcal"
                                required
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="field">
                            <label>Paciente *</label>
                            {isEditing && mode === 'add' ? (
                                <select name="patientId" value={form.patientId} onChange={handleChange} required>
                                    <option value="">Selecciona un paciente</option>
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input value={getPatientName(form.patientId)} disabled />
                            )}
                        </div>
                        <div className="field">
                            <label>Calorías Diarias (kcal) *</label>
                            <input
                                name="calories"
                                type="number"
                                value={form.calories}
                                onChange={handleChange}
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
                                required
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="field">
                            <label>Objetivo</label>
                            <select name="target" value={form.target} onChange={handleChange} disabled={!isEditing}>
                                <option value="Reducir IMC">Reducir IMC</option>
                                <option value="Control calórico">Control calórico</option>
                                <option value="Masa muscular">Masa muscular</option>
                                <option value="Plan deportivo">Plan deportivo</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h4 style={{ fontWeight: 700, margin: 0 }}>Estructura de Comidas</h4>
                        {isEditing && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                Escribe el alimento y pulsa Agregar en cada tiempo de comida
                            </span>
                        )}
                    </div>

                    <div className="meal-builder-grid">
                        {mealCategories.map((cat) => {
                            const foods = form.meals[cat.key] || [];
                            const foodForm = newFoodForms[cat.key];
                            return (
                                <div key={cat.key} className="meal-builder-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                                                background: `${cat.color}18`, display: 'grid', placeItems: 'center', color: cat.color
                                            }}>
                                                <i className={`bi ${cat.icon}`} />
                                            </div>
                                            <strong style={{ fontSize: '0.95rem' }}>{cat.label}</strong>
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>
                                            {mealCalories(foods)} kcal
                                        </span>
                                    </div>

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
                                                                    value={food.time || defaultTimes[cat.key]}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'time', e.target.value)}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={food.name || ''}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'name', e.target.value)}
                                                                    placeholder="Alimento"
                                                                />
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '0.35rem' }}>
                                                                <input
                                                                    type="text"
                                                                    value={food.qty || ''}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'qty', e.target.value)}
                                                                    placeholder="Cantidad"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={food.unit || ''}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'unit', e.target.value)}
                                                                    placeholder="Unidad"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={food.calories ?? ''}
                                                                    onChange={(e) => handleUpdateFoodField(cat.key, idx, 'calories', e.target.value)}
                                                                    placeholder="kcal"
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
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
                                                                        </span>
                                                                    )}
                                                                    <strong style={{ fontSize: '0.85rem' }}>{food.name || food}</strong>
                                                                </div>
                                                                <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                                                                    {food.qty} {food.unit} · {food.calories || 0} kcal
                                                                </span>
                                                                {food.notes && (
                                                                    <div style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                                                        {food.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isEditing && (
                                                                <div style={{ display: 'flex', gap: '0.15rem', flexShrink: 0 }}>
                                                                    <button type="button" title="Editar" onClick={() => setEditingFood({ category: cat.key, index: idx })}
                                                                        style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.15rem' }}>
                                                                        <i className="bi bi-pencil" />
                                                                    </button>
                                                                    <button type="button" title="Subir" onClick={() => handleMoveFood(cat.key, idx, 'up')} disabled={idx === 0}
                                                                        style={{ border: 'none', background: 'none', color: idx === 0 ? '#cbd5e1' : 'var(--muted)', cursor: 'pointer', padding: '0.15rem' }}>
                                                                        <i className="bi bi-arrow-up-short" />
                                                                    </button>
                                                                    <button type="button" title="Bajar" onClick={() => handleMoveFood(cat.key, idx, 'down')} disabled={idx === foods.length - 1}
                                                                        style={{ border: 'none', background: 'none', color: idx === foods.length - 1 ? '#cbd5e1' : 'var(--muted)', cursor: 'pointer', padding: '0.15rem' }}>
                                                                        <i className="bi bi-arrow-down-short" />
                                                                    </button>
                                                                    <button type="button" title="Duplicar" onClick={() => handleDuplicateFood(cat.key, idx)}
                                                                        style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.15rem' }}>
                                                                        <i className="bi bi-files" />
                                                                    </button>
                                                                    <button type="button" title="Eliminar" onClick={() => handleRemoveFood(cat.key, idx)}
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
                                                    value={foodForm.time}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'time', e.target.value)}
                                                />
                                                <input
                                                    type="text"
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
                                                    placeholder="Cant."
                                                    value={foodForm.qty}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'qty', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Unidad"
                                                    value={foodForm.unit}
                                                    onChange={(e) => handleFoodInputChange(cat.key, 'unit', e.target.value)}
                                                />
                                                <input
                                                    type="number"
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
                                                placeholder="Notas u observaciones (opcional)"
                                                value={foodForm.notes}
                                                onChange={(e) => handleFoodInputChange(cat.key, 'notes', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
                        <button type="button" className="btn secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn success" style={{ background: 'var(--primary)', border: 'none' }}>
                            Guardar plan alimenticio
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
                        <button type="button" className="btn secondary" onClick={onClose}>
                            Cerrar
                        </button>
                        <button type="button" className="btn" style={{ background: 'var(--primary)', border: 'none' }} onClick={() => setIsEditing(true)}>
                            <i className="bi bi-pencil" style={{ marginRight: '0.35rem' }} />
                            Editar plan
                        </button>
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default PlanModal;
