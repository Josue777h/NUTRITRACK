import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';

const AppointmentModal = ({ appointment, patients = [], isOpen, onClose, onSave, onDelete, mode = 'view' }) => {
    const { showError } = useToast();
    const { auth } = useApp();
    const [isEditing, setIsEditing] = useState(mode === 'edit');
    const [form, setForm] = useState({
        patientId: '',
        date: '',
        time: '',
        duration: '30',
        type: 'consulta',
        notes: '',
        status: 'Pendiente',
        reason: ''
    });

    const appointmentTypes = [
        { value: 'consulta', label: 'Consulta General' },
        { value: 'seguimiento', label: 'Seguimiento' },
        { value: 'evaluacion', label: 'Evaluación' },
        { value: 'urgencia', label: 'Urgencia' }
    ];

    const statusOptions = [
        { value: 'Pendiente', label: 'Pendiente', color: 'warning' },
        { value: 'Confirmada', label: 'Confirmada', color: 'success' },
        { value: 'Completada', label: 'Completada', color: 'primary' },
        { value: 'Cancelada', label: 'Cancelada', color: 'danger' }
    ];

    useEffect(() => {
        if (!isOpen) return;

        if (appointment && (mode === 'edit' || mode === 'view')) {
            setForm({
                patientId: appointment.patientId?.toString() || '',
                date: appointment.date || '',
                time: appointment.time || '',
                duration: appointment.duration || '30',
                type: appointment.type || 'consulta',
                notes: appointment.notes || '',
                status: appointment.status || 'Pendiente',
                reason: appointment.reason || ''
            });
        } else if (mode === 'add') {
            setForm({
                patientId: auth.role === 'usuario' ? auth.patientId?.toString() : '',
                date: '',
                time: '',
                duration: '30',
                type: 'consulta',
                notes: '',
                status: 'Pendiente',
                reason: ''
            });
        }
        setIsEditing(mode === 'edit' || mode === 'add');
    }, [appointment, mode, isOpen, auth]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        
        if (!form.patientId || !form.date || !form.time) {
            showError('Completa los campos obligatorios');
            return;
        }

        const appointmentData = {
            ...appointment,
            ...form,
            patientId: parseInt(form.patientId),
            reason: form.reason
        };

        if (mode === 'add') {
            appointmentData.id = Date.now();
        }

        onSave(appointmentData);
        onClose();
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        if (mode === 'add') {
            onClose();
        } else {
            setIsEditing(false);
            if (appointment) {
                setForm({
                    patientId: appointment.patientId?.toString() || '',
                    date: appointment.date || '',
                    time: appointment.time || '',
                    duration: appointment.duration || '30',
                    type: appointment.type || 'consulta',
                    notes: appointment.notes || '',
                    status: appointment.status || 'Pendiente',
                    reason: appointment.reason || ''
                });
            }
        }
    };

    const handleDelete = () => {
        if (window.confirm('¿Quitar esta cita de la agenda? Se guardará en el historial para poder descargarla.')) {
            if (onDelete && appointment?.id) {
                onDelete(appointment.id);
            }
        }
    };

    const handleQuickConfirm = () => {
        const appointmentData = {
            ...appointment,
            status: 'Confirmada'
        };
        onSave(appointmentData);
        onClose();
    };

    const handleQuickCancelStatus = () => {
        const appointmentData = {
            ...appointment,
            status: 'Cancelada'
        };
        onSave(appointmentData);
        onClose();
    };

    const getPatientName = (patientId) => {
        const patient = (patients || []).find(p => Number(p.id) === Number(patientId));
        return patient ? patient.name : 'Paciente no encontrado';
    };

    const getStatusBadge = (status) => {
        const statusOption = statusOptions.find(s => s.value.toLowerCase() === status?.toLowerCase());
        return statusOption ? (
            <span className={`status-pill status-${statusOption.color}`}>
                {statusOption.label}
            </span>
        ) : null;
    };

    const getTypeLabel = (type) => {
        const typeOption = appointmentTypes.find(t => t.value === type);
        return typeOption ? typeOption.label : type;
    };

    const renderViewMode = () => (
        <div className="modal-details">
            <div className="detail-section">
                <h4>Información de la Cita</h4>
                <div className="detail-grid">
                    <div className="detail-item">
                        <label>Paciente:</label>
                        <span>{getPatientName(appointment?.patientId)}</span>
                    </div>
                    <div className="detail-item">
                        <label>Fecha:</label>
                        <span>{appointment?.date}</span>
                    </div>
                    <div className="detail-item">
                        <label>Hora:</label>
                        <span>{appointment?.time}</span>
                    </div>
                    <div className="detail-item">
                        <label>Duración:</label>
                        <span>{appointment?.duration || 30} minutos</span>
                    </div>
                    <div className="detail-item">
                        <label>Tipo:</label>
                        <span>{getTypeLabel(appointment?.type)}</span>
                    </div>
                    <div className="detail-item">
                        <label>Estado:</label>
                        <span>{getStatusBadge(appointment?.status)}</span>
                    </div>
                    {appointment?.reason && (
                        <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                            <label>Motivo de la Cita:</label>
                            <span>{appointment.reason}</span>
                        </div>
                    )}
                </div>
            </div>
            
            {appointment?.notes && (
                <div className="detail-section">
                    <h4>Notas</h4>
                    <p>{appointment.notes}</p>
                </div>
            )}
        </div>
    );

    const renderEditMode = () => (
        <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {auth.role === 'nutriologo' ? (
                    <div className="field" style={{ gridColumn: 'span 2' }}>
                        <label htmlFor="patientId">Paciente *</label>
                        <select
                            id="patientId"
                            name="patientId"
                            value={form.patientId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecciona un paciente</option>
                            {(patients || []).map(patient => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.name}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="field" style={{ gridColumn: 'span 2' }}>
                        <label>Paciente</label>
                        <input
                            value={auth.fullName}
                            disabled
                            style={{ background: 'var(--surface-soft)' }}
                        />
                    </div>
                )}
                <div className="field">
                    <label htmlFor="date">Fecha *</label>
                    <input
                        id="date"
                        name="date"
                        type="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="time">Hora *</label>
                    <input
                        id="time"
                        name="time"
                        type="time"
                        value={form.time}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="duration">Duración</label>
                    <select
                        id="duration"
                        name="duration"
                        value={form.duration}
                        onChange={handleChange}
                    >
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="45">45 minutos</option>
                        <option value="60">60 minutos</option>
                        <option value="90">90 minutos</option>
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="type">Tipo de Cita</label>
                    <select
                        id="type"
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                    >
                        {appointmentTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="reason">Motivo de la Cita</label>
                    <input
                        id="reason"
                        name="reason"
                        type="text"
                        placeholder="Ej: Control de peso, primera cita, evaluación de dieta..."
                        value={form.reason}
                        onChange={handleChange}
                    />
                </div>
                {auth.role === 'nutriologo' && (
                    <div className="field" style={{ gridColumn: 'span 2' }}>
                        <label htmlFor="status">Estado</label>
                        <select
                            id="status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                        >
                            {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="field" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="notes">Notas</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Notas sobre la cita..."
                        rows="3"
                    />
                </div>
            </div>
        </form>
    );

    const modalActions = isEditing ? (
        <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn secondary" onClick={handleCancel}>
                Descartar cambios
            </button>
            <button type="button" className="btn" onClick={handleSubmit} style={{ background: 'var(--primary)', border: 'none' }}>
                {mode === 'add' ? 'Agendar cita' : 'Guardar cambios'}
            </button>
        </div>
    ) : (
        <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {auth.role === 'nutriologo' && appointment?.status?.toLowerCase() !== 'confirmada' && appointment?.status?.toLowerCase() !== 'completada' && (
                <button className="btn success" onClick={handleQuickConfirm}>
                    <i className="bi bi-check-circle" />
                    Confirmar cita
                </button>
            )}
            <button className="btn secondary" onClick={handleEdit}>
                <i className="bi bi-pencil" />
                Reprogramar
            </button>
            {appointment?.status?.toLowerCase() !== 'cancelada' && (
                <button className="btn danger" onClick={handleQuickCancelStatus}>
                    <i className="bi bi-calendar-x" />
                    Cancelar cita
                </button>
            )}
            {onDelete && appointment?.id && (
                <button className="btn danger" onClick={handleDelete} style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                    <i className="bi bi-trash" />
                    Eliminar
                </button>
            )}
        </div>
    );

    const title = mode === 'add' ? 'Agendar Nueva Cita' : 
                 isEditing ? 'Editar Cita' : 'Detalles de la Cita';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="medium"
        >
            {isEditing ? renderEditMode() : renderViewMode()}
            {modalActions}
        </Modal>
    );
};

export default AppointmentModal;
