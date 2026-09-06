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

        const weightVal = Number(reportData.weight);
        const bmiVal = Number(reportData.bmi);
        const calVal = Number(reportData.calories);

        const payload = {
            patient_id: Number(reportData.patientId),
            date: reportData.date || new Date().toISOString().split("T")[0],
            weight: !isNaN(weightVal) && weightVal > 0 ? weightVal : 70,
            bmi: !isNaN(bmiVal) && bmiVal >= 5 ? bmiVal : 24,
            calories: !isNaN(calVal) && calVal >= 0 ? calVal : 2000
        };

        const extendedPayload = {
            ...payload,
            type: reportData.type || "progreso",
            notes: reportData.notes || reportData.content || reportData.title || "",
            feeling: reportData.feeling || "",
            observations: reportData.observations || "",
            diagnosis: reportData.diagnosis || "",
            recommendations: Array.isArray(reportData.recommendations) ? reportData.recommendations : [],
            next_steps: reportData.nextSteps || "",
            conclusion: reportData.conclusion || ""
        };

        // Try inserting with all fields first
        const { data, error } = await supabase
            .from("reports")
            .insert(extendedPayload)
            .select()
            .single();

        if (!error) return data;

        // If error is due to missing columns in DB schema, fallback to basic schema
        console.warn("Retrying report insert with basic schema:", error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
            .from("reports")
            .insert(payload)
            .select()
            .single();

        if (fallbackError) throw fallbackError;
        return fallbackData;
    },

    async updateReport(id, reportData) {
        if (!isSupabaseConfigured) return null;

        const weightVal = Number(reportData.weight);
        const bmiVal = Number(reportData.bmi);
        const calVal = Number(reportData.calories);

        const payload = {
            patient_id: Number(reportData.patientId),
            date: reportData.date || new Date().toISOString().split("T")[0],
            weight: !isNaN(weightVal) && weightVal > 0 ? weightVal : 70,
            bmi: !isNaN(bmiVal) && bmiVal >= 5 ? bmiVal : 24,
            calories: !isNaN(calVal) && calVal >= 0 ? calVal : 2000
        };

        const extendedPayload = {
            ...payload,
            type: reportData.type || "progreso",
            notes: reportData.notes || reportData.content || reportData.title || "",
            feeling: reportData.feeling || "",
            observations: reportData.observations || "",
            diagnosis: reportData.diagnosis || "",
            recommendations: Array.isArray(reportData.recommendations) ? reportData.recommendations : [],
            next_steps: reportData.nextSteps || "",
            conclusion: reportData.conclusion || ""
        };

        const { data, error } = await supabase
            .from("reports")
            .update(extendedPayload)
            .eq("id", id)
            .select()
            .single();

        if (!error) return data;

        console.warn("Retrying report update with basic schema:", error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
            .from("reports")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (fallbackError) throw fallbackError;
        return fallbackData;
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
