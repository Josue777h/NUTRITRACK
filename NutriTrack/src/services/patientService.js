import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const patientService = {
    async getPatients(nutriologoId = null) {
        if (!isSupabaseConfigured) return [];
        let query = supabase.from("patients").select("*");
        if (nutriologoId) {
            query = query.eq("nutriologo_id", nutriologoId);
        }
        const { data, error } = await query.order("name", { ascending: true });
        if (error) throw error;
        return data;
    },

    async getPatientById(id) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("patients")
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },

    async createPatient(patientData, nutriologoId = null) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("patients")
            .insert({
                name: patientData.name,
                age: Number(patientData.age),
                weight: Number(patientData.weight),
                height: Number(patientData.height),
                target: patientData.target,
                notes: patientData.notes || "",
                email: patientData.email || null,
                nutriologo_id: nutriologoId,
                user_id: patientData.user_id || null,
                allergies: patientData.allergies || [],
                conditions: patientData.conditions || []
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updatePatient(id, patientData) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("patients")
            .update({
                name: patientData.name,
                age: Number(patientData.age),
                weight: Number(patientData.weight),
                height: Number(patientData.height),
                target: patientData.target,
                notes: patientData.notes || "",
                email: patientData.email || null,
                user_id: patientData.user_id || null,
                allergies: patientData.allergies || [],
                conditions: patientData.conditions || []
            })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deletePatient(id) {
        if (!isSupabaseConfigured) return null;
        const { error } = await supabase
            .from("patients")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return true;
    }
};
