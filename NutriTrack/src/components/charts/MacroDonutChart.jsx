import { useMemo } from "react";

/**
 * MacroDonutChart
 * Visualizes the protein, carbs and fat distribution in an interactive SVG donut chart.
 */
function MacroDonutChart({ calories = 2000, macros, size = 180, showLegend = true }) {
    // Default 30% Protein, 45% Carbs, 25% Fat if not specified
    const calculatedMacros = useMemo(() => {
        const pPct = Number(macros?.protein ?? 30);
        const cPct = Number(macros?.carbs ?? 45);
        const fPct = Number(macros?.fat ?? 25);
        const totalPct = pPct + cPct + fPct || 100;

        const cal = Number(calories) || 2000;
        
        // 1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal
        const pCal = (cal * (pPct / totalPct));
        const cCal = (cal * (cPct / totalPct));
        const fCal = (cal * (fPct / totalPct));

        return {
            protein: { pct: Math.round((pPct / totalPct) * 100), grams: Math.round(pCal / 4), color: "#49b54c", label: "Proteínas" },
            carbs:   { pct: Math.round((cPct / totalPct) * 100), grams: Math.round(cCal / 4), color: "#382ffd", label: "Carbohidratos" },
            fat:     { pct: Math.round((fPct / totalPct) * 100), grams: Math.round(fCal / 9), color: "#6dd377", label: "Grasas" }
        };
    }, [calories, macros]);

    const radius = 64;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;

    const pOffset = 0;
    const pLength = (circumference * calculatedMacros.protein.pct) / 100;

    const cOffset = -pLength;
    const cLength = (circumference * calculatedMacros.carbs.pct) / 100;

    const fOffset = -(pLength + cLength);
    const fLength = (circumference * calculatedMacros.fat.pct) / 100;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <svg width={size} height={size} viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
                    {/* Background Track */}
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke="var(--surface-elevated)"
                        strokeWidth={strokeWidth}
                    />

                    {/* Protein Segment */}
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke={calculatedMacros.protein.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${pLength} ${circumference}`}
                        strokeDashoffset={pOffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />

                    {/* Carbs Segment */}
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke={calculatedMacros.carbs.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${cLength} ${circumference}`}
                        strokeDashoffset={cOffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />

                    {/* Fat Segment */}
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke={calculatedMacros.fat.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${fLength} ${circumference}`}
                        strokeDashoffset={fOffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />
                </svg>

                {/* Center Calorie Label */}
                <div style={{ position: "absolute", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)", lineHeight: 1.1 }}>
                        {calories}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        kcal / día
                    </span>
                </div>
            </div>

            {showLegend && (
                <div style={{ display: "grid", gap: "0.5rem", flex: 1, minWidth: "140px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)" }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: calculatedMacros.protein.color }} />
                            Proteínas
                        </span>
                        <strong style={{ color: "var(--text)" }}>{calculatedMacros.protein.grams}g ({calculatedMacros.protein.pct}%)</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)" }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: calculatedMacros.carbs.color }} />
                            Carbohidratos
                        </span>
                        <strong style={{ color: "var(--text)" }}>{calculatedMacros.carbs.grams}g ({calculatedMacros.carbs.pct}%)</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)" }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: calculatedMacros.fat.color }} />
                            Grasas
                        </span>
                        <strong style={{ color: "var(--text)" }}>{calculatedMacros.fat.grams}g ({calculatedMacros.fat.pct}%)</strong>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MacroDonutChart;
