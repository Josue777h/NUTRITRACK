function LineChart({ values = [], color = "#49b54c", id = "line-grad" }) {
    const width = 320;
    const height = 120;
    if (!values.length) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = width / (values.length - 1 || 1);
    
    const pointsArray = values.map((value, index) => {
        const x = step * index;
        const y = height - 14 - ((value - min) / range) * (height - 32);
        return { x, y, value };
    });

    const points = pointsArray.map((p) => `${p.x},${p.y}`).join(" ");
    const areaPoints = `0,${height - 10} ${points} ${width},${height - 10}`;
    const gradId = `chart-grad-${color.replace("#", "")}`;

    return (
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
            </defs>
            {/* Horizontal Guide */}
            <line x1="0" y1={height - 10} x2={width} y2={height - 10} stroke="var(--line)" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Area Fill */}
            <polygon fill={`url(#${gradId})`} points={areaPoints} />
            {/* Line Path */}
            <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
            {/* Data Dots with Glow */}
            {pointsArray.map((p, index) => (
                <g key={`${p.value}-${index}`}>
                    <circle cx={p.x} cy={p.y} r="5" fill="var(--surface)" stroke={color} strokeWidth="2.5" />
                    <circle cx={p.x} cy={p.y} r="2" fill={color} />
                </g>
            ))}
        </svg>
    );
}

export default LineChart;
