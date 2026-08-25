export const roleLabels = {
    nutriologo: "Nutriólogo",
    usuario: "Paciente"
};

export const navByRole = {
    nutriologo: [
        { key: "dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill", path: "/dashboard" },
        { key: "patients", label: "Pacientes", icon: "bi-people-fill", path: "/pacientes" },
        { key: "appointments", label: "Agenda", icon: "bi-calendar3-event-fill", path: "/citas" },
        { key: "plans", label: "Planes", icon: "bi-apple", path: "/planes" },
        { key: "reports", label: "Reportes", icon: "bi-bar-chart-line-fill", path: "/reportes" },
        { key: "profile", label: "Mi Cuenta", icon: "bi-person-circle", path: "/perfil" }
    ],
    usuario: [
        { key: "dashboard", label: "Inicio", icon: "bi-house-heart-fill", path: "/dashboard" },
        { key: "appointments", label: "Mis Citas", icon: "bi-calendar3-event-fill", path: "/citas" },
        { key: "plans", label: "Mi Plan", icon: "bi-apple", path: "/planes" },
        { key: "reports", label: "Mi Progreso", icon: "bi-graph-up-arrow", path: "/reportes" },
        { key: "profile", label: "Mi Perfil", icon: "bi-person-circle", path: "/perfil" }
    ]
};

export const screenTitlesByRole = {
    nutriologo: {
        "/dashboard": "Panel principal",
        "/pacientes": "Directorio de pacientes",
        "/citas": "Agenda de citas",
        "/planes": "Planes alimenticios",
        "/reportes": "Reportes clínicos",
        "/perfil": "Mi cuenta y consultorio",
        "/configuracion": "Mi cuenta y consultorio"
    },
    usuario: {
        "/dashboard": "Mi portal de salud",
        "/citas": "Mis citas nutricionales",
        "/planes": "Mi plan alimenticio",
        "/reportes": "Mi evolución y progreso",
        "/perfil": "Mi perfil",
        "/configuracion": "Mi perfil"
    }
};
