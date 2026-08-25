import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const MOODS = [
    { key: "excelente", emoji: "⚡", label: "Enérgico", color: "#49b54c" },
    { key: "bien", emoji: "😊", label: "Bien", color: "#382ffd" },
    { key: "regular", emoji: "😐", label: "Normal", color: "#6dd377" },
    { key: "cansado", emoji: "😴", label: "Cansado", color: "#8b5cf6" },
    { key: "antojos", emoji: "🍩", label: "Antojos", color: "#ec4899" }
];

const MEAL_LABELS = {
    desayuno: { label: "Desayuno", icon: "bi-brightness-high-fill", color: "#f59e0b" },
    mediaManana: { label: "Media Mañana", icon: "bi-sun-fill", color: "#6dd377" },
    almuerzo: { label: "Almuerzo", icon: "bi-egg-fried", color: "#49b54c" },
    merienda: { label: "Merienda", icon: "bi-cup-hot-fill", color: "#382ffd" },
    cena: { label: "Cena", icon: "bi-moon-stars-fill", color: "#6366f1" },
    snack: { label: "Snack / Colación", icon: "bi-cookie", color: "#ec4899" }
};

function PatientHabitsTracker({ activePlan }) {
    const { dailyHabits, updateDailyHabits } = useApp();
    const { showSuccess } = useToast();

    const todayStr = new Date().toISOString().split("T")[0];
    const todayHabit = dailyHabits[todayStr] || {
        waterGlasses: 0,
        completedMeals: [],
        mood: "bien",
        energy: 4
    };

    const [water, setWater] = useState(todayHabit.waterGlasses || 0);
    const [completedMeals, setCompletedMeals] = useState(todayHabit.completedMeals || []);
    const [mood, setMood] = useState(todayHabit.mood || "bien");

    // All available meals in the active diet plan
    const activeMealsList = useMemo(() => {
        if (!activePlan?.meals) return [];
        return Object.entries(activePlan.meals)
            .filter(([, foods]) => Array.isArray(foods) && foods.length > 0)
            .map(([mealKey, foods]) => ({
                key: mealKey,
                info: MEAL_LABELS[mealKey] || { label: mealKey, icon: "bi-check2", color: "var(--primary)" },
                foods
            }));
    }, [activePlan]);

    const handleWaterChange = (delta) => {
        const next = Math.max(0, Math.min(16, water + delta));
        setWater(next);
        updateDailyHabits(todayStr, { ...todayHabit, waterGlasses: next });
        if (next === 8) {
            showSuccess("🎉 ¡Felicidades! Has completado tu meta de 2 Litros de agua de hoy.");
        }
    };

    const toggleMeal = (mealKey) => {
        const next = completedMeals.includes(mealKey)
            ? completedMeals.filter((k) => k !== mealKey)
            : [...completedMeals, mealKey];
        
        setCompletedMeals(next);
        updateDailyHabits(todayStr, { ...todayHabit, completedMeals: next });

        if (next.length === activeMealsList.length && activeMealsList.length > 0) {
            showSuccess("🌟 ¡Día perfecto! Has completado todas las comidas de tu plan hoy.");
        }
    };

    const handleMoodSelect = (moodKey) => {
        setMood(moodKey);
        updateDailyHabits(todayStr, { ...todayHabit, mood: moodKey });
        showSuccess(`Estado registrado: ${MOODS.find(m => m.key === moodKey)?.label || ""}`);
    };

    const mealProgressPct = activeMealsList.length
        ? Math.round((completedMeals.length / activeMealsList.length) * 100)
        : 0;

    return (
        <div style={{ display: "grid", gap: "1.25rem" }}>
            
            {/* 1. Track de Hidratación */}
            <div className="panel" style={{ padding: "1.25rem", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                    <div>
                        <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ fontSize: "1.2rem" }}>💧</span> Hidratación Diaria
                        </h4>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                            Meta: 8 vasos (2,000 ml) · Llevas: <strong>{water * 250} ml ({water}/8 vasos)</strong>
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <button
                            type="button"
                            className="btn secondary small"
                            onClick={() => handleWaterChange(-1)}
                            disabled={water <= 0}
                            style={{ width: "32px", height: "32px", padding: 0, justifyContent: "center", fontSize: "1rem", fontWeight: "700" }}
                        >
                            -
                        </button>
                        <button
                            type="button"
                            className="btn success small"
                            onClick={() => handleWaterChange(1)}
                            disabled={water >= 16}
                            style={{ width: "32px", height: "32px", padding: 0, justifyContent: "center", background: "#0ea5e9", border: "none", fontSize: "1rem", fontWeight: "700", color: "#fff" }}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Glasses visual grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "0.4rem" }}>
                    {Array.from({ length: 8 }).map((_, idx) => {
                        const isFilled = idx < water;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleWaterChange(idx < water ? -1 : 1)}
                                title={`Vaso ${idx + 1} (250 ml)`}
                                style={{
                                    height: "38px",
                                    border: isFilled ? "none" : "1px dashed var(--line-strong)",
                                    borderRadius: "var(--radius-sm)",
                                    background: isFilled ? "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)" : "var(--surface-soft)",
                                    color: isFilled ? "#fff" : "var(--muted)",
                                    display: "grid",
                                    placeItems: "center",
                                    cursor: "pointer",
                                    fontSize: "0.85rem",
                                    transition: "all 0.25s ease",
                                    transform: isFilled ? "scale(1.02)" : "scale(1)",
                                    boxShadow: isFilled ? "0 2px 8px rgba(14, 165, 233, 0.25)" : "none"
                                }}
                            >
                                <i className={`bi ${isFilled ? "bi-droplet-fill" : "bi-droplet"}`} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Checklist de Comidas de Hoy */}
            <div className="panel" style={{ padding: "1.25rem", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                        <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ fontSize: "1.2rem" }}>🥗</span> Comidas de Hoy
                        </h4>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                            {completedMeals.length} de {activeMealsList.length} comidas completadas ({mealProgressPct}%)
                        </span>
                    </div>
                    <span className="badge" style={{ background: mealProgressPct === 100 ? "var(--success-soft)" : "var(--primary-soft)", color: mealProgressPct === 100 ? "var(--success)" : "var(--primary-strong)", fontWeight: "700" }}>
                        {mealProgressPct === 100 ? "¡Día completado! 🏆" : `${mealProgressPct}% cumplimiento`}
                    </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: "6px", background: "var(--surface-elevated)", borderRadius: "999px", overflow: "hidden", marginBottom: "1rem" }}>
                    <div
                        style={{
                            height: "100%",
                            width: `${mealProgressPct}%`,
                            background: mealProgressPct === 100 ? "var(--success)" : "var(--primary)",
                            transition: "width 0.4s ease"
                        }}
                    />
                </div>

                {/* Meals list */}
                {activeMealsList.length > 0 ? (
                    <div style={{ display: "grid", gap: "0.6rem" }}>
                        {activeMealsList.map((meal) => {
                            const isDone = completedMeals.includes(meal.key);
                            return (
                                <div
                                    key={meal.key}
                                    onClick={() => toggleMeal(meal.key)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "0.75rem 1rem",
                                        borderRadius: "var(--radius-sm)",
                                        border: isDone ? "1px solid var(--primary)" : "1px solid var(--line)",
                                        background: isDone ? "var(--primary-soft)" : "var(--surface-soft)",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <div style={{
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "50%",
                                            background: isDone ? "var(--primary)" : "var(--surface)",
                                            border: isDone ? "none" : "2px solid var(--line-strong)",
                                            display: "grid",
                                            placeItems: "center",
                                            color: "#fff",
                                            fontSize: "0.8rem",
                                            transition: "all 0.2s ease"
                                        }}>
                                            {isDone && <i className="bi bi-check-lg" />}
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: "0.88rem", color: isDone ? "var(--primary-strong)" : "var(--text)", textDecoration: isDone ? "line-through" : "none" }}>
                                                {meal.info.label}
                                            </strong>
                                            <span style={{ display: "block", fontSize: "0.74rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                                                {meal.foods.map(f => f.name || f).slice(0, 2).join(", ")}
                                                {meal.foods.length > 2 ? ` y ${meal.foods.length - 2} más...` : ""}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                                        {meal.foods[0]?.time || ""}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "1rem 0", fontSize: "0.85rem" }}>
                        Tu nutriólogo no ha cargado comidas en tu plan aún.
                    </p>
                )}
            </div>

            {/* 3. Check-in de Estado de Ánimo */}
            <div className="panel" style={{ padding: "1.25rem", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "var(--text)", margin: 0, marginBottom: "0.3rem" }}>
                    ¿Cómo te sientes hoy?
                </h4>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: "0.85rem" }}>
                    Tu nutriólogo puede ver tu estado anímico para ajustar tu plan y porciones.
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.4rem" }}>
                    {MOODS.map((m) => {
                        const isSelected = mood === m.key;
                        return (
                            <button
                                key={m.key}
                                type="button"
                                onClick={() => handleMoodSelect(m.key)}
                                style={{
                                    padding: "0.6rem 0.3rem",
                                    border: isSelected ? `2px solid ${m.color}` : "1px solid var(--line)",
                                    borderRadius: "var(--radius-sm)",
                                    background: isSelected ? "var(--primary-soft)" : "var(--surface-soft)",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    transition: "all 0.2s ease",
                                    transform: isSelected ? "scale(1.04)" : "scale(1)"
                                }}
                            >
                                <span style={{ fontSize: "1.3rem" }}>{m.emoji}</span>
                                <span style={{ fontSize: "0.72rem", fontWeight: isSelected ? "700" : "500", color: isSelected ? "var(--text)" : "var(--muted)" }}>
                                    {m.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default PatientHabitsTracker;
