import { useState, useEffect } from "react";

const LOADING_STEPS = [
    "Inicializando entorno clínico seguro...",
    "Sincronizando pacientes y expedientes...",
    "Optimizando planes y consultas en tiempo real...",
    "Todo listo. Bienvenido a NutriTrack"
];

export default function NutriPreloader({
    message,
    fullScreen = true,
    minDuration = 1100,
    onFinish
}) {
    const [progress, setProgress] = useState(12);
    const [stepIndex, setStepIndex] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 98) {
                    clearInterval(interval);
                    return 100;
                }
                const increment = Math.floor(Math.random() * 14) + 8;
                return Math.min(98, prev + increment);
            });
        }, 140);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (progress > 30 && stepIndex === 0) setStepIndex(1);
        if (progress > 65 && stepIndex === 1) setStepIndex(2);
        if (progress >= 95 && stepIndex === 2) setStepIndex(3);

        if (progress >= 100) {
            const timeout = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => {
                    setIsDone(true);
                    onFinish?.();
                }, 450);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [progress, stepIndex, onFinish]);

    if (isDone) return null;


    const activeMessage = message || LOADING_STEPS[stepIndex];

    return (
        <div
            className={`nutri-preloader-overlay ${fullScreen ? "is-fullscreen" : "is-inline"} ${isExiting ? "is-exiting" : ""}`}
            role="status"
            aria-live="polite"
        >
            {/* Fondo ambiental con gradientes y partículas */}
            <div className="nutri-preloader-ambient-glow" />
            <div className="nutri-preloader-ambient-glow-blue" />
            <div className="nutri-preloader-particles" aria-hidden="true">
                <span className="particle p1" />
                <span className="particle p2" />
                <span className="particle p3" />
                <span className="particle p4" />
                <span className="particle p5" />
            </div>

            {/* Núcleo Central de Animación Tipo Motion Graphics */}
            <div className="nutri-preloader-stage">
                <div className="nutri-preloader-orb-wrapper">
                    {/* Anillos orbitales giratorios multicapa */}
                    <div className="preloader-ring ring-outer" />
                    <div className="preloader-ring ring-middle" />
                    <div className="preloader-ring ring-inner" />
                    
                    {/* Resplandor de energía de fondo */}
                    <div className="preloader-core-glow" />

                    {/* Emblema SVG central interactivo */}
                    <svg
                        className="preloader-svg-logo"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="nutriGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6DD377" />
                                <stop offset="60%" stopColor="#49B54C" />
                                <stop offset="100%" stopColor="#382FFD" />
                            </linearGradient>
                            <linearGradient id="nutriGradAccent" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#382FFD" />
                                <stop offset="100%" stopColor="#49B54C" />
                            </linearGradient>
                            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3.5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Órbita elíptica de energía */}
                        <ellipse
                            cx="50"
                            cy="50"
                            rx="38"
                            ry="20"
                            stroke="url(#nutriGradAccent)"
                            strokeWidth="2.2"
                            strokeDasharray="8 6"
                            className="svg-orbit-ellipse"
                        />

                        {/* Hoja / Silueta clínica con trazo animado */}
                        <path
                            d="M 50 16 C 68 28 78 46 72 68 C 66 84 50 86 50 86 C 50 86 34 84 28 68 C 22 46 32 28 50 16 Z"
                            stroke="url(#nutriGradPrimary)"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="svg-leaf-path"
                            filter="url(#neonGlow)"
                        />

                        {/* Tallo / Pulso vital interior */}
                        <path
                            d="M 50 24 Q 52 48 38 60 M 50 42 Q 54 52 64 56"
                            stroke="#6DD377"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            className="svg-vein-path"
                        />

                        {/* Núcleo brillante pulsante */}
                        <circle
                            cx="50"
                            cy="50"
                            r="4.5"
                            fill="#FFFFFF"
                            filter="url(#neonGlow)"
                            className="svg-energy-core"
                        />
                    </svg>
                </div>

                {/* Marca y Tipografía Cinematográfica */}
                <div className="nutri-preloader-brand">
                    <h2 className="nutri-preloader-title">
                        <span className="brand-text">NUTRITRACK</span>
                        <span className="brand-dot">.</span>
                    </h2>
                    <p className="nutri-preloader-subtitle">
                        PLATAFORMA CLÍNICA NUTRICIONAL
                    </p>
                </div>

                {/* Barra de Progreso y Mensaje Dinámico */}
                <div className="nutri-preloader-progress-box">
                    <div className="nutri-progress-track">
                        <div
                            className="nutri-progress-fill"
                            style={{ width: `${progress}%` }}
                        >
                            <span className="nutri-progress-flare" />
                        </div>
                    </div>

                    <div className="nutri-progress-meta">
                        <span className="nutri-progress-text">
                            <i className="bi bi-shield-check" style={{ marginRight: "0.35rem", color: "var(--primary)" }} />
                            {activeMessage}
                        </span>
                        <span className="nutri-progress-pct">{progress}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
