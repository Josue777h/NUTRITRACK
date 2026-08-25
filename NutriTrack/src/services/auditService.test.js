import { describe, expect, it, beforeEach, afterEach } from "vitest";
import auditLogger from "./auditService";

describe("AuditLogger", () => {
    beforeEach(() => {
        // Limpiar logs antes de cada test
        auditLogger.clearAllLogs();
    });

    afterEach(() => {
        // Limpiar logs después de cada test
        auditLogger.clearAllLogs();
    });

    describe("Creación de logs", () => {
        it("debería crear un log de info correctamente", () => {
            auditLogger.info("TEST_ACTION", { test: "data" });
            const logs = auditLogger.getLogs();
            
            expect(logs).toHaveLength(1);
            expect(logs[0].action).toBe("TEST_ACTION");
            expect(logs[0].details).toEqual({ test: "data" });
            expect(logs[0].level).toBe(1); // INFO level
        });

        it("debería crear un log de error correctamente", () => {
            auditLogger.error("ERROR_ACTION", { error: "test error" });
            const logs = auditLogger.getLogs();
            
            expect(logs).toHaveLength(1);
            expect(logs[0].action).toBe("ERROR_ACTION");
            expect(logs[0].level).toBe(3); // ERROR level
        });

        it("debería crear un log de auditoría correctamente", () => {
            auditLogger.audit("PATIENT_CREATED", "patient", 123, "user-456", {
                patientName: "Test Patient"
            });
            const logs = auditLogger.getLogs();
            
            expect(logs).toHaveLength(1);
            expect(logs[0].action).toBe("PATIENT_CREATED");
            expect(logs[0].details.entityType).toBe("patient");
            expect(logs[0].details.entityId).toBe(123);
            expect(logs[0].details.userId).toBe("user-456");
        });
    });

    describe("Métodos de auditoría específicos", () => {
        it("debería registrar login correctamente", () => {
            auditLogger.auditLogin("user-123", "test@example.com", "nutriologo");
            const logs = auditLogger.getLogs({ action: "USER_LOGIN" });
            
            expect(logs).toHaveLength(1);
            expect(logs[0].details.email).toBe("test@example.com");
            expect(logs[0].details.role).toBe("nutriologo");
        });

        it("debería registrar logout correctamente", () => {
            auditLogger.auditLogout("user-123", "test@example.com");
            const logs = auditLogger.getLogs({ action: "USER_LOGOUT" });
            
            expect(logs).toHaveLength(1);
            expect(logs[0].details.email).toBe("test@example.com");
        });

        it("debería registrar acciones de pacientes correctamente", () => {
            auditLogger.auditPatientAction("CREATED", 1, "Juan Pérez", "nutri-123");
            const logs = auditLogger.getLogs({ action: "PATIENT_CREATED" });
            
            expect(logs).toHaveLength(1);
            expect(logs[0].details.patientName).toBe("Juan Pérez");
        });

        it("debería registrar acciones de citas correctamente", () => {
            auditLogger.auditAppointmentAction("CREATED", 1, 2, "nutri-123");
            const logs = auditLogger.getLogs({ action: "APPOINTMENT_CREATED" });
            
            expect(logs).toHaveLength(1);
            expect(logs[0].details.patientId).toBe(2);
        });
    });

    describe("Filtrado de logs", () => {
        beforeEach(() => {
            auditLogger.info("ACTION_1", { type: "info" });
            auditLogger.error("ACTION_2", { type: "error" });
            auditLogger.audit("ACTION_3", "patient", 1, "user-1");
        });

        it("debería filtrar por nivel", () => {
            const errorLogs = auditLogger.getLogs({ level: 3 });
            expect(errorLogs).toHaveLength(1);
            expect(errorLogs[0].action).toBe("ACTION_2");
        });

        it("debería filtrar por acción", () => {
            const actionLogs = auditLogger.getLogs({ action: "ACTION_1" });
            expect(actionLogs).toHaveLength(1);
            expect(actionLogs[0].action).toBe("ACTION_1");
        });

        it("debería filtrar por tipo de entidad", () => {
            const patientLogs = auditLogger.getLogs({ entityType: "patient" });
            expect(patientLogs).toHaveLength(1);
            expect(patientLogs[0].details.entityType).toBe("patient");
        });
    });

    describe("Limpieza de logs", () => {
        it("debería limpiar logs antiguos correctamente", () => {
            // Crear logs con diferentes fechas
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 40); // 40 días atrás
            
            const recentDate = new Date();
            
            // Simular logs con fechas diferentes
            auditLogger.logs.push({
                id: "old-log",
                timestamp: oldDate.toISOString(),
                level: 1,
                action: "OLD_ACTION",
                details: {}
            });
            
            auditLogger.logs.push({
                id: "recent-log",
                timestamp: recentDate.toISOString(),
                level: 1,
                action: "RECENT_ACTION",
                details: {}
            });
            
            auditLogger.clearOldLogs(30);
            
            const logs = auditLogger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].action).toBe("RECENT_ACTION");
        });

        it("debería limpiar todos los logs", () => {
            auditLogger.info("TEST", {});
            auditLogger.clearAllLogs();
            const logs = auditLogger.getLogs();
            expect(logs).toHaveLength(0);
        });
    });

    describe("Exportación de logs", () => {
        it("debería exportar logs como JSON válido", () => {
            auditLogger.info("TEST_ACTION", { test: "data" });
            const exported = auditLogger.exportLogs();
            
            expect(() => JSON.parse(exported)).not.toThrow();
            const parsed = JSON.parse(exported);
            expect(parsed).toHaveLength(1);
        });
    });
});