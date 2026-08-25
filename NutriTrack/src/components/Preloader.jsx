import "./Preloader.css";

export default function Preloader() {
    return (
        <div className="preloader-overlay" role="status" aria-label="Cargando NutriTrack">
            <div className="preloader-box">
                <div className="preloader-logo">
                    <i className="bi bi-heart-pulse-fill" />
                </div>
                <div className="preloader-brand">NutriTrack</div>
                <div className="preloader-dots">
                    <span /><span /><span />
                </div>
            </div>
        </div>
    );
}
