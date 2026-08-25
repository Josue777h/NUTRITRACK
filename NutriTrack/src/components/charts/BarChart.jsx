function BarChart({ labels = [], values = [], color = "#49b54c" }) {
    if (!values.length) return null;
    const max = Math.max(...values, 1);

    return (
        <div className="bar-chart" style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", height: "130px", padding: "0.5rem 0.25rem 0" }}>
            {values.map((value, index) => {
                const pct = Math.max(8, Math.min(100, Math.round((value / max) * 100)));
                return (
                    <article className="bar-item" key={`${labels[index]}-${value}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--muted)", opacity: 0.85 }}>{value}</span>
                        <div
                            className="bar"
                            style={{
                                width: "100%",
                                maxWidth: "36px",
                                height: `${pct}%`,
                                background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
                                borderRadius: "6px 6px 2px 2px",
                                transition: "height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: `0 2px 8px ${color}33`
                            }}
                        />
                        <span style={{ fontSize: "0.72rem", color: "var(--text-light)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "48px" }}>
                            {labels[index]}
                        </span>
                    </article>
                );
            })}
        </div>
    );
}

export default BarChart;

