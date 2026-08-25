import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import AppLayout from "./layout/AppLayout";
import { useApp } from "./context/AppContext";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PatientsPage = lazy(() => import("./pages/PatientsPage"));
const AppointmentsPage = lazy(() => import("./pages/AppointmentsPage"));
const PlansPage = lazy(() => import("./pages/PlansPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageLoader() {
    return <main className="route-loading" role="status">Cargando…</main>;
}

function App() {
    const navigate = useNavigate();
    const { auth, login, logout } = useApp();

    const handleLogin = async (payload) => {
        const result = await login(payload);
        if (result.ok) {
            navigate("/dashboard");
        }
        return result;
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const withSuspense = (page) => (
        <Suspense fallback={<PageLoader />}>{page}</Suspense>
    );

    const withLayout = (page, allowedRoles) => (
        <PrivateRoute
            isAuthenticated={auth.isAuthenticated}
            role={auth.role}
            allowedRoles={allowedRoles}
        >
            <AppLayout onLogout={handleLogout}>{withSuspense(page)}</AppLayout>
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
                        withSuspense(<LoginPage onLogin={handleLogin} />)
                    )
                }
            />
            <Route
                path="/register"
                element={
                    auth.isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        withSuspense(<RegisterPage />)
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
            <Route path="/configuracion" element={withLayout(<ProfilePage onLogout={handleLogout} defaultTab="configuracion" />)} />
            <Route path="*" element={withSuspense(<NotFoundPage />)} />
        </Routes>
    );
}

export default App;
