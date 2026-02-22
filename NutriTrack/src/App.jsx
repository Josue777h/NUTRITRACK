import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import AppLayout from "./layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import PlansPage from "./pages/PlansPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import { useApp } from "./context/AppContext";

function App() {
    const navigate = useNavigate();
    const { auth, login, logout } = useApp();

    const handleLogin = (payload) => {
        const result = login(payload);
        if (result.ok) {
            navigate("/dashboard");
        }
        return result;
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const withLayout = (page, allowedRoles) => (
        <PrivateRoute
            isAuthenticated={auth.isAuthenticated}
            role={auth.role}
            allowedRoles={allowedRoles}
        >
            <AppLayout onLogout={handleLogout}>{page}</AppLayout>
        </PrivateRoute>
    );

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Navigate
                        to={auth.isAuthenticated ? "/dashboard" : "/login"}
                        replace
                    />
                }
            />
            <Route
                path="/login"
                element={
                    auth.isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <LoginPage onLogin={handleLogin} />
                    )
                }
            />
            <Route path="/dashboard" element={withLayout(<DashboardPage />)} />
            <Route
                path="/pacientes"
                element={withLayout(<PatientsPage />, ["nutriologo"])}
            />
            <Route path="/citas" element={withLayout(<AppointmentsPage />)} />
            <Route path="/planes" element={withLayout(<PlansPage />)} />
            <Route path="/reportes" element={withLayout(<ReportsPage />)} />
            <Route path="/perfil" element={withLayout(<ProfilePage onLogout={handleLogout} />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
