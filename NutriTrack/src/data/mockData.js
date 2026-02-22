export const roleLabels = {
    nutriologo: "Nutriologo",
    usuario: "Usuario"
};

export const navByRole = {
    nutriologo: [
        { key: "dashboard", label: "Dashboard", icon: "bi-speedometer2", path: "/dashboard" },
        { key: "patients", label: "Pacientes", icon: "bi-people", path: "/pacientes" },
        { key: "appointments", label: "Citas", icon: "bi-calendar3", path: "/citas" },
        { key: "plans", label: "Planes", icon: "bi-apple", path: "/planes" },
        { key: "reports", label: "Reportes", icon: "bi-bar-chart-line", path: "/reportes" },
        { key: "profile", label: "Perfil", icon: "bi-person-circle", path: "/perfil" }
    ],
    usuario: [
        { key: "dashboard", label: "Mi Panel", icon: "bi-speedometer2", path: "/dashboard" },
        { key: "appointments", label: "Mis Citas", icon: "bi-calendar3", path: "/citas" },
        { key: "plans", label: "Mi Plan", icon: "bi-apple", path: "/planes" },
        { key: "reports", label: "Seguimiento", icon: "bi-bar-chart-line", path: "/reportes" },
        { key: "profile", label: "Mi Perfil", icon: "bi-person-circle", path: "/perfil" }
    ]
};

export const screenTitles = {
    "/dashboard": "Panel principal",
    "/pacientes": "Gestion de pacientes",
    "/citas": "Control de citas",
    "/planes": "Planes alimenticios",
    "/reportes": "Reportes y seguimiento",
    "/perfil": "Perfil y configuracion"
};

export const seedPatients = [
    {
        id: 1,
        name: "Ana Mendoza",
        age: 32,
        weight: 68,
        height: 164,
        target: "Reducir IMC",
        notes: "Evitar lactosa y mantener plan hipocalorico."
    },
    {
        id: 2,
        name: "Carlos Ruiz",
        age: 41,
        weight: 83,
        height: 176,
        target: "Control calorico",
        notes: "Aumentar hidratacion y fibra."
    },
    {
        id: 3,
        name: "Sofia Ramos",
        age: 27,
        weight: 59,
        height: 165,
        target: "Plan deportivo",
        notes: "Distribuir proteina durante el dia."
    },
    {
        id: 4,
        name: "Luis Herrera",
        age: 35,
        weight: 76,
        height: 171,
        target: "Masa muscular",
        notes: "Incrementar superavit calorico controlado."
    }
];

export const seedAppointments = [
    {
        id: 1,
        patientId: 1,
        date: "2026-02-23",
        time: "08:00",
        status: "Confirmada",
        notes: "Revisar adherencia semanal"
    },
    {
        id: 2,
        patientId: 2,
        date: "2026-02-23",
        time: "11:00",
        status: "Pendiente",
        notes: "Control de composicion corporal"
    },
    {
        id: 3,
        patientId: 3,
        date: "2026-02-24",
        time: "09:30",
        status: "Confirmada",
        notes: "Ajuste plan deportivo"
    },
    {
        id: 4,
        patientId: 4,
        date: "2026-02-25",
        time: "14:00",
        status: "Confirmada",
        notes: "Seguimiento masa muscular"
    }
];

export const seedPlans = [
    {
        id: 1,
        patientId: 1,
        day: "Lunes",
        breakfast: "Avena con frutas y chia",
        lunch: "Pollo a la plancha con quinoa",
        dinner: "Crema de verduras y pavo",
        snack: "Yogurt natural con nueces"
    },
    {
        id: 2,
        patientId: 2,
        day: "Martes",
        breakfast: "Tostadas integrales con huevo",
        lunch: "Pescado al horno con ensalada",
        dinner: "Sopa de lentejas",
        snack: "Banano y almendras"
    },
    {
        id: 3,
        patientId: 3,
        day: "Miercoles",
        breakfast: "Smoothie verde con proteina",
        lunch: "Arroz integral y carne magra",
        dinner: "Ensalada mediterranea",
        snack: "Fruta picada"
    }
];

export const seedReports = [
    { id: 1, patientId: 2, date: "2025-09-01", weight: 83, bmi: 29, calories: 2350 },
    { id: 2, patientId: 2, date: "2025-10-01", weight: 81, bmi: 28, calories: 2210 },
    { id: 3, patientId: 2, date: "2025-11-01", weight: 80, bmi: 27, calories: 2160 },
    { id: 4, patientId: 2, date: "2025-12-01", weight: 78, bmi: 26.6, calories: 2050 },
    { id: 5, patientId: 2, date: "2026-01-01", weight: 77, bmi: 26.2, calories: 1980 },
    { id: 6, patientId: 2, date: "2026-02-01", weight: 76, bmi: 25.9, calories: 1920 },
    { id: 7, patientId: 1, date: "2025-09-01", weight: 72, bmi: 26.7, calories: 2100 },
    { id: 8, patientId: 1, date: "2025-10-01", weight: 71, bmi: 26.4, calories: 2050 },
    { id: 9, patientId: 1, date: "2025-11-01", weight: 70, bmi: 26, calories: 2000 },
    { id: 10, patientId: 1, date: "2025-12-01", weight: 69, bmi: 25.6, calories: 1950 },
    { id: 11, patientId: 1, date: "2026-01-01", weight: 68.6, bmi: 25.3, calories: 1920 },
    { id: 12, patientId: 1, date: "2026-02-01", weight: 68, bmi: 25, calories: 1880 }
];

export const seedProfiles = {
    nutriologo: {
        fullName: "Dra. Maria Torres",
        email: "maria.torres@nutritrack.com",
        phone: "+57 315 000 0000",
        specialty: "Nutricion deportiva",
        schedule: "Lunes a viernes 08:00 - 17:00",
        registration: "COL-NT 4082"
    },
    usuario: {
        fullName: "Paciente NutriTrack",
        email: "usuario@nutritrack.com",
        phone: "+57 300 000 0000",
        specialty: "Plan personalizado",
        schedule: "Controles quincenales",
        registration: "Paciente activo"
    }
};
