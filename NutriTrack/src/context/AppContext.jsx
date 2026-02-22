import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    seedAppointments,
    seedPatients,
    seedPlans,
    seedProfiles,
    seedReports
} from "../data/mockData";

const AppContext = createContext(null);
const STORAGE_KEY = "nutritrack_state_v3";

const defaultState = {
    auth: {
        isAuthenticated: false,
        role: null,
        username: "",
        fullName: "",
        patientId: null
    },
    security: {
        nutriologo: "123456",
        usuario: "123456"
    },
    profiles: seedProfiles,
    patients: seedPatients,
    appointments: seedAppointments,
    plans: seedPlans,
    reports: seedReports
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
                profiles: { ...defaultState.profiles, ...(parsed.profiles ?? {}) },
                patients: parsed.patients ?? defaultState.patients,
                appointments: parsed.appointments ?? defaultState.appointments,
                plans: parsed.plans ?? defaultState.plans,
                reports: parsed.reports ?? defaultState.reports
            };
        } catch {
            return defaultState;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const login = ({ username, password, role, selectedPatientId }) => {
        const storedPassword = state.security[role] ?? "123456";
        if (password !== storedPassword) {
            return { ok: false, message: "Contrasena incorrecta. Prueba con 123456." };
        }

        if (role === "usuario") {
            const patient = state.patients.find((item) => item.id === Number(selectedPatientId));
            if (!patient) {
                return { ok: false, message: "Debes seleccionar un paciente para ingresar como usuario." };
            }

            setState((prev) => ({
                ...prev,
                auth: {
                    isAuthenticated: true,
                    role: "usuario",
                    username,
                    fullName: patient.name,
                    patientId: patient.id
                },
                profiles: {
                    ...prev.profiles,
                    usuario: {
                        ...prev.profiles.usuario,
                        fullName: patient.name
                    }
                }
            }));

            return { ok: true };
        }

        const fullName = username?.trim() ? username.trim() : "Dra. Maria Torres";
        setState((prev) => ({
            ...prev,
            auth: {
                isAuthenticated: true,
                role: "nutriologo",
                username,
                fullName,
                patientId: null
            },
            profiles: {
                ...prev.profiles,
                nutriologo: {
                    ...prev.profiles.nutriologo,
                    fullName
                }
            }
        }));
        return { ok: true };
    };

    const logout = () => {
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

    const addPatient = (payload) => {
        const newPatient = {
            id: getNextId(state.patients),
            name: payload.name.trim(),
            age: Number(payload.age),
            weight: Number(payload.weight),
            height: Number(payload.height),
            target: payload.target,
            notes: payload.notes?.trim() ?? ""
        };
        setState((prev) => ({
            ...prev,
            patients: [newPatient, ...prev.patients]
        }));
        return newPatient;
    };

    const updatePatient = (patientId, payload) => {
        setState((prev) => ({
            ...prev,
            patients: prev.patients.map((item) =>
                item.id === patientId
                    ? {
                          ...item,
                          name: payload.name.trim(),
                          age: Number(payload.age),
                          weight: Number(payload.weight),
                          height: Number(payload.height),
                          target: payload.target,
                          notes: payload.notes?.trim() ?? ""
                      }
                    : item
            )
        }));
    };

    const removePatient = (patientId) => {
        setState((prev) => ({
            ...prev,
            patients: prev.patients.filter((item) => item.id !== patientId),
            appointments: prev.appointments.filter((item) => item.patientId !== patientId),
            plans: prev.plans.filter((item) => item.patientId !== patientId),
            reports: prev.reports.filter((item) => item.patientId !== patientId)
        }));
    };

    const addAppointment = (payload) => {
        const newAppointment = {
            id: getNextId(state.appointments),
            patientId: Number(payload.patientId),
            date: payload.date,
            time: payload.time,
            status: payload.status,
            notes: payload.notes?.trim() ?? ""
        };

        setState((prev) => ({
            ...prev,
            appointments: [newAppointment, ...prev.appointments].sort((a, b) =>
                `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
            )
        }));
    };

    const updateAppointment = (appointmentId, payload) => {
        setState((prev) => ({
            ...prev,
            appointments: prev.appointments
                .map((item) =>
                    item.id === appointmentId
                        ? {
                              ...item,
                              patientId: Number(payload.patientId),
                              date: payload.date,
                              time: payload.time,
                              status: payload.status,
                              notes: payload.notes?.trim() ?? ""
                          }
                        : item
                )
                .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
        }));
    };

    const cancelAppointment = (appointmentId) => {
        setState((prev) => ({
            ...prev,
            appointments: prev.appointments.map((item) =>
                item.id === appointmentId ? { ...item, status: "Cancelada" } : item
            )
        }));
    };

    const addPlan = (payload) => {
        const newPlan = {
            id: getNextId(state.plans),
            patientId: Number(payload.patientId),
            day: payload.day,
            breakfast: payload.breakfast.trim(),
            lunch: payload.lunch.trim(),
            dinner: payload.dinner.trim(),
            snack: payload.snack.trim()
        };
        setState((prev) => ({
            ...prev,
            plans: [newPlan, ...prev.plans]
        }));
    };

    const updatePlan = (planId, payload) => {
        setState((prev) => ({
            ...prev,
            plans: prev.plans.map((item) =>
                item.id === planId
                    ? {
                          ...item,
                          patientId: Number(payload.patientId),
                          day: payload.day,
                          breakfast: payload.breakfast.trim(),
                          lunch: payload.lunch.trim(),
                          dinner: payload.dinner.trim(),
                          snack: payload.snack.trim()
                      }
                    : item
            )
        }));
    };

    const removePlan = (planId) => {
        setState((prev) => ({
            ...prev,
            plans: prev.plans.filter((item) => item.id !== planId)
        }));
    };

    const addReport = (payload) => {
        const newReport = {
            id: getNextId(state.reports),
            patientId: Number(payload.patientId),
            date: payload.date,
            weight: Number(payload.weight),
            bmi: Number(payload.bmi),
            calories: Number(payload.calories)
        };
        setState((prev) => ({
            ...prev,
            reports: [...prev.reports, newReport].sort(byRecentDate)
        }));
    };

    const updateProfile = (payload) => {
        if (!state.auth.role) {
            return;
        }
        const role = state.auth.role;
        setState((prev) => ({
            ...prev,
            profiles: {
                ...prev.profiles,
                [role]: {
                    ...prev.profiles[role],
                    ...payload
                }
            },
            auth: {
                ...prev.auth,
                fullName: payload.fullName ?? prev.auth.fullName
            }
        }));
    };

    const changePassword = (currentPassword, newPassword) => {
        const role = state.auth.role;
        if (!role) {
            return { ok: false, message: "No hay una sesion activa." };
        }
        const savedPassword = state.security[role];
        if (currentPassword !== savedPassword) {
            return { ok: false, message: "La contrasena actual no coincide." };
        }
        if (newPassword.trim().length < 6) {
            return { ok: false, message: "La nueva contrasena debe tener al menos 6 caracteres." };
        }

        setState((prev) => ({
            ...prev,
            security: {
                ...prev.security,
                [role]: newPassword
            }
        }));
        return { ok: true, message: "Contrasena actualizada correctamente." };
    };

    const value = useMemo(
        () => ({
            auth: state.auth,
            patients: state.patients,
            appointments: state.appointments,
            plans: state.plans,
            reports: state.reports,
            profiles: state.profiles,
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
            updateProfile,
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
