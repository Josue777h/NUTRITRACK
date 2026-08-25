import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const userService = {
    async getProfile(userId) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
        if (error) throw error;
        return data;
    },
    
    async updateProfile(userId, profileForm) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from("profiles")
            .update({
                full_name: profileForm.fullName,
                phone: profileForm.phone,
                specialty: profileForm.specialty,
                schedule: profileForm.schedule,
                registration: profileForm.registration
            })
            .eq("id", userId);
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async signUp(email, password, role, fullName) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role,
                    full_name: fullName
                }
            }
        });
        if (error) throw error;

        // El trigger handle_new_user crea el perfil en la base de datos. Esto
        // también funciona cuando Supabase exige confirmar el correo primero.
        return data;
    },

    async signOut() {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
    },

    async updatePassword(password) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        return data;
    },

    async resetPassword(email) {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/perfil`
        });
        if (error) throw error;
        return data;
    }
};
