import { describe, expect, it, vi, beforeEach } from "vitest";
import { patientService } from "./patientService";

// Mock de Supabase
const { mockSupabase } = vi.hoisted(() => ({
    mockSupabase: {
        from: vi.fn()
    }
}));

vi.mock("./supabaseClient", () => ({
    supabase: mockSupabase,
    isSupabaseConfigured: true
}));

describe("patientService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getPatients", () => {
        it("debería obtener todos los pacientes sin filtro", async () => {
            const mockPatients = [
                { id: 1, name: "Juan Pérez", email: "juan@example.com" },
                { id: 2, name: "María García", email: "maria@example.com" }
            ];
            
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: mockPatients, error: null })
                })
            });

            const result = await patientService.getPatients();
            expect(result).toEqual(mockPatients);
        });

        it("debería obtener pacientes filtrados por nutriólogo", async () => {
            const mockPatients = [
                { id: 1, name: "Juan Pérez", nutriologo_id: "nutri-123" }
            ];
            
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockPatients, error: null })
                    })
                })
            });

            const result = await patientService.getPatients("nutri-123");
            expect(result).toEqual(mockPatients);
            expect(mockSupabase.from).toHaveBeenCalledWith("patients");
        });
    });

    describe("getPatientById", () => {
        it("debería obtener un paciente por ID", async () => {
            const mockPatient = { id: 1, name: "Juan Pérez", email: "juan@example.com" };
            
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockPatient, error: null })
                    })
                })
            });

            const result = await patientService.getPatientById(1);
            expect(result).toEqual(mockPatient);
        });

        it("debería lanzar error si no encuentra el paciente", async () => {
            const mockError = new Error("Patient not found");
            
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null, error: mockError })
                    })
                })
            });

            await expect(patientService.getPatientById(999)).rejects.toThrow("Patient not found");
        });
    });

    describe("createPatient", () => {
        it("debería crear un paciente correctamente", async () => {
            const mockPatientData = {
                name: "Nuevo Paciente",
                age: 30,
                weight: 70,
                height: 175,
                target: "Perder peso",
                email: "nuevo@example.com"
            };
            
            const mockCreatedPatient = { id: 1, ...mockPatientData };
            
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockCreatedPatient, error: null })
                    })
                })
            });

            const result = await patientService.createPatient(mockPatientData, "nutri-123");
            expect(result).toEqual(mockCreatedPatient);
        });

        it("debería procesar correctamente alergias y condiciones", async () => {
            const mockPatientData = {
                name: "Paciente con Alergias",
                age: 25,
                weight: 65,
                height: 170,
                allergies: ["Lácteos", "Nueces"],
                conditions: ["Diabetes"]
            };
            
            const mockCreatedPatient = { id: 1, ...mockPatientData };
            
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockCreatedPatient, error: null })
                    })
                })
            });

            const result = await patientService.createPatient(mockPatientData, "nutri-123");
            expect(result.allergies).toEqual(["Lácteos", "Nueces"]);
            expect(result.conditions).toEqual(["Diabetes"]);
        });
    });

    describe("updatePatient", () => {
        it("debería actualizar un paciente correctamente", async () => {
            const mockUpdatedData = {
                name: "Juan Pérez Actualizado",
                age: 31,
                weight: 68
            };
            
            const mockUpdatedPatient = { id: 1, ...mockUpdatedData };
            
            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: mockUpdatedPatient, error: null })
                        })
                    })
                })
            });

            const result = await patientService.updatePatient(1, mockUpdatedData);
            expect(result).toEqual(mockUpdatedPatient);
        });
    });

    describe("deletePatient", () => {
        it("debería eliminar un paciente correctamente", async () => {
            mockSupabase.from.mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null })
                })
            });

            const result = await patientService.deletePatient(1);
            expect(result).toBe(true);
        });

        it("debería lanzar error cuando falla la eliminación", async () => {
            const mockError = new Error("Delete failed");
            
            mockSupabase.from.mockReturnValue({
                delete: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: mockError })
                })
            });

            await expect(patientService.deletePatient(1)).rejects.toThrow("Delete failed");
        });
    });
});