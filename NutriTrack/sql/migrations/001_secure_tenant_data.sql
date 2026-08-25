-- NutriTrack: schema alignment, tenant isolation, and integrity controls.
-- Apply this migration in the Supabase SQL editor before enabling production traffic.
-- It is written to be safe to run once on top of sql/schema.sql.

begin;

-- Fields already used by the application but missing from the original schema.
alter table public.patients
    add column if not exists phone text,
    add column if not exists gender text check (gender in ('femenino', 'masculino', 'otro', 'no_especificado')),
    add column if not exists allergies jsonb not null default '[]'::jsonb,
    add column if not exists conditions jsonb not null default '[]'::jsonb,
    add column if not exists updated_at timestamptz not null default now();

alter table public.appointments
    add column if not exists type text not null default 'consulta',
    add column if not exists duration integer not null default 30 check (duration between 5 and 480),
    add column if not exists reason text,
    add column if not exists archived_at timestamptz,
    add column if not exists updated_at timestamptz not null default now();

alter table public.nutrition_plans
    add column if not exists updated_at timestamptz not null default now();

alter table public.consultas
    add column if not exists updated_at timestamptz not null default now();

alter table public.reports
    add column if not exists type text not null default 'progreso',
    add column if not exists notes text,
    add column if not exists feeling text,
    add column if not exists observations text,
    add column if not exists diagnosis text,
    add column if not exists recommendations jsonb not null default '[]'::jsonb,
    add column if not exists next_steps text,
    add column if not exists conclusion text,
    add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
    add column if not exists updated_at timestamptz not null default now();

-- Domain checks prevent impossible clinical values from entering the database.
alter table public.patients
    add constraint patients_age_range check (age is null or age between 0 and 130) not valid,
    add constraint patients_weight_range check (weight is null or weight between 1 and 500) not valid,
    add constraint patients_height_range check (height is null or height between 30 and 300) not valid;

alter table public.reports
    add constraint reports_weight_range check (weight is null or weight between 1 and 500) not valid,
    add constraint reports_bmi_range check (bmi is null or bmi between 5 and 120) not valid,
    add constraint reports_calories_range check (calories is null or calories between 0 and 20000) not valid;

-- Query paths used by the application.
create index if not exists patients_nutriologo_id_idx on public.patients (nutriologo_id);
create index if not exists patients_user_id_idx on public.patients (user_id);
create index if not exists appointments_patient_date_idx on public.appointments (patient_id, date);
create index if not exists nutrition_plans_patient_created_idx on public.nutrition_plans (patient_id, created_at desc);
create index if not exists consultas_patient_created_idx on public.consultas (patient_id, created_at desc);
create index if not exists reports_patient_date_idx on public.reports (patient_id, date desc);

-- Keep modified timestamps reliable without relying on browser code.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists patients_set_updated_at on public.patients;
drop trigger if exists appointments_set_updated_at on public.appointments;
drop trigger if exists nutrition_plans_set_updated_at on public.nutrition_plans;
drop trigger if exists consultas_set_updated_at on public.consultas;
drop trigger if exists reports_set_updated_at on public.reports;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger patients_set_updated_at before update on public.patients for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger nutrition_plans_set_updated_at before update on public.nutrition_plans for each row execute function public.set_updated_at();
create trigger consultas_set_updated_at before update on public.consultas for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.reports for each row execute function public.set_updated_at();

-- A profile is created server-side for every new auth user. This keeps signup
-- working when Supabase requires email confirmation (there is no client session yet).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A patient account can safely claim the pre-created clinical record with the
  -- same email; otherwise it receives an empty record of its own.
  if (new.raw_user_meta_data ->> 'role') is distinct from 'nutriologo' then
    update public.patients
       set user_id = new.id
     where user_id is null
       and lower(email) = lower(new.email);

    if not found then
      insert into public.patients (name, email, user_id, target, notes)
      values (
        coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email),
        new.email,
        new.id,
        'Mantenimiento',
        'Ficha creada durante el registro de la cuenta.'
      );
    end if;
  end if;

  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' = 'nutriologo' then 'nutriologo'
      else 'usuario'
    end,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SECURITY DEFINER functions are deliberately narrow: they only answer ownership
-- questions, and avoid exposing rows while bypassing RLS.
create or replace function public.can_access_patient(target_patient_id integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.patients p
    where p.id = target_patient_id
      and (
        p.nutriologo_id = auth.uid()
        or p.user_id = auth.uid()
      )
  );
$$;

create or replace function public.can_manage_patient(target_patient_id integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.patients p
    where p.id = target_patient_id
      and p.nutriologo_id = auth.uid()
  );
$$;

-- Remove the permissive development policies from the initial prototype.
drop policy if exists "Permitir todo a usuarios autenticados" on public.profiles;
drop policy if exists "Permitir todo a usuarios autenticados" on public.patients;
drop policy if exists "Permitir todo a usuarios autenticados" on public.appointments;
drop policy if exists "Permitir todo a usuarios autenticados" on public.nutrition_plans;
drop policy if exists "Permitir todo a usuarios autenticados" on public.consultas;
drop policy if exists "Permitir todo a usuarios autenticados" on public.reports;

-- Recreate policies deterministically if the migration is rerun in a staging copy.
drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_self_insert on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists patients_tenant_select on public.patients;
drop policy if exists patients_tenant_insert on public.patients;
drop policy if exists patients_tenant_update on public.patients;
drop policy if exists patients_tenant_delete on public.patients;

create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_self_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- A nutritionist sees their own patient list; a patient sees only their linked record.
-- An unlinked record can only be claimed by the verified account with the same email.
create policy patients_tenant_select on public.patients for select to authenticated using (
  nutriologo_id = auth.uid()
  or user_id = auth.uid()
  or (user_id is null and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
);
create policy patients_tenant_insert on public.patients for insert to authenticated with check (
  nutriologo_id = auth.uid()
  or (user_id = auth.uid() and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
);
create policy patients_tenant_update on public.patients for update to authenticated using (
  nutriologo_id = auth.uid()
  or user_id = auth.uid()
  or (user_id is null and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
) with check (
  nutriologo_id = auth.uid()
  or (user_id = auth.uid() and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
);
create policy patients_tenant_delete on public.patients for delete to authenticated using (nutriologo_id = auth.uid());

-- Related clinical records are readable by the linked patient, but can only be
-- created, changed, or removed by that patient's nutritionist.
drop policy if exists appointments_tenant_select on public.appointments;
drop policy if exists appointments_tenant_insert on public.appointments;
drop policy if exists appointments_tenant_update on public.appointments;
drop policy if exists appointments_tenant_delete on public.appointments;
drop policy if exists plans_tenant_select on public.nutrition_plans;
drop policy if exists plans_tenant_insert on public.nutrition_plans;
drop policy if exists plans_tenant_update on public.nutrition_plans;
drop policy if exists plans_tenant_delete on public.nutrition_plans;
drop policy if exists consultas_tenant_select on public.consultas;
drop policy if exists consultas_tenant_insert on public.consultas;
drop policy if exists consultas_tenant_update on public.consultas;
drop policy if exists consultas_tenant_delete on public.consultas;
drop policy if exists reports_tenant_select on public.reports;
drop policy if exists reports_tenant_insert on public.reports;
drop policy if exists reports_tenant_update on public.reports;
drop policy if exists reports_tenant_delete on public.reports;

create policy appointments_tenant_select on public.appointments for select to authenticated using (public.can_access_patient(patient_id));
create policy appointments_tenant_insert on public.appointments for insert to authenticated with check (public.can_manage_patient(patient_id));
create policy appointments_tenant_update on public.appointments for update to authenticated using (public.can_manage_patient(patient_id)) with check (public.can_manage_patient(patient_id));
create policy appointments_tenant_delete on public.appointments for delete to authenticated using (public.can_manage_patient(patient_id));

create policy plans_tenant_select on public.nutrition_plans for select to authenticated using (public.can_access_patient(patient_id));
create policy plans_tenant_insert on public.nutrition_plans for insert to authenticated with check (public.can_manage_patient(patient_id));
create policy plans_tenant_update on public.nutrition_plans for update to authenticated using (public.can_manage_patient(patient_id)) with check (public.can_manage_patient(patient_id));
create policy plans_tenant_delete on public.nutrition_plans for delete to authenticated using (public.can_manage_patient(patient_id));

create policy consultas_tenant_select on public.consultas for select to authenticated using (public.can_access_patient(patient_id));
create policy consultas_tenant_insert on public.consultas for insert to authenticated with check (public.can_manage_patient(patient_id));
create policy consultas_tenant_update on public.consultas for update to authenticated using (public.can_manage_patient(patient_id)) with check (public.can_manage_patient(patient_id));
create policy consultas_tenant_delete on public.consultas for delete to authenticated using (public.can_manage_patient(patient_id));

create policy reports_tenant_select on public.reports for select to authenticated using (public.can_access_patient(patient_id));
create policy reports_tenant_insert on public.reports for insert to authenticated with check (public.can_manage_patient(patient_id));
create policy reports_tenant_update on public.reports for update to authenticated using (public.can_manage_patient(patient_id)) with check (public.can_manage_patient(patient_id));
create policy reports_tenant_delete on public.reports for delete to authenticated using (public.can_manage_patient(patient_id));

commit;
