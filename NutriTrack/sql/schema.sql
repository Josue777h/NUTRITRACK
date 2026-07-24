-- Esquema SQL para NutriTrack
-- Puedes ejecutar este código en el editor SQL de tu panel de Supabase.

-- 1. Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('nutriologo', 'usuario')),
    full_name text,
    email text UNIQUE,
    phone text,
    specialty text,
    schedule text,
    registration text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Tabla de Pacientes (historias clínicas de los pacientes)
CREATE TABLE IF NOT EXISTS public.patients (
    id serial PRIMARY KEY,
    name text NOT NULL,
    age integer,
    weight numeric,
    height numeric,
    target text,
    notes text,
    email text UNIQUE,
    nutriologo_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL, -- Si el paciente tiene cuenta de autenticación
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Tabla de Citas
CREATE TABLE IF NOT EXISTS public.appointments (
    id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients (id) ON DELETE CASCADE,
    date date NOT NULL,
    time text NOT NULL,
    status text NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Confirmada', 'Cancelada', 'Completada')),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Tabla de Planes Alimenticios
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
    id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients (id) ON DELETE CASCADE,
    name text NOT NULL DEFAULT 'Plan Alimenticio',
    target text,
    calories integer DEFAULT 2000,
    duration integer DEFAULT 8, -- duración en semanas
    meals jsonb DEFAULT '{
        "desayuno": [],
        "mediaManana": [],
        "almuerzo": [],
        "merienda": [],
        "cena": [],
        "snack": []
    }'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Tabla de Consultas (registro de las sesiones clínicas)
CREATE TABLE IF NOT EXISTS public.consultas (
    id serial PRIMARY KEY,
    appointment_id integer REFERENCES public.appointments (id) ON DELETE CASCADE,
    patient_id integer REFERENCES public.patients (id) ON DELETE CASCADE,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 6. Tabla de Reportes (historial de progreso y mediciones del paciente)
CREATE TABLE IF NOT EXISTS public.reports (
    id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients (id) ON DELETE CASCADE,
    date date NOT NULL,
    weight numeric,
    bmi numeric,
    calories integer,
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar Row Level Security (RLS) opcionalmente.
-- Por ahora, mantendremos las tablas accesibles o puedes configurar políticas de acceso.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura sencillas (acceso público temporal para desarrollo rápido o autenticado)
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.patients FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.appointments FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.nutrition_plans FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.consultas FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.reports FOR ALL TO authenticated USING (true);
