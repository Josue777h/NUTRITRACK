import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";
import { userService } from "../services/userService";
import { patientService } from "../services/patientService";
import { appointmentService } from "../services/appointmentService";
import { nutritionPlanService } from "../services/nutritionPlanService";
import { reportService } from "../services/reportService";
import auditLogger from "../services/auditService";
import { PRESET_DIET_TEMPLATES } from "../data/dietTemplates";

const AppContext = createContext(null);
const STORAGE_KEY = "nutritrack_state_v5";

const defaultState = {
    theme: "light",
    auth: {
        isAuthenticated: false,
        role: null,
        username: "",
        fullName: "",
        patientId: null
    },
    profiles: {},
    patients: [],
    appointments: [],
    plans: [],
    reports: [],
    appointmentHistory: [],
    dailyHabits: {},
    dietTemplates: PRESET_DIET_TEMPLATES
};

function getNextId(items) {
    if (!items.length) {
        return 1;
    }
    return Math.max(...items.map((item) => Number(item.id))) + 1;
}

function byRecentDate(a, b) {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function AppProvider({ children }) {
    const [state, setState] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return defaultState;
            }
            const parsed = JSON.parse(raw);
            return {
                ...defaultState,
                ...parsed,
                theme: parsed.theme || defaultState.theme,
                dailyHabits: parsed.dailyHabits || {},
                dietTemplates: parsed.dietTemplates || PRESET_DIET_TEMPLATES,
                auth: { ...defaultState.auth, ...(parsed.auth ?? {}) },
                profiles: {},
                patients: [],
                appointments: [],
                plans: [],
                reports: [],
                appointmentHistory: parsed.appointmentHistory ?? defaultState.appointmentHistory,
            };
        } catch {
            return defaultState;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", state.theme || "light");
    }, [state.theme]);

    // ─── Helper: cargar todos los datos del usuario autenticado ───
    const loadUserData = async (session) => {
        if (!session?.user) return;
        const profile = await userService.getProfile(session.user.id);
        const role = profile?.role || "usuario";
        const fullName = profile?.full_name || session.user.email;

        const fetchedPatients = await patientService.getPatients(
            role === "nutriologo" ? session.user.id : null
        );

        let patientId = null;
        let isolatedPatients = [];
        let isolatedAppointments = [];
        let isolatedPlans = [];
        let isolatedReports = [];

        if (role === "nutriologo") {
            isolatedPatients = fetchedPatients || [];
            const myPatientIds = new Set(isolatedPatients.map((p) => Number(p.id)));
            const patientIds = [...myPatientIds];
            const [fa, fp, fr] = await Promise.all([
                appointmentService.getAppointments(patientIds),
                nutritionPlanService.getPlans(patientIds),
                reportService.getReports(patientIds),
            ]);
            isolatedAppointments = (fa || []).filter((a) => myPatientIds.has(Number(a.patient_id)));
            isolatedPlans = (fp || []).filter((pl) => myPatientIds.has(Number(pl.patient_id)));
            isolatedReports = (fr || []).filter((r) => myPatientIds.has(Number(r.patient_id)));
        } else {
            const myPatient = (fetchedPatients || []).find(
                (p) =>
                    p.user_id === session.user.id ||
                    p.email?.toLowerCase() === session.user.email?.toLowerCase()
            );
            if (myPatient) {
                patientId = myPatient.id;
                isolatedPatients = [myPatient];
                const [fa, fp, fr] = await Promise.all([
                    appointmentService.getAppointments([patientId]),
                    nutritionPlanService.getPlans([patientId]),
                    reportService.getReports([patientId]),
                ]);
                isolatedAppointments = (fa || []).filter((a) => Number(a.patient_id) === Number(patientId));
                isolatedPlans = (fp || []).filter((pl) => Number(pl.patient_id) === Number(patientId));
                isolatedReports = (fr || []).filter((r) => Number(r.patient_id) === Number(patientId));
            }
        }

        setState((prev) => ({
            ...prev,
            auth: {
                isAuthenticated: true,
                role,
                username: session.user.email,
                fullName,
                patientId,
                uid: session.user.id,
            },
            patients: isolatedPatients,
            appointments: isolatedAppointments.map((a) => ({
                id: a.id,
                patientId: a.patient_id,
                date: a.date,
                time: a.time,
                status: a.status,
                notes: a.notes,
                type: a.type || "consulta",
                duration: Number(a.duration) || 30,
                reason: a.reason || "",
            })),
            plans: isolatedPlans.map((p) => ({
                id: p.id,
                patientId: p.patient_id,
                name: p.name,
                target: p.target,
                calories: p.calories,
                duration: p.duration,
                meals: p.meals,
            })),
            reports: isolatedReports.map((r) => ({
                id: r.id,
                patientId: r.patient_id,
                date: r.date,
                weight: Number(r.weight),
                bmi: Number(r.bmi),
                calories: Number(r.calories),
                type: r.type || "progreso",
                notes: r.notes || "",
                feeling: r.feeling || "",
                observations: r.observations || "",
                diagnosis: r.diagnosis || "",
                recommendations: r.recommendations || [],
                nextSteps: r.next_steps || "",
                conclusion: r.conclusion || "",
            })),
        }));

        return { role, patientId, uid: session.user.id };
    };

    // ─── Auth listener: reacciona INSTANTÁNEAMENTE a login/logout de Supabase ───
    useEffect(() => {
        if (!isSupabaseConfigured) return;

        // Carga inicial de sesión existente
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadUserData(session).catch(console.error);
            }
        });

        // Escucha cambios de sesión en tiempo real (login, logout, token refresh)
        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_OUT" || !session) {
                    localStorage.removeItem(STORAGE_KEY);
                    setState(defaultState);
                } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                    await loadUserData(session);
                }
            }
        );

        return () => authSub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Realtime subscriptions: sincronización en vivo entre roles ───
    useEffect(() => {
        if (!isSupabaseConfigured || !state.auth.isAuthenticated) return;

        const { role, patientId, uid } = state.auth;

        // Recarga todos los datos relevantes del usuario actual desde Supabase
        const refreshAll = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) await loadUserData(session);
        };

        const channels = [];

        if (role === "nutriologo") {
            // El nutriólogo escucha cambios en sus pacientes y los datos relacionados
            const ch = supabase
                .channel(`nutriologo-realtime-${uid}`)
                .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, refreshAll)
                .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, refreshAll)
                .on("postgres_changes", { event: "*", schema: "public", table: "nutrition_plans" }, refreshAll)
                .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, refreshAll)
                .subscribe();
            channels.push(ch);
        } else if (patientId) {
            // El paciente escucha cambios en sus propios datos (citas, planes, reportes)
            const ch = supabase
                .channel(`patient-realtime-${patientId}`)
                .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${patientId}` }, refreshAll)
                .on("postgres_changes", { event: "*", schema: "public", table: "nutrition_plans", filter: `patient_id=eq.${patientId}` }, refreshAll)
                .on("postgres_changes", { event: "*", schema: "public", table: "reports", filter: `patient_id=eq.${patientId}` }, refreshAll)
                .subscribe();
            channels.push(ch);
        }

        return () => {
            channels.forEach((ch) => supabase.removeChannel(ch));
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.auth.isAuthenticated, state.auth.role, state.auth.patientId]);


    const login = async ({ email, password }) => {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Intentar iniciar sesión con Supabase si está configurado
        if (isSupabaseConfigured) {
            try {
                const data = await userService.signIn(normalizedEmail, password);
                if (data?.user) {
                    const session = data.session || (await supabase.auth.getSession())?.data?.session;
                    if (session) {
                        await loadUserData(session);
                    } else {
                        const profile = await userService.getProfile(data.user.id);
                        const role = profile?.role || "usuario";
                        const fullName = profile?.full_name || data.user.email;

                        const fetchedPatients = await patientService.getPatients();
                        let patientId = null;
                        if (role === "usuario") {
                            const myPatient = fetchedPatients.find(
                                (p) => p.user_id === data.user.id || p.email?.toLowerCase() === normalizedEmail
                            );
                            patientId = myPatient ? myPatient.id : null;
                        }

                        setState((prev) => ({
                            ...prev,
                            auth: {
                                isAuthenticated: true,
                                role,
                                username: data.user.email,
                                fullName,
                                patientId,
                                uid: data.user.id
                            }
                        }));
                    }
                    
                    // Auditoría de login exitoso
                    const currentProfile = await userService.getProfile(data.user.id);
                    auditLogger.auditLogin(data.user.id, data.user.email, currentProfile?.role || "usuario");
                    
                    return { ok: true };
                }
            } catch (error) {
                // Auditoría de intento fallido
                auditLogger.warn("LOGIN_FAILED", { email: normalizedEmail, error: error.message });
                return { ok: false, message: error.message || "Error al iniciar sesión en Supabase." };
            }
        }

        return { ok: false, message: "El servicio de autenticación no está configurado." };
    };

    const logout = async () => {
        const currentUserId = state.auth.uid;
        const currentEmail = state.auth.username;
        
        if (isSupabaseConfigured) {
            try {
                await userService.signOut();
            } catch (error) {
                console.error("Error al cerrar sesión en Supabase:", error);
            }
        }

        // Auditoría de logout
        if (currentUserId) {
            auditLogger.auditLogout(currentUserId, currentEmail);
        }

        // Limpiar localStorage completamente para evitar sesiones fantasma
        localStorage.removeItem(STORAGE_KEY);

        // Resetear COMPLETAMENTE el estado a valores por defecto
        setState(defaultState);
    };

    const addPatient = async (payload) => {
        let newPatient = {
            name: payload.name.trim(),
            age: Number(payload.age),
            weight: Number(payload.weight),
            height: Number(payload.height),
            target: payload.target,
            notes: payload.notes?.trim() ?? "",
            email: payload.email?.trim().toLowerCase() || null,
            allergies: payload.allergies || [],
            conditions: payload.conditions || []
        };

        if (isSupabaseConfigured) {
            try {
                let saved = null;
                if (newPatient.email) {
                    // 1. Buscar si ya existe un perfil de usuario registrado para este correo
                    const { data: profileList } = await supabase
                        .from("profiles")
                        .select("id")
                        .ilike("email", newPatient.email);

                    if (profileList && profileList.length > 0) {
                        newPatient.user_id = profileList[0].id;
                    }

                    // 2. Buscar si ya existe una ficha clínica registrada para este correo
                    const { data: existingList } = await supabase
                        .from("patients")
                        .select("*")
                        .ilike("email", newPatient.email);

                    if (existingList && existingList.length > 0) {
                        const existingId = existingList[0].id;
                        // Actualizar la ficha existente con la información clínica del nutriólogo
                        saved = await patientService.updatePatient(existingId, {
                            ...newPatient,
                            user_id: newPatient.user_id || existingList[0].user_id
                        });

                        // Asignar el nutriólogo actual a la ficha
                        if (state.auth.uid) {
                            await supabase
                                .from("patients")
                                .update({ nutriologo_id: state.auth.uid })
                                .eq("id", existingId);
                        }
                    }
                }

                if (!saved) {
                    // Si no existía ficha previa, crear una nueva
                    saved = await patientService.createPatient(newPatient, state.auth.uid);
                }

                if (saved) {
                    newPatient = { ...newPatient, ...saved };
                    // Auditoría de creación de paciente
                    auditLogger.auditPatientAction("CREATED", newPatient.id, newPatient.name, state.auth.uid);
                }
            } catch (error) {
                console.error("Error al registrar paciente en Supabase:", error);
                auditLogger.error("PATIENT_CREATE_ERROR", { error: error.message, patient: newPatient });
                newPatient.id = `temp-${Date.now()}`;
            }
        } else {
            newPatient.id = getNextId(state.patients);
            auditLogger.auditPatientAction("CREATED", newPatient.id, newPatient.name, state.auth.uid);
        }

        setState((prev) => ({
            ...prev,
            patients: [
                newPatient,
                ...prev.patients.filter((p) => p.id !== newPatient.id && p.email !== newPatient.email)
            ]
        }));
        return newPatient;
    };

    const updatePatient = async (patientId, payload) => {
        const updated = {
            name: payload.name.trim(),
            age: Number(payload.age),
            weight: Number(payload.weight),
            height: Number(payload.height),
            target: payload.target,
            notes: payload.notes?.trim() ?? "",
            email: payload.email?.trim().toLowerCase() || null,
            allergies: payload.allergies || [],
            conditions: payload.conditions || []
        };

        if (isSupabaseConfigured) {
            try {
                // Si el email fue modificado o coincide con un perfil existente, actualizar user_id
                if (updated.email) {
                    const { data: profileData, error: profileError } = await supabase
                        .from("profiles")
                        .select("id")
                        .ilike("email", updated.email)
                        .maybeSingle();
                    if (profileData?.id && !profileError) {
                        updated.user_id = profileData.id;
                    }
                }
                await patientService.updatePatient(patientId, updated);
                // Auditoría de actualización de paciente
                auditLogger.auditPatientAction("UPDATED", patientId, updated.name, state.auth.uid);
            } catch (error) {
                console.error("Error al actualizar paciente en Supabase:", error);
                auditLogger.error("PATIENT_UPDATE_ERROR", { error: error.message, patientId });
            }
        }

        setState((prev) => ({
            ...prev,
            patients: prev.patients.map((item) =>
                item.id === patientId ? { ...item, ...updated } : item
            )
        }));
    };

    const removePatient = async (patientId) => {
        const patient = state.patients.find(p => p.id === patientId);
        
        if (isSupabaseConfigured) {
            try {
                // Eliminar en cascada: citas, planes y reportes del paciente antes de eliminarlo
                await Promise.all([
                    supabase.from("appointments").delete().eq("patient_id", patientId),
                    supabase.from("nutrition_plans").delete().eq("patient_id", patientId),
                    supabase.from("reports").delete().eq("patient_id", patientId)
                ]);
                // Luego eliminar el paciente
                await patientService.deletePatient(patientId);
                // Auditoría de eliminación de paciente
                if (patient) {
                    auditLogger.auditPatientAction("DELETED", patientId, patient.name, state.auth.uid);
                }
            } catch (error) {
                console.error("Error al eliminar paciente de Supabase:", error);
                auditLogger.error("PATIENT_DELETE_ERROR", { error: error.message, patientId });
            }
        }

        setState((prev) => ({
            ...prev,
            patients: prev.patients.filter((item) => item.id !== patientId),
            appointments: prev.appointments.filter((item) => item.patientId !== patientId),
            plans: prev.plans.filter((item) => item.patientId !== patientId),
            reports: prev.reports.filter((item) => item.patientId !== patientId)
        }));
    };

    const addAppointment = async (payload) => {
        let newAppointment = {
            patientId: Number(payload.patientId),
            date: payload.date,
            time: payload.time,
            status: payload.status || "Pendiente",
            notes: payload.notes?.trim() ?? "",
            type: payload.type || "consulta",
            duration: Number(payload.duration) || 30,
            reason: payload.reason?.trim() ?? ""
        };

        if (isSupabaseConfigured) {
            try {
                const saved = await appointmentService.createAppointment(newAppointment);
                if (saved) {
                    newAppointment = {
                        ...newAppointment,
                        id: saved.id,
                        patientId: saved.patient_id || newAppointment.patientId,
                        date: saved.date || newAppointment.date,
                        time: saved.time || newAppointment.time,
                        status: saved.status || newAppointment.status,
                        notes: saved.notes ?? newAppointment.notes,
                        type: saved.type || newAppointment.type,
                        duration: saved.duration || newAppointment.duration,
                        reason: saved.reason ?? newAppointment.reason
                    };
                    // Auditoría de creación de cita
                    auditLogger.auditAppointmentAction("CREATED", newAppointment.id, newAppointment.patientId, state.auth.uid);
                }
            } catch (error) {
                console.error("Error al agendar cita en Supabase:", error);
                auditLogger.error("APPOINTMENT_CREATE_ERROR", { error: error.message, appointment: newAppointment });
                newAppointment.id = `temp-${Date.now()}`;
            }
        } else {
            newAppointment.id = getNextId(state.appointments);
            auditLogger.auditAppointmentAction("CREATED", newAppointment.id, newAppointment.patientId, state.auth.uid);
        }

        setState((prev) => ({
            ...prev,
            appointments: [newAppointment, ...prev.appointments].sort((a, b) =>
                `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
            )
        }));
    };

    const updateAppointment = async (appointmentId, payload) => {
        const updated = {
            patientId: Number(payload.patientId),
            date: payload.date,
            time: payload.time,
            status: payload.status,
            notes: payload.notes?.trim() ?? "",
            type: payload.type || "consulta",
            duration: Number(payload.duration) || 30,
            reason: payload.reason?.trim() ?? ""
        };

        if (isSupabaseConfigured) {
            try {
                await appointmentService.updateAppointment(appointmentId, updated);
                // Auditoría de actualización de cita
                auditLogger.auditAppointmentAction("UPDATED", appointmentId, updated.patientId, state.auth.uid);
            } catch (error) {
                console.error("Error al actualizar cita en Supabase:", error);
                auditLogger.error("APPOINTMENT_UPDATE_ERROR", { error: error.message, appointmentId });
            }
        }

        setState((prev) => ({
            ...prev,
            appointments: prev.appointments
                .map((item) =>
                    item.id === appointmentId ? { ...item, ...updated } : item
                )
                .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
        }));
    };

    const cancelAppointment = async (appointmentId) => {
        const appointment = state.appointments.find(a => a.id === appointmentId);
        
        if (isSupabaseConfigured) {
            try {
                await appointmentService.cancelAppointment(appointmentId);
                // Auditoría de cancelación de cita
                if (appointment) {
                    auditLogger.auditAppointmentAction("CANCELLED", appointmentId, appointment.patientId, state.auth.uid);
                }
            } catch (error) {
                console.error("Error al cancelar cita en Supabase:", error);
                auditLogger.error("APPOINTMENT_CANCEL_ERROR", { error: error.message, appointmentId });
            }
        }

        setState((prev) => ({
            ...prev,
            appointments: prev.appointments.map((item) =>
                item.id === appointmentId ? { ...item, status: "Cancelada" } : item
            )
        }));
    };

    // Archive/remove from agenda but keep a permanent history copy for download
    const archiveAppointment = async (appointmentId) => {
        const found = state.appointments.find((item) => item.id === appointmentId);
        if (!found) return null;

        const archivedItem = {
            ...found,
            archivedAt: new Date().toISOString(),
            archived: true
        };

        setState((prev) => ({
            ...prev,
            appointments: prev.appointments.filter((item) => item.id !== appointmentId),
            appointmentHistory: [
                archivedItem,
                ...(prev.appointmentHistory || []).filter((item) => item.id !== appointmentId)
            ]
        }));

        // Keep a record in Supabase so it remains available in the database
        if (isSupabaseConfigured) {
            try {
                const status = found.status?.toLowerCase() === "completada" ? "Completada" : "Cancelada";
                await appointmentService.updateAppointment(appointmentId, {
                    ...found,
                    status
                });
            } catch (error) {
                console.error("Error al archivar cita en Supabase:", error);
            }
        }

        return archivedItem;
    };

    const deleteAppointmentPermanently = async (appointmentId) => {
        const found =
            state.appointments.find((item) => item.id === appointmentId) ||
            (state.appointmentHistory || []).find((item) => item.id === appointmentId);

        const historyEntry = found
            ? { ...found, archivedAt: new Date().toISOString(), archived: true }
            : null;

        setState((prev) => ({
            ...prev,
            appointments: prev.appointments.filter((item) => item.id !== appointmentId),
            appointmentHistory: historyEntry
                ? [
                    historyEntry,
                    ...(prev.appointmentHistory || []).filter((item) => item.id !== appointmentId)
                ]
                : (prev.appointmentHistory || [])
        }));

        // Keep in Supabase (mark cancelled) so the record can still be exported from DB
        if (isSupabaseConfigured) {
            try {
                await appointmentService.cancelAppointment(appointmentId);
            } catch (error) {
                console.error("Error al marcar cita eliminada en Supabase:", error);
            }
        }
    };

    const addPlan = async (payload) => {
        let newPlan = {
            patientId: Number(payload.patientId),
            name: payload.name?.trim() || "Plan Alimenticio",
            target: payload.target || "Reducir IMC",
            calories: Number(payload.calories) || 2000,
            duration: Number(payload.duration) || 8,
            meals: payload.meals || {
                desayuno: [],
                mediaManana: [],
                almuerzo: [],
                merienda: [],
                cena: [],
                snack: []
            }
        };

        if (isSupabaseConfigured) {
            try {
                const saved = await nutritionPlanService.createPlan(newPlan);
                if (saved) {
                    newPlan = {
                        id: saved.id,
                        patientId: saved.patient_id,
                        name: saved.name,
                        target: saved.target,
                        calories: saved.calories,
                        duration: saved.duration,
                        meals: saved.meals
                    };
                    // Auditoría de creación de plan
                    auditLogger.auditPlanAction("CREATED", newPlan.id, newPlan.patientId, state.auth.uid);
                }
            } catch (error) {
                console.error("Error al crear plan nutricional en Supabase:", error);
                auditLogger.error("PLAN_CREATE_ERROR", { error: error.message, plan: newPlan });
                newPlan.id = `temp-${Date.now()}`;
            }
        } else {
            newPlan.id = getNextId(state.plans);
            auditLogger.auditPlanAction("CREATED", newPlan.id, newPlan.patientId, state.auth.uid);
        }

        setState((prev) => ({
            ...prev,
            plans: [newPlan, ...prev.plans]
        }));
    };

    const updatePlan = async (planId, payload) => {
        const updated = {
            patientId: Number(payload.patientId),
            name: payload.name?.trim() || "Plan Alimenticio",
            target: payload.target || "Reducir IMC",
            calories: Number(payload.calories) || 2000,
            duration: Number(payload.duration) || 8,
            meals: payload.meals
        };

        if (isSupabaseConfigured) {
            try {
                await nutritionPlanService.updatePlan(planId, updated);
                // Auditoría de actualización de plan
                auditLogger.auditPlanAction("UPDATED", planId, updated.patientId, state.auth.uid);
            } catch (error) {
                console.error("Error al actualizar plan en Supabase:", error);
                auditLogger.error("PLAN_UPDATE_ERROR", { error: error.message, planId });
            }
        }

        setState((prev) => ({
            ...prev,
            plans: prev.plans.map((item) =>
                item.id === planId ? { ...item, ...updated } : item
            )
        }));
    };

    const removePlan = async (planId) => {
        const plan = state.plans.find(p => p.id === planId);
        
        if (isSupabaseConfigured) {
            try {
                await nutritionPlanService.deletePlan(planId);
                // Auditoría de eliminación de plan
                if (plan) {
                    auditLogger.auditPlanAction("DELETED", planId, plan.patientId, state.auth.uid);
                }
            } catch (error) {
                console.error("Error al eliminar plan en Supabase:", error);
                auditLogger.error("PLAN_DELETE_ERROR", { error: error.message, planId });
            }
        }

        setState((prev) => ({
            ...prev,
            plans: prev.plans.filter((item) => item.id !== planId)
        }));
    };

    const addReport = async (payload) => {
        const weightVal = Number(payload.weight);
        const bmiVal = Number(payload.bmi);
        const calVal = Number(payload.calories);

        let newReport = {
            patientId: Number(payload.patientId),
            date: payload.date || new Date().toISOString().split("T")[0],
            weight: !isNaN(weightVal) && weightVal > 0 ? weightVal : 70,
            bmi: !isNaN(bmiVal) && bmiVal >= 5 ? bmiVal : 24,
            calories: !isNaN(calVal) && calVal >= 0 ? calVal : 2000,
            notes: payload.notes || payload.content || payload.title || "",
            feeling: payload.feeling || "",
            observations: payload.observations || "",
            diagnosis: payload.diagnosis || "",
            type: payload.type || "progreso",
            recommendations: Array.isArray(payload.recommendations) ? payload.recommendations : [],
            nextSteps: payload.nextSteps || "",
            conclusion: payload.conclusion || ""
        };

        if (isSupabaseConfigured) {
            try {
                const saved = await reportService.createReport(newReport);
                if (saved) {
                    newReport = {
                        ...newReport,
                        id: saved.id,
                        patientId: saved.patient_id,
                        date: saved.date,
                        weight: Number(saved.weight),
                        bmi: Number(saved.bmi),
                        calories: Number(saved.calories),
                        type: saved.type || newReport.type,
                        notes: saved.notes || newReport.notes,
                        feeling: saved.feeling || newReport.feeling,
                        observations: saved.observations || newReport.observations,
                        diagnosis: saved.diagnosis || newReport.diagnosis,
                        recommendations: saved.recommendations || newReport.recommendations,
                        nextSteps: saved.next_steps || newReport.nextSteps,
                        conclusion: saved.conclusion || newReport.conclusion,
                    };
                    // Auditoría de creación de reporte
                    auditLogger.auditReportAction("CREATED", newReport.id, newReport.patientId, state.auth.uid);
                }
            } catch (error) {
                console.error("Error al guardar reporte en Supabase:", error);
                auditLogger.error("REPORT_CREATE_ERROR", { error: error.message, report: newReport });
                newReport.id = `temp-${Date.now()}`;
            }
        } else {
            newReport.id = getNextId(state.reports);
            auditLogger.auditReportAction("CREATED", newReport.id, newReport.patientId, state.auth.uid);
        }

        setState((prev) => ({
            ...prev,
            patients: prev.patients.map((p) =>
                Number(p.id) === Number(newReport.patientId)
                    ? { ...p, weight: newReport.weight, bmi: newReport.bmi }
                    : p
            ),
            reports: [...prev.reports.filter((r) => r.id !== newReport.id), newReport].sort(byRecentDate)
        }));

        return newReport;
    };

    const updateReport = async (id, updatedReport) => {
        const weightVal = Number(updatedReport.weight);
        const bmiVal = Number(updatedReport.bmi);
        const calVal = Number(updatedReport.calories);

        const payload = {
            patientId: Number(updatedReport.patientId),
            date: updatedReport.date || new Date().toISOString().split("T")[0],
            weight: !isNaN(weightVal) && weightVal > 0 ? weightVal : 70,
            bmi: !isNaN(bmiVal) && bmiVal >= 5 ? bmiVal : 24,
            calories: !isNaN(calVal) && calVal >= 0 ? calVal : 2000,
            type: updatedReport.type || "progreso",
            notes: updatedReport.notes || updatedReport.content || updatedReport.title || "",
            feeling: updatedReport.feeling || "",
            observations: updatedReport.observations || "",
            diagnosis: updatedReport.diagnosis || "",
            recommendations: Array.isArray(updatedReport.recommendations) ? updatedReport.recommendations : [],
            nextSteps: updatedReport.nextSteps || "",
            conclusion: updatedReport.conclusion || ""
        };

        if (isSupabaseConfigured) {
            try {
                await reportService.updateReport(id, payload);
            } catch (error) {
                console.error("Error al actualizar reporte en Supabase:", error);
            }
        }

        setState((prev) => ({
            ...prev,
            reports: prev.reports
                .map((item) => (item.id === id ? { ...item, ...payload, id } : item))
                .sort(byRecentDate)
        }));
    };

    const removeReport = async (id) => {
        if (isSupabaseConfigured) {
            try {
                await reportService.deleteReport(id);
            } catch (error) {
                console.error("Error al eliminar reporte de Supabase:", error);
            }
        }

        setState((prev) => ({
            ...prev,
            reports: prev.reports.filter((item) => item.id !== id)
        }));
    };

    const registerUser = async (userData) => {
        const email = userData.email.trim().toLowerCase();
        const fullName = userData.fullName?.trim() || `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

        if (isSupabaseConfigured) {
            try {
                await userService.signUp(
                    email,
                    userData.password,
                    "usuario",
                    fullName
                );
                // El trigger handle_new_user crea o vincula la ficha de paciente
                // dentro de la base de datos, incluso si se exige confirmar email.
                return { success: true, message: "Usuario registrado exitosamente en Supabase" };
            } catch (error) {
                return { success: false, message: error.message || "Error al registrarse en Supabase." };
            }
        }

        return { success: false, message: "El registro requiere una conexión configurada con Supabase." };
    };
    
    const registerNutriologist = async (nutriologistData) => {
        const email = nutriologistData.email.trim().toLowerCase();
        const fullName = nutriologistData.fullName?.trim() || `${nutriologistData.firstName || ""} ${nutriologistData.lastName || ""}`.trim();

        if (isSupabaseConfigured) {
            try {
                await userService.signUp(
                    email,
                    nutriologistData.password,
                    "nutriologo",
                    fullName
                );
                return { success: true, message: "Nutriólogo registrado exitosamente en Supabase" };
            } catch (error) {
                return { success: false, message: error.message || "Error al registrarse en Supabase." };
            }
        }

        return { success: false, message: "El registro requiere una conexión configurada con Supabase." };
    };

    const changePassword = async (currentPassword, newPassword) => {
        if (!isSupabaseConfigured) {
            return { ok: false, message: "El cambio de contraseña requiere una conexión configurada con Supabase." };
        }
        if (newPassword.trim().length < 10) {
            return { ok: false, message: "La nueva contraseña debe tener al menos 10 caracteres." };
        }
        try {
            await userService.signIn(state.auth.username, currentPassword);
            await userService.updatePassword(newPassword);
            return { ok: true, message: "Contraseña actualizada correctamente." };
        } catch {
            return { ok: false, message: "La contraseña actual no coincide o no se pudo actualizar." };
        }
    };

    const updateProfile = (profileForm) => {
        const role = state.auth.role;
        if (!role) return;
        setState((prev) => ({
            ...prev,
            profiles: {
                ...prev.profiles,
                [role]: {
                    ...prev.profiles[role],
                    ...profileForm
                }
            }
        }));
    };

    const toggleTheme = () => {
        setState((prev) => {
            const nextTheme = prev.theme === "dark" ? "light" : "dark";
            return { ...prev, theme: nextTheme };
        });
    };

    const updateDailyHabits = async (dateStr, habitData) => {
        setState((prev) => ({
            ...prev,
            dailyHabits: {
                ...prev.dailyHabits,
                [dateStr]: habitData
            }
        }));

        if (isSupabaseConfigured && state.auth.patientId) {
            try {
                await supabase.from("daily_habits").upsert({
                    patient_id: Number(state.auth.patientId),
                    date: dateStr,
                    water_glasses: Number(habitData.waterGlasses) || 0,
                    completed_meals: habitData.completedMeals || [],
                    mood: habitData.mood || null,
                    energy: Number(habitData.energy) || null
                }, { onConflict: "patient_id,date" });
            } catch (err) {
                console.error("Error al sincronizar hábitos en Supabase:", err);
            }
        }
    };

    const saveDietTemplate = (templateData) => {
        const newTemplate = {
            id: templateData.id || `custom-${Date.now()}`,
            name: templateData.name.trim(),
            description: templateData.description?.trim() || "",
            target: templateData.target || "Control calórico",
            calories: Number(templateData.calories) || 2000,
            duration: Number(templateData.duration) || 4,
            macros: templateData.macros || { protein: 30, carbs: 45, fat: 25 },
            meals: templateData.meals
        };

        setState((prev) => ({
            ...prev,
            dietTemplates: [
                newTemplate,
                ...(prev.dietTemplates || []).filter((t) => t.id !== newTemplate.id)
            ]
        }));
        return newTemplate;
    };

    const deleteDietTemplate = (templateId) => {
        setState((prev) => ({
            ...prev,
            dietTemplates: (prev.dietTemplates || []).filter((t) => t.id !== templateId)
        }));
    };

    const generateWhatsAppPlanMessage = (patientName, plan) => {
        if (!plan) return "";
        let text = `👋 ¡Hola ${patientName || "Paciente"}! Te comparto tu nuevo plan alimenticio personalizado en *NutriTrack* 🥗\n\n`;
        text += `🎯 *Objetivo:* ${plan.target || "Nutricional"}\n`;
        text += `🔥 *Meta Calórica:* ${plan.calories || 2000} kcal/día\n`;
        text += `⏱ *Duración:* ${plan.duration || 4} semanas\n\n`;
        text += `📋 *DISTRIBUCIÓN DE COMIDAS:*\n`;

        const mealTitles = {
            desayuno: "☀️ Desayuno",
            mediaManana: "🌤 Media Mañana",
            almuerzo: "🍲 Almuerzo",
            merienda: "☕ Merienda",
            cena: "🌙 Cena",
            snack: "🍪 Snack"
        };

        Object.entries(plan.meals || {}).forEach(([key, foods]) => {
            if (Array.isArray(foods) && foods.length > 0) {
                text += `\n*${mealTitles[key] || key.toUpperCase()}:*\n`;
                foods.forEach((f) => {
                    const name = typeof f === "string" ? f : f.name;
                    const qty = f.qty ? ` (${f.qty} ${f.unit || ""})` : "";
                    const notes = f.notes ? ` - _${f.notes}_` : "";
                    text += `  • ${name}${qty}${notes}\n`;
                });
            }
        });

        text += `\n💧 *Recordatorio:* Recuerda tomar mínimo 2L de agua al día y registrar tu progreso en NutriTrack ✨`;
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
    };

    const value = useMemo(
        () => ({
            theme: state.theme || "light",
            toggleTheme,
            auth: state.auth,
            patients: state.patients,
            appointments: state.appointments,
            plans: state.plans,
            reports: state.reports,
            dailyHabits: state.dailyHabits || {},
            dietTemplates: state.dietTemplates || PRESET_DIET_TEMPLATES,
            appointmentHistory: state.appointmentHistory || [],
            profiles: state.profiles,
            login,
            logout,
            addPatient,
            updatePatient,
            removePatient,
            addAppointment,
            updateAppointment,
            cancelAppointment,
            archiveAppointment,
            deleteAppointmentPermanently,
            addPlan,
            updatePlan,
            removePlan,
            addReport,
            updateReport,
            removeReport,
            updateDailyHabits,
            saveDietTemplate,
            deleteDietTemplate,
            generateWhatsAppPlanMessage,
            updateProfile,
            registerUser,
            registerNutriologist,
            changePassword
        }),
        [state]
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp debe usarse dentro de AppProvider");
    }
    return context;
}

export { AppProvider, useApp };
