export const PRESET_DIET_TEMPLATES = [
    {
        id: "tpl-deficit-1500",
        name: "Déficit Calórico & Pérdida de Grasa (1,500 kcal)",
        description: "Plan estructurado con alta densidad nutricional y saciedad para reducción progresiva de grasa corporal.",
        target: "Reducir IMC",
        calories: 1500,
        duration: 8,
        macros: { protein: 30, carbs: 40, fat: 30 },
        meals: {
            desayuno: [
                { time: "08:00", name: "Tortilla de 3 claras y 1 huevo entero con espinacas", qty: "1", unit: "plato", calories: 220, notes: "Cocinar con 1 cdta de aceite de oliva" },
                { time: "08:00", name: "Avena cocida en agua con canela y frutos rojos", qty: "40", unit: "g", calories: 160, notes: "Endulzar con stevia si se desea" },
                { time: "08:00", name: "Café negro o té verde", qty: "1", unit: "taza", calories: 5, notes: "Sin azúcar" }
            ],
            mediaManana: [
                { time: "11:00", name: "Manzana verde en rodajas con mantequilla de maní natural", qty: "1", unit: "unidad", calories: 150, notes: "1 cda (15g) de mantequilla de maní" }
            ],
            almuerzo: [
                { time: "14:00", name: "Pechuga de pollo a la plancha con finas hierbas", qty: "150", unit: "g", calories: 240, notes: "Pesar en crudo" },
                { time: "14:00", name: "Arroz integral o quinoa cocida", qty: "80", unit: "g", calories: 110, notes: "Aprox 1/2 taza" },
                { time: "14:00", name: "Ensalada mixta (lechuga, tomate cherry, pepino) con limón y 1 cdta de aceite de oliva", qty: "1", unit: "bol grande", calories: 90, notes: "Abundante agua" }
            ],
            merienda: [
                { time: "17:00", name: "Yogur griego natural 0% grasa con nueces picadas", qty: "150", unit: "g", calories: 160, notes: "10g de nueces" }
            ],
            cena: [
                { time: "20:00", name: "Filete de pescado blanco (merluza o tilapia) al horno", qty: "180", unit: "g", calories: 210, notes: "Con ajo y perejil" },
                { time: "20:00", name: "Verduras salteadas al vapor (brócoli, calabacín, zanahoria)", qty: "200", unit: "g", calories: 95, notes: "Sin grasas añadidas" }
            ],
            snack: [
                { time: "22:00", name: "Infusión relajante de manzanilla o lavanda", qty: "1", unit: "taza", calories: 0, notes: "Para favorecer el descanso" }
            ]
        }
    },
    {
        id: "tpl-balanced-2000",
        name: "Mantenimiento & Balance Metabólico (2,000 kcal)",
        description: "Equilibrio ideal de macronutrientes para mantenimiento de peso, energía sostenida y salud cardiovascular.",
        target: "Control calórico",
        calories: 2000,
        duration: 8,
        macros: { protein: 25, carbs: 50, fat: 25 },
        meals: {
            desayuno: [
                { time: "08:00", name: "Tostadas integrales con aguacate y huevo pochado", qty: "2", unit: "rebanadas", calories: 340, notes: "1/2 aguacate mediano" },
                { time: "08:00", name: "Jugo verde de espinaca, pepino, manzana verde y jengibre", qty: "1", unit: "vaso grande", calories: 85, notes: "Sin colar" }
            ],
            mediaManana: [
                { time: "11:00", name: "Mix de frutos secos (almendras, nueces, arándanos)", qty: "30", unit: "g", calories: 170, notes: "Sin sal añadida" },
                { time: "11:00", name: "Plátano mediano", qty: "1", unit: "unidad", calories: 105, notes: "Energía rápida" }
            ],
            almuerzo: [
                { time: "14:00", name: "Salmón a la plancha con limón y romero", qty: "160", unit: "g", calories: 330, notes: "Rico en Omega-3" },
                { time: "14:00", name: "Batata o camote asado en cubos", qty: "150", unit: "g", calories: 135, notes: "Carbohidrato complejo" },
                { time: "14:00", name: "Ensalada verde con espárragos y aderezo de vinagreta balsámica", qty: "1", unit: "plato", calories: 80, notes: "" }
            ],
            merienda: [
                { time: "17:00", name: "Batido de proteína o yogur con avena y semillas de chía", qty: "1", unit: "vaso", calories: 260, notes: "1 cda de chía" }
            ],
            cena: [
                { time: "20:00", name: "Pechuga de pavo o pollo a la parrilla", qty: "150", unit: "g", calories: 230, notes: "Sazonar al gusto" },
                { time: "20:00", name: "Crema casera de calabaza y zanahoria", qty: "1", unit: "tazón", calories: 130, notes: "Sin nata" },
                { time: "20:00", name: "Ensalada de hojas verdes y aceite de oliva virgen extra", qty: "1", unit: "plato", calories: 75, notes: "" }
            ],
            snack: [
                { time: "22:00", name: "Chocolate negro 85% cacao", qty: "2", unit: "onzas (20g)", calories: 65, notes: "Antioxidante" }
            ]
        }
    },
    {
        id: "tpl-hypertrophy-2600",
        name: "Hipertrofia & Rendimiento Deportivo (2,600 kcal)",
        description: "Alto aporte proteico y de carbohidratos complejos para ganancia de masa muscular magra y recuperación atlética.",
        target: "Masa muscular",
        calories: 2600,
        duration: 12,
        macros: { protein: 30, carbs: 50, fat: 20 },
        meals: {
            desayuno: [
                { time: "07:30", name: "Omelette de 4 huevos (2 enteros + 2 claras) con pavo y queso bajo en grasa", qty: "1", unit: "plato", calories: 380, notes: "Alto en leucina" },
                { time: "07:30", name: "Avena con leche deslactosada/almendra, plátano y miel", qty: "80", unit: "g", calories: 350, notes: "Carbohidratos para el entrenamiento" },
                { time: "07:30", name: "Zumo natural de naranja", qty: "1", unit: "vaso", calories: 110, notes: "" }
            ],
            mediaManana: [
                { time: "10:30", name: "Sándwich de pan integral con atún al agua, tomate y hojas verdes", qty: "2", unit: "rebanadas", calories: 280, notes: "1 lata de atún" },
                { time: "10:30", name: "Fruta fresca (kiwi o manzana)", qty: "1", unit: "unidad", calories: 70, notes: "" }
            ],
            almuerzo: [
                { time: "13:30", name: "Ternera magra o pechuga de pollo a la plancha", qty: "200", unit: "g", calories: 360, notes: "Rico en hierro y creatina natural" },
                { time: "13:30", name: "Arroz blanco o pasta integral cocida", qty: "200", unit: "g", calories: 260, notes: "Aprox 1.5 tazas" },
                { time: "13:30", name: "Verduras asadas y 1 cucharada de aceite de oliva", qty: "1", unit: "plato", calories: 140, notes: "" }
            ],
            merienda: [
                { time: "17:00", name: "Batido post-entrenamiento (Proteína Whey + Plátano + Crema de cacahuete)", qty: "1", unit: "shaker", calories: 360, notes: "Tomar dentro de las 2h post-entreno" }
            ],
            cena: [
                { time: "20:30", name: "Pechuga de pollo o lomo de atún a la plancha", qty: "180", unit: "g", calories: 280, notes: "Proteína de lenta digestión" },
                { time: "20:30", name: "Patata cocida o puré de patata natural", qty: "150", unit: "g", calories: 130, notes: "Recarga de glucógeno" },
                { time: "20:30", name: "Ensalada multicolor con aceite de oliva", qty: "1", unit: "plato", calories: 90, notes: "" }
            ],
            snack: [
                { time: "22:30", name: "Queso cottage o quark con un puñado de almendras", qty: "100", unit: "g", calories: 130, notes: "Caseína nocturna" }
            ]
        }
    },
    {
        id: "tpl-keto-1800",
        name: "Cetogénico / Low Carb Estricto (1,800 kcal)",
        description: "Enfoque bajo en carbohidratos y alto en grasas saludables para activar cetosis y control glucémico.",
        target: "Reducir IMC",
        calories: 1800,
        duration: 6,
        macros: { protein: 25, carbs: 5, fat: 70 },
        meals: {
            desayuno: [
                { time: "08:30", name: "Huevos revueltos con mantequilla ghee, bacon crujiente y aguacate entero", qty: "1", unit: "plato", calories: 480, notes: "Grasas saludables densas" },
                { time: "08:30", name: "Café bulletproof con aceite MCT o aceite de coco", qty: "1", unit: "taza", calories: 110, notes: "Sin endulzantes con carbohidratos" }
            ],
            mediaManana: [
                { time: "11:30", name: "Nueces de macadamia o pecanas y aceitunas verdes", qty: "30", unit: "g", calories: 210, notes: "Muy bajo en carbs netos" }
            ],
            almuerzo: [
                { time: "14:00", name: "Muslos de pollo con piel al horno con hierbas", qty: "200", unit: "g", calories: 420, notes: "Rico en grasas buenas y colágeno" },
                { time: "14:00", name: "Ensalada de espinacas baby con queso parmesano, nueces y aceite de oliva virgen extra", qty: "1", unit: "bol", calories: 200, notes: "" }
            ],
            merienda: [
                { time: "17:30", name: "Bastones de apio y pepino con guacamole casero", qty: "1", unit: "ración", calories: 130, notes: "" }
            ],
            cena: [
                { time: "20:30", name: "Salmón al horno con costra de semillas de sésamo", qty: "180", unit: "g", calories: 370, notes: "Rico en EPA/DHA" },
                { time: "20:30", name: "Espárragos trigueros a la plancha con mantequilla", qty: "150", unit: "g", calories: 95, notes: "" }
            ],
            snack: [
                { time: "22:00", name: "Té de jengibre y menta", qty: "1", unit: "taza", calories: 0, notes: "Digestivo" }
            ]
        }
    }
];
