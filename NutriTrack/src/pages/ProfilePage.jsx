import { useMemo, useState, useEffect } from "react";
import { roleLabels } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

/* ─── Ayudantes ─── */
function FieldGroup({ label, icon, children }) {
    return (
        <div className="pf-field-group">
            <label className="pf-field-label">
                {icon && <i className={`bi ${icon}`} />}
                {label}
            </label>
            {children}
        </div>
    );
}

function SectionTitle({ icon, title, subtitle }) {
    return (
        <div className="pf-section-title">
            <span className="pf-section-icon"><i className={`bi ${icon}`} /></span>
            <div>
                <h3>{title}</h3>
                {subtitle && <p>{subtitle}</p>}
            </div>
        </div>
    );
}

/* ─── Componente principal ─── */
function ProfilePage({ onLogout, defaultTab }) {
    const { auth, profiles, updateProfile, changePassword, patients, updatePatient } = useApp();
    const { showSuccess, showError, showWarning } = useToast();
    const isNutri = auth.role === "nutriologo";

    // Find current patient if user role is patient
    const currentPatient = useMemo(() => {
        if (!isNutri && auth.patientId) {
            return patients.find(p => Number(p.id) === Number(auth.patientId));
        }
        return null;
    }, [isNutri, auth.patientId, patients]);

    const resolveTab = (tab) => {
        if (tab === "configuracion") return "seguridad";
        return tab || "personal";
    };
    const [activeBlock, setActiveBlock] = useState(resolveTab(defaultTab));
    const [pwVisible, setPwVisible] = useState({ current: false, nuevo: false, confirm: false });

    // Profile or patient fallback
    const profile = profiles[auth.role] || {
        fullName: auth.fullName,
        email: auth.username,
        phone: "",
        specialty: "",
        schedule: "",
        registration: "",
        bio: "",
        address: "",
        city: "Bogotá, Colombia"
    };

    // Form states
    const [personalForm, setPersonalForm] = useState({
        fullName: isNutri ? (profile.fullName || "") : (currentPatient?.name || auth.fullName || ""),
        email:    isNutri ? (profile.email || "") : (currentPatient?.email || auth.username || ""),
        phone:    isNutri ? (profile.phone || "") : (currentPatient?.phone || ""),
        city:     profile.city || "Bogotá, Colombia",
        age:      isNutri ? "" : (currentPatient?.age || ""),
        gender:   isNutri ? "" : (currentPatient?.gender || "femenino")
    });

    const [professionalForm, setProfessionalForm] = useState({
        specialty:    profile.specialty    || "",
        registration: profile.registration || "",
        bio:          profile.bio          || ""
    });

    const [officeForm, setOfficeForm] = useState({
        officeName:    profile.officeName || "Consultorio NutriTrack",
        officeAddress: profile.officeAddress || profile.address || "",
        officeCity:    profile.officeCity || profile.city || "Bogotá, Colombia",
        officePhone:   profile.officePhone || ""
    });

    const [scheduleForm, setScheduleForm] = useState({
        schedule:           profile.schedule || "Lunes a Viernes 08:00 - 17:00",
        daysOfAttention:    profile.daysOfAttention || "Lunes, Martes, Miércoles, Jueves, Viernes",
        availabilityNotes:  profile.availabilityNotes || ""
    });

    const [physicalForm, setPhysicalForm] = useState({
        weight: currentPatient?.weight || "",
        height: currentPatient?.height || "",
        target: currentPatient?.target || "Reducir IMC"
    });

    const [medicalForm, setMedicalForm] = useState({
        allergies:  currentPatient?.allergies ? currentPatient.allergies.join(", ") : "",
        conditions: currentPatient?.conditions ? currentPatient.conditions.join(", ") : "",
        notes:      currentPatient?.notes || ""
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword:  "",
        newPassword:      "",
        confirmPassword:  ""
    });

    const [pwStrength, setPwStrength] = useState(0);

    // Keep state in sync with context
    useEffect(() => {
        if (defaultTab) setActiveBlock(resolveTab(defaultTab));
    }, [defaultTab]);

    useEffect(() => {
        if (currentPatient) {
            setPersonalForm(p => ({
                ...p,
                fullName: currentPatient.name || "",
                email: currentPatient.email || "",
                phone: currentPatient.phone || "",
                age: currentPatient.age || "",
                gender: currentPatient.gender || "femenino"
            }));
            setPhysicalForm({
                weight: currentPatient.weight || "",
                height: currentPatient.height || "",
                target: currentPatient.target || "Reducir IMC"
            });
            setMedicalForm({
                allergies: currentPatient.allergies ? currentPatient.allergies.join(", ") : "",
                conditions: currentPatient.conditions ? currentPatient.conditions.join(", ") : "",
                notes: currentPatient.notes || ""
            });
        }
    }, [currentPatient]);

    const initials = useMemo(() =>
        personalForm.fullName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join(""),
        [personalForm.fullName]
    );

    const calculatedIMC = useMemo(() => {
        if (isNutri || !physicalForm.weight || !physicalForm.height) return null;
        const w = Number(physicalForm.weight);
        const h = Number(physicalForm.height) / 100;
        return (w / (h * h)).toFixed(1);
    }, [isNutri, physicalForm.weight, physicalForm.height]);

    /* ── Medidor de fortaleza de contraseña ── */
    const calcStrength = (pw) => {
        let score = 0;
        if (pw.length >= 6)  score++;
        if (pw.length >= 10) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return score;
    };

    const strengthLabel = ["", "Muy débil", "Débil", "Regular", "Buena", "Excelente"];
    const strengthColor = ["", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#16a34a"];

    /* ── Handlers ── */
    const handleSavePersonal = (e) => {
        e.preventDefault();
        if (!personalForm.fullName.trim()) { showError("El nombre completo es obligatorio."); return; }
        
        if (isNutri) {
            updateProfile({ ...profile, ...personalForm });
        } else if (currentPatient) {
            updatePatient(currentPatient.id, {
                ...currentPatient,
                name: personalForm.fullName,
                email: personalForm.email,
                phone: personalForm.phone,
                age: Number(personalForm.age),
                gender: personalForm.gender
            });
        }
        showSuccess("✓ Información personal guardada correctamente.");
    };

    const handleSaveProfessional = (e) => {
        e.preventDefault();
        updateProfile({ ...profile, ...professionalForm });
        showSuccess("✓ Datos profesionales actualizados.");
    };

    const handleSaveOffice = (e) => {
        e.preventDefault();
        updateProfile({ ...profile, ...officeForm });
        showSuccess("✓ Datos del consultorio guardados.");
    };

    const handleSaveSchedule = (e) => {
        e.preventDefault();
        updateProfile({ ...profile, ...scheduleForm });
        showSuccess("✓ Horarios y disponibilidad guardados.");
    };

    const handleSavePhysical = (e) => {
        e.preventDefault();
        if (!currentPatient) return;
        updatePatient(currentPatient.id, {
            ...currentPatient,
            weight: Number(physicalForm.weight),
            height: Number(physicalForm.height),
            target: physicalForm.target
        });
        showSuccess("✓ Datos físicos actualizados.");
    };

    const handleSaveMedical = (e) => {
        e.preventDefault();
        if (!currentPatient) return;
        updatePatient(currentPatient.id, {
            ...currentPatient,
            allergies: medicalForm.allergies ? medicalForm.allergies.split(",").map(a => a.trim()).filter(Boolean) : [],
            conditions: medicalForm.conditions ? medicalForm.conditions.split(",").map(c => c.trim()).filter(Boolean) : [],
            notes: medicalForm.notes
        });
        showSuccess("✓ Historial médico actualizado.");
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showError("Las contraseñas nuevas no coinciden. Verifica e intenta de nuevo.");
            return;
        }
        if (pwStrength < 2) {
            showWarning("Tu contraseña es demasiado débil. Usa al menos 8 caracteres.");
            return;
        }
        const result = changePassword(passwordForm.currentPassword, passwordForm.newPassword);
        if (result.ok) {
            showSuccess("🔐 Contraseña actualizada exitosamente.");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setPwStrength(0);
        } else {
            showError(result.message);
        }
    };

    const navItems = isNutri ? [
        { key: "personal",      label: "Información Personal",   icon: "bi-person-fill",   desc: "Nombre, contacto" },
        { key: "profesional",   label: "Datos Profesionales",    icon: "bi-briefcase-fill", desc: "Especialidad, cédula, bio" },
        { key: "consultorio",   label: "Consultorio",            icon: "bi-building-fill",  desc: "Ubicación física, dirección" },
        { key: "horarios",      label: "Horarios",               icon: "bi-calendar-week-fill", desc: "Disponibilidad de citas" },
        { key: "seguridad",     label: "Seguridad y Cuentas",     icon: "bi-shield-lock-fill", desc: "Contraseña y sesión" }
    ] : [
        { key: "personal",      label: "Información Personal",   icon: "bi-person-fill",   desc: "Nombre, contacto, edad" },
        { key: "fisico",        label: "Datos Físicos",          icon: "bi-activity",      desc: "Peso, altura, IMC, objetivos" },
        { key: "medico",        label: "Historial Médico",       icon: "bi-journal-medical", desc: "Alergias, condiciones" },
        { key: "seguridad",     label: "Seguridad y Cuentas",     icon: "bi-shield-lock-fill", desc: "Contraseña y sesión" }
    ];

    return (
        <div className="pf-layout">
            {/* ── Sidebar de perfil ── */}
            <aside className="pf-sidebar">
                {/* Avatar + info */}
                <div className="pf-avatar-section">
                    <div className="pf-avatar">
                        <span className="pf-avatar-initials">{initials || "?"}</span>
                        <span className="pf-avatar-ring" />
                    </div>
                    <div className="pf-avatar-info">
                        <strong className="pf-avatar-name">{personalForm.fullName || "Sin nombre"}</strong>
                        <span className={`pf-role-badge pf-role-${auth.role}`}>
                            <i className={isNutri ? "bi bi-person-badge-fill" : "bi bi-person-heart"} />
                            {roleLabels[auth.role]}
                        </span>
                        <small className="pf-avatar-email">{personalForm.email}</small>
                    </div>
                </div>

                {/* Stats rápidas solo para nutriólogo */}
                {isNutri && (
                    <div className="pf-quick-stats">
                        <div className="pf-qstat">
                            <i className="bi bi-shield-check" />
                            <span>{professionalForm.registration || "—"}</span>
                            <small>Cédula profesional</small>
                        </div>
                        <div className="pf-qstat">
                            <i className="bi bi-clock-fill" />
                            <span style={{ fontSize: "0.7rem" }}>{scheduleForm.schedule || "—"}</span>
                            <small>Horario</small>
                        </div>
                    </div>
                )}

                {/* Navegación */}
                <nav className="pf-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            className={`pf-nav-item${activeBlock === item.key ? " active" : ""}`}
                            onClick={() => setActiveBlock(item.key)}
                        >
                            <span className="pf-nav-icon"><i className={`bi ${item.icon}`} /></span>
                            <span className="pf-nav-text">
                                <strong>{item.label}</strong>
                                <small>{item.desc}</small>
                            </span>
                            {activeBlock === item.key && <span className="pf-nav-arrow"><i className="bi bi-chevron-right" /></span>}
                        </button>
                    ))}
                </nav>

                {/* Cerrar sesión */}
                <button className="pf-logout-btn" onClick={onLogout}>
                    <i className="bi bi-box-arrow-right" />
                    Cerrar sesión
                </button>
            </aside>

            {/* ── Panel de contenido ── */}
            <main className="pf-content">

                {/* ══ TAB: INFORMACIÓN PERSONAL (Especialista o Paciente) ══ */}
                {activeBlock === "personal" && (
                    <form onSubmit={handleSavePersonal} className="pf-panel" noValidate>
                        <SectionTitle
                            icon="bi-person-fill"
                            title="Información Personal"
                            subtitle="Actualiza tus datos de contacto e identificación básica."
                        />

                        <div className="pf-form-grid">
                            <FieldGroup label="Nombre completo" icon="bi-person">
                                <input
                                    type="text"
                                    value={personalForm.fullName}
                                    onChange={(e) => setPersonalForm((p) => ({ ...p, fullName: e.target.value }))}
                                    placeholder="Tu nombre completo"
                                    required
                                />
                            </FieldGroup>

                            <FieldGroup label="Correo electrónico" icon="bi-envelope">
                                <input
                                    type="email"
                                    value={personalForm.email}
                                    onChange={(e) => setPersonalForm((p) => ({ ...p, email: e.target.value }))}
                                    placeholder="nombre@correo.com"
                                    required
                                />
                            </FieldGroup>

                            <FieldGroup label="Teléfono de contacto" icon="bi-telephone">
                                <input
                                    type="tel"
                                    value={personalForm.phone}
                                    onChange={(e) => setPersonalForm((p) => ({ ...p, phone: e.target.value }))}
                                    placeholder="+57 300 000 0000"
                                />
                            </FieldGroup>

                            {!isNutri && (
                                <>
                                    <FieldGroup label="Edad (años)" icon="bi-calendar-event">
                                        <input
                                            type="number"
                                            value={personalForm.age}
                                            onChange={(e) => setPersonalForm((p) => ({ ...p, age: e.target.value }))}
                                            placeholder="25"
                                        />
                                    </FieldGroup>

                                    <FieldGroup label="Género" icon="bi-gender-ambiguous">
                                        <select
                                            value={personalForm.gender}
                                            onChange={(e) => setPersonalForm((p) => ({ ...p, gender: e.target.value }))}
                                        >
                                            <option value="femenino">Femenino</option>
                                            <option value="masculino">Masculino</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </FieldGroup>
                                </>
                            )}

                            <FieldGroup label="Ciudad / Ubicación" icon="bi-geo-alt">
                                <input
                                    type="text"
                                    value={personalForm.city}
                                    onChange={(e) => setPersonalForm((p) => ({ ...p, city: e.target.value }))}
                                    placeholder="Bogotá, Colombia"
                                />
                            </FieldGroup>
                        </div>

                        <div className="pf-form-actions">
                            <button type="submit" className="btn pf-btn-save" style={{ background: 'var(--primary)', border: 'none' }}>
                                <i className="bi bi-check2-circle" />
                                Guardar cambios personales
                            </button>
                        </div>
                    </form>
                )}

                {/* ══ TAB: DATOS PROFESIONALES (Especialista) ══ */}
                {activeBlock === "profesional" && isNutri && (
                    <form onSubmit={handleSaveProfessional} className="pf-panel" noValidate>
                        <SectionTitle
                            icon="bi-briefcase-fill"
                            title="Datos Profesionales"
                            subtitle="Información de tu práctica y credenciales médicas."
                        />

                        <div className="pf-form-grid">
                            <FieldGroup label="Especialidad / Enfoque clínico" icon="bi-stars">
                                <input
                                    type="text"
                                    value={professionalForm.specialty}
                                    onChange={(e) => setProfessionalForm((p) => ({ ...p, specialty: e.target.value }))}
                                    placeholder="Ej: Nutrición Clínica y Deportiva"
                                />
                            </FieldGroup>

                            <FieldGroup label="Número de licencia / Cédula profesional" icon="bi-patch-check-fill">
                                <input
                                    type="text"
                                    value={professionalForm.registration}
                                    onChange={(e) => setProfessionalForm((p) => ({ ...p, registration: e.target.value }))}
                                    placeholder="Ej: COL-NT 4082"
                                />
                            </FieldGroup>
                        </div>

                        <FieldGroup label="Biografía profesional" icon="bi-blockquote-left">
                            <textarea
                                value={professionalForm.bio}
                                onChange={(e) => setProfessionalForm((p) => ({ ...p, bio: e.target.value }))}
                                rows={4}
                                placeholder="Describe tu experiencia, enfoque y filosofía de atención…"
                                style={{ resize: "vertical" }}
                            />
                        </FieldGroup>

                        <div className="pf-form-actions">
                            <button type="submit" className="btn pf-btn-save" style={{ background: 'var(--primary)', border: 'none' }}>
                                <i className="bi bi-check2-circle" />
                                Guardar datos profesionales
                            </button>
                        </div>
                    </form>
                )}

                {/* ══ TAB: CONSULTORIO (Especialista) ══ */}
                {activeBlock === "consultorio" && isNutri && (
                    <form onSubmit={handleSaveOffice} className="pf-panel" noValidate>
                        <SectionTitle
                            icon="bi-building-fill"
                            title="Información del Consultorio"
                            subtitle="Registra los detalles del lugar de atención física a tus pacientes."
                        />

                        <div className="pf-form-grid">
                            <FieldGroup label="Nombre del consultorio" icon="bi-shop">
                                <input
                                    type="text"
                                    value={officeForm.officeName}
                                    onChange={(e) => setOfficeForm(p => ({ ...p, officeName: e.target.value }))}
                                    placeholder="Ej: Centro Nutritrack Norte"
                                />
                            </FieldGroup>

                            <FieldGroup label="Dirección física" icon="bi-geo-fill">
                                <input
                                    type="text"
                                    value={officeForm.officeAddress}
                                    onChange={(e) => setOfficeForm(p => ({ ...p, officeAddress: e.target.value }))}
                                    placeholder="Calle 100 # 15-20, Consultorio 502"
                                />
                            </FieldGroup>

                            <FieldGroup label="Ciudad" icon="bi-map">
                                <input
                                    type="text"
                                    value={officeForm.officeCity}
                                    onChange={(e) => setOfficeForm(p => ({ ...p, officeCity: e.target.value }))}
                                    placeholder="Bogotá, Colombia"
                                />
                            </FieldGroup>

                            <FieldGroup label="Teléfono de la Oficina" icon="bi-telephone-fill">
                                <input
                                    type="tel"
                                    value={officeForm.officePhone}
                                    onChange={(e) => setOfficeForm(p => ({ ...p, officePhone: e.target.value }))}
                                    placeholder="+57 601 234 5678"
                                />
                            </FieldGroup>
                        </div>

                        <div className="pf-form-actions">
                            <button type="submit" className="btn pf-btn-save" style={{ background: 'var(--primary)', border: 'none' }}>
                                <i className="bi bi-check2-circle" />
                                Guardar datos del consultorio
                            </button>
                        </div>
                    </form>
                )}

                {/* ══ TAB: HORARIOS DE ATENCIÓN (Especialista) ══ */}
                {activeBlock === "horarios" && isNutri && (
                    <form onSubmit={handleSaveSchedule} className="pf-panel" noValidate>
                        <SectionTitle
                            icon="bi-calendar-week-fill"
                            title="Horarios y Disponibilidad"
                            subtitle="Configura las horas y los días de atención disponibles para citas."
                        />

                        <div className="pf-form-grid">
                            <FieldGroup label="Horario diario de atención" icon="bi-clock-fill">
                                <input
                                    type="text"
                                    value={scheduleForm.schedule}
                                    onChange={(e) => setScheduleForm(p => ({ ...p, schedule: e.target.value }))}
                                    placeholder="Ej: Lunes a Viernes 08:00 - 17:00"
                                />
                            </FieldGroup>

                            <FieldGroup label="Días de consulta activa" icon="bi-calendar-check-fill">
                                <input
                                    type="text"
                                    value={scheduleForm.daysOfAttention}
                                    onChange={(e) => setScheduleForm(p => ({ ...p, daysOfAttention: e.target.value }))}
                                    placeholder="Ej: Lunes, Martes, Miércoles, Jueves, Viernes"
                                />
                            </FieldGroup>
                        </div>

                        <FieldGroup label="Notas de disponibilidad / Excepciones" icon="bi-chat-left-dots-fill">
                            <textarea
                                value={scheduleForm.availabilityNotes}
                                onChange={(e) => setScheduleForm(p => ({ ...p, availabilityNotes: e.target.value }))}
                                rows={3}
                                placeholder="Ej: No se atiende en días festivos oficiales. Citas virtuales los sábados de 9:00 a 12:00."
                            />
                        </FieldGroup>

                        <div className="pf-form-actions">
                            <button type="submit" className="btn pf-btn-save" style={{ background: 'var(--primary)', border: 'none' }}>
                                <i className="bi bi-check2-circle" />
                                Guardar horarios
                            </button>
                        </div>
                    </form>
                )}

                {/* ══ TAB: DATOS FÍSICOS (Paciente) ══ */}
                {activeBlock === "fisico" && !isNutri && (
                    <div className="pf-panel">
                        <SectionTitle
                            icon="bi-activity"
                            title="Tus Datos Físicos Clínicos"
                            subtitle="Mediciones oficiales registradas por tu nutricionista durante tus consultas."
                        />

                        {/* Stat cards 2×2 */}
                        <div className="pf-stat-row">
                            {/* Peso */}
                            <div className="pf-stat-card">
                                <span className="pf-stat-card-label">
                                    <i className="bi bi-speedometer" />
                                    Peso actual
                                </span>
                                <span className="pf-stat-card-value">
                                    {physicalForm.weight ? `${physicalForm.weight} kg` : "—"}
                                </span>
                            </div>

                            {/* Estatura */}
                            <div className="pf-stat-card">
                                <span className="pf-stat-card-label">
                                    <i className="bi bi-rulers" />
                                    Estatura
                                </span>
                                <span className="pf-stat-card-value">
                                    {physicalForm.height ? `${physicalForm.height} cm` : "—"}
                                </span>
                            </div>

                            {/* IMC */}
                            <div className="pf-stat-card">
                                <span className="pf-stat-card-label">
                                    <i className="bi bi-heart-fill" />
                                    IMC calculado
                                </span>
                                <span className={`pf-stat-card-value ${calculatedIMC ? "highlight" : ""}`}>
                                    {calculatedIMC
                                        ? `${calculatedIMC} — ${Number(calculatedIMC) < 18.5 ? "Bajo peso" : Number(calculatedIMC) < 25 ? "Saludable" : Number(calculatedIMC) < 30 ? "Sobrepeso" : "Obesidad"}`
                                        : "—"}
                                </span>
                            </div>

                            {/* Objetivo */}
                            <div className="pf-stat-card">
                                <span className="pf-stat-card-label">
                                    <i className="bi bi-bullseye" />
                                    Objetivo nutricional
                                </span>
                                <span className="pf-stat-card-value" style={{ fontSize: "0.95rem", letterSpacing: 0 }}>
                                    {physicalForm.target || "Control Calórico"}
                                </span>
                            </div>
                        </div>

                        <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <i className="bi bi-info-circle" />
                            Solo tu nutricionista puede modificar estos datos durante la consulta.
                        </p>
                    </div>
                )}

                {/* ══ TAB: HISTORIAL MÉDICO (Paciente) ══ */}
                {activeBlock === "medico" && !isNutri && (
                    <div className="pf-panel">
                        <SectionTitle
                            icon="bi-journal-medical"
                            title="Historial Médico y Clínico"
                            subtitle="Información clínica y alergias evaluadas por tu nutricionista."
                        />

                        <div className="pf-info-field">
                            <label><i className="bi bi-exclamation-triangle" style={{ marginRight: "0.35rem", color: "var(--warning)" }} />Alergias registradas</label>
                            <span className={medicalForm.allergies ? "" : "empty"}>
                                {medicalForm.allergies || "Ninguna registrada"}
                            </span>
                        </div>

                        <div className="pf-info-field">
                            <label><i className="bi bi-heart-pulse" style={{ marginRight: "0.35rem", color: "var(--danger)" }} />Condiciones médicas</label>
                            <span className={medicalForm.conditions ? "" : "empty"}>
                                {medicalForm.conditions || "Ninguna registrada"}
                            </span>
                        </div>

                        <div className="pf-note-field">
                            <label><i className="bi bi-chat-left-text" style={{ marginRight: "0.35rem", color: "var(--primary)" }} />Observaciones de tu especialista</label>
                            <div className={`pf-note-content ${medicalForm.notes ? "" : "empty"}`}>
                                {medicalForm.notes || "Tu especialista agregará notas médicas durante la consulta."}
                            </div>
                        </div>

                        <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <i className="bi bi-shield-check" style={{ color: "var(--primary)" }} />
                            Esta información es gestionada exclusivamente por tu nutricionista.
                        </p>
                    </div>
                )}

                {/* ══ TAB: SEGURIDAD Y CUENTAS (Especialista o Paciente) ══ */}
                {activeBlock === "seguridad" && (
                    <div className="pf-panel">
                        <SectionTitle
                            icon="bi-shield-lock-fill"
                            title="Seguridad y Contraseña"
                            subtitle="Mantén tu cuenta protegida con una contraseña segura."
                        />

                        <div className="pf-security-banner">
                            <i className="bi bi-shield-check" />
                            <div>
                                <strong>Tu cuenta está protegida</strong>
                                <p>Te recomendamos usar una contraseña de al menos 10 caracteres con números y símbolos.</p>
                            </div>
                        </div>

                        <form onSubmit={handleChangePassword} className="pf-pw-form" noValidate>
                            <FieldGroup label="Contraseña actual" icon="bi-lock">
                                <div className="password-wrapper">
                                    <input
                                        type={pwVisible.current ? "text" : "password"}
                                        placeholder="Ingresa tu contraseña actual"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setPwVisible((v) => ({ ...v, current: !v.current }))}>
                                        <i className={`bi ${pwVisible.current ? "bi-eye-slash-fill" : "bi-eye-fill"}`} />
                                    </button>
                                </div>
                            </FieldGroup>

                            <FieldGroup label="Nueva contraseña" icon="bi-key">
                                <div className="password-wrapper">
                                    <input
                                        type={pwVisible.nuevo ? "text" : "password"}
                                        placeholder="Mínimo 6 caracteres"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPasswordForm((p) => ({ ...p, newPassword: val }));
                                            setPwStrength(calcStrength(val));
                                        }}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setPwVisible((v) => ({ ...v, nuevo: !v.nuevo }))}>
                                        <i className={`bi ${pwVisible.nuevo ? "bi-eye-slash-fill" : "bi-eye-fill"}`} />
                                    </button>
                                </div>
                                {passwordForm.newPassword && (
                                    <div className="pw-strength-meter">
                                        <div className="pw-strength-bars">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <span
                                                    key={n}
                                                    className="pw-strength-bar"
                                                    style={{ background: n <= pwStrength ? strengthColor[pwStrength] : "var(--line)" }}
                                                />
                                            ))}
                                        </div>
                                        <span style={{ color: strengthColor[pwStrength], fontWeight: 600, fontSize: "0.75rem" }}>
                                            {strengthLabel[pwStrength]}
                                        </span>
                                    </div>
                                )}
                            </FieldGroup>

                            <FieldGroup label="Confirmar nueva contraseña" icon="bi-check-circle">
                                <div className="password-wrapper">
                                    <input
                                        type={pwVisible.confirm ? "text" : "password"}
                                        placeholder="Repite tu nueva contraseña"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                        required
                                        autoComplete="new-password"
                                        style={{
                                            borderColor: passwordForm.confirmPassword
                                                ? passwordForm.newPassword === passwordForm.confirmPassword
                                                    ? "var(--success)"
                                                    : "var(--danger)"
                                                : undefined
                                        }}
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setPwVisible((v) => ({ ...v, confirm: !v.confirm }))}>
                                        <i className={`bi ${pwVisible.confirm ? "bi-eye-slash-fill" : "bi-eye-fill"}`} />
                                    </button>
                                </div>
                                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                                    <small style={{ color: "var(--danger)", fontWeight: 500, marginTop: "0.25rem", display: "block" }}>
                                        <i className="bi bi-x-circle" /> Las contraseñas no coinciden
                                    </small>
                                )}
                                {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                                    <small style={{ color: "var(--success)", fontWeight: 500, marginTop: "0.25rem", display: "block" }}>
                                        <i className="bi bi-check-circle" /> Las contraseñas coinciden
                                    </small>
                                )}
                            </FieldGroup>

                            <div className="pf-form-actions">
                                <button type="submit" className="btn pf-btn-save" style={{ background: 'var(--primary)', border: 'none' }}>
                                    <i className="bi bi-shield-check" />
                                    Actualizar contraseña
                                </button>
                            </div>
                        </form>

                        {/* Danger zone */}
                        <div className="pf-danger-zone">
                            <div className="pf-danger-zone-header">
                                <i className="bi bi-exclamation-triangle-fill" />
                                <div>
                                    <strong>Cerrar sesión</strong>
                                    <p>Esto cerrará tu sesión actual en todos los dispositivos.</p>
                                </div>
                            </div>
                            <button className="btn pf-btn-danger" onClick={onLogout}>
                                <i className="bi bi-box-arrow-right" />
                                Cerrar sesión ahora
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ProfilePage;
