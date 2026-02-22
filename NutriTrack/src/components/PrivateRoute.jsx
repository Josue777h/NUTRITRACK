import { Navigate } from "react-router-dom";

function PrivateRoute({ isAuthenticated, role, allowedRoles, children }) {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default PrivateRoute;
