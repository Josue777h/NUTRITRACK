import { validationErrors, useState, useMemo } from 'react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';

const AddPatientModal = ({ isOpen, onClose, onSave }) => {
    const { showError } = useToast();
    const [step, setStep] = useState(1);

    const initialForm = {
        name: '',
        documentId: '',
        clinicalCode: '',
        email: '',
        phone : '',
        age: '',
        gender: 'femenino',
        weight: '',
        height: '',
        target: 'Reducir IMC',
        calories: '2000',
        notes: '',
        allergies: '',
        conditions: '',
        sendEmailInvite: true
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
                showError("Completa el objetivo y calorias del paciente.");
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

    const stepTitles = [
        "1. Información Personal",
        "2. Mediciones Físicas",
        "3. Objetivos Clínicos",
        "4. Historial Médico"
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Agregar Nuevo Paciente"
            size="medium"
        >
            {/* Header del Asistente (Stepper) sin números feos */}
            <div style={{ marginBottom: '1.25rem', background: 'var(--surface-soft)', padding: '0.85rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-strong)', fontWeight: 700, fontSize: '0.78rem' }}>
                        Paso {step} de 4
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
                        {stepTitles[step - 1]}
                    </strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${(step / 4) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            {step === 1 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="field">
                        <label htmlFor="name">Nombre completo del paciente *</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Ej: María Rodríguez"
                            required
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="field">
                            <label htmlFor="documentId">
                                <i className="bi bi-person-vcard" style={{ marginRight: '0.3rem' }} />
                                Cédula / DNI / Identificación
                            </label>
                            <input
                                id="documentId"
                                name="documentId"
                                type="text"
                                value={form.documentId}
                                onChange={handleChange}
                                placeholder="Ej: 1098765432"
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="clinicalCode">
                                <i className="bi bi-upc-scan" style={{ marginRight: '0.3rem' }} />
                                Código Clínico (Opcional)
                            </label>
                            <input
                                id="clinicalCode"
                                name="clinicalCode"
                                type="text"
                                value={form.clinicalCode}
                                onChange={handleChange}
                                placeholder="Auto: PAC-#####"
                            />
                        </div>
                    </div>
                    <div className="field">
                        <label htmlFor="email">Correo electrónico *</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="paciente@ejemplo.com"
                            required
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="field">
                            <label htmlFor="phone">Teléfono de contacto</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+57 300 123 4567"
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="age">Edad (años) *</label>
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
                    </div>
                    <div className="field">
                        <label htmlFor="gender">Género</label>
                        <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
                            <option value="femenino">Femenino</option>
                            <option value="masculino">Masculino</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="button" className="button secondary" onClick={handleClose}>
                            Cancelar
                        </button>
                        <button type="button" className="button" onClick={handleNext} style={{ background: 'var(--primary)', border: 'none' }}>
                            Siguiente <i className="bi bi-arrow-right" style={{ marginLeft: '0.3rem' }} />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="field">
                            <label htmlFor="weight">Peso actual (kg) *</label>
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
                            value={imcValue ? `${imcValue} (${Number(imcValue) < 18.5 ? 'Bajo Peso' : Number(imcValue) < 25 ? 'Normal' : 'Sobrepeso'})` : '--'}
                            disabled
                            style={{ background: 'var(--surface-soft)', fontWeight: '600', color: 'var(--primary-strong)' }}
                        />
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="button" className="button secondary" onClick={handleBack}>
                            <i className="bi bi-arrow-left" style={{ marginRight: '0.3rem' }} /> Atrás
                        </button>
                        <button type="button" className="button" onClick={handleNext} style={{ background: 'var(--primary)', border: 'none' }}>
                            Siguiente <i className="bi bi-arrow-right" style={{ marginLeft: '0.3rem' }} />
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
                        <button type="button" className="button secondary" onClick={handleBack}>
                            <i className="bi bi-arrow-left" style={{ marginRight: '0.3rem' }} /> Atrás
                        </button>
                        <button type="button" className="button" onClick={handleNext} style={{ background: 'var(--primary)', border: 'none' }}>
                            Siguiente <i className="bi bi-arrow-right" style={{ marginLeft: '0.3rem' }} />
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
                            placeholder="Ej: Lactosa, gluten, mariscos"
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
                            placeholder="Ej: Diabetes Tipo 2, hipertensión"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="notes">Notas / Observaciones Clínicas</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Observaciones iniciales del profesional..."
                            rows="3"
                        />
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.85rem 1rem',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: 'var(--radius)',
                        marginTop: '0.25rem'
                    }}>
                        <input
                            id="sendEmailInvite"
                            name="sendEmailInvite"
                            type="checkbox"
                            checked={form.sendEmailInvite}
                            onChange={(e) => setForm(prev => ({ ...prev, sendEmailInvite: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                        <label htmlFor="sendEmailInvite" style={{ margin: 0, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text)' }}>
                            <i className="bi bi-envelope-check" style={{ marginRight: '0.4rem', color: 'var(--primary)' }} />
                            Enviar correo automático de activación al paciente al guardar
                        </label>
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="button" className="button secondary" onClick={handleBack}>
                            <i className="bi bi-arrow-left" style={{ marginRight: '0.3rem' }} /> Atrás
                        </button>
                        <button type="submit" className="button success" style={{ background: 'var(--primary)', border: 'none' }}>
                            <i className="bi bi-check2-circle" style={{ marginRight: '0.4rem' }} /> Guardar Paciente
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default AddPatientModal;
