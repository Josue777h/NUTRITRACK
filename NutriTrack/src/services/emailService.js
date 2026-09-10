/**
 * Servicio de Envío de Correos Automáticos para NutriTrack.
 * Utiliza EmailJS para envío directo de emails transaccionales sin requerir servidor backend.
 */

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

export const isEmailServiceConfigured = Boolean(
    EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY
);

/**
 * Obtiene la URL base de la aplicación.
 * Si se define VITE_APP_URL en .env.local, se usa esa URL (útil para pruebas en red local con celular o producción).
 * De lo contrario, usa el origen actual del navegador (window.location.origin) o localhost:5173 por defecto.
 */
export function getAppBaseUrl() {
    const envUrl = import.meta.env.VITE_APP_URL || "";
    if (envUrl.trim()) {
        return envUrl.trim().replace(/\/+$/, "");
    }
    if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, "");
    }
    return "http://localhost:5173";
}

/**
 * Genera el enlace seguro de activación y registro para el paciente.
 */
export function generateInviteUrl({ email = "", name = "", clinicalCode = "", documentId = "", nutriologoId = "" } = {}) {
    const baseUrl = getAppBaseUrl();
    const params = new URLSearchParams();
    params.set("role", "paciente");
    if (email) params.set("email", email);
    if (name) params.set("name", name);
    if (clinicalCode) params.set("code", clinicalCode);
    if (documentId) params.set("doc", documentId);
    if (nutriologoId) params.set("ref", nutriologoId);

    return `${baseUrl}/register?${params.toString()}`;
}

export const emailService = {
    isConfigured() {
        return isEmailServiceConfigured;
    },
    getBaseUrl: getAppBaseUrl,
    generateInviteUrl,

    /**
     * Envía automáticamente el correo de invitación al paciente con su enlace único.
     */
    async sendPatientInvite({ patientName, patientEmail, inviteUrl, nutriologoName, clinicalCode, nutriologoId }) {
        if (!patientEmail) {
            throw new Error("El paciente no tiene un correo electrónico registrado.");
        }

        if (!isEmailServiceConfigured) {
            return {
                success: false,
                notConfigured: true,
                message: "EmailJS no está configurado en las variables de entorno (.env.local)."
            };
        }

        const effectiveInviteUrl = inviteUrl || generateInviteUrl({
            email: patientEmail,
            name: patientName,
            clinicalCode,
            nutriologoId
        });

        const templateParams = {
            to_name: patientName || "Paciente",
            to_email: patientEmail,
            invite_link: effectiveInviteUrl,
            nutriologo_name: nutriologoName || "Tu Nutriólogo",
            clinical_code: clinicalCode || "PACIENTE",
            app_name: "NutriTrack",
            login_url: `${getAppBaseUrl()}/login`,
            SiteURL: getAppBaseUrl(),
            Email: patientEmail
        };

        const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                template_params: templateParams
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Fallo en el envío del correo: ${errText || response.statusText}`);
        }

        return {
            success: true,
            message: `Correo enviado exitosamente a ${patientEmail}`
        };
    }
};
