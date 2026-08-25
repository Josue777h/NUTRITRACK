import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const nutritionPlanService = {
    async getPlans(patientIds = []) {
        if (!isSupabaseConfigured) return [];
        let query = supabase.from("nutrition_plans").select("*");
        const ids = Array.isArray(patientIds) ? patientIds : [patientIds];
        if (ids.length === 1) {
            query = query.eq("patient_id", ids[0]);
        } else if (ids.length > 1) {
            query = query.in("patient_id", ids);
        }
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        return data;
    },

    async createPlan(planData) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("nutrition_plans")
            .insert({
                patient_id: Number(planData.patientId),
                name: planData.name,
                target: planData.target,
                calories: Number(planData.calories),
                duration: Number(planData.duration),
                meals: planData.meals || {
                    desayuno: [],
                    mediaManana: [],
                    almuerzo: [],
                    merienda: [],
                    cena: [],
                    snack: []
                }
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updatePlan(id, planData) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("nutrition_plans")
            .update({
                patient_id: Number(planData.patientId),
                name: planData.name,
                target: planData.target,
                calories: Number(planData.calories),
                duration: Number(planData.duration),
                meals: planData.meals
            })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deletePlan(id) {
        if (!isSupabaseConfigured) return null;
        const { error } = await supabase
            .from("nutrition_plans")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return true;
    }
};
