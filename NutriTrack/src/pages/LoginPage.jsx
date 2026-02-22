import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const initialForm = {
    username: "",
    password: "",
    role: "nutriologo",
    selectedPatientId: ""
};

function LoginPage({ onLogin }) {
    const { patients } = useApp();
    const { showSuccess, showError } = useToast();
    const [form, setForm] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const result = onLogin(form);
            if (result.ok) {
                showSuccess(`¡Bienvenido${form.role === 'nutriologo' ? ' Nutriólogo' : ''}!`);
            } else {
                showError(result.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            showError('Error de conexión. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickLogin = (role, username, password) => {
        setForm({
            ...form,
            role,
            username,
            password,
            selectedPatientId: role === 'usuario' ? patients[0]?.id || '' : ''
        });
    };

    return (
        <section className="login-page">
            <article className="login-card">
                <div className="login-info">
                    <div className="login-logo">
                        <i className="bi bi-heart-pulse-fill" />
                    </div>
                    <h1>NutriTrack</h1>
                    <p>
                        Prototipo funcional del sistema de gestión y seguimiento
                        nutricional. Todas las acciones son interactivas.
                    </p>
                    <div className="login-points">
                        <article>
                            <strong>Acceso rápido:</strong>
                            <div className="quick-login-buttons">
                                <button 
                                    type="button" 
                                    className="quick-login-btn nutriologo"
                                    onClick={() => handleQuickLogin('nutriologo', 'Dra. Maria Torres', '123456')}
                                >
                                    <i className="bi bi-person-badge" />
                                    Nutriólogo Demo
                                </button>
                                <button 
                                    type="button" 
                                    className="quick-login-btn usuario"
                                    onClick={() => handleQuickLogin('usuario', 'usuario_demo', '123456')}
                                >
                                    <i className="bi bi-person" />
                                    Usuario Demo
                                </button>
                            </div>
                        </article>
                        <article>
                            <strong>Rol Nutriólogo:</strong> Administra pacientes, citas,
                            planes y reportes.
                        </article>
                        <article>
                            <strong>Rol Usuario:</strong> Consulta su plan personal, citas y
                            seguimiento.
                        </article>
                    </div>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    <h2>Iniciar sesión</h2>
                    <p>Selecciona el tipo de cuenta para cargar las opciones del sistema.</p>

                    <div className="field">
                        <label htmlFor="role">Tipo de cuenta</label>
                        <select id="role" name="role" value={form.role} onChange={handleChange}>
                            <option value="nutriologo">Nutriólogo</option>
                            <option value="usuario">Usuario</option>
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="username">Usuario</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder={form.role === "nutriologo" ? "Dra. Maria Torres" : "usuario_demo"}
                            value={form.username}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {form.role === "usuario" ? (
                        <div className="field">
                            <label htmlFor="selectedPatientId">Paciente asociado</label>
                            <select
                                id="selectedPatientId"
                                name="selectedPatientId"
                                value={form.selectedPatientId}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            >
                                <option value="">Selecciona paciente</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    <div className="field">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="123456"
                            value={form.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={`btn ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <i className="bi bi-arrow-repeat spinning" />
                                Iniciando sesión...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-box-arrow-in-right" />
                                Iniciar sesión
                            </>
                        )}
                    </button>
                </form>
            </article>
        </section>
    );
}

export default LoginPage;
