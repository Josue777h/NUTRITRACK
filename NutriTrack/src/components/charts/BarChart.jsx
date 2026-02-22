function BarChart({ labels, values, color }) {
    const max = Math.max(...values);

    return (
        <div className="bar-chart">
            {values.map((value, index) => (
                <article className="bar-item" key={`${labels[index]}-${value}`}>
                    <div className="bar" style={{ height: `${(value / max) * 100}%`, background: color }} />
                    <span>{labels[index]}</span>
                </article>
            ))}
        </div>
    );
}

export default BarChart;
