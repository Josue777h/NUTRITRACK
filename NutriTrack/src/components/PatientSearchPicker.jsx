import { useState, useRef, useEffect, useMemo } from 'react';

function normalizeText(text) {
    if (!text) return '';
    return String(text)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

export default function PatientSearchPicker({
    patients = [],
    selectedId,
    onSelect,
    placeholder = 'Buscar o seleccionar paciente...',
    label,
    required = false,
    disabled = false,
    className = '',
    id = 'patient-search-picker'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const listRef = useRef(null);

    // Encuentra el paciente seleccionado
    const selectedPatient = useMemo(() => {
        if (!selectedId && selectedId !== 0) return null;
        return (patients || []).find(p => String(p.id) === String(selectedId)) || null;
    }, [patients, selectedId]);

    // Filtrado de pacientes en tiempo real (nombre, cédula, código, correo, teléfono)
    const filteredPatients = useMemo(() => {
        if (!patients || !patients.length) return [];
        const q = normalizeText(searchQuery);
        if (!q) return patients;

        return patients.filter((patient) => {
            const name = normalizeText(patient.name);
            const doc = normalizeText(patient.documentId || patient.document_id || patient.cedula || patient.docId);
            const code = normalizeText(patient.clinicalCode || patient.clinical_code || patient.code || `pac-${patient.id}`);
            const email = normalizeText(patient.email);
            const phone = normalizeText(patient.phone);

            return (
                name.includes(q) ||
                doc.includes(q) ||
                code.includes(q) ||
                email.includes(q) ||
                phone.includes(q) ||
                String(patient.id).includes(q)
            );
        });
    }, [patients, searchQuery]);

    // Abrir menú y autoenfocar campo de búsqueda
    const handleToggle = () => {
        if (disabled) return;
        setIsOpen((prev) => {
            const next = !prev;
            if (next) {
                setSearchQuery('');
                setHighlightedIndex(0);
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 50);
            }
            return next;
        });
    };

    // Cerrar menú al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Manejo de teclas (Escape, Flechas, Enter)
    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
            }
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => {
                const next = prev < filteredPatients.length - 1 ? prev + 1 : 0;
                scrollIntoView(next);
                return next;
            });
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => {
                const next = prev > 0 ? prev - 1 : filteredPatients.length - 1;
                scrollIntoView(next);
                return next;
            });
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredPatients[highlightedIndex]) {
                handleSelect(filteredPatients[highlightedIndex]);
            }
        }
    };

    const scrollIntoView = (index) => {
        if (!listRef.current) return;
        const item = listRef.current.children[index];
        if (item) {
            item.scrollIntoView({ block: 'nearest' });
        }
    };

    const handleSelect = (patient) => {
        if (onSelect) {
            onSelect(patient.id, patient);
        }
        setIsOpen(false);
        setSearchQuery('');
    };

    const getInitials = (name) => {
        if (!name) return 'P';
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    return (
        <div
            ref={containerRef}
            className={`patient-search-picker ${className} ${disabled ? 'is-disabled' : ''} ${isOpen ? 'is-open' : ''}`}
            onKeyDown={handleKeyDown}
        >
            {label && (
                <label className="patient-search-picker-label" htmlFor={id}>
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}

            {/* Botón / Gatillo principal que muestra el paciente seleccionado */}
            <button
                id={id}
                type="button"
                className={`patient-search-picker-trigger ${!selectedPatient ? 'is-placeholder' : ''}`}
                onClick={handleToggle}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {selectedPatient ? (
                    <div className="patient-search-picker-selected">
                        <span className="patient-search-picker-avatar">
                            {getInitials(selectedPatient.name)}
                        </span>
                        <div className="patient-search-picker-info">
                            <span className="patient-search-picker-name">
                                {selectedPatient.name}
                            </span>
                            <div className="patient-search-picker-meta">
                                <span className="patient-picker-badge code">
                                    <i className="bi bi-person-badge" />
                                    {selectedPatient.clinicalCode || selectedPatient.clinical_code || `PAC-${selectedPatient.id}`}
                                </span>
                                {(selectedPatient.documentId || selectedPatient.document_id) && (
                                    <span className="patient-picker-badge doc">
                                        <i className="bi bi-card-text" />
                                        CC: {selectedPatient.documentId || selectedPatient.document_id}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="patient-search-picker-placeholder">
                        <i className="bi bi-search" />
                        <span>{placeholder}</span>
                    </div>
                )}

                <span className="patient-search-picker-chevron">
                    <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                </span>
            </button>

            {/* Menú desplegable flotante con buscador en vivo */}
            {isOpen && (
                <div className="patient-search-picker-popover" role="listbox">
                    <div className="patient-search-picker-header">
                        <div className="patient-search-input-wrapper">
                            <i className="bi bi-search search-icon" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="patient-search-input"
                                placeholder="Escribe nombre, cédula o código..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setHighlightedIndex(0);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="patient-search-clear-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchQuery('');
                                        searchInputRef.current?.focus();
                                    }}
                                    title="Limpiar búsqueda"
                                >
                                    <i className="bi bi-x-lg" />
                                </button>
                            )}
                        </div>
                        <div className="patient-search-count">
                            {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente' : 'pacientes'}
                            {searchQuery ? ' encontrados' : ' registrados'}
                        </div>
                    </div>

                    <div ref={listRef} className="patient-search-picker-list">
                        {filteredPatients.length > 0 ? (
                            filteredPatients.map((p, index) => {
                                const isSelected = String(p.id) === String(selectedId);
                                const isHighlighted = index === highlightedIndex;
                                const code = p.clinicalCode || p.clinical_code || `PAC-${p.id}`;
                                const doc = p.documentId || p.document_id;

                                return (
                                    <div
                                        key={p.id}
                                        role="option"
                                        aria-selected={isSelected}
                                        className={`patient-search-picker-item ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                                        onClick={() => handleSelect(p)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                    >
                                        <span className="patient-search-picker-avatar item-avatar">
                                            {getInitials(p.name)}
                                        </span>
                                        <div className="patient-search-picker-item-details">
                                            <div className="patient-search-picker-item-name">
                                                <strong>{p.name}</strong>
                                                {isSelected && (
                                                    <span className="patient-selected-tag">
                                                        <i className="bi bi-check2" /> Seleccionado
                                                    </span>
                                                )}
                                            </div>
                                            <div className="patient-search-picker-item-meta">
                                                <span className="patient-picker-badge code">
                                                    {code}
                                                </span>
                                                {doc && (
                                                    <span className="patient-picker-badge doc">
                                                        CC: {doc}
                                                    </span>
                                                )}
                                                {p.email && (
                                                    <span className="patient-picker-email" title={p.email}>
                                                        <i className="bi bi-envelope" /> {p.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="patient-search-picker-empty">
                                <i className="bi bi-person-x" />
                                <p>No se encontró ningún paciente con "<strong>{searchQuery}</strong>"</p>
                                <span>Verifica la cédula, el código clínico o el nombre.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
