import { useMemo, useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navByRole, roleLabels, screenTitlesByRole } from "../data/appNavigation";
import { useApp } from "../context/AppContext";

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
}

function AppLayout({ onLogout, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const { auth, theme, toggleTheme } = useApp();
    const userMenuRef = useRef(null);

    const getFirstName = (fullName) => {
        if (!fullName) return "Usuario";
        const parts = fullName.split(" ");
        if (parts[0] === "Dra." || parts[0] === "Dr.") {
            return parts.slice(0, 2).join(" ");
        }
        return parts[0];
    };
    const firstName = getFirstName(auth.fullName);

    const screenTitle = useMemo(
        () => (screenTitlesByRole[auth.role] ?? screenTitlesByRole.nutriologo)[location.pathname] ?? "NutriTrack",
        [location.pathname, auth.role]
    );
    const navItems = navByRole[auth.role] ?? [];
    const isNutri = auth.role === "nutriologo";

    const handleLogout = () => {
        setShowUserMenu(false);
        onLogout();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        if (showUserMenu) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showUserMenu]);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    const initials = auth.fullName
        ?.split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("") || "?";

    return (
        <div className={`app-shell ${auth.role === "usuario" ? "patient-role" : "nutritionist-role"}`}>
            {/* ── Sidebar ── */}
            <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
                {/* Brand */}
                <div className="brand">
                    <div className="brand-logo">
                        <i className="bi bi-heart-pulse-fill" />
                    </div>
                    <div>
                        <h1>NutriTrack</h1>
                        <p>{isNutri ? "Panel profesional" : "Mi salud"}</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="menu">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
                        >
                            <i className={`bi ${item.icon}`} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className={`sidebar-avatar ${isNutri ? "nutri" : "patient"}`}>
                            {initials}
                        </div>
                        <div className="sidebar-user-info">
                            <strong className="user-name">{auth.fullName || "NutriTrack"}</strong>
                            <span className="user-role">{roleLabels[auth.role] ?? "Usuario"}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="sidebar-logout-btn"
                        type="button"
                    >
                        <i className="bi bi-box-arrow-right" />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* Overlay móvil */}
            {isSidebarOpen && (
                <button
                    className="overlay"
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Panel principal ── */}
            <section className="main-panel">
                <header className="topbar">
                    <div className="topbar-left">
                        <button
                            type="button"
                            className="menu-toggle"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Abrir menú"
                        >
                            <i className="bi bi-list" />
                        </button>
                        <div className="page-info">
                            <h2>{screenTitle}</h2>
                            <p>
                                {getGreeting()}, <strong>{firstName}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        {/* Theme mode toggle button */}
                        <button
                            type="button"
                            className="theme-toggle-btn"
                            onClick={toggleTheme}
                            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                            aria-label="Alternar tema"
                            style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                border: "1px solid var(--line)",
                                background: "var(--surface)",
                                color: theme === "dark" ? "#f59e0b" : "var(--text)",
                                display: "grid",
                                placeItems: "center",
                                cursor: "pointer",
                                fontSize: "1.05rem",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <i className={`bi ${theme === "dark" ? "bi-sun-fill" : "bi-moon-stars-fill"}`} />
                        </button>

                        <div className="user-menu-wrapper" ref={userMenuRef}>
                            <button
                                className="user-menu-trigger"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                aria-label="Menú de usuario"
                                aria-expanded={showUserMenu}
                            >
                                <div className={`topbar-avatar ${isNutri ? "nutri" : "patient"}`}>
                                    {initials}
                                </div>
                                <span className="user-name-short">{firstName}</span>
                                <i className={`bi bi-chevron-${showUserMenu ? "up" : "down"}`} />
                            </button>

                            {showUserMenu && (
                                <div className="user-menu-dropdown" role="menu">
                                    <div className="user-menu-header">
                                        <div className={`topbar-avatar ${isNutri ? "nutri" : "patient"}`}>
                                            {initials}
                                        </div>
                                        <div className="user-details">
                                            <strong>{auth.fullName || "NutriTrack"}</strong>
                                            <p>{roleLabels[auth.role] ?? "Usuario"}</p>
                                        </div>
                                    </div>
                                    <div className="user-menu-actions">
                                        <NavLink
                                            to="/perfil"
                                            className="menu-dropdown-item"
                                            onClick={() => setShowUserMenu(false)}
                                            style={{ textDecoration: "none", color: "inherit" }}
                                            role="menuitem"
                                        >
                                            <i className="bi bi-person-gear" />
                                            {isNutri ? "Mi cuenta y consultorio" : "Mi perfil"}
                                        </NavLink>
                                        <div className="menu-divider" />
                                        <button
                                            className="menu-dropdown-item danger"
                                            onClick={handleLogout}
                                            role="menuitem"
                                        >
                                            <i className="bi bi-box-arrow-right" />
                                            Cerrar sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="screen-content">{children}</main>
            </section>

            {/* Bottom Nav — siempre visible en móvil (paciente + nutriólogo) */}
            <nav className="bottom-nav" aria-label="Navegación principal">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
                    >
                        <i className={`bi ${item.icon}`} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}

export default AppLayout;
