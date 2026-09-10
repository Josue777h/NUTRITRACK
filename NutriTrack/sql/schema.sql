-- ==============================================================================
-- NUTRITRACK - ESQUEMA DE BASE DE DATOS UNIFICADO (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Este archivo es el ÚNICO archivo SQL necesario para inicializar o actualizar
-- completamente la base de datos de NutriTrack en el SQL Editor de Supabase.
-- Es totalmente idempotente (se puede ejecutar múltiples veces sin error).
-- ==============================================================================

-- 1. TABLA DE PERFILES DE USUARIO (Extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('nutriologo', 'usuario')),
    full_name text,
    email text UNIQUE,
    phone text,
    document_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Asegurar columnas limpias si la tabla ya existía
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_id text;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS specialty;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS schedule;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS registration;

-- 2. TABLA DE PACIENTES (Historias Clínicas)
CREATE TABLE IF NOT EXISTS public.patients (
    id serial PRIMARY KEY,
    clinical_code text,
    document_id text,
    name text NOT NULL,
    age integer CHECK (age IS NULL OR (age >= 0 AND age <= 130)),
    gender text CHECK (gender IN ('femenino', 'masculino', 'otro', 'no_especificado')),
    weight numeric CHECK (weight IS NULL OR (weight >= 1 AND weight <= 500)),
    height numeric CHECK (height IS NULL OR (height >= 30 AND height <= 300)),
    target text,
    phone text,
    email text,
    allergies jsonb NOT NULL DEFAULT '[]'::jsonb,
    conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
    notes text,
    nutriologo_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinical_code text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS document_id text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS conditions jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 3. TABLA DE CITAS
CREATE TABLE IF NOT EXISTS public.appointments (
    id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients (id) ON DELETE CASCADE,
    date date NOT NULL,
    time text NOT NULL,
    status text NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Confirmada', 'Cancelada', 'Completada')),
    type text NOT NULL DEFAULT 'consulta',
    duration integer NOT NULL DEFAULT 30 CHECK (duration BETWEEN 5 AND 480),
    reason text,
    notes text,
    archived_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'consulta';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS duration integer NOT NULL DEFAULT 30;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 4. TABLA DE PLANES ALIMENTICIOS
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
    id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients (id) ON DELETE CASCADE,
    name text NOT NULL DEFAULT 'Plan Alimenticio',
    target text,
    calories integer DEFAULT 2000,
    duration integer DEFAULT 8,
    meals jsonb DEFAULT '{
        "desayuno": [],
        "mediaManana": [],
        "almuerzo": [],
        "merienda": [],
        "cena": [],
        "snack": []
    }'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.nutrition_plans ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 5. ELIMINAR TABLA OBSOLETA DE CONSULTAS (Las consultas reales se gestionan en 'reports')
DROP TABLE IF EXISTS public.consultas CASCADE;

-- 6. TABLA DE REPORTES Y PROGRESO CLÍNICO
CREATE TABLE IF NOT EXISTS public.reports (
    id serial PRIMARY KEY,
    patient_id integer REFERENCES public.patients (id) ON DELETE CASCADE,
    date date NOT NULL,
    weight numeric CHECK (weight IS NULL OR (weight >= 1 AND weight <= 500)),
    bmi numeric CHECK (bmi IS NULL OR (bmi >= 5 AND bmi <= 120)),
    calories integer CHECK (calories IS NULL OR (calories >= 0 AND calories <= 20000)),
    type text NOT NULL DEFAULT 'progreso',
    notes text,
    feeling text,
    observations text,
    diagnosis text,
    recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
    next_steps text,
    conclusion text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'progreso';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS feeling text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS observations text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS diagnosis text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS recommendations jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS next_steps text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS conclusion text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 7. TABLA DE HÁBITOS DIARIOS DEL PACIENTE
CREATE TABLE IF NOT EXISTS public.daily_habits (
    id serial PRIMARY KEY,
    patient_id integer NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    water_glasses integer NOT NULL DEFAULT 0 CHECK (water_glasses >= 0 AND water_glasses <= 30),
    completed_meals jsonb NOT NULL DEFAULT '[]'::jsonb,
    mood text CHECK (mood IN ('excelente', 'bien', 'regular', 'cansado', 'antojos', null)),
    energy integer CHECK (energy IS NULL OR (energy >= 1 AND energy <= 5)),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT daily_habits_patient_date_key UNIQUE (patient_id, date)
);

-- 8. TABLA DE PLANTILLAS DE DIETAS
CREATE TABLE IF NOT EXISTS public.diet_templates (
    id serial PRIMARY KEY,
    nutriologo_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
    is_global boolean NOT NULL DEFAULT false,
    name text NOT NULL,
    description text,
    target text NOT NULL DEFAULT 'Control calórico',
    calories integer NOT NULL DEFAULT 2000,
    duration integer NOT NULL DEFAULT 4,
    macros jsonb NOT NULL DEFAULT '{"protein": 25, "carbs": 50, "fat": 25}'::jsonb,
    meals jsonb NOT NULL DEFAULT '{
        "desayuno": [],
        "mediaManana": [],
        "almuerzo": [],
        "merienda": [],
        "cena": [],
        "snack": []
    }'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 9. TABLA DE ALIMENTOS PERSONALIZADOS
CREATE TABLE IF NOT EXISTS public.custom_foods (
    id serial PRIMARY KEY,
    nutriologo_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
    name text NOT NULL,
    brand text,
    category text DEFAULT 'General',
    serving_size numeric NOT NULL DEFAULT 100 CHECK (serving_size > 0),
    serving_unit text NOT NULL DEFAULT 'g',
    calories numeric NOT NULL DEFAULT 0 CHECK (calories >= 0),
    protein numeric NOT NULL DEFAULT 0 CHECK (protein >= 0),
    carbs numeric NOT NULL DEFAULT 0 CHECK (carbs >= 0),
    fat numeric NOT NULL DEFAULT 0 CHECK (fat >= 0),
    fiber numeric DEFAULT 0 CHECK (fiber >= 0),
    sugar numeric DEFAULT 0 CHECK (sugar >= 0),
    is_favorite boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS patients_nutriologo_id_idx ON public.patients (nutriologo_id);
CREATE INDEX IF NOT EXISTS patients_user_id_idx ON public.patients (user_id);
CREATE INDEX IF NOT EXISTS patients_clinical_code_idx ON public.patients (clinical_code);
CREATE INDEX IF NOT EXISTS patients_document_id_idx ON public.patients (document_id);
CREATE INDEX IF NOT EXISTS appointments_patient_date_idx ON public.appointments (patient_id, date);
CREATE INDEX IF NOT EXISTS nutrition_plans_patient_created_idx ON public.nutrition_plans (patient_id, created_at desc);
CREATE INDEX IF NOT EXISTS reports_patient_date_idx ON public.reports (patient_id, date desc);
CREATE INDEX IF NOT EXISTS daily_habits_patient_date_idx ON public.daily_habits (patient_id, date desc);
CREATE INDEX IF NOT EXISTS diet_templates_nutriologo_id_idx ON public.diet_templates (nutriologo_id);
CREATE INDEX IF NOT EXISTS custom_foods_nutriologo_id_idx ON public.custom_foods (nutriologo_id);
CREATE INDEX IF NOT EXISTS custom_foods_is_favorite_idx ON public.custom_foods (nutriologo_id, is_favorite);

-- ==============================================================================
-- TRIGGERS DE ACTUALIZACIÓN DE TIMESTAMPS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS patients_set_updated_at ON public.patients;
DROP TRIGGER IF EXISTS appointments_set_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS nutrition_plans_set_updated_at ON public.nutrition_plans;
DROP TRIGGER IF EXISTS reports_set_updated_at ON public.reports;
DROP TRIGGER IF EXISTS daily_habits_set_updated_at ON public.daily_habits;
DROP TRIGGER IF EXISTS diet_templates_set_updated_at ON public.diet_templates;
DROP TRIGGER IF EXISTS custom_foods_set_updated_at ON public.custom_foods;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER patients_set_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER appointments_set_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER nutrition_plans_set_updated_at BEFORE UPDATE ON public.nutrition_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER reports_set_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER daily_habits_set_updated_at BEFORE UPDATE ON public.daily_habits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER diet_templates_set_updated_at BEFORE UPDATE ON public.diet_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER custom_foods_set_updated_at BEFORE UPDATE ON public.custom_foods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- TRIGGER DE CREACIÓN DE USUARIO (AUTH.USERS -> PROFILES & PACIENTE VINCULADO)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_nutriologo_id uuid;
  assigned_clinical_code text;
BEGIN
  -- Si no es nutriólogo, es un paciente/usuario
  IF (new.raw_user_meta_data ->> 'role') IS DISTINCT FROM 'nutriologo' THEN
    
    -- Extraer el ID del nutriólogo de los metadatos si vino con enlace de invitación
    IF (new.raw_user_meta_data ->> 'nutriologo_id') IS NOT NULL AND (new.raw_user_meta_data ->> 'nutriologo_id') <> '' THEN
      BEGIN
        ref_nutriologo_id := (new.raw_user_meta_data ->> 'nutriologo_id')::uuid;
      EXCEPTION WHEN OTHERS THEN
        ref_nutriologo_id := null;
      END;
    END IF;

    -- 1. Intentar vincular con una ficha existente por correo electrónico
    UPDATE public.patients
       SET user_id = new.id,
           nutriologo_id = COALESCE(patients.nutriologo_id, ref_nutriologo_id)
     WHERE user_id IS NULL
       AND lower(email) = lower(new.email);

    -- 2. Si no existía ficha creada por el nutriólogo, crear una nueva vinculada
    IF NOT FOUND THEN
      assigned_clinical_code := COALESCE(new.raw_user_meta_data ->> 'clinical_code', 'PAC-' || LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0'));
      INSERT INTO public.patients (
        name,
        email,
        user_id,
        nutriologo_id,
        clinical_code,
        document_id,
        target,
        notes
      ) VALUES (
        COALESCE(NULLIF(new.raw_user_meta_data ->> 'full_name', ''), new.email),
        new.email,
        new.id,
        ref_nutriologo_id,
        assigned_clinical_code,
        new.raw_user_meta_data ->> 'document_id',
        'Mantenimiento',
        'Ficha vinculada automáticamente desde invitación.'
      );
    END IF;
  END IF;

  -- Crear el perfil público
  INSERT INTO public.profiles (id, role, full_name, email, document_id)
  VALUES (
    new.id,
    CASE
      WHEN new.raw_user_meta_data ->> 'role' = 'nutriologo' THEN 'nutriologo'
      ELSE 'usuario'
    END,
    NULLIF(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'document_id'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      document_id = COALESCE(EXCLUDED.document_id, profiles.document_id);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- SEGURIDAD A NIVEL DE FILAS (RLS) Y FUNCIONES HELPER
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_patient(target_patient_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = target_patient_id
      AND (
        p.nutriologo_id = auth.uid()
        OR p.user_id = auth.uid()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_patient(target_patient_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = target_patient_id
      AND p.nutriologo_id = auth.uid()
  );
$$;

-- Políticas de Profiles
DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
DROP POLICY IF EXISTS profiles_self_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR true);
CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Políticas de Patients
DROP POLICY IF EXISTS patients_tenant_select ON public.patients;
DROP POLICY IF EXISTS patients_tenant_insert ON public.patients;
DROP POLICY IF EXISTS patients_tenant_update ON public.patients;
DROP POLICY IF EXISTS patients_tenant_delete ON public.patients;

CREATE POLICY patients_tenant_select ON public.patients FOR SELECT TO authenticated USING (
  nutriologo_id = auth.uid()
  OR user_id = auth.uid()
  OR (user_id IS NULL AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
);
CREATE POLICY patients_tenant_insert ON public.patients FOR INSERT TO authenticated WITH CHECK (
  nutriologo_id = auth.uid()
  OR (user_id = auth.uid() AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
);
CREATE POLICY patients_tenant_update ON public.patients FOR UPDATE TO authenticated USING (
  nutriologo_id = auth.uid()
  OR user_id = auth.uid()
  OR (user_id IS NULL AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
) WITH CHECK (
  nutriologo_id = auth.uid()
  OR (user_id = auth.uid() AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
);
CREATE POLICY patients_tenant_delete ON public.patients FOR DELETE TO authenticated USING (nutriologo_id = auth.uid());

-- Políticas para Appointments, Plans, Consultas, Reports
DROP POLICY IF EXISTS appointments_tenant_select ON public.appointments;
DROP POLICY IF EXISTS appointments_tenant_insert ON public.appointments;
DROP POLICY IF EXISTS appointments_tenant_update ON public.appointments;
DROP POLICY IF EXISTS appointments_tenant_delete ON public.appointments;
CREATE POLICY appointments_tenant_select ON public.appointments FOR SELECT TO authenticated USING (public.can_access_patient(patient_id));
CREATE POLICY appointments_tenant_insert ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.can_manage_patient(patient_id));
CREATE POLICY appointments_tenant_update ON public.appointments FOR UPDATE TO authenticated USING (public.can_manage_patient(patient_id)) WITH CHECK (public.can_manage_patient(patient_id));
CREATE POLICY appointments_tenant_delete ON public.appointments FOR DELETE TO authenticated USING (public.can_manage_patient(patient_id));

DROP POLICY IF EXISTS plans_tenant_select ON public.nutrition_plans;
DROP POLICY IF EXISTS plans_tenant_insert ON public.nutrition_plans;
DROP POLICY IF EXISTS plans_tenant_update ON public.nutrition_plans;
DROP POLICY IF EXISTS plans_tenant_delete ON public.nutrition_plans;
CREATE POLICY plans_tenant_select ON public.nutrition_plans FOR SELECT TO authenticated USING (public.can_access_patient(patient_id));
CREATE POLICY plans_tenant_insert ON public.nutrition_plans FOR INSERT TO authenticated WITH CHECK (public.can_manage_patient(patient_id));
CREATE POLICY plans_tenant_update ON public.nutrition_plans FOR UPDATE TO authenticated USING (public.can_manage_patient(patient_id)) WITH CHECK (public.can_manage_patient(patient_id));
CREATE POLICY plans_tenant_delete ON public.nutrition_plans FOR DELETE TO authenticated USING (public.can_manage_patient(patient_id));

DROP POLICY IF EXISTS reports_tenant_select ON public.reports;
DROP POLICY IF EXISTS reports_tenant_insert ON public.reports;
DROP POLICY IF EXISTS reports_tenant_update ON public.reports;
DROP POLICY IF EXISTS reports_tenant_delete ON public.reports;
CREATE POLICY reports_tenant_select ON public.reports FOR SELECT TO authenticated USING (public.can_access_patient(patient_id));
CREATE POLICY reports_tenant_insert ON public.reports FOR INSERT TO authenticated WITH CHECK (public.can_manage_patient(patient_id));
CREATE POLICY reports_tenant_update ON public.reports FOR UPDATE TO authenticated USING (public.can_manage_patient(patient_id)) WITH CHECK (public.can_manage_patient(patient_id));
CREATE POLICY reports_tenant_delete ON public.reports FOR DELETE TO authenticated USING (public.can_manage_patient(patient_id));

DROP POLICY IF EXISTS daily_habits_tenant_select ON public.daily_habits;
DROP POLICY IF EXISTS daily_habits_tenant_insert ON public.daily_habits;
DROP POLICY IF EXISTS daily_habits_tenant_update ON public.daily_habits;
DROP POLICY IF EXISTS daily_habits_tenant_delete ON public.daily_habits;
CREATE POLICY daily_habits_tenant_select ON public.daily_habits FOR SELECT TO authenticated USING (public.can_access_patient(patient_id));
CREATE POLICY daily_habits_tenant_insert ON public.daily_habits FOR INSERT TO authenticated WITH CHECK (public.can_access_patient(patient_id));
CREATE POLICY daily_habits_tenant_update ON public.daily_habits FOR UPDATE TO authenticated USING (public.can_access_patient(patient_id)) WITH CHECK (public.can_manage_patient(patient_id));
CREATE POLICY daily_habits_tenant_delete ON public.daily_habits FOR DELETE TO authenticated USING (public.can_manage_patient(patient_id));

DROP POLICY IF EXISTS diet_templates_select ON public.diet_templates;
DROP POLICY IF EXISTS diet_templates_insert ON public.diet_templates;
DROP POLICY IF EXISTS diet_templates_update ON public.diet_templates;
DROP POLICY IF EXISTS diet_templates_delete ON public.diet_templates;
CREATE POLICY diet_templates_select ON public.diet_templates FOR SELECT TO authenticated USING (is_global = true OR nutriologo_id = auth.uid());
CREATE POLICY diet_templates_insert ON public.diet_templates FOR INSERT TO authenticated WITH CHECK (nutriologo_id = auth.uid());
CREATE POLICY diet_templates_update ON public.diet_templates FOR UPDATE TO authenticated USING (nutriologo_id = auth.uid()) WITH CHECK (nutriologo_id = auth.uid());
CREATE POLICY diet_templates_delete ON public.diet_templates FOR DELETE TO authenticated USING (nutriologo_id = auth.uid());

DROP POLICY IF EXISTS custom_foods_select ON public.custom_foods;
DROP POLICY IF EXISTS custom_foods_insert ON public.custom_foods;
DROP POLICY IF EXISTS custom_foods_update ON public.custom_foods;
DROP POLICY IF EXISTS custom_foods_delete ON public.custom_foods;
CREATE POLICY custom_foods_select ON public.custom_foods FOR SELECT TO authenticated USING (nutriologo_id = auth.uid());
CREATE POLICY custom_foods_insert ON public.custom_foods FOR INSERT TO authenticated WITH CHECK (nutriologo_id = auth.uid());
CREATE POLICY custom_foods_update ON public.custom_foods FOR UPDATE TO authenticated USING (nutriologo_id = auth.uid()) WITH CHECK (nutriologo_id = auth.uid());
CREATE POLICY custom_foods_delete ON public.custom_foods FOR DELETE TO authenticated USING (nutriologo_id = auth.uid());
