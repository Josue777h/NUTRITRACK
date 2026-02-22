function LineChart({ values, color }) {
    const width = 320;
    const height = 120;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = width / (values.length - 1 || 1);
    const points = values
        .map((value, index) => {
            const x = step * index;
            const y = height - 10 - ((value - min) / range) * (height - 24);
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <line x1="0" y1={height - 10} x2={width} y2={height - 10} stroke="#d7e2d7" strokeWidth="2" />
            <polyline fill="none" stroke={color} strokeWidth="3" points={points} />
            {values.map((value, index) => {
                const x = step * index;
                const y = height - 10 - ((value - min) / range) * (height - 24);
                return <circle key={`${value}-${index}`} cx={x} cy={y} r="4.5" fill={color} />;
            })}
        </svg>
    );
}

export default LineChart;
