import { useState } from "react";
import { useApp } from "../context/AppContext";

const initialForm = {
    username: "",
    password: "",
    role: "nutriologo",
    selectedPatientId: ""
};

function LoginPage({ onLogin }) {
    const { patients } = useApp();
    const [form, setForm] = useState(initialForm);
    const [feedback, setFeedback] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFeedback("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const result = onLogin(form);
        if (!result.ok) {
            setFeedback(result.message);
        }
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
                        Prototipo funcional del sistema de gestion y seguimiento
                        nutricional. Todas las acciones son interactivas.
                    </p>
                    <div className="login-points">
                        <article>
                            <strong>Acceso de demostracion:</strong> contrasena para ambos
                            roles: <code>123456</code>.
                        </article>
                        <article>
                            <strong>Rol Nutriologo:</strong> administra pacientes, citas,
                            planes y reportes.
                        </article>
                        <article>
                            <strong>Rol Usuario:</strong> consulta su plan personal, citas y
                            seguimiento.
                        </article>
                    </div>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    <h2>Iniciar sesion</h2>
                    <p>Selecciona el tipo de cuenta para cargar las opciones del sistema.</p>

                    <div className="field">
                        <label htmlFor="role">Tipo de cuenta</label>
                        <select id="role" name="role" value={form.role} onChange={handleChange}>
                            <option value="nutriologo">Nutriologo</option>
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
                        <label htmlFor="password">Contrasena</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="123456"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {feedback ? <p className="alert-inline error">{feedback}</p> : null}

                    <button type="submit" className="btn">
                        <i className="bi bi-box-arrow-in-right" />
                        Iniciar sesion
                    </button>
                </form>
            </article>
        </section>
    );
}

export default LoginPage;
