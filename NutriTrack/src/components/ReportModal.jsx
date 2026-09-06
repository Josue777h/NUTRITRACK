import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';

const ReportModal = ({ report, patients, defaultPatientId, isOpen, onClose, onSave, onDelete, mode = 'view' }) => {
    const { showSuccess, showError } = useToast();
    const [isEditing, setIsEditing] = useState(mode === 'edit');
    const [form, setForm] = useState({
        patientId: '',
        title: '',
        type: 'progreso',
        date: new Date().toISOString().split('T')[0],
        content: '',
        metrics: {
            weight: '',
            height: '',
            bmi: '',
            bodyFat: '',
            muscleMass: '',
            measurements: {
                waist: '',
                chest: '',
                arms: '',
                legs: ''
            }
        },
        recommendations: [],
        nextSteps: '',
        conclusion: ''
    });

    const reportTypes = [
        { value: 'progreso', label: 'Reporte de Progreso' },
        { value: 'evaluacion', label: 'Evaluación Inicial' },
        { value: 'seguimiento', label: 'Seguimiento Mensual' },
        { value: 'final', label: 'Reporte Final' }
    ];

    useEffect(() => {
        if (report && mode === 'edit') {
            setForm({
                patientId: report.patientId?.toString() || '',
                title: report.title || report.type || 'Reporte de progreso',
                type: report.type || 'progreso',
                date: report.date || new Date().toISOString().split('T')[0],
                content: report.content || report.notes || report.observations || '',
                metrics: {
                    weight: report.metrics?.weight ?? report.weight ?? '',
                    height: report.metrics?.height || '',
                    bmi: report.metrics?.bmi ?? report.bmi ?? '',
                    bodyFat: report.metrics?.bodyFat || '',
                    muscleMass: report.metrics?.muscleMass || '',
                    measurements: {
                        waist: report.metrics?.measurements?.waist || '',
                        chest: report.metrics?.measurements?.chest || '',
                        arms: report.metrics?.measurements?.arms || '',
                        legs: report.metrics?.measurements?.legs || ''
                    }
                },
                recommendations: report.recommendations || [],
                nextSteps: report.nextSteps || '',
                conclusion: report.conclusion || ''
            });
        } else if (mode === 'add') {
            const initialPatientId = defaultPatientId ? String(defaultPatientId) : (patients?.[0]?.id ? String(patients[0].id) : '');
            setForm({
                patientId: initialPatientId,
                title: 'Reporte de progreso',
                type: 'progreso',
                date: new Date().toISOString().split('T')[0],
                content: '',
                metrics: {
                    weight: '',
                    height: '',
                    bmi: '',
                    bodyFat: '',
                    muscleMass: '',
                    measurements: {
                        waist: '',
                        chest: '',
                        arms: '',
                        legs: ''
                    }
                },
                recommendations: [],
                nextSteps: '',
                conclusion: ''
            });
        }
        setIsEditing(mode === 'edit' || mode === 'add');
    }, [report, mode, defaultPatientId, patients]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setForm(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleMeasurementChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            metrics: {
                ...prev.metrics,
                measurements: {
                    ...prev.metrics.measurements,
                    [field]: value
                }
            }
        }));
    };

    const handleRecommendationChange = (index, value) => {
        const updatedRecommendations = [...form.recommendations];
        updatedRecommendations[index] = value;
        setForm(prev => ({ ...prev, recommendations: updatedRecommendations }));
    };

    const addRecommendation = () => {
        setForm(prev => ({
            ...prev,
            recommendations: [...prev.recommendations, '']
        }));
    };

    const removeRecommendation = (index) => {
        setForm(prev => ({
            ...prev,
            recommendations: prev.recommendations.filter((_, i) => i !== index)
        }));
    };

    const calculateBMI = () => {
        const weight = parseFloat(form.metrics.weight);
        const height = parseFloat(form.metrics.height) / 100; // Convert cm to m
        if (weight && height) {
            const bmi = (weight / (height * height)).toFixed(1);
            setForm(prev => ({
                ...prev,
                metrics: {
                    ...prev.metrics,
                    bmi: bmi
                }
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!form.patientId) {
            showError('Por favor selecciona un paciente');
            return;
        }

        const reportData = {
            ...report,
            ...form,
            patientId: parseInt(form.patientId, 10),
            notes: form.content || form.notes || form.title || "",
            weight: Number(form.metrics.weight) || (report?.weight ? Number(report.weight) : 70),
            bmi: Number(form.metrics.bmi) || (report?.bmi ? Number(report.bmi) : 24),
            calories: Number(form.calories) || (report?.calories ? Number(report.calories) : 2000)
        };

        if (mode === 'add') {
            reportData.id = Date.now();
            reportData.createdAt = new Date().toISOString();
        }

        onSave(reportData);
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
            if (report) {
                setForm({
                    patientId: report.patientId?.toString() || '',
                    title: report.title || '',
                    type: report.type || 'progreso',
                    date: report.date || new Date().toISOString().split('T')[0],
                    content: report.content || '',
                    metrics: {
                        weight: report.metrics?.weight || '',
                        height: report.metrics?.height || '',
                        bmi: report.metrics?.bmi || '',
                        bodyFat: report.metrics?.bodyFat || '',
                        muscleMass: report.metrics?.muscleMass || '',
                        measurements: {
                            waist: report.metrics?.measurements?.waist || '',
                            chest: report.metrics?.measurements?.chest || '',
                            arms: report.metrics?.measurements?.arms || '',
                            legs: report.metrics?.measurements?.legs || ''
                        }
                    },
                    recommendations: report.recommendations || [],
                    nextSteps: report.nextSteps || '',
                    conclusion: report.conclusion || ''
                });
            }
        }
    };

    const handleDelete = () => {
        if (window.confirm('¿Estás seguro de eliminar este reporte?')) {
            onDelete(report.id);
            showSuccess('Reporte eliminado correctamente');
            onClose();
        }
    };

    const getPatientName = (patientId) => {
        const patient = patients.find(p => p.id === parseInt(patientId));
        return patient ? patient.name : 'Paciente no encontrado';
    };

    const getTypeLabel = (type) => {
        const typeOption = reportTypes.find(t => t.value === type);
        return typeOption ? typeOption.label : type;
    };

    const renderViewMode = () => (
        <div className="modal-details">
            <div className="detail-section">
                <h4>Información del Reporte</h4>
                <div className="detail-grid">
                    <div className="detail-item">
                        <label>Título:</label>
                        <span>{report.title}</span>
                    </div>
                    <div className="detail-item">
                        <label>Paciente:</label>
                        <span>{getPatientName(report.patientId)}</span>
                    </div>
                    <div className="detail-item">
                        <label>Tipo:</label>
                        <span>{getTypeLabel(report.type)}</span>
                    </div>
                    <div className="detail-item">
                        <label>Fecha:</label>
                        <span>{report.date}</span>
                    </div>
                </div>
            </div>

            {report.metrics && (
                <div className="detail-section">
                    <h4>Métricas</h4>
                    <div className="metrics-grid">
                        {report.metrics.weight && (
                            <div className="metric-item">
                                <label>Peso:</label>
                                <span>{report.metrics.weight} kg</span>
                            </div>
                        )}
                        {report.metrics.height && (
                            <div className="metric-item">
                                <label>Altura:</label>
                                <span>{report.metrics.height} cm</span>
                            </div>
                        )}
                        {report.metrics.bmi && (
                            <div className="metric-item">
                                <label>IMC:</label>
                                <span>{report.metrics.bmi}</span>
                            </div>
                        )}
                        {report.metrics.bodyFat && (
                            <div className="metric-item">
                                <label>% Grasa:</label>
                                <span>{report.metrics.bodyFat}%</span>
                            </div>
                        )}
                        {report.metrics.muscleMass && (
                            <div className="metric-item">
                                <label>Masa Muscular:</label>
                                <span>{report.metrics.muscleMass} kg</span>
                            </div>
                        )}
                    </div>
                    
                    {report.metrics.measurements && (
                        <div className="measurements-grid">
                            <h5>Mediciones Corporales</h5>
                            {report.metrics.measurements.waist && (
                                <div className="metric-item">
                                    <label>Cintura:</label>
                                    <span>{report.metrics.measurements.waist} cm</span>
                                </div>
                            )}
                            {report.metrics.measurements.chest && (
                                <div className="metric-item">
                                    <label>Pecho:</label>
                                    <span>{report.metrics.measurements.chest} cm</span>
                                </div>
                            )}
                            {report.metrics.measurements.arms && (
                                <div className="metric-item">
                                    <label>Brazos:</label>
                                    <span>{report.metrics.measurements.arms} cm</span>
                                </div>
                            )}
                            {report.metrics.measurements.legs && (
                                <div className="metric-item">
                                    <label>Piernas:</label>
                                    <span>{report.metrics.measurements.legs} cm</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="detail-section">
                <h4>Contenido del Reporte</h4>
                <div className="report-content">
                    <p>{report.content}</p>
                </div>
            </div>

            {report.recommendations && report.recommendations.length > 0 && (
                <div className="detail-section">
                    <h4>Recomendaciones</h4>
                    <ul>
                        {report.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}

            {report.nextSteps && (
                <div className="detail-section">
                    <h4>Pasos Siguientes</h4>
                    <p>{report.nextSteps}</p>
                </div>
            )}

            {report.conclusion && (
                <div className="detail-section">
                    <h4>Conclusión</h4>
                    <p>{report.conclusion}</p>
                </div>
            )}
        </div>
    );

    const renderEditMode = () => (
        <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-form-grid">
                <div className="field">
                    <label htmlFor="patientId">Paciente *</label>
                    <select
                        id="patientId"
                        name="patientId"
                        value={form.patientId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecciona un paciente</option>
                        {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                                {patient.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="title">Título del Reporte *</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Ej: Reporte de progreso mensual"
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="type">Tipo de Reporte</label>
                    <select
                        id="type"
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                    >
                        {reportTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="date">Fecha</label>
                    <input
                        id="date"
                        name="date"
                        type="date"
                        value={form.date}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="report-section">
                <h5>Métricas del Paciente</h5>
                <div className="metrics-form-grid">
                    <div className="field">
                        <label htmlFor="metrics.weight">Peso (kg)</label>
                        <input
                            id="metrics.weight"
                            name="metrics.weight"
                            type="number"
                            step="0.1"
                            value={form.metrics.weight}
                            onChange={handleChange}
                            onBlur={calculateBMI}
                            placeholder="70.5"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="metrics.height">Altura (cm)</label>
                        <input
                            id="metrics.height"
                            name="metrics.height"
                            type="number"
                            value={form.metrics.height}
                            onChange={handleChange}
                            onBlur={calculateBMI}
                            placeholder="170"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="metrics.bmi">IMC</label>
                        <input
                            id="metrics.bmi"
                            name="metrics.bmi"
                            type="number"
                            step="0.1"
                            value={form.metrics.bmi}
                            onChange={handleChange}
                            placeholder="24.4"
                            readOnly
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="metrics.bodyFat">% Grasa Corporal</label>
                        <input
                            id="metrics.bodyFat"
                            name="metrics.bodyFat"
                            type="number"
                            step="0.1"
                            value={form.metrics.bodyFat}
                            onChange={handleChange}
                            placeholder="15.2"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="metrics.muscleMass">Masa Muscular (kg)</label>
                        <input
                            id="metrics.muscleMass"
                            name="metrics.muscleMass"
                            type="number"
                            step="0.1"
                            value={form.metrics.muscleMass}
                            onChange={handleChange}
                            placeholder="35.2"
                        />
                    </div>
                </div>

                <h6>Mediciones Corporales (cm)</h6>
                <div className="measurements-form-grid">
                    <div className="field">
                        <label htmlFor="measurements.waist">Cintura</label>
                        <input
                            type="number"
                            value={form.metrics.measurements.waist}
                            onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                            placeholder="80"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="measurements.chest">Pecho</label>
                        <input
                            type="number"
                            value={form.metrics.measurements.chest}
                            onChange={(e) => handleMeasurementChange('chest', e.target.value)}
                            placeholder="95"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="measurements.arms">Brazos</label>
                        <input
                            type="number"
                            value={form.metrics.measurements.arms}
                            onChange={(e) => handleMeasurementChange('arms', e.target.value)}
                            placeholder="35"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="measurements.legs">Piernas</label>
                        <input
                            type="number"
                            value={form.metrics.measurements.legs}
                            onChange={(e) => handleMeasurementChange('legs', e.target.value)}
                            placeholder="55"
                        />
                    </div>
                </div>
            </div>

            <div className="field full">
                <label htmlFor="content">Contenido o Notas del Reporte</label>
                <textarea
                    id="content"
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    placeholder="Describe el progreso del paciente, logros, áreas de mejora..."
                    rows="6"
                />
            </div>

            <div className="report-section">
                <h5>Recomendaciones</h5>
                {form.recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-form">
                        <textarea
                            placeholder={`Recomendación ${index + 1}`}
                            value={rec}
                            onChange={(e) => handleRecommendationChange(index, e.target.value)}
                            rows="2"
                        />
                        <button type="button" className="btn danger small" onClick={() => removeRecommendation(index)}>
                            <i className="bi bi-trash" />
                        </button>
                    </div>
                ))}
                <button type="button" className="btn secondary" onClick={addRecommendation}>
                    <i className="bi bi-plus" />
                    Agregar Recomendación
                </button>
            </div>

            <div className="field full">
                <label htmlFor="nextSteps">Pasos Siguientes</label>
                <textarea
                    id="nextSteps"
                    name="nextSteps"
                    value={form.nextSteps}
                    onChange={handleChange}
                    placeholder="Próximos pasos y metas..."
                    rows="3"
                />
            </div>

            <div className="field full">
                <label htmlFor="conclusion">Conclusión</label>
                <textarea
                    id="conclusion"
                    name="conclusion"
                    value={form.conclusion}
                    onChange={handleChange}
                    placeholder="Conclusión del reporte..."
                    rows="3"
                />
            </div>
        </form>
    );

    const modalActions = isEditing ? (
        <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={handleCancel}>
                <i className="bi bi-x" />
                {mode === 'add' ? 'Cancelar' : 'Cancelar Edición'}
            </button>
            {mode === 'edit' && (
                <button type="button" className="btn danger" onClick={handleDelete}>
                    <i className="bi bi-trash" />
                    Eliminar
                </button>
            )}
            <button type="submit" className="btn" onClick={handleSubmit}>
                <i className="bi bi-check" />
                {mode === 'add' ? 'Crear Reporte' : 'Guardar Cambios'}
            </button>
        </div>
    ) : (
        <div className="modal-actions">
            <button className="btn" onClick={handleEdit}>
                <i className="bi bi-pencil" />
                Editar
            </button>
            <button className="btn danger" onClick={handleDelete}>
                <i className="bi bi-trash" />
                Eliminar
            </button>
        </div>
    );

    const title = mode === 'add' ? 'Crear Nuevo Reporte' : 
                 mode === 'edit' ? 'Editar Reporte' : 'Detalles del Reporte';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="large"
        >
            {isEditing ? renderEditMode() : renderViewMode()}
            {modalActions}
        </Modal>
    );
};

export default ReportModal;
