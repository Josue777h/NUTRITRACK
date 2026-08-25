// Servicio de auditoría y logging estructurado
const AUDIT_STORAGE_KEY = "nutritrack_audit_log";
const MAX_LOG_ENTRIES = 500; // Limitar tamaño del log
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    AUDIT: 4
};

class AuditLogger {
    constructor() {
        this.minLevel = LOG_LEVELS.INFO;
        this.logs = [];
        this.loadLogs();
    }

    loadLogs() {
        try {
            const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (error) {
            console.error("Error loading audit logs:", error);
            this.logs = [];
        }
    }

    saveLogs() {
        try {
            // Mantener solo los últimos MAX_LOG_ENTRIES
            if (this.logs.length > MAX_LOG_ENTRIES) {
                this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
            }
            localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.logs));
        } catch (error) {
            console.error("Error saving audit logs:", error);
        }
    }

    createLogEntry(level, action, details = {}) {
        return {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            level,
            action,
            details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }

    log(level, action, details = {}) {
        if (level < this.minLevel) return;

        const entry = this.createLogEntry(level, action, details);
        this.logs.push(entry);
        this.saveLogs();

        // También enviar a consola para desarrollo
        const levelName = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level);
        // "audit" no es un método de console — mapeamos a los métodos válidos
        const consoleMethodMap = { debug: 'debug', info: 'info', warn: 'warn', error: 'error', audit: 'log' };
        const methodName = consoleMethodMap[levelName?.toLowerCase()] ?? 'log';
        console[methodName](`[${levelName}] ${action}`, details);
    }

    debug(action, details) {
        this.log(LOG_LEVELS.DEBUG, action, details);
    }

    info(action, details) {
        this.log(LOG_LEVELS.INFO, action, details);
    }

    warn(action, details) {
        this.log(LOG_LEVELS.WARN, action, details);
    }

    error(action, details) {
        this.log(LOG_LEVELS.ERROR, action, details);
    }

    // Métodos específicos de auditoría
    audit(action, entityType, entityId, userId, details = {}) {
        this.log(LOG_LEVELS.AUDIT, action, {
            entityType,
            entityId,
            userId,
            ...details
        });
    }

    // Auditoría de acciones del usuario
    auditLogin(userId, email, role) {
        this.audit("USER_LOGIN", "user", userId, userId, {
            email,
            role,
            timestamp: new Date().toISOString()
        });
    }

    auditLogout(userId, email) {
        this.audit("USER_LOGOUT", "user", userId, userId, {
            email,
            timestamp: new Date().toISOString()
        });
    }

    auditPatientAction(action, patientId, patientName, userId) {
        this.audit(`PATIENT_${action}`, "patient", patientId, userId, {
            patientName,
            timestamp: new Date().toISOString()
        });
    }

    auditAppointmentAction(action, appointmentId, patientId, userId) {
        this.audit(`APPOINTMENT_${action}`, "appointment", appointmentId, userId, {
            patientId,
            timestamp: new Date().toISOString()
        });
    }

    auditPlanAction(action, planId, patientId, userId) {
        this.audit(`PLAN_${action}`, "nutrition_plan", planId, userId, {
            patientId,
            timestamp: new Date().toISOString()
        });
    }

    auditReportAction(action, reportId, patientId, userId) {
        this.audit(`REPORT_${action}`, "report", reportId, userId, {
            patientId,
            timestamp: new Date().toISOString()
        });
    }

    // Obtener logs filtrados
    getLogs(filters = {}) {
        let filtered = [...this.logs];

        if (filters.level !== undefined) {
            filtered = filtered.filter(log => log.level === filters.level);
        }

        if (filters.action) {
            filtered = filtered.filter(log => 
                log.action.toLowerCase().includes(filters.action.toLowerCase())
            );
        }

        if (filters.startDate) {
            filtered = filtered.filter(log => 
                new Date(log.timestamp) >= new Date(filters.startDate)
            );
        }

        if (filters.endDate) {
            filtered = filtered.filter(log => 
                new Date(log.timestamp) <= new Date(filters.endDate)
            );
        }

        if (filters.entityType) {
            filtered = filtered.filter(log => 
                log.details.entityType === filters.entityType
            );
        }

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Limpiar logs antiguos
    clearOldLogs(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        this.logs = this.logs.filter(log => 
            new Date(log.timestamp) >= cutoffDate
        );
        this.saveLogs();
    }

    // Exportar logs para análisis
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }

    // Limpiar todos los logs (con precaución)
    clearAllLogs() {
        this.logs = [];
        this.saveLogs();
    }
}

// Instancia singleton
const auditLogger = new AuditLogger();

export default auditLogger;