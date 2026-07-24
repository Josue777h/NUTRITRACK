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
        { key: "profile", label: "Perfil", icon: "bi-person-circle", path: "/perfil" },
        { key: "configuracion", label: "Configuración", icon: "bi-gear-fill", path: "/configuracion" }
    ],
    usuario: [
        { key: "dashboard",    label: "Inicio",     icon: "bi-house-heart-fill",     path: "/dashboard" },
        { key: "appointments", label: "Mis Citas",  icon: "bi-calendar3-event-fill", path: "/citas" },
        { key: "plans",        label: "Mi Plan",    icon: "bi-apple",                path: "/planes" },
        { key: "reports",      label: "Mi Progreso",icon: "bi-graph-up-arrow",       path: "/reportes" },
        { key: "profile",      label: "Mi Perfil",  icon: "bi-person-circle",        path: "/perfil" }
    ]
};

export const screenTitlesByRole = {
    nutriologo: {
        "/dashboard":    "Panel principal",
        "/pacientes":    "Mis pacientes",
        "/citas":        "Agenda de citas",
        "/planes":       "Planes alimenticios",
        "/reportes":     "Reportes clínicos",
        "/perfil":       "Mi perfil",
        "/configuracion":"Configuración"
    },
    usuario: {
        "/dashboard":    "Mi panel",
        "/citas":        "Mis citas",
        "/planes":       "Mi plan alimenticio",
        "/reportes":     "Mi progreso",
        "/perfil":       "Mi perfil",
        "/configuracion":"Configuración"
    }
};

/** @deprecated Use screenTitlesByRole */
export const screenTitles = screenTitlesByRole.nutriologo;

export const seedPatients = [
    {
        id: 1,
        name: "Ana Mendoza",
        age: 32,
        weight: 68,
        height: 164,
        target: "Reducir IMC",
        notes: "Evitar lactosa y mantener plan hipocalorico.",
        email: "ana.mendoza@email.com"
    },
    {
        id: 2,
        name: "Carlos Ruiz",
        age: 41,
        weight: 83,
        height: 176,
        target: "Control calorico",
        notes: "Aumentar hidratacion y fibra.",
        email: "josuexdsepulveda@gmail.com"
    },
    {
        id: 3,
        name: "Sofia Ramos",
        age: 27,
        weight: 59,
        height: 165,
        target: "Plan deportivo",
        notes: "Distribuir proteina durante el dia.",
        email: "sofia.ramos@email.com"
    },
    {
        id: 4,
        name: "Luis Herrera",
        age: 35,
        weight: 76,
        height: 171,
        target: "Masa muscular",
        notes: "Incrementar superavit calorico controlado.",
        email: "luis.herrera@email.com"
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
        name: "Plan Hipocalórico y Proteico",
        target: "Reducir IMC",
        calories: 1800,
        duration: 12,
        meals: {
            desayuno: [
                { name: "Licuado de avena con proteína en polvo", qty: "1", unit: "taza", calories: 250, notes: "Con agua" },
                { name: "Plátano mediano", qty: "1", unit: "pieza", calories: 105, notes: "Fresco" },
                { name: "Almendras", qty: "10", unit: "piezas", calories: 70, notes: "Naturales" }
            ],
            mediaManana: [
                { name: "Manzana verde", qty: "1", unit: "pieza", calories: 80, notes: "Con cáscara" },
                { name: "Té verde", qty: "1", unit: "taza", calories: 2, notes: "Sin azúcar" }
            ],
            almuerzo: [
                { name: "Pechuga de pollo a la plancha", qty: "200", unit: "g", calories: 330, notes: "Condimentar con finas hierbas" },
                { name: "Quinoa cocida", qty: "1", unit: "taza", calories: 220, notes: "Hervida" },
                { name: "Ensalada verde con espinacas y aguacate", qty: "1", unit: "porción", calories: 120, notes: "Limón y sal" }
            ],
            merienda: [
                { name: "Yogurt griego natural sin azúcar", qty: "1", unit: "vaso", calories: 130, notes: "Frio" },
                { name: "Frutos rojos", qty: "0.5", unit: "taza", calories: 40, notes: "Fresas y arándanos" }
            ],
            cena: [
                { name: "Filete de pescado al horno", qty: "150", unit: "g", calories: 200, notes: "Ajo y cebolla" },
                { name: "Brócoli y zanahorias al vapor", qty: "1.5", unit: "tazas", calories: 90, notes: "Poco cocido" }
            ],
            snack: [
                { name: "Infusión de manzanilla", qty: "1", unit: "taza", calories: 0, notes: "Antes de dormir" }
            ]
        }
    },
    {
        id: 2,
        patientId: 2,
        name: "Plan Control Calórico",
        target: "Control calórico",
        calories: 2200,
        duration: 8,
        meals: {
            desayuno: [
                { name: "Huevo revuelto con espinacas", qty: "2", unit: "piezas", calories: 180, notes: "Aceite de oliva en spray" },
                { name: "Pan integral tostado", qty: "2", unit: "rebanadas", calories: 140, notes: "Sin mantequilla" }
            ],
            mediaManana: [
                { name: "Papaya picada", qty: "1", unit: "taza", calories: 60, notes: "Fresca" }
            ],
            almuerzo: [
                { name: "Pescado a la plancha", qty: "180", unit: "g", calories: 240, notes: "Sazonado al gusto" },
                { name: "Arroz integral", qty: "1", unit: "taza", calories: 216, notes: "Cocido" },
                { name: "Ensalada mixta", qty: "1", unit: "porción", calories: 85, notes: "Con pepino y tomate" }
            ],
            merienda: [
                { name: "Gelatina sin azúcar", qty: "1", unit: "porción", calories: 10, notes: "Cualquier sabor" },
                { name: "Nueces", qty: "1", unit: "puñado", calories: 95, notes: "Picadas" }
            ],
            cena: [
                { name: "Sopa de verduras casera", qty: "1.5", unit: "tazas", calories: 110, notes: "Baja en sodio" },
                { name: "Pechuga de pavo", qty: "100", unit: "g", calories: 120, notes: "En rebanadas finas" }
            ],
            snack: [
                { name: "Leche de almendras", qty: "1", unit: "vaso", calories: 45, notes: "Sin endulzar" }
            ]
        }
    },
    {
        id: 3,
        patientId: 3,
        name: "Plan Rendimiento Deportivo",
        target: "Plan deportivo",
        calories: 2800,
        duration: 16,
        meals: {
            desayuno: [
                { name: "Batido con avena, plátano, crema de maní y leche descremada", qty: "1", unit: "porción", calories: 550, notes: "Licuar bien" },
                { name: "Claras de huevo", qty: "3", unit: "piezas", calories: 50, notes: "A la plancha" }
            ],
            mediaManana: [
                { name: "Sándwich de pavo con queso panela", qty: "1", unit: "pieza", calories: 310, notes: "Pan integral" }
            ],
            almuerzo: [
                { name: "Bife de carne magra", qty: "200", unit: "g", calories: 410, notes: "A término medio" },
                { name: "Pasta integral con salsa de tomate natural", qty: "1.5", unit: "tazas", calories: 350, notes: "Salsa casera" },
                { name: "Ensalada colorida", qty: "1", unit: "porción", calories: 95, notes: "Con zanahoria, betabel y espinaca" }
            ],
            merienda: [
                { name: "Yogurt con granola y chia", qty: "1", unit: "taza", calories: 290, notes: "Mezclar" }
            ],
            cena: [
                { name: "Salmón a la plancha", qty: "180", unit: "g", calories: 360, notes: "Al limón" },
                { name: "Puré de camote (batata)", qty: "1", unit: "taza", calories: 180, notes: "Sin mantequilla" },
                { name: "Espárragos asados", qty: "1", unit: "taza", calories: 45, notes: "Pizca de sal" }
            ],
            snack: [
                { name: "Licuado de proteína post-entreno", qty: "1", unit: "taza", calories: 210, notes: "Con agua fría" }
            ]
        }
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
        email: "josuesepulvedassj@gmail.com",
        phone: "+57 315 000 0000",
        specialty: "Nutricion deportiva",
        schedule: "Lunes a viernes 08:00 - 17:00",
        registration: "COL-NT 4082"
    },
    usuario: {
        fullName: "Paciente NutriTrack",
        email: "josuexdsepulveda@gmail.com",
        phone: "+57 300 000 0000",
        specialty: "Plan personalizado",
        schedule: "Controles quincenales",
        registration: "Paciente activo"
    }
};
