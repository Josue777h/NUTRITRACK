import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    seedAppointments,
    seedPatients,
    seedPlans,
    seedProfiles,
    seedReports
} from "../data/mockData";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";
import { createClient } from "@supabase/supabase-js";
import { userService } from "../services/userService";
import { patientService } from "../services/patientService";
import { appointmentService } from "../services/appointmentService";
import { nutritionPlanService } from "../services/nutritionPlanService";
import { consultationService } from "../services/consultationService";
import { reportService } from "../services/reportService";

const AppContext = createContext(null);
const STORAGE_KEY = "nutritrack_state_v4";

const defaultState = {
    auth: {
        isAuthenticated: false,
        role: null,
        username: "",
        fullName: "",
        patientId: null
    },
    security: {
        nutriologo: "josue123",
        usuario: "josue123"
    },
    profiles: isSupabaseConfigured ? {} : seedProfiles,
    patients: isSupabaseConfigured ? [] : seedPatients,
    appointments: isSupabaseConfigured ? [] : seedAppointments,
    plans: isSupabaseConfigured ? [] : seedPlans,
    reports: isSupabaseConfigured ? [] : seedReports,
    registeredUsers: [],
    registeredNutriologists: []
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
                auth: { ...defaultState.auth, ...(parsed.auth ?? {}) },
                security: { ...defaultState.security, ...(parsed.security ?? {}) },
                profiles: isSupabaseConfigured ? {} : ({ ...defaultState.profiles, ...(parsed.profiles ?? {}) }),
                patients: isSupabaseConfigured ? [] : (parsed.patients ?? defaultState.patients),
                appointments: isSupabaseConfigured ? [] : (parsed.appointments ?? defaultState.appointments),
                plans: isSupabaseConfigured ? [] : (parsed.plans ?? defaultState.plans),
                reports: isSupabaseConfigured ? [] : (parsed.reports ?? defaultState.reports),
                registeredUsers: parsed.registeredUsers ?? defaultState.registeredUsers,
                registeredNutriologists: parsed.registeredNutriologists ?? defaultState.registeredNutriologists
            };
        } catch {
            return defaultState;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // Cargar datos de Supabase si está configurado
    useEffect(() => {
        if (isSupabaseConfigured) {
            const loadData = async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        const profile = await userService.getProfile(session.user.id);
                        const role = profile?.role || "usuario";
                        const fullName = profile?.full_name || session.user.email;

                        // Si es nutriólogo, filtrar sus pacientes específicos de Supabase
                        const fetchedPatients = await patientService.getPatients(role === "nutriologo" ? session.user.id : null);
                        
                        let patientId = null;
                        let isolatedPatients = [];
                        let isolatedAppointments = [];
                        let isolatedPlans = [];
                        let isolatedReports = [];

                        if (role === "nutriologo") {
                            isolatedPatients = fetchedPatients || [];
                            
                            const fetchedAppointments = await appointmentService.getAppointments();
                            const fetchedPlans = await nutritionPlanService.getPlans();
                            const fetchedReports = await reportService.getReports();

                            const myPatientIds = new Set(isolatedPatients.map(p => Number(p.id)));
                            
                            isolatedAppointments = (fetchedAppointments || []).filter(a => myPatientIds.has(Number(a.patient_id)));
                            isolatedPlans = (fetchedPlans || []).filter(pl => myPatientIds.has(Number(pl.patient_id)));
                            isolatedReports = (fetchedReports || []).filter(r => myPatientIds.has(Number(r.patient_id)));
                        } else {
                            const myPatient = (fetchedPatients || []).find(
                                (p) => p.user_id === session.user.id || p.email?.toLowerCase() === session.user.email?.toLowerCase()
                            );
                            
                            if (myPatient) {
                                patientId = myPatient.id;
                                isolatedPatients = [myPatient];
                                
                                const fetchedAppointments = await appointmentService.getAppointments();
                                const fetchedPlans = await nutritionPlanService.getPlans();
                                const fetchedReports = await reportService.getReports();

                                isolatedAppointments = (fetchedAppointments || []).filter(a => Number(a.patient_id) === Number(patientId));
                                isolatedPlans = (fetchedPlans || []).filter(pl => Number(pl.patient_id) === Number(patientId));
                                isolatedReports = (fetchedReports || []).filter(r => Number(r.patient_id) === Number(patientId));
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
                                uid: session.user.id
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
                                reason: a.reason || ""
                            })),
                            plans: isolatedPlans.map((p) => ({
                                id: p.id,
                                patientId: p.patient_id,
                                name: p.name,
                                target: p.target,
                                calories: p.calories,
                                duration: p.duration,
                                meals: p.meals
                            })),
                            reports: isolatedReports.map((r) => ({
                                id: r.id,
                                patientId: r.patient_id,
                                date: r.date,
                                weight: Number(r.weight),
                                bmi: Number(r.bmi),
                                calories: Number(r.calories)
                            }))
                        }));
                    } else {
                        // Limpiar estado en Supabase cuando se cierra sesión
                        setState((prev) => ({
                            ...prev,
                            auth: {
                                isAuthenticated: false,
                                role: null,
                                username: "",
                                fullName: "",
                                patientId: null
                            },
                            patients: [],
                            appointments: [],
                            plans: [],
                            reports: []
                        }));
                    }
                } catch (error) {
                    console.error("Error al cargar datos desde Supabase:", error);
                }
            };
            loadData();
        }
    }, [state.auth.isAuthenticated]);

    const login = async ({ email, password }) => {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Intentar iniciar sesión con Supabase si está configurado
        if (isSupabaseConfigured) {
            try {
                const data = await userService.signIn(normalizedEmail, password);
                if (data?.user) {
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
                    return { ok: true };
                }
            } catch (error) {
                return { ok: false, message: error.message || "Error al iniciar sesión en Supabase." };
            }
        }

        // 2. Demo accounts local fallback
        if (normalizedEmail === "josuesepulvedassj@gmail.com") {
            if (password === "josue123") {
                setState((prev) => ({
                    ...prev,
                    auth: {
                        isAuthenticated: true,
                        role: "nutriologo",
                        username: "Dra. Maria Torres",
                        fullName: "Dra. Maria Torres",
                        patientId: null
                    }
                }));
                return { ok: true };
            } else {
                return { ok: false, message: "Contraseña incorrecta para el demo de Nutriólogo." };
            }
        }

        if (normalizedEmail === "josuexdsepulveda@gmail.com") {
            if (password === "josue123") {
                const patient = state.patients.find(p => p.email === "josuexdsepulveda@gmail.com") || state.patients[0];
                setState((prev) => ({
                    ...prev,
                    auth: {
                        isAuthenticated: true,
                        role: "usuario",
                        username: "Paciente NutriTrack",
                        fullName: patient ? patient.name : "Paciente NutriTrack",
                        patientId: patient ? patient.id : 2
                    }
                }));
                return { ok: true };
            } else {
                return { ok: false, message: "Contraseña incorrecta para el demo de Paciente." };
            }
        }

        // 3. Registered nutritionists local fallback
        const registeredNutri = state.registeredNutriologists.find(
            n => n.email.trim().toLowerCase() === normalizedEmail && n.password === password
        );
        if (registeredNutri) {
            setState((prev) => ({
                ...prev,
                auth: {
                    isAuthenticated: true,
                    role: "nutriologo",
                    username: registeredNutri.email,
                    fullName: `${registeredNutri.firstName} ${registeredNutri.lastName}`.trim(),
                    patientId: null
                }
            }));
            return { ok: true };
        }

        // 4. Registered patients local fallback
        const registeredPat = state.registeredUsers.find(
            u => u.email.trim().toLowerCase() === normalizedEmail && u.password === password
        );
        if (registeredPat) {
            let patient = state.patients.find(p => p.email.trim().toLowerCase() === normalizedEmail);
            let updatedPatients = [...state.patients];
            if (!patient) {
                patient = {
                    id: getNextId(state.patients),
                    name: `${registeredPat.firstName} ${registeredPat.lastName}`.trim(),
                    age: 30,
                    weight: 70,
                    height: 170,
                    target: "Mantenimiento",
                    notes: "Ficha creada al iniciar sesión.",
                    email: registeredPat.email
                };
                updatedPatients.unshift(patient);
            }

            setState((prev) => ({
                ...prev,
                patients: updatedPatients,
                auth: {
                    isAuthenticated: true,
                    role: "usuario",
                    username: registeredPat.email,
                    fullName: `${registeredPat.firstName} ${registeredPat.lastName}`.trim(),
                    patientId: patient.id
                }
            }));
            return { ok: true };
        }

        return { ok: false, message: "Correo o contraseña incorrectos." };
    };

    const logout = async () => {
        if (isSupabaseConfigured) {
            try {
                await userService.signOut();
            } catch (error) {
                console.error("Error al cerrar sesión en Supabase:", error);
            }
        }

        setState((prev) => ({
            ...prev,
            auth: {
                isAuthenticated: false,
                role: null,
                username: "",
                fullName: "",
                patientId: null
            }
        }));
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
                }
            } catch (error) {
                console.error("Error al registrar paciente en Supabase:", error);
                newPatient.id = `temp-${Date.now()}`;
            }
        } else {
            newPatient.id = getNextId(state.patients);
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
            } catch (error) {
                console.error("Error al actualizar paciente en Supabase:", error);
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
        if (isSupabaseConfigured) {
            try {
                await patientService.deletePatient(patientId);
            } catch (error) {
                console.error("Error al eliminar paciente de Supabase:", error);
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
                }
            } catch (error) {
                console.error("Error al agendar cita en Supabase:", error);
                newAppointment.id = `temp-${Date.now()}`;
            }
        } else {
            newAppointment.id = getNextId(state.appointments);
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
            } catch (error) {
                console.error("Error al actualizar cita en Supabase:", error);
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
        if (isSupabaseConfigured) {
            try {
                await appointmentService.cancelAppointment(appointmentId);
            } catch (error) {
                console.error("Error al cancelar cita en Supabase:", error);
            }
        }

        setState((prev) => ({
            ...prev,
            appointments: prev.appointments.map((item) =>
                item.id === appointmentId ? { ...item, status: "Cancelada" } : item
            )
        }));
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
                }
            } catch (error) {
                console.error("Error al crear plan nutricional en Supabase:", error);
                newPlan.id = `temp-${Date.now()}`;
            }
        } else {
            newPlan.id = getNextId(state.plans);
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
            } catch (error) {
                console.error("Error al actualizar plan en Supabase:", error);
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
        if (isSupabaseConfigured) {
            try {
                await nutritionPlanService.deletePlan(planId);
            } catch (error) {
                console.error("Error al eliminar plan en Supabase:", error);
            }
        }

        setState((prev) => ({
            ...prev,
            plans: prev.plans.filter((item) => item.id !== planId)
        }));
    };

    const addReport = async (payload) => {
        let newReport = {
            patientId: Number(payload.patientId),
            date: payload.date,
            weight: Number(payload.weight),
            bmi: Number(payload.bmi),
            calories: Number(payload.calories)
        };

        if (isSupabaseConfigured) {
            try {
                const saved = await reportService.createReport(newReport);
                if (saved) {
                    newReport = {
                        id: saved.id,
                        patientId: saved.patient_id,
                        date: saved.date,
                        weight: Number(saved.weight),
                        bmi: Number(saved.bmi),
                        calories: Number(saved.calories)
                    };
                }
            } catch (error) {
                console.error("Error al guardar reporte en Supabase:", error);
                newReport.id = `temp-${Date.now()}`;
            }
        } else {
            newReport.id = getNextId(state.reports);
        }

        setState((prev) => ({
            ...prev,
            reports: [...prev.reports, newReport].sort(byRecentDate)
        }));
    };

    const updateReport = async (id, updatedReport) => {
        const payload = {
            patientId: Number(updatedReport.patientId),
            date: updatedReport.date,
            weight: Number(updatedReport.weight),
            bmi: Number(updatedReport.bmi),
            calories: Number(updatedReport.calories)
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
                .map((item) => (item.id === id ? { ...item, ...payload } : item))
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
                const data = await userService.signUp(
                    email,
                    userData.password,
                    "usuario",
                    fullName
                );
                if (data?.user) {
                    // Buscar si ya existe una ficha de paciente registrada por el nutriólogo
                    const { data: existingPatients } = await supabase
                        .from("patients")
                        .select("*")
                        .ilike("email", email);

                    if (existingPatients && existingPatients.length > 0) {
                        // Vincular la ficha del paciente al usuario recién registrado
                        await supabase
                            .from("patients")
                            .update({ user_id: data.user.id })
                            .eq("id", existingPatients[0].id);
                    } else {
                        // Crear una nueva ficha vinculada
                        await patientService.createPatient({
                            name: fullName,
                            age: 30,
                            weight: 70,
                            height: 170,
                            target: "Mantenimiento",
                            notes: "Ficha creada por registro público.",
                            email,
                            user_id: data.user.id
                        });
                    }
                }
                return { success: true, message: "Usuario registrado exitosamente en Supabase" };
            } catch (error) {
                return { success: false, message: error.message || "Error al registrarse en Supabase." };
            }
        }

        // Local storage register
        const existingUser = state.registeredUsers.find(user => 
            user.email === email
        );
        
        if (existingUser) {
            return { success: false, message: "El correo ya está registrado" };
        }
        
        const newUser = {
            id: getNextId(state.registeredUsers),
            ...userData,
            fullName,
            registeredAt: new Date().toISOString()
        };

        // Comprobar si el nutriólogo ya creó una ficha para este correo
        const existingPatient = state.patients.find(
            (p) => p.email?.trim().toLowerCase() === email
        );
        let updatedPatients = [...state.patients];

        if (!existingPatient) {
            const patientId = getNextId(state.patients);
            const newPatient = {
                id: patientId,
                name: fullName,
                age: 30,
                weight: 70,
                height: 170,
                target: "Mantenimiento",
                notes: "Ficha creada por registro público.",
                email: userData.email
            };
            updatedPatients.unshift(newPatient);
        }
        
        setState((prev) => ({
            ...prev,
            registeredUsers: [...prev.registeredUsers, newUser],
            patients: updatedPatients
        }));
        
        return { success: true, message: "Usuario registrado exitosamente" };
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

        // Local storage register
        const existingNutriologist = state.registeredNutriologists.find(nutriologist => 
            nutriologist.email === email
        );
        
        if (existingNutriologist) {
            return { success: false, message: "El correo ya está registrado" };
        }
        
        const newNutriologist = {
            id: getNextId(state.registeredNutriologists),
            ...nutriologistData,
            fullName,
            registeredAt: new Date().toISOString()
        };
        
        setState((prev) => ({
            ...prev,
            registeredNutriologists: [...prev.registeredNutriologists, newNutriologist]
        }));
        
        return { success: true, message: "Nutriólogo registrado exitosamente" };
    };

    const changePassword = (currentPassword, newPassword) => {
        const role = state.auth.role;
        if (!role) {
            return { ok: false, message: "No hay una sesión activa." };
        }
        const savedPassword = state.security[role];
        if (currentPassword !== savedPassword) {
            return { ok: false, message: "La contraseña actual no coincide." };
        }
        if (newPassword.trim().length < 6) {
            return { ok: false, message: "La nueva contraseña debe tener al menos 6 caracteres." };
        }

        setState((prev) => ({
            ...prev,
            security: {
                ...prev.security,
                [role]: newPassword
            }
        }));
        return { ok: true, message: "Contraseña actualizada correctamente." };
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

    const value = useMemo(
        () => ({
            auth: state.auth,
            patients: state.patients,
            appointments: state.appointments,
            plans: state.plans,
            reports: state.reports,
            profiles: state.profiles,
            registeredUsers: state.registeredUsers,
            registeredNutriologists: state.registeredNutriologists,
            login,
            logout,
            addPatient,
            updatePatient,
            removePatient,
            addAppointment,
            updateAppointment,
            cancelAppointment,
            addPlan,
            updatePlan,
            removePlan,
            addReport,
            updateReport,
            removeReport,
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
