import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { isSupabaseConfigured } from "../services/supabaseClient";
import { userService } from "../services/userService";

const initialForm = {
    email: "",
    password: "",
    rememberMe: false
};

function LoginPage({ onLogin }) {
    const { showSuccess, showError, showWarning } = useToast();
    const [form, setForm] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 900));
            const result = await onLogin({ email: form.email, password: form.password });
            if (result.ok) {
                showSuccess("¡Bienvenido de nuevo! Sesión iniciada correctamente.");
            } else {
                showError(result.message || "Correo o contraseña incorrectos.");
            }
        } catch {
            showError("Error de conexión. Por favor intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!form.email.trim()) {
            showWarning("Introduce tu correo para recibir el enlace de restablecimiento.");
            return;
        }
        if (!isSupabaseConfigured) {
            showError("El restablecimiento requiere una conexión configurada con Supabase.");
            return;
        }
        try {
            await userService.resetPassword(form.email.trim().toLowerCase());
            showSuccess("Si el correo existe, recibirás un enlace para restablecer la contraseña.");
        } catch {
            showError("No fue posible solicitar el restablecimiento. Intenta de nuevo.");
        }
    };

    const features = [
        { icon: "bi-people-fill", title: "Gestión de pacientes", desc: "Expedientes clínicos completos" },
        { icon: "bi-apple", title: "Planes alimenticios", desc: "Diseño nutricional personalizado" },
        { icon: "bi-graph-up-arrow", title: "Seguimiento nutricional", desc: "Reportes de progreso en tiempo real" },
        { icon: "bi-calendar3-event-fill", title: "Agenda inteligente", desc: "Control de citas y recordatorios" },
    ];

    return (
        <section className="login-page">
            {/* Fondo animado */}
            <div className="login-bg-orbs">
                <span className="orb orb-1" />
                <span className="orb orb-2" />
                <span className="orb orb-3" />
            </div>

            <article className="login-card">
                {/* ── Columna izquierda ── */}
                <div className="login-info">
                    <div className="login-brand">
                        <span className="login-logo-icon">
                            <img src="/logonutri.png" alt="Logo" />
                        </span>
                        <span className="login-brand-name">NutriTrack</span>
                    </div>

                    <div className="login-headline">
                        <h1>Tu consultorio<br /><span className="login-headline-accent">en un solo lugar</span></h1>
                        <p>Gestiona pacientes, planes y citas con la herramienta más completa para nutriólogos profesionales.</p>
                    </div>

                    <ul className="login-features">
                        {features.map((f) => (
                            <li key={f.icon} className="login-feature-item">
                                <span className="login-feature-icon">
                                    <i className={`bi ${f.icon}`} />
                                </span>
                                <div>
                                    <strong>{f.title}</strong>
                                    <p>{f.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                </div>

                {/* ── Columna derecha (formulario) ── */}
                <div className="login-form-col">
                    {/* Mini brand shown only on ≤520px when info panel is hidden */}
                    <div className="login-mobile-brand">
                        <span className="login-mobile-logo">
                            <i className="bi bi-heart-pulse-fill" />
                        </span>
                        <span>NutriTrack</span>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <header className="login-form-header">
                            <h2>Iniciar sesión</h2>
                            <p>Introduce tu correo y contraseña para acceder a tu cuenta.</p>
                        </header>

                        <div className="field">
                            <label htmlFor="email">
                                <i className="bi bi-envelope-fill" style={{ marginRight: "0.4rem", opacity: 0.6 }} />
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="nombre@correo.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="password">
                                <i className="bi bi-lock-fill" style={{ marginRight: "0.4rem", opacity: 0.6 }} />
                                Contraseña
                            </label>
                            <div className="password-wrapper">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"} />
                                </button>
                            </div>
                        </div>

                        <div className="login-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={form.rememberMe}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                                <span>Recordarme</span>
                            </label>
                            <a href="#forgot" className="forgot-link" onClick={handleForgotPassword}>
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className={`btn login-submit-btn${isLoading ? " loading" : ""}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <i className="bi bi-arrow-repeat spinning" />
                                    Verificando credenciales...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right" />
                                    Iniciar sesión
                                </>
                            )}
                        </button>

                        <div className="login-divider">
                            <span>¿Primera vez aquí?</span>
                        </div>

                        <Link to="/register" className="btn login-register-btn">
                            <i className="bi bi-person-plus-fill" />
                            Crear una cuenta nueva
                        </Link>
                    </form>

                    <footer className="login-form-footer">
                        <p>
                            <i className="bi bi-shield-lock-fill" style={{ marginRight: "0.3rem", color: "var(--primary)" }} />
                            Tus datos están protegidos con cifrado de extremo a extremo.
                        </p>
                    </footer>
                </div>
            </article>
        </section>
    );
}

export default LoginPage;
