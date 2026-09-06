import { useMemo, useState } from "react";
import BarChart from "../components/charts/BarChart";
import LineChart from "../components/charts/LineChart";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import ReportModal from "../components/ReportModal";

function formatDate(dateValue) {
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
        day: "2-digit", month: "short", year: "numeric"
    });
}
function formatMonth(dateValue) {
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", { month: "short" });
}

function ReportsPage() {
    const { auth, patients, reports, addReport, updateReport, removeReport } = useApp();
    const { showSuccess, showWarning } = useToast();
    const isNutri = auth.role === "nutriologo";

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalMode, setModalMode] = useState("view");
    const [selectedPatientId, setSelectedPatientId] = useState(
        isNutri ? String(patients[0]?.id ?? "") : String(auth.patientId)
    );

    const patientId = isNutri ? Number(selectedPatientId) : Number(auth.patientId);
    const patient   = patients.find((p) => Number(p.id) === patientId);

    const patientReports = useMemo(() =>
        reports
            .filter((r) => Number(r.patientId) === patientId)
            .sort((a, b) => a.date.localeCompare(b.date)),
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
            weight:   Number(data.weight   || data.metrics?.weight   || 70),
            bmi:      Number(data.bmi      || data.metrics?.bmi      || 24),
            calories: Number(data.calories || data.metrics?.calories || 2000),
            notes:    data.notes || data.content || data.title || ""
        };
        try {
            if (modalMode === "add") {
                await addReport(flat);
                showSuccess("Reporte creado.");
            } else {
                await updateReport(data.id, flat);
                showSuccess("Reporte actualizado.");
            }
        } catch (error) {
            console.error("Error al procesar reporte:", error);
        } finally {
            closeModal();
        }
    };

    const handleDelete = (id) => { removeReport(id); showWarning("Reporte eliminado."); closeModal(); };

    const exportCsv = () => {
        if (!patientReports.length) { showWarning("No hay datos para exportar."); return; }
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
        if (!latest) return null;
        const bmi = Number(latest.bmi || 24);
        if (bmi < 18.5) return { icon: "bi-exclamation-triangle-fill", color: "warning", text: "Tu IMC está bajo. Sigue tu plan para mejorar tu nutrición." };
        if (bmi < 25)   return { icon: "bi-emoji-smile-fill",          color: "success", text: "¡Excelente! Tu IMC está en rango saludable. Sigue así." };
        if (bmi < 30)   return { icon: "bi-graph-down-arrow",          color: "warning", text: "Tu IMC está un poco elevado. Tu nutriólogo te ayudará a mejorarlo." };
        return             { icon: "bi-heart-fill",                    color: "danger",  text: "Recuerda seguir tu plan. Pequeños cambios generan grandes resultados." };
    };
    const msg = motivationalMsg();

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
                                : "Así ha evolucionado tu salud desde que empezaste."}
                        </p>
                    </div>
                    <div className="report-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button className="btn secondary" type="button" onClick={() => window.print()}>
                            <i className="bi bi-printer" />
                            Imprimir PDF
                        </button>
                        <button className="btn secondary" type="button" onClick={exportCsv}>
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
                    <div className="field" style={{ maxWidth: "320px" }}>
                        <label htmlFor="patientSelect">
                            <i className="bi bi-person" style={{ marginRight: "0.4rem" }} />
                            Paciente
                        </label>
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
                        {latest && (
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
                        )}

                        {/* ── Gráficas ── */}
                        <div className="report-grid">
                            <div className="stat-card">
                                <h4><i className="bi bi-speedometer2" style={{ marginRight: "0.4rem", color: "var(--secondary)" }} />Peso</h4>
                                {patientReports.length
                                    ? <LineChart values={weights} color="#2563eb" />
                                    : <p className="empty-state">Sin datos de peso</p>}
                            </div>
                            <div className="stat-card">
                                <h4><i className="bi bi-activity" style={{ marginRight: "0.4rem", color: "var(--primary)" }} />IMC</h4>
                                {patientReports.length
                                    ? <LineChart values={bmiVals} color="#16a34a" />
                                    : <p className="empty-state">Sin datos de IMC</p>}
                            </div>
                            <div className="stat-card">
                                <h4><i className="bi bi-fire" style={{ marginRight: "0.4rem", color: "var(--warning)" }} />Calorías</h4>
                                {patientReports.length
                                    ? <BarChart labels={labels} values={calVals} color="#f59e0b" />
                                    : <p className="empty-state">Sin datos de calorías</p>}
                            </div>
                        </div>

                        {/* ── Historial de reportes ── */}
                        <div className="panel">
                            <div className="panel-header">
                                <h4 className="panel-title">Historial de reportes</h4>
                                {/* El paciente puede descargar solo si hay datos */}
                                {!isNutri && patientReports.length > 0 && (
                                    <button className="btn secondary small" onClick={exportCsv}>
                                        <i className="bi bi-download" />
                                        Descargar CSV
                                    </button>
                                )}
                            </div>
                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Peso</th>
                                            <th>IMC</th>
                                            <th>Calorías</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patientReports.length ? (
                                            patientReports.map((report) => (
                                                <tr key={report.id}>
                                                    <td>{formatDate(report.date)}</td>
                                                    <td>{report.weight || report.metrics?.weight || 70} kg</td>
                                                    <td>{report.bmi || report.metrics?.bmi || 24}</td>
                                                    <td>{report.calories || report.metrics?.calories || 2000} kcal</td>
                                                    <td>
                                                        <div className="table-actions">
                                                            <button
                                                                className="btn secondary small"
                                                                type="button"
                                                                onClick={() => openModal("view", report)}
                                                            >
                                                                <i className="bi bi-eye" />
                                                                Ver
                                                            </button>
                                                            {/* Editar y eliminar solo nutriólogo */}
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
                                                <td colSpan="5">
                                                    <div className="empty-state-block">
                                                        <div className="empty-state-icon">
                                                            <i className="bi bi-clipboard-data" />
                                                        </div>
                                                        <h4>Sin reportes aún</h4>
                                                        <p>
                                                            {isNutri
                                                                ? "Crea el primer reporte para este paciente."
                                                                : "Tu nutriólogo registrará aquí tu evolución."}
                                                        </p>
                                                        {isNutri && (
                                                            <button className="btn" onClick={() => openModal("add")}>
                                                                <i className="bi bi-plus-circle" />
                                                                Crear reporte
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="empty-state-block">
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
