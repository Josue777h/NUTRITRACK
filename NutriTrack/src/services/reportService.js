import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const reportService = {
    async getReports(patientIds = []) {
        if (!isSupabaseConfigured) return [];
        let query = supabase.from("reports").select("*");
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

    async createReport(reportData) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("reports")
            .insert({
                patient_id: Number(reportData.patientId),
                date: reportData.date,
                weight: Number(reportData.weight),
                bmi: Number(reportData.bmi),
                calories: Number(reportData.calories),
                type: reportData.type || "progreso",
                notes: reportData.notes || "",
                feeling: reportData.feeling || "",
                observations: reportData.observations || "",
                diagnosis: reportData.diagnosis || "",
                recommendations: reportData.recommendations || [],
                next_steps: reportData.nextSteps || "",
                conclusion: reportData.conclusion || ""
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
                calories: Number(reportData.calories),
                type: reportData.type || "progreso",
                notes: reportData.notes || "",
                feeling: reportData.feeling || "",
                observations: reportData.observations || "",
                diagnosis: reportData.diagnosis || "",
                recommendations: reportData.recommendations || [],
                next_steps: reportData.nextSteps || "",
                conclusion: reportData.conclusion || ""
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
