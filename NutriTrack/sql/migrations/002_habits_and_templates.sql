-- NutriTrack: Migración 002 - Seguimiento de Hábitos Diarios y Plantillas de Dietas
-- Ejecutar en el SQL Editor de Supabase después de 001_secure_tenant_data.sql

begin;

-- 1. Tabla de Hábitos Diarios del Paciente (Hidratación, Checklist de comidas, Estado anímico)
CREATE TABLE IF NOT EXISTS public.daily_habits (
    id serial PRIMARY KEY,
    patient_id integer NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    water_glasses integer NOT NULL DEFAULT 0 CHECK (water_glasses >= 0 AND water_glasses <= 30),
    completed_meals jsonb NOT NULL DEFAULT '[]'::jsonb,
    mood text CHECK (mood in ('excelente', 'bien', 'regular', 'cansado', 'antojos', null)),
    energy integer CHECK (energy is null or energy between 1 and 5),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT daily_habits_patient_date_key UNIQUE (patient_id, date)
);

-- 2. Tabla de Plantillas de Dietas Reutilizables (Para uso de los Nutriólogos)
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
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS daily_habits_patient_date_idx ON public.daily_habits (patient_id, date desc);
CREATE INDEX IF NOT EXISTS diet_templates_nutriologo_id_idx ON public.diet_templates (nutriologo_id);

-- Triggers de actualización de timestamps
DROP TRIGGER IF EXISTS daily_habits_set_updated_at ON public.daily_habits;
DROP TRIGGER IF EXISTS diet_templates_set_updated_at ON public.diet_templates;
CREATE TRIGGER daily_habits_set_updated_at BEFORE UPDATE ON public.daily_habits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER diet_templates_set_updated_at BEFORE UPDATE ON public.diet_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Habilitar RLS
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para Hábitos Diarios
DROP POLICY IF EXISTS daily_habits_tenant_select ON public.daily_habits;
DROP POLICY IF EXISTS daily_habits_tenant_insert ON public.daily_habits;
DROP POLICY IF EXISTS daily_habits_tenant_update ON public.daily_habits;
DROP POLICY IF EXISTS daily_habits_tenant_delete ON public.daily_habits;

CREATE POLICY daily_habits_tenant_select ON public.daily_habits FOR SELECT TO authenticated
USING (public.can_access_patient(patient_id));

CREATE POLICY daily_habits_tenant_insert ON public.daily_habits FOR INSERT TO authenticated
WITH CHECK (public.can_access_patient(patient_id));

CREATE POLICY daily_habits_tenant_update ON public.daily_habits FOR UPDATE TO authenticated
USING (public.can_access_patient(patient_id))
WITH CHECK (public.can_access_patient(patient_id));

CREATE POLICY daily_habits_tenant_delete ON public.daily_habits FOR DELETE TO authenticated
USING (public.can_manage_patient(patient_id));

-- Políticas de Seguridad para Plantillas de Dietas
DROP POLICY IF EXISTS diet_templates_select ON public.diet_templates;
DROP POLICY IF EXISTS diet_templates_insert ON public.diet_templates;
DROP POLICY IF EXISTS diet_templates_update ON public.diet_templates;
DROP POLICY IF EXISTS diet_templates_delete ON public.diet_templates;

CREATE POLICY diet_templates_select ON public.diet_templates FOR SELECT TO authenticated
USING (is_global = true OR nutriologo_id = auth.uid());

CREATE POLICY diet_templates_insert ON public.diet_templates FOR INSERT TO authenticated
WITH CHECK (nutriologo_id = auth.uid());

CREATE POLICY diet_templates_update ON public.diet_templates FOR UPDATE TO authenticated
USING (nutriologo_id = auth.uid())
WITH CHECK (nutriologo_id = auth.uid());

CREATE POLICY diet_templates_delete ON public.diet_templates FOR DELETE TO authenticated
USING (nutriologo_id = auth.uid());

commit;
