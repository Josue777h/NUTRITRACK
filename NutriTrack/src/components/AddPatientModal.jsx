import { useState, useMemo } from 'react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';

const AddPatientModal = ({ isOpen, onClose, onSave }) => {
    const { showSuccess, showError } = useToast();
    const [step, setStep] = useState(1);

    const initialForm = {
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: 'femenino',
        weight: '',
        height: '',
        target: 'Reducir IMC',
        calories: '2000',
        notes: '',
        allergies: '',
        conditions: ''
    };

    const [form, setForm] = useState(initialForm);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const imcValue = useMemo(() => {
        const w = Number(form.weight);
        const h = Number(form.height);
        if (w && h) {
            return (w / ((h / 100) ** 2)).toFixed(1);
        }
        return null;
    }, [form.weight, form.height]);

    const handleNext = () => {
        if (step === 1) {
            if (!form.name.trim() || !form.age || !form.email.trim()) {
                showError("Completa todos los campos obligatorios de información personal.");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!form.weight || !form.height) {
                showError("Completa el peso y altura del paciente.");
                return;
            }
            setStep(3);
        } else if (step === 3) {
            if (!form.target || !form.calories) {
                showError("Completa el objetivo y calorías del paciente.");
                return;
            }
            setStep(4);
        }
    };

    const handleBack = () => {
        setStep(prev => Math.max(1, prev - 1));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        
        const patientData = {
            ...form,
            age: Number(form.age),
            weight: Number(form.weight),
            height: Number(form.height),
            calories: Number(form.calories),
            allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
            conditions: form.conditions ? form.conditions.split(',').map(c => c.trim()).filter(Boolean) : []
        };

        if (onSave) {
            onSave(patientData);
        }
        setForm(initialForm);
        setStep(1);
        onClose();
    };

    const handleClose = () => {
        setForm(initialForm);
        setStep(1);
        onClose();
    };

    const renderStepLabel = () => {
        switch (step) {
            case 1: return "Paso 1: Información Personal";
            case 2: return "Paso 2: Información Física";
            case 3: return "Paso 3: Objetivos del Tratamiento";
            case 4: return "Paso 4: Información Médica";
            default: return "";
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Agregar Nuevo Paciente"
            size="medium"
        >
            <div className="step-indicator" style={{ marginBottom: '1.5rem' }}>
                <div className={`step-node ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>1</div>
                <div className={`step-node ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>2</div>
                <div className={`step-node ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>3</div>
                <div className={`step-node ${step === 4 ? 'active' : step > 4 ? 'completed' : ''}`}>4</div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-light)' }}>
                {renderStepLabel()}
            </h4>

            {step === 1 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="field">
                        <label htmlFor="name">Nombre completo *</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Nombre y apellido"
                            required
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="field">
                            <label htmlFor="email">Correo electrónico *</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="correo@ejemplo.com"
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="phone">Teléfono</label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+57 300 000 0000"
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="field">
                            <label htmlFor="age">Edad *</label>
                            <input
                                id="age"
                                name="age"
                                type="number"
                                value={form.age}
                                onChange={handleChange}
                                placeholder="30"
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="gender">Género</label>
                            <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
                                <option value="femenino">Femenino</option>
                                <option value="masculino">Masculino</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="button" className="btn secondary" onClick={handleClose}>
                            Cancelar
                        </button>
                        <button type="button" className="btn" onClick={handleNext} style={{ background: 'var(--primary)', border: 'none' }}>
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="field">
                            <label htmlFor="weight">Peso (kg) *</label>
                            <input
                                id="weight"
                                name="weight"
                                type="number"
                                step="0.1"
                                value={form.weight}
                                onChange={handleChange}
                                placeholder="70"
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="height">Altura (cm) *</label>
                            <input
                                id="height"
                                name="height"
                                type="number"
                                value={form.height}
                                onChange={handleChange}
                                placeholder="170"
                                required
                            />
                        </div>
                    </div>
                    <div className="field">
                        <label>IMC Estimado</label>
                        <input
                            type="text"
                            value={imcValue ? `${imcValue} (${Number(imcValue) < 25 ? 'Normal' : 'Sobrepeso'})` : '--'}
                            disabled
                            style={{ background: 'var(--surface-soft)', fontWeight: '600' }}
                        />
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="button" className="btn secondary" onClick={handleBack}>
                            Atrás
                        </button>
                        <button type="button" className="btn" onClick={handleNext} style={{ background: 'var(--primary)', border: 'none' }}>
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="field">
                        <label htmlFor="target">Objetivo Nutricional *</label>
                        <select id="target" name="target" value={form.target} onChange={handleChange}>
                            <option value="Reducir IMC">Reducir IMC</option>
                            <option value="Control calórico">Control calórico</option>
                            <option value="Masa muscular">Masa muscular</option>
                            <option value="Plan deportivo">Plan deportivo</option>
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="calories">Calorías Diarias Recomendadas *</label>
                        <input
                            id="calories"
                            name="calories"
                            type="number"
                            value={form.calories}
                            onChange={handleChange}
                            placeholder="2000"
                            required
                        />
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="button" className="btn secondary" onClick={handleBack}>
                            Atrás
                        </button>
                        <button type="button" className="btn" onClick={handleNext} style={{ background: 'var(--primary)', border: 'none' }}>
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div className="field">
                        <label htmlFor="allergies">Alergias (separadas por comas)</label>
                        <input
                            id="allergies"
                            name="allergies"
                            type="text"
                            value={form.allergies}
                            onChange={handleChange}
                            placeholder="Ej: Lactosa, gluten"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="conditions">Condiciones médicas (separadas por comas)</label>
                        <input
                            id="conditions"
                            name="conditions"
                            type="text"
                            value={form.conditions}
                            onChange={handleChange}
                            placeholder="Ej: Diabetes, hipertensión"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="notes">Notas / Observaciones Clínicas</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Historial médico u observaciones adicionales..."
                            rows="3"
                        />
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="button" className="btn secondary" onClick={handleBack}>
                            Atrás
                        </button>
                        <button type="submit" className="btn success" style={{ background: 'var(--primary)', border: 'none' }}>
                            Guardar Paciente
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default AddPatientModal;
