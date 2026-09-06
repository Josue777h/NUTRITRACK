function LineChart({ values = [], color = "#49b54c" }) {
    const width = 320;
    const height = 120;
    if (!values || !values.length) return null;

    const padX = 24;
    const padTop = 18;
    const padBottom = 20;
    const plotHeight = height - padTop - padBottom;
    const gradId = `chart-grad-${String(color).replace(/[^a-zA-Z0-9]/g, "")}`;

    // Handle single data point
    if (values.length === 1) {
        const val = values[0];
        const cx = width / 2;
        const cy = height / 2;

        return (
            <div style={{ width: "100%", position: "relative" }}>
                <svg
                    className="chart-svg"
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ width: "100%", height: "130px", overflow: "visible" }}
                >
                    <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    {/* Horizontal Guide */}
                    <line
                        x1={padX}
                        y1={cy}
                        x2={width - padX}
                        y2={cy}
                        stroke="var(--line)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                    />
                    {/* Single measurement highlight */}
                    <circle cx={cx} cy={cy} r="18" fill={color} fillOpacity="0.12" />
                    <circle cx={cx} cy={cy} r="7" fill="var(--surface)" stroke={color} strokeWidth="3" />
                    <circle cx={cx} cy={cy} r="3" fill={color} />
                    <text
                        x={cx}
                        y={cy - 12}
                        textAnchor="middle"
                        fill="var(--text)"
                        fontSize="11"
                        fontWeight="700"
                    >
                        {val}
                    </text>
                    <text
                        x={cx}
                        y={cy + 24}
                        textAnchor="middle"
                        fill="var(--muted)"
                        fontSize="9"
                        fontWeight="500"
                    >
                        Medición inicial
                    </text>
                </svg>
            </div>
        );
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = (width - padX * 2) / (values.length - 1);

    const pointsArray = values.map((value, index) => {
        const x = padX + step * index;
        const y = height - padBottom - ((value - min) / range) * plotHeight;
        return { x, y, value };
    });

    const points = pointsArray.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaPoints = `${padX},${height - 10} ${points} ${width - padX},${height - 10}`;

    return (
        <div style={{ width: "100%", position: "relative" }}>
            <svg
                className="chart-svg"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                style={{ width: "100%", height: "130px", overflow: "visible" }}
            >
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                {/* Horizontal Guides */}
                <line
                    x1={padX}
                    y1={height - 10}
                    x2={width - padX}
                    y2={height - 10}
                    stroke="var(--line)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                />
                <line
                    x1={padX}
                    y1={padTop}
                    x2={width - padX}
                    y2={padTop}
                    stroke="var(--line)"
                    strokeWidth="0.75"
                    strokeDasharray="2 2"
                    opacity="0.5"
                />
                {/* Area Fill */}
                <polygon fill={`url(#${gradId})`} points={areaPoints} />
                {/* Line Path */}
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
                {/* Data Dots with Glow */}
                {pointsArray.map((p, index) => (
                    <g key={`${p.value}-${index}`}>
                        <circle cx={p.x} cy={p.y} r="5" fill="var(--surface)" stroke={color} strokeWidth="2.5" />
                        <circle cx={p.x} cy={p.y} r="2" fill={color} />
                    </g>
                ))}
            </svg>
        </div>
    );
}

export default LineChart;
