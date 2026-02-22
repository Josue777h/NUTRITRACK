import { useMemo, useState } from "react";
import { roleLabels } from "../data/mockData";
import { useApp } from "../context/AppContext";

function ProfilePage({ onLogout }) {
    const { auth, profiles, updateProfile, changePassword } = useApp();
    const profile = profiles[auth.role];

    const [profileForm, setProfileForm] = useState({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        specialty: profile.specialty,
        schedule: profile.schedule
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [feedback, setFeedback] = useState("");

    const initials = useMemo(() => {
        return profileForm.fullName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((item) => item[0]?.toUpperCase())
            .join("");
    }, [profileForm.fullName]);

    const handleProfileChange = (event) => {
        const { name, value } = event.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = (event) => {
        event.preventDefault();
        updateProfile(profileForm);
        setFeedback("Perfil actualizado correctamente.");
    };

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleChangePassword = (event) => {
        event.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setFeedback("La confirmacion de contrasena no coincide.");
            return;
        }
        const result = changePassword(passwordForm.currentPassword, passwordForm.newPassword);
        setFeedback(result.message);
        if (result.ok) {
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        }
    };

    return (
        <section className="profile-grid">
            <article className="panel">
                <div className="profile-header">
                    <div className="avatar">{initials || "NT"}</div>
                    <div>
                        <h3>{profileForm.fullName}</h3>
                        <p>
                            {roleLabels[auth.role]} - {profile.registration}
                        </p>
                    </div>
                </div>
                <div className="profile-details">
                    <article>
                        <span>Correo</span>
                        <strong>{profileForm.email}</strong>
                    </article>
                    <article>
                        <span>Telefono</span>
                        <strong>{profileForm.phone}</strong>
                    </article>
                    <article>
                        <span>Especialidad</span>
                        <strong>{profileForm.specialty}</strong>
                    </article>
                    <article>
                        <span>Horario</span>
                        <strong>{profileForm.schedule}</strong>
                    </article>
                </div>
            </article>

            <article className="panel">
                <div className="panel-header">
                    <h3 className="panel-title">Configuracion de cuenta</h3>
                </div>

                {feedback ? <p className="alert-inline success">{feedback}</p> : null}

                <form className="form-grid" onSubmit={handleSaveProfile}>
                    <div className="field">
                        <label htmlFor="fullName">Nombre completo</label>
                        <input
                            id="fullName"
                            name="fullName"
                            value={profileForm.fullName}
                            onChange={handleProfileChange}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="email">Correo</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={profileForm.email}
                            onChange={handleProfileChange}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="phone">Telefono</label>
                        <input
                            id="phone"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="specialty">Descripcion</label>
                        <input
                            id="specialty"
                            name="specialty"
                            value={profileForm.specialty}
                            onChange={handleProfileChange}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="schedule">Horario / disponibilidad</label>
                        <input
                            id="schedule"
                            name="schedule"
                            value={profileForm.schedule}
                            onChange={handleProfileChange}
                        />
                    </div>
                    <button type="submit" className="btn">
                        Guardar perfil
                    </button>
                </form>

                <hr className="divider" />

                <form className="form-grid" onSubmit={handleChangePassword}>
                    <h4 className="panel-title">Cambiar contrasena</h4>
                    <div className="field">
                        <label htmlFor="currentPassword">Contrasena actual</label>
                        <input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="newPassword">Nueva contrasena</label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="confirmPassword">Confirmar contrasena</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <div className="action-row">
                        <button className="btn secondary" type="submit">
                            <i className="bi bi-key" />
                            Actualizar contrasena
                        </button>
                        <button className="btn danger" type="button" onClick={onLogout}>
                            <i className="bi bi-box-arrow-right" />
                            Cerrar sesion
                        </button>
                    </div>
                </form>
            </article>
        </section>
    );
}

export default ProfilePage;
