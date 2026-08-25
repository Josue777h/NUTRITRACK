import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            textAlign: "center",
            padding: "2rem"
        }}>
            <h1 style={{ fontSize: "4rem", marginBottom: "1rem", color: "var(--primary)" }}>404</h1>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--text)" }}>
                Página no encontrada
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: "2rem", maxWidth: "400px" }}>
                Lo sentimos, la página que intentas visitar no existe o ha sido movida.
            </p>
            <Link 
                to="/dashboard" 
                className="button"
                style={{ 
                    background: "var(--primary)", 
                    color: "white", 
                    textDecoration: "none", 
                    padding: "0.75rem 1.5rem", 
                    borderRadius: "var(--radius)",
                    fontWeight: "bold",
                    display: "inline-block"
                }}
            >
                Volver al Inicio
            </Link>
        </div>
    );
}
