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
                clinical_code: patientData.clinical_code || patientData.clinicalCode || null,
                document_id: patientData.document_id || patientData.documentId || null,
                name: patientData.name,
                age: Number(patientData.age),
                weight: Number(patientData.weight),
                height: Number(patientData.height),
                target: patientData.target,
                notes: patientData.notes || "",
                email: patientData.email || null,
                phone: patientData.phone || null,
                gender: patientData.gender || null,
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
        const payload = {
            name: patientData.name,
            age: Number(patientData.age),
            weight: Number(patientData.weight),
            height: Number(patientData.height),
            target: patientData.target,
            notes: patientData.notes || "",
            email: patientData.email || null,
            phone: patientData.phone || null,
            gender: patientData.gender || null,
            user_id: patientData.user_id || null,
            allergies: patientData.allergies || [],
            conditions: patientData.conditions || []
        };
        if (patientData.clinical_code || patientData.clinicalCode) {
            payload.clinical_code = patientData.clinical_code || patientData.clinicalCode;
        }
        if (patientData.document_id !== undefined || patientData.documentId !== undefined) {
            payload.document_id = patientData.document_id || patientData.documentId || null;
        }

        const { data, error } = await supabase
            .from("patients")
            .update(payload)
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
