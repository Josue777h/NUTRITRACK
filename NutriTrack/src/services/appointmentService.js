import { supabase, isSupabaseConfigured } from "./supabaseClient";

function formatStatus(status) {
    if (!status) return "Pendiente";
    const s = String(status).toLowerCase().trim();
    if (s === "confirmada") return "Confirmada";
    if (s === "cancelada") return "Cancelada";
    if (s === "completada") return "Completada";
    return "Pendiente";
}

export const appointmentService = {
    async getAppointments(patientIds = []) {
        if (!isSupabaseConfigured) return [];
        let query = supabase.from("appointments").select("*");
        const ids = Array.isArray(patientIds) ? patientIds : [patientIds];
        if (ids.length === 1) {
            query = query.eq("patient_id", ids[0]);
        } else if (ids.length > 1) {
            query = query.in("patient_id", ids);
        }
        const { data, error } = await query.order("date", { ascending: true });
        if (error) throw error;
        return data;
    },

    async createAppointment(appointmentData) {
        if (!isSupabaseConfigured) return null;
        const fullPayload = {
            patient_id: Number(appointmentData.patientId),
            date: appointmentData.date,
            time: appointmentData.time,
            status: formatStatus(appointmentData.status),
            notes: appointmentData.notes || "",
            type: appointmentData.type || "consulta",
            duration: Number(appointmentData.duration) || 30,
            reason: appointmentData.reason || ""
        };

        try {
            const { data, error } = await supabase
                .from("appointments")
                .insert(fullPayload)
                .select()
                .single();
            if (!error && data) return data;
        } catch (e) {
            console.warn("Falling back to base columns for appointment insert:", e);
        }

        const basePayload = {
            patient_id: Number(appointmentData.patientId),
            date: appointmentData.date,
            time: appointmentData.time,
            status: formatStatus(appointmentData.status),
            notes: appointmentData.notes || ""
        };
        const { data: baseData, error: baseErr } = await supabase
            .from("appointments")
            .insert(basePayload)
            .select()
            .single();
        if (baseErr) throw baseErr;
        return { ...baseData, ...fullPayload };
    },

    async updateAppointment(id, appointmentData) {
        if (!isSupabaseConfigured) return null;
        const fullPayload = {
            patient_id: Number(appointmentData.patientId),
            date: appointmentData.date,
            time: appointmentData.time,
            status: formatStatus(appointmentData.status),
            notes: appointmentData.notes || "",
            type: appointmentData.type || "consulta",
            duration: Number(appointmentData.duration) || 30,
            reason: appointmentData.reason || ""
        };

        try {
            const { data, error } = await supabase
                .from("appointments")
                .update(fullPayload)
                .eq("id", id)
                .select()
                .single();
            if (!error && data) return data;
        } catch (e) {
            console.warn("Falling back to base columns for appointment update:", e);
        }

        const basePayload = {
            patient_id: Number(appointmentData.patientId),
            date: appointmentData.date,
            time: appointmentData.time,
            status: formatStatus(appointmentData.status),
            notes: appointmentData.notes || ""
        };
        const { data: baseData, error: baseErr } = await supabase
            .from("appointments")
            .update(basePayload)
            .eq("id", id)
            .select()
            .single();
        if (baseErr) throw baseErr;
        return { ...baseData, ...fullPayload };
    },

    async cancelAppointment(id) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("appointments")
            .update({ status: "Cancelada" })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteAppointment(id) {
        if (!isSupabaseConfigured) return null;
        const { error } = await supabase
            .from("appointments")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return true;
    }
};
