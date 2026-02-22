import { useMemo, useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navByRole, roleLabels, screenTitles } from "../data/mockData";
import { useApp } from "../context/AppContext";

function AppLayout({ onLogout, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const { auth } = useApp();
    const userMenuRef = useRef(null);

    const screenTitle = useMemo(
        () => screenTitles[location.pathname] ?? "NutriTrack",
        [location.pathname]
    );
    const navItems = navByRole[auth.role] ?? [];

    const handleLogout = () => {
        setShowUserMenu(false);
        onLogout();
    };

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

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
                    <div className="user-info">
                        <div className="user-avatar">
                            <i className="bi bi-person-circle" />
                        </div>
                        <div className="user-details">
                            <p className="user-role">{roleLabels[auth.role] ?? "Sesion activa"}</p>
                            <strong className="user-name">{auth.fullName || "NutriTrack"}</strong>
                        </div>
                    </div>
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
                    <div className="topbar-left">
                        <button
                            type="button"
                            className="menu-toggle"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Abrir menu"
                        >
                            <i className="bi bi-list" />
                        </button>
                        <div className="page-info">
                            <h2>{screenTitle}</h2>
                            <p>Bienvenido de nuevo</p>
                        </div>
                    </div>
                    <div className="topbar-right">
                        <div className="user-menu-wrapper" ref={userMenuRef}>
                            <button
                                className="user-menu-trigger"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                aria-label="Menu de usuario"
                                aria-expanded={showUserMenu}
                            >
                                <div className="user-avatar small">
                                    <i className="bi bi-person-circle" />
                                </div>
                                <span className="user-name-short">{auth.fullName?.split(' ')[0] || "Usuario"}</span>
                                <i className="bi bi-chevron-down" />
                            </button>
                            {showUserMenu && (
                                <div className="user-menu-dropdown">
                                    <div className="user-menu-header">
                                        <div className="user-avatar">
                                            <i className="bi bi-person-circle" />
                                        </div>
                                        <div className="user-details">
                                            <strong>{auth.fullName || "NutriTrack"}</strong>
                                            <p>{roleLabels[auth.role] ?? "Usuario"}</p>
                                        </div>
                                    </div>
                                    <div className="user-menu-actions">
                                        <button className="menu-dropdown-item">
                                            <i className="bi bi-person" />
                                            Mi perfil
                                        </button>
                                        <button className="menu-dropdown-item">
                                            <i className="bi bi-gear" />
                                            Configuracion
                                        </button>
                                        <button className="menu-dropdown-item">
                                            <i className="bi bi-question-circle" />
                                            Ayuda
                                        </button>
                                        <div className="menu-divider" />
                                        <button className="menu-dropdown-item danger" onClick={handleLogout}>
                                            <i className="bi bi-box-arrow-right" />
                                            Cerrar sesion
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <main className="screen-content">{children}</main>
            </section>
        </div>
    );
}

export default AppLayout;
