import { describe, it, expect, beforeEach, vi } from "vitest";
import { emailService } from "./emailService";

describe("emailService", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("debe rechazar el envío si no se proporciona el correo del paciente", async () => {
        await expect(
            emailService.sendPatientInvite({
                patientName: "Juan",
                patientEmail: "",
                inviteUrl: "http://localhost:5173/register"
            })
        ).rejects.toThrow("El paciente no tiene un correo electrónico registrado.");
    });

    it("debe enviar el correo exitosamente cuando la respuesta de fetch es ok", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => "OK"
        });

        const result = await emailService.sendPatientInvite({
            patientName: "Juan Pérez",
            patientEmail: "juan@example.com",
            inviteUrl: "http://localhost:5173/register?role=paciente&email=juan@example.com"
        });

        if (emailService.isConfigured()) {
            expect(result.success).toBe(true);
            expect(result.message).toContain("juan@example.com");
            expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        } else {
            expect(result.notConfigured).toBe(true);
        }
    });

    it("debe arrojar un error si el endpoint de EmailJS responde con error", async () => {
        if (!emailService.isConfigured()) {
            return;
        }

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 400,
            statusText: "Bad Request",
            text: async () => "Invalid template ID"
        });

        await expect(
            emailService.sendPatientInvite({
                patientName: "Juan Pérez",
                patientEmail: "juan@example.com",
                inviteUrl: "http://localhost:5173/register"
            })
        ).rejects.toThrow("Fallo en el envío del correo: Invalid template ID");
    });

    it("debe generar una URL de invitación con los parámetros correctos", () => {
        const url = emailService.generateInviteUrl({
            email: "maria@example.com",
            name: "María Gómez",
            clinicalCode: "PAC-123",
            documentId: "1098765432",
            nutriologoId: "5"
        });

        expect(url).toContain("/register?");
        expect(url).toContain("role=paciente");
        expect(url).toContain("email=maria%40example.com");
        expect(url).toContain("name=Mar%C3%ADa+G%C3%B3mez");
        expect(url).toContain("code=PAC-123");
        expect(url).toContain("doc=1098765432");
        expect(url).toContain("ref=5");
    });
});
