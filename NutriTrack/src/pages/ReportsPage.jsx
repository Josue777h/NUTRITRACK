import { useMemo, useState, useEffect } from "react";
import BarChart from "../components/charts/BarChart";
import LineChart from "../components/charts/LineChart";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import ReportModal from "../components/ReportModal";

function formatDate(dateValue) {
    if (!dateValue) return "—";
    const str = String(dateValue).split("T")[0];
    const date = new Date(`${str}T00:00:00`);
    return isNaN(date.getTime()) ? String(dateValue) : date.toLocaleDateString("es-CO", {
        day: "2-digit", month: "short", year: "numeric"
    });
}
function formatMonth(dateValue) {
    if (!dateValue) return "";
    const str = String(dateValue).split("T")[0];
    const date = new Date(`${str}T00:00:00`);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function ReportsPage() {
    const { auth, patients = [], reports = [], addReport, updateReport, removeReport } = useApp();
    const { showSuccess, showWarning, showError } = useToast();
    const isNutri = auth.role === "nutriologo";

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalMode, setModalMode] = useState("view");
    const [selectedPatientId, setSelectedPatientId] = useState(
        isNutri ? String(patients[0]?.id ?? "") : String(auth.patientId ?? "")
    );

    useEffect(() => {
        if (isNutri && patients.length > 0) {
            if (!selectedPatientId || !patients.some((p) => String(p.id) === String(selectedPatientId))) {
                setSelectedPatientId(String(patients[0].id));
            }
        } else if (!isNutri && auth.patientId) {
            setSelectedPatientId(String(auth.patientId));
        }
    }, [isNutri, patients, selectedPatientId, auth.patientId]);

    const patientId = isNutri ? Number(selectedPatientId) : Number(auth.patientId);
    
    // For patient role, always ensure patient object exists so view never fails
    const patient = useMemo(() => {
        const found = (patients || []).find((p) => Number(p.id) === patientId);
        if (found) return found;
        if (!isNutri && auth.patientId) {
            return {
                id: auth.patientId,
                name: auth.fullName || auth.username || "Mi Ficha",
                email: auth.username || ""
            };
        }
        return null;
    }, [patients, patientId, isNutri, auth]);

    const patientReports = useMemo(() =>
        (reports || [])
            .filter((r) => Number(r.patientId ?? r.patient_id) === patientId)
            .sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))),
        [patientId, reports]
    );

    const latest  = patientReports[patientReports.length - 1];
    const labels  = patientReports.map((r) => formatMonth(r.date));
    const weights = patientReports.map((r) => Number(r.weight  || r.metrics?.weight  || 70));
    const bmiVals = patientReports.map((r) => Number(r.bmi     || r.metrics?.bmi     || 24));
    const calVals = patientReports.map((r) => Number(r.calories|| r.metrics?.calories|| 2000));

    const openModal = (mode, report = null) => {
        setSelectedReport(report);
        setModalMode(mode);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedReport(null);
        setModalMode("view");
    };

    const handleSave = async (data) => {
        const flat = {
            ...data,
            patientId: Number(data.patientId),
            date:      data.date || new Date().toISOString().split("T")[0],
            weight:    Number(String(data.weight || data.metrics?.weight || 70).replace(",", ".")),
            bmi:       Number(String(data.bmi || data.metrics?.bmi || 24).replace(",", ".")),
            calories:  Number(String(data.calories || data.metrics?.calories || 2000).replace(",", ".")),
            notes:     data.notes || data.content || data.title || "",
            type:      data.type || "progreso"
        };
        try {
            if (modalMode === "add" || !data.id) {
                await addReport(flat);
                showSuccess("Reporte creado con éxito.");
                if (flat.patientId) {
                    setSelectedPatientId(String(flat.patientId));
                }
            } else {
                await updateReport(data.id, flat);
                showSuccess("Reporte actualizado con éxito.");
            }
            closeModal();
        } catch (error) {
            console.error("Error al procesar reporte:", error);
            showError("Error al procesar reporte: " + (error?.message || ""));
            throw error;
        }
    };

    const handleDelete = (id) => {
        removeReport(id);
        showWarning("Reporte eliminado.");
        closeModal();
    };

    const exportCsv = () => {
        if (!patientReports.length) {
            showWarning("No hay datos para exportar.");
            return;
        }
        const rows = patientReports.map((r) => [r.date, r.weight, r.bmi, r.calories].join(","));
        const csv  = ["fecha,peso,imc,calorias", ...rows].join("\n");
        const a    = Object.assign(document.createElement("a"), {
            href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
            download: `reporte_${(patient?.name ?? "paciente").replaceAll(" ", "_")}.csv`
        });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showSuccess("Reporte exportado en CSV.");
    };

    /* ── Mensaje motivacional para paciente ── */
    const motivationalMsg = () => {
        if (!latest) {
            return {
                icon: "bi-clipboard2-pulse",
                color: "warning",
                text: "Aún no tienes mediciones registradas. Tu nutriólogo añadirá tus reportes clínicos periódicamente."
            };
        }
        const bmi = Number(latest.bmi || 24);
        if (bmi < 18.5) return { icon: "bi-exclamation-triangle-fill", color: "warning", text: "Tu IMC está bajo. Sigue tu plan para mejorar tu nutrición y energía." };
        if (bmi < 25)   return { icon: "bi-emoji-smile-fill",          color: "success", text: "¡Excelente! Tu IMC se encuentra en rango saludable. Sigue con tus buenos hábitos." };
        if (bmi < 30)   return { icon: "bi-graph-down-arrow",          color: "warning", text: "Tu IMC está un poco elevado. Mantén la constancia con tu plan nutricional." };
        return             { icon: "bi-heart-fill",                    color: "danger",  text: "Recuerda seguir tu plan. Pequeños cambios sostenidos generan grandes resultados de salud." };
    };
    const msg = motivationalMsg();

    const initials = (patient?.name || "P")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("");

    return (
        <section className="single-panel">
            <article className="panel">
                {/* ── Header ── */}
                <div className="panel-header">
                    <div>
                        <h3 className="panel-title">
                            {isNutri ? "Evolución nutricional" : "Mi progreso"}
                        </h3>
                        <p className="panel-subtitle">
                            {isNutri
                                ? "Gráficas de peso, IMC y calorías por paciente."
                                : "Así ha evolucionado tu salud y estado nutricional."}
                        </p>
                    </div>
                    <div className="report-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button className="btn secondary" type="button" onClick={() => window.print()}>
                            <i className="bi bi-printer" />
                            Imprimir PDF
                        </button>
                        <button className="btn secondary" type="button" onClick={exportCsv} disabled={!patientReports.length}>
                            <i className="bi bi-download" />
                            Descargar Excel/CSV
                        </button>
                        {isNutri && (
                            <button className="btn" type="button" onClick={() => openModal("add")}>
                                <i className="bi bi-plus-circle" />
                                Nuevo Reporte
                            </button>
                        )}
                    </div>
                </div>

                {/* Selector de paciente (solo nutriólogo) */}
                {isNutri && (
                    <div className="report-patient-selector" style={{ marginBottom: "1rem" }}>
                        <div className="report-patient-info">
                            <div className="report-patient-avatar">
                                {initials}
                            </div>
                            <div>
                                <strong style={{ fontSize: "1rem", color: "var(--text)" }}>
                                    {patient?.name || "Selecciona un paciente"}
                                </strong>
                                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)" }}>
                                    {patient?.email ? `${patient.email} • ` : ""}
                                    {patientReports.length} {patientReports.length === 1 ? "reporte registrado" : "reportes registrados"}
                                </span>
                            </div>
                        </div>

                        <div className="field" style={{ margin: 0, minWidth: "260px" }}>
                            <select
                                id="patientSelect"
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                            >
                                {patients.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Banner motivacional solo para paciente */}
                {!isNutri && msg && (
                    <div className={`report-banner report-banner-${msg.color}`}>
                        <i className={`bi ${msg.icon}`} />
                        <p>{msg.text}</p>
                    </div>
                )}

                {patient ? (
                    <>
                        {/* ── Estadísticas rápidas ── */}
                        {latest ? (
                            <div className="rpt-stats-row">
                                <div className="rpt-stat">
                                    <i className="bi bi-speedometer2" />
                                    <div>
                                        <span>Último peso</span>
                                        <strong>{latest.weight || latest.metrics?.weight || "—"} kg</strong>
                                    </div>
                                </div>
                                <div className="rpt-stat">
                                    <i className="bi bi-activity" />
                                    <div>
                                        <span>IMC</span>
                                        <strong>{latest.bmi || latest.metrics?.bmi || "—"}</strong>
                                    </div>
                                </div>
                                <div className="rpt-stat">
                                    <i className="bi bi-fire" />
                                    <div>
                                        <span>Calorías</span>
                                        <strong>{latest.calories || latest.metrics?.calories || "—"} kcal</strong>
                                    </div>
                                </div>
                                <div className="rpt-stat">
                                    <i className="bi bi-calendar3" />
                                    <div>
                                        <span>Último reporte</span>
                                        <strong>{formatDate(latest.date)}</strong>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rpt-stats-row">
                                <div className="rpt-stat">
                                    <i className="bi bi-speedometer2" />
                                    <div>
                                        <span>Peso inicial</span>
                                        <strong>{patient.weight ? `${patient.weight} kg` : "—"}</strong>
                                    </div>
                                </div>
                                <div className="rpt-stat">
                                    <i className="bi bi-activity" />
                                    <div>
                                        <span>Altura</span>
                                        <strong>{patient.height ? `${patient.height} cm` : "—"}</strong>
                                    </div>
                                </div>
                                <div className="rpt-stat">
                                    <i className="bi bi-bullseye" />
                                    <div>
                                        <span>Objetivo</span>
                                        <strong>{patient.target || "Control nutricional"}</strong>
                                    </div>
                                </div>
                                <div className="rpt-stat">
                                    <i className="bi bi-journal-text" />
                                    <div>
                                        <span>Reportes</span>
                                        <strong>0 registros</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Gráficas Cuadrícula (Responsive 3 columnas) ── */}
                        <div className="report-grid">
                            <div className="report-chart-card">
                                <div className="report-chart-header">
                                    <h4>
                                        <i className="bi bi-speedometer2" style={{ color: "var(--secondary)" }} />
                                        Peso Corporal
                                    </h4>
                                    <span className="report-chart-badge secondary">
                                        {latest?.weight ? `${latest.weight} kg` : "Sin datos"}
                                    </span>
                                </div>
                                <div className="report-chart-body">
                                    {patientReports.length
                                        ? <LineChart values={weights} color="#2563eb" />
                                        : <p className="empty-state">Sin datos de peso</p>}
                                </div>
                            </div>

                            <div className="report-chart-card">
                                <div className="report-chart-header">
                                    <h4>
                                        <i className="bi bi-activity" style={{ color: "var(--primary)" }} />
                                        Evolución IMC
                                    </h4>
                                    <span className="report-chart-badge primary">
                                        {latest?.bmi ? `IMC ${latest.bmi}` : "Sin datos"}
                                    </span>
                                </div>
                                <div className="report-chart-body">
                                    {patientReports.length
                                        ? <LineChart values={bmiVals} color="#16a34a" />
                                        : <p className="empty-state">Sin datos de IMC</p>}
                                </div>
                            </div>

                            <div className="report-chart-card">
                                <div className="report-chart-header">
                                    <h4>
                                        <i className="bi bi-fire" style={{ color: "var(--warning)" }} />
                                        Calorías Objetivo
                                    </h4>
                                    <span className="report-chart-badge warning">
                                        {latest?.calories ? `${latest.calories} kcal` : "Sin datos"}
                                    </span>
                                </div>
                                <div className="report-chart-body">
                                    {patientReports.length
                                        ? <BarChart labels={labels} values={calVals} color="#f59e0b" />
                                        : <p className="empty-state">Sin datos de calorías</p>}
                                </div>
                            </div>
                        </div>

                        {/* ── Historial de reportes ── */}
                        <section className="report-table-section">
                            <div className="report-table-header">
                                <h4>Historial de Reportes Clínicos</h4>
                                {!isNutri && patientReports.length > 0 && (
                                    <button className="btn secondary small" onClick={exportCsv}>
                                        <i className="bi bi-download" />
                                        Descargar CSV
                                    </button>
                                )}
                            </div>
                            <div className="table-wrap">
                                <table className="table report-history-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Tipo</th>
                                            <th>Peso</th>
                                            <th>IMC</th>
                                            <th>Calorías</th>
                                            <th>Notas / Observaciones</th>
                                            <th style={{ textAlign: "right" }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patientReports.length ? (
                                            [...patientReports].reverse().map((report) => (
                                                <tr key={report.id}>
                                                    <td style={{ fontWeight: "600", whiteSpace: "nowrap" }}>{formatDate(report.date)}</td>
                                                    <td>
                                                        <span
                                                            style={{
                                                                display: "inline-block",
                                                                padding: "0.2rem 0.6rem",
                                                                borderRadius: "999px",
                                                                fontSize: "0.75rem",
                                                                fontWeight: "700",
                                                                textTransform: "capitalize",
                                                                background: report.type === "final" ? "var(--accent-soft)" : "var(--primary-soft)",
                                                                color: report.type === "final" ? "var(--accent)" : "var(--primary-strong)"
                                                            }}
                                                        >
                                                            {report.type || "progreso"}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: "nowrap" }}><strong>{report.weight || report.metrics?.weight || 70} kg</strong></td>
                                                    <td style={{ whiteSpace: "nowrap" }}>{report.bmi || report.metrics?.bmi || 24}</td>
                                                    <td style={{ whiteSpace: "nowrap" }}>{report.calories || report.metrics?.calories || 2000} kcal</td>
                                                    <td
                                                        style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-light)" }}
                                                        title={report.notes || report.observations || report.diagnosis || "Sin observaciones adicionales"}
                                                    >
                                                        {report.notes || report.observations || report.diagnosis || "Sin observaciones adicionales"}
                                                    </td>
                                                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                                        <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                                                            <button
                                                                className="btn secondary small"
                                                                type="button"
                                                                onClick={() => openModal("view", report)}
                                                            >
                                                                <i className="bi bi-eye" />
                                                                Ver
                                                            </button>
                                                            {isNutri && (
                                                                <>
                                                                    <button
                                                                        className="btn ghost small"
                                                                        type="button"
                                                                        onClick={() => openModal("edit", report)}
                                                                    >
                                                                        <i className="bi bi-pencil" />
                                                                        Editar
                                                                    </button>
                                                                    <button
                                                                        className="btn danger small"
                                                                        type="button"
                                                                        onClick={() => handleDelete(report.id)}
                                                                    >
                                                                        <i className="bi bi-trash" />
                                                                        Eliminar
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7">
                                                    <div className="empty-state-block" style={{ padding: "2.5rem 1rem" }}>
                                                        <div className="empty-state-icon">
                                                            <i className="bi bi-clipboard-data" />
                                                        </div>
                                                        <h4>Sin reportes aún</h4>
                                                        <p>
                                                            {isNutri
                                                                ? "Crea el primer reporte clínico para registrar la evolución de este paciente."
                                                                : "Tu nutriólogo registrará aquí tu evolución y avances periódicos."}
                                                        </p>
                                                        {isNutri && (
                                                            <button className="btn" onClick={() => openModal("add")} style={{ marginTop: "0.5rem" }}>
                                                                <i className="bi bi-plus-circle" />
                                                                Crear reporte inicial
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                ) : (
                    <div className="empty-state-block" style={{ padding: "3rem 1rem" }}>
                        <div className="empty-state-icon">
                            <i className="bi bi-person-x" />
                        </div>
                        <h4>Sin paciente seleccionado</h4>
                        <p>Selecciona un paciente para ver su evolución nutricional.</p>
                    </div>
                )}
            </article>

            <ReportModal
                report={selectedReport}
                patients={patients}
                defaultPatientId={selectedPatientId}
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSave}
                onDelete={isNutri ? handleDelete : undefined}
                mode={isNutri ? modalMode : "view"}
            />
        </section>
    );
}

export default ReportsPage;
