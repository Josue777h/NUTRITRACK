import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const consultationService = {
    async getConsultas(patientId = null) {
        if (!isSupabaseConfigured) return [];
        let query = supabase.from("consultas").select("*");
        if (patientId) {
            query = query.eq("patient_id", patientId);
        }
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        return data;
    },

    async createConsulta(consultaData) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("consultas")
            .insert({
                appointment_id: consultaData.appointmentId ? Number(consultaData.appointmentId) : null,
                patient_id: Number(consultaData.patientId),
                notes: consultaData.notes || ""
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateConsulta(id, consultaData) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("consultas")
            .update({
                notes: consultaData.notes
            })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteConsulta(id) {
        if (!isSupabaseConfigured) return null;
        const { error } = await supabase
            .from("consultas")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return true;
    }
};
