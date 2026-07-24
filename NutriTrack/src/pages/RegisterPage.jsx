import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const initialForm = {
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "nutriologo",
};

function getPasswordStrength(pw) {
    if (!pw) return { level: 0, label: "", color: "var(--line)" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
        { level: 0, label: "",          color: "var(--line)" },
        { level: 1, label: "Muy débil", color: "var(--danger)" },
        { level: 2, label: "Débil",     color: "var(--warning)" },
        { level: 3, label: "Regular",   color: "var(--warning-light)" },
        { level: 4, label: "Fuerte",    color: "var(--success)" },
        { level: 5, label: "Muy fuerte",color: "var(--primary)" },
    ];
    return levels[score] ?? levels[0];
}

function RegisterPage() {
    const navigate = useNavigate();
    const { registerUser, registerNutriologist } = useApp();
    const { showSuccess, showError } = useToast();
    const [form, setForm] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const pwStrength = getPasswordStrength(form.password);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const errs = {};
        if (!form.fullName.trim()) errs.fullName = "El nombre es requerido.";
        if (!form.email.trim()) {
            errs.email = "El correo es requerido.";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            errs.email = "Formato de correo inválido.";
        }
        if (!form.password) {
            errs.password = "La contraseña es requerida.";
        } else if (form.password.length < 6) {
            errs.password = "Mínimo 6 caracteres.";
        }
        if (form.password !== form.confirmPassword) {
            errs.confirmPassword = "Las contraseñas no coinciden.";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            await new Promise((r) => setTimeout(r, 800));
            let result;
            if (form.role === "nutriologo") {
                result = await registerNutriologist({
                    fullName: form.fullName.trim(),
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                });
            } else {
                result = await registerUser({
                    fullName: form.fullName.trim(),
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                });
            }
            if (result.success) {
                showSuccess("¡Registro exitoso! Ya puedes iniciar sesión.");
                navigate("/login");
            } else {
                showError(result.message || "Error al registrarse.");
            }
        } catch {
            showError("Error de red. Intenta más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    const benefits = [
        { icon: "bi-shield-lock-fill",   text: "Datos cifrados con seguridad de extremo a extremo" },
        { icon: "bi-people-fill",        text: "Gestión completa de pacientes en tu consultorio" },
        { icon: "bi-graph-up-arrow",     text: "Reportes nutricionales y seguimiento de progreso" },
        { icon: "bi-calendar3-event-fill", text: "Agenda de citas inteligente y recordatorios" },
    ];

    const barColors = [
        "var(--line)",
        "var(--danger)",
        "var(--warning)",
        "var(--warning-light)",
        "var(--success)",
        "var(--primary)",
    ];

    return (
        <section className="login-page">
            {/* Animated background */}
            <div className="login-bg-orbs">
                <span className="orb orb-1" />
                <span className="orb orb-2" />
                <span className="orb orb-3" />
            </div>

            <article className="login-card" style={{ position: "relative", zIndex: 1 }}>
                {/* ── Left panel ── */}
                <div className="login-info">
                    <div className="login-brand">
                        <span className="login-logo-icon">
                            <i className="bi bi-heart-pulse-fill" />
                        </span>
                        <span className="login-brand-name">NutriTrack</span>
                    </div>

                    <div className="login-headline">
                        <h1>Únete a la<br /><span className="login-headline-accent">plataforma líder</span></h1>
                        <p>Todo lo que necesitas para gestionar tu consultorio nutricional de manera profesional y eficiente.</p>
                    </div>

                    <div className="register-info-points">
                        {benefits.map((b) => (
                            <div key={b.icon} className="register-info-point">
                                <i className={`bi ${b.icon}`} />
                                <span>{b.text}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: "auto", fontSize: "0.74rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <i className="bi bi-lock-fill" style={{ color: "#4ade80" }} />
                        Tus datos están protegidos con cifrado SSL/TLS
                    </div>
                </div>

                {/* ── Right panel (form) ── */}
                <div className="login-form-col">
                    <form className="login-form" onSubmit={handleSubmit} noValidate
                        style={{ padding: "2.5rem 2.5rem 1.5rem", gap: "0.9rem" }}>

                        <header className="login-form-header">
                            <h2>Crear cuenta</h2>
                            <p>Regístrate gratis y empieza a gestionar tu práctica.</p>
                        </header>

                        {/* Role selector */}
                        <div>
                            <label style={{
                                fontSize: "0.8rem", fontWeight: 600,
                                color: "var(--muted)", marginBottom: "0.5rem",
                                display: "block", textTransform: "uppercase",
                                letterSpacing: "0.04em"
                            }}>
                                Tipo de cuenta
                            </label>
                            <div className="role-selector">
                                <button
                                    type="button"
                                    className={`role-card${form.role === "nutriologo" ? " selected" : ""}`}
                                    onClick={() => setForm((p) => ({ ...p, role: "nutriologo" }))}
                                    disabled={isLoading}
                                >
                                    <span className="role-card-check"><i className="bi bi-check-lg" /></span>
                                    <span className="role-card-icon nutri">
                                        <i className="bi bi-person-badge-fill" />
                                    </span>
                                    <strong>Nutriólogo</strong>
                                    <span>Gestiona pacientes</span>
                                </button>
                                <button
                                    type="button"
                                    className={`role-card${form.role === "usuario" ? " selected" : ""}`}
                                    onClick={() => setForm((p) => ({ ...p, role: "usuario" }))}
                                    disabled={isLoading}
                                >
                                    <span className="role-card-check"><i className="bi bi-check-lg" /></span>
                                    <span className="role-card-icon patient">
                                        <i className="bi bi-person-heart" />
                                    </span>
                                    <strong>Paciente</strong>
                                    <span>Ve tu progreso</span>
                                </button>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="field">
                            <label htmlFor="reg-fullName">
                                <i className="bi bi-person-fill" style={{ marginRight: "0.3rem", opacity: 0.6 }} />
                                Nombre completo
                            </label>
                            <input
                                id="reg-fullName"
                                name="fullName"
                                type="text"
                                placeholder="Ej: Ana García López"
                                value={form.fullName}
                                onChange={handleChange}
                                className={errors.fullName ? "error" : ""}
                                required
                                disabled={isLoading}
                                autoComplete="name"
                            />
                            {errors.fullName && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle-fill" />
                                    {errors.fullName}
                                </span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="field">
                            <label htmlFor="reg-email">
                                <i className="bi bi-envelope-fill" style={{ marginRight: "0.3rem", opacity: 0.6 }} />
                                Correo electrónico
                            </label>
                            <input
                                id="reg-email"
                                name="email"
                                type="email"
                                placeholder="tu@correo.com"
                                value={form.email}
                                onChange={handleChange}
                                className={errors.email ? "error" : ""}
                                required
                                disabled={isLoading}
                                autoComplete="email"
                            />
                            {errors.email && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle-fill" />
                                    {errors.email}
                                </span>
                            )}
                        </div>

                        {/* Password */}
                        <div className="field">
                            <label htmlFor="reg-password">
                                <i className="bi bi-lock-fill" style={{ marginRight: "0.3rem", opacity: 0.6 }} />
                                Contraseña
                            </label>
                            <div className="password-wrapper">
                                <input
                                    id="reg-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 6 caracteres"
                                    value={form.password}
                                    onChange={handleChange}
                                    className={errors.password ? "error" : ""}
                                    required
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((p) => !p)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Ocultar" : "Mostrar"}
                                >
                                    <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"} />
                                </button>
                            </div>

                            {/* Strength meter */}
                            {form.password && (
                                <div className="pw-strength-meter">
                                    <div className="pw-strength-bars">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <div
                                                key={n}
                                                className="pw-strength-bar"
                                                style={{
                                                    background: n <= pwStrength.level ? pwStrength.color : "var(--line)"
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span
                                        className="pw-strength-label"
                                        style={{ color: pwStrength.color, fontSize: "0.72rem" }}
                                    >
                                        {pwStrength.label}
                                    </span>
                                </div>
                            )}

                            {errors.password && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle-fill" />
                                    {errors.password}
                                </span>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="field">
                            <label htmlFor="reg-confirmPassword">
                                <i className="bi bi-shield-lock-fill" style={{ marginRight: "0.3rem", opacity: 0.6 }} />
                                Confirmar contraseña
                            </label>
                            <div className="password-wrapper">
                                <input
                                    id="reg-confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Repite tu contraseña"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className={errors.confirmPassword ? "error" : ""}
                                    required
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword((p) => !p)}
                                    tabIndex={-1}
                                    aria-label={showConfirmPassword ? "Ocultar" : "Mostrar"}
                                >
                                    <i className={showConfirmPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"} />
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <span className="error-message">
                                    <i className="bi bi-exclamation-circle-fill" />
                                    {errors.confirmPassword}
                                </span>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className={`login-submit-btn btn${isLoading ? " loading" : ""}`}
                            disabled={isLoading}
                            style={{ marginTop: "0.25rem" }}
                        >
                            {isLoading ? (
                                <>
                                    <i className="bi bi-arrow-repeat spinning" />
                                    Creando cuenta...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-person-plus-fill" />
                                    Crear cuenta gratis
                                </>
                            )}
                        </button>

                        <div className="login-divider">
                            <span>¿Ya tienes una cuenta?</span>
                        </div>

                        <Link to="/login" className="login-register-btn">
                            <i className="bi bi-box-arrow-in-right" />
                            Iniciar sesión
                        </Link>
                    </form>

                    <footer className="login-form-footer">
                        <p>
                            <i className="bi bi-shield-check-fill" style={{ marginRight: "0.3rem", color: "var(--primary)" }} />
                            Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
                        </p>
                    </footer>
                </div>
            </article>
        </section>
    );
}

export default RegisterPage;
