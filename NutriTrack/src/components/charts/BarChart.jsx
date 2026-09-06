function BarChart({ labels = [], values = [], color = "#f59e0b" }) {
    if (!values || !values.length) return null;
    const max = Math.max(...values, 1);

    return (
        <div style={{ width: "100%", height: "130px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div
                className="bar-chart"
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: values.length === 1 ? "center" : "space-around",
                    gap: "0.75rem",
                    height: "105px",
                    padding: "0 0.5rem",
                    borderBottom: "1px solid var(--line)"
                }}
            >
                {values.map((value, index) => {
                    const pct = Math.max(12, Math.min(100, Math.round((value / max) * 100)));
                    const label = labels[index] || `#${index + 1}`;
                    return (
                        <article
                            className="bar-item"
                            key={`${label}-${index}-${value}`}
                            style={{
                                flex: values.length === 1 ? "0 1 70px" : 1,
                                maxWidth: "56px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                height: "100%",
                                justifyContent: "flex-end",
                                gap: "0.35rem"
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "0.7rem",
                                    fontWeight: "700",
                                    color: "var(--text)",
                                    opacity: 0.9,
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {value}
                            </span>
                            <div
                                className="bar"
                                style={{
                                    width: "100%",
                                    minWidth: "22px",
                                    height: `${pct}%`,
                                    background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
                                    borderRadius: "5px 5px 2px 2px",
                                    transition: "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: `0 3px 8px ${color}33`
                                }}
                            />
                            <span
                                style={{
                                    fontSize: "0.68rem",
                                    color: "var(--muted)",
                                    fontWeight: "600",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "50px",
                                    marginTop: "2px"
                                }}
                                title={label}
                            >
                                {label}
                            </span>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default BarChart;
