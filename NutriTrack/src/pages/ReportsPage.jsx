import { useMemo, useState } from "react";
import BarChart from "../components/charts/BarChart";
import LineChart from "../components/charts/LineChart";
import { useApp } from "../context/AppContext";

function formatMonth(dateValue) {
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("es-CO", {
        month: "short"
    });
}

function ReportsPage() {
    const { auth, patients, reports, addReport } = useApp();
    const [selectedPatientId, setSelectedPatientId] = useState(
        auth.role === "usuario" ? String(auth.patientId) : String(patients[0]?.id ?? "")
    );
    const [feedback, setFeedback] = useState("");
    const [form, setForm] = useState({
        date: "",
        weight: "",
        bmi: "",
        calories: ""
    });

    const patientId = auth.role === "usuario" ? auth.patientId : Number(selectedPatientId);
    const patient = patients.find((item) => item.id === patientId);

    const patientReports = useMemo(() => {
        return reports
            .filter((item) => item.patientId === patientId)
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [patientId, reports]);

    const latest = patientReports[patientReports.length - 1];
    const labels = patientReports.map((item) => formatMonth(item.date));
    const weights = patientReports.map((item) => item.weight);
    const bmiValues = patientReports.map((item) => item.bmi);
    const calories = patientReports.map((item) => item.calories);

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddReport = (event) => {
        event.preventDefault();
        if (!patientId || !form.date || !form.weight || !form.bmi || !form.calories) {
            setFeedback("Completa todos los campos para registrar seguimiento.");
            return;
        }
        addReport({
            patientId,
            date: form.date,
            weight: form.weight,
            bmi: form.bmi,
            calories: form.calories
        });
        setForm({ date: "", weight: "", bmi: "", calories: "" });
        setFeedback("Seguimiento registrado correctamente.");
    };

    const exportCsv = () => {
        if (!patientReports.length) {
            setFeedback("No hay datos para exportar.");
            return;
        }

        const header = "fecha,peso,imc,calorias";
        const rows = patientReports.map((item) =>
            [item.date, item.weight, item.bmi, item.calories].join(",")
        );
        const csvContent = [header, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `reporte_${(patient?.name ?? "paciente").replaceAll(" ", "_")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setFeedback("Reporte exportado en CSV.");
    };

    return (
        <section className="split-layout">
            <article className="panel">
                <div className="panel-header">
                    <div>
                        <h3 className="panel-title">Evolucion nutricional</h3>
                        <p className="panel-subtitle">
                            Graficas dinamicas de peso, IMC y calorias por paciente.
                        </p>
                    </div>
                    <div className="report-actions">
                        <button className="btn secondary" type="button" onClick={() => window.print()}>
                            <i className="bi bi-printer" />
                            Imprimir
                        </button>
                        <button className="btn" type="button" onClick={exportCsv}>
                            <i className="bi bi-download" />
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {auth.role === "nutriologo" ? (
                    <div className="field compact-field">
                        <label htmlFor="selectedPatientId">Paciente para analisis</label>
                        <select
                            id="selectedPatientId"
                            value={selectedPatientId}
                            onChange={(event) => setSelectedPatientId(event.target.value)}
                        >
                            {patients.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}

                <div className="report-grid">
                    <article className="chart-box">
                        <h4>Peso (kg)</h4>
                        <p>Ultimos controles</p>
                        {weights.length ? (
                            <LineChart values={weights} color="#2f7f73" />
                        ) : (
                            <p className="empty-state">Sin registros</p>
                        )}
                    </article>
                    <article className="chart-box">
                        <h4>IMC</h4>
                        <p>Tendencia mensual</p>
                        {bmiValues.length ? (
                            <BarChart labels={labels} values={bmiValues} color="#4a7898" />
                        ) : (
                            <p className="empty-state">Sin registros</p>
                        )}
                    </article>
                    <article className="chart-box">
                        <h4>Calorias promedio</h4>
                        <p>Consumo reportado</p>
                        {calories.length ? (
                            <LineChart values={calories} color="#2e5f8b" />
                        ) : (
                            <p className="empty-state">Sin registros</p>
                        )}
                    </article>
                </div>

                <div className="details-box">
                    <h4>Resumen actual</h4>
                    {latest ? (
                        <div className="details-grid">
                            <article>
                                <span>Paciente</span>
                                <strong>{patient?.name}</strong>
                            </article>
                            <article>
                                <span>Ultimo peso</span>
                                <strong>{latest.weight} kg</strong>
                            </article>
                            <article>
                                <span>Ultimo IMC</span>
                                <strong>{latest.bmi}</strong>
                            </article>
                            <article>
                                <span>Calorias</span>
                                <strong>{latest.calories} kcal</strong>
                            </article>
                        </div>
                    ) : (
                        <p className="empty-state">No hay datos para este paciente.</p>
                    )}
                </div>
            </article>

            <article className="panel">
                <div className="panel-header">
                    <h3 className="panel-title">
                        {auth.role === "nutriologo" ? "Registrar seguimiento" : "Registrar mi avance"}
                    </h3>
                </div>
                {feedback ? <p className="alert-inline success">{feedback}</p> : null}
                <form className="form-grid" onSubmit={handleAddReport}>
                    <div className="field">
                        <label>Paciente</label>
                        <input value={patient?.name ?? "Sin paciente"} readOnly />
                    </div>
                    <div className="field">
                        <label htmlFor="date">Fecha</label>
                        <input id="date" name="date" type="date" value={form.date} onChange={handleFormChange} />
                    </div>
                    <div className="field">
                        <label htmlFor="weight">Peso (kg)</label>
                        <input
                            id="weight"
                            name="weight"
                            type="number"
                            step="0.1"
                            value={form.weight}
                            onChange={handleFormChange}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="bmi">IMC</label>
                        <input
                            id="bmi"
                            name="bmi"
                            type="number"
                            step="0.1"
                            value={form.bmi}
                            onChange={handleFormChange}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="calories">Calorias (kcal)</label>
                        <input
                            id="calories"
                            name="calories"
                            type="number"
                            value={form.calories}
                            onChange={handleFormChange}
                        />
                    </div>
                    <button type="submit" className="btn">
                        Guardar seguimiento
                    </button>
                </form>
            </article>
        </section>
    );
}

export default ReportsPage;
