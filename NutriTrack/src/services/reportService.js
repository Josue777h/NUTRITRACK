import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const reportService = {
    async getReports(patientId = null) {
        if (!isSupabaseConfigured) return [];
        let query = supabase.from("reports").select("*");
        if (patientId) {
            query = query.eq("patient_id", patientId);
        }
        const { data, error } = await query.order("date", { ascending: true });
        if (error) throw error;
        return data;
    },

    async createReport(reportData) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("reports")
            .insert({
                patient_id: Number(reportData.patientId),
                date: reportData.date,
                weight: Number(reportData.weight),
                bmi: Number(reportData.bmi),
                calories: Number(reportData.calories)
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateReport(id, reportData) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("reports")
            .update({
                patient_id: Number(reportData.patientId),
                date: reportData.date,
                weight: Number(reportData.weight),
                bmi: Number(reportData.bmi),
                calories: Number(reportData.calories)
            })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteReport(id) {
        if (!isSupabaseConfigured) return null;
        const { error } = await supabase
            .from("reports")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return true;
    }
};
