import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Validación mejorada de variables de entorno
function validateSupabaseConfig(url, key) {
    if (!url || !key) {
        return { valid: false, error: "Faltan variables de entorno de Supabase" };
    }
    
    if (url === "YOUR_SUPABASE_URL" || key === "YOUR_SUPABASE_ANON_KEY") {
        return { valid: false, error: "Variables de entorno no configuradas (valores por defecto detectados)" };
    }
    
    try {
        new URL(url);
    } catch {
        return { valid: false, error: "URL de Supabase inválida" };
    }
    
    if (key.length < 20) {
        return { valid: false, error: "Anon key de Supabase inválida (demasiado corta)" };
    }
    
    return { valid: true };
}

const validation = validateSupabaseConfig(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = validation.valid;

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    })
    : null;

if (!isSupabaseConfigured) {
    console.warn(
        `NutriTrack: ${validation.error}. Usando LocalStorage/MockData como fallback.`
    );
}
