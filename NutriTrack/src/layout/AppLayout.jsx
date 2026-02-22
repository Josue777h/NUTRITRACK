import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navByRole, roleLabels, screenTitles } from "../data/mockData";
import { useApp } from "../context/AppContext";

function AppLayout({ onLogout, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { auth } = useApp();

    const screenTitle = useMemo(
        () => screenTitles[location.pathname] ?? "NutriTrack",
        [location.pathname]
    );
    const navItems = navByRole[auth.role] ?? [];

    return (
        <div className="app-shell">
            <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
                <div className="brand">
                    <div className="brand-logo">
                        <i className="bi bi-heart-pulse-fill" />
                    </div>
                    <div>
                        <h1>NutriTrack</h1>
                        <p>Sistema de gestion nutricional</p>
                    </div>
                </div>
                <nav className="menu">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) =>
                                `menu-item ${isActive ? "active" : ""}`
                            }
                        >
                            <i className={`bi ${item.icon}`} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <p>{roleLabels[auth.role] ?? "Sesion activa"}</p>
                    <strong>{auth.fullName || "NutriTrack"}</strong>
                </div>
            </aside>

            {isSidebarOpen ? (
                <button
                    className="overlay"
                    type="button"
                    aria-label="Cerrar menu"
                    onClick={() => setIsSidebarOpen(false)}
                />
            ) : null}

            <section className="main-panel">
                <header className="topbar">
                    <button
                        type="button"
                        className="menu-toggle"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Abrir menu"
                    >
                        <i className="bi bi-list" />
                    </button>
                    <div>
                        <h2>{screenTitle}</h2>
                        <p>
                            {roleLabels[auth.role] ?? "Perfil"}: {auth.fullName || "Invitado"}
                        </p>
                    </div>
                    <button className="btn ghost" type="button" onClick={onLogout}>
                        <i className="bi bi-box-arrow-right" />
                        Cerrar sesion
                    </button>
                </header>
                <main className="screen-content">{children}</main>
            </section>
        </div>
    );
}

export default AppLayout;
