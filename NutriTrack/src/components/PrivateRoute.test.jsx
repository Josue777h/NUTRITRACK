import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PrivateRoute from "./PrivateRoute";

function renderRoute({ isAuthenticated, role, allowedRoles }) {
    render(
        <MemoryRouter initialEntries={["/private"]}>
            <Routes>
                <Route path="/login" element={<p>Login</p>} />
                <Route path="/dashboard" element={<p>Dashboard</p>} />
                <Route
                    path="/private"
                    element={
                        <PrivateRoute
                            isAuthenticated={isAuthenticated}
                            role={role}
                            allowedRoles={allowedRoles}
                        >
                            <p>Contenido privado</p>
                        </PrivateRoute>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
}

describe("PrivateRoute", () => {
    it("redirects unauthenticated visitors to login", () => {
        renderRoute({ isAuthenticated: false, role: null });
        expect(screen.getByText("Login")).toBeInTheDocument();
    });

    it("redirects users without the required role to the dashboard", () => {
        renderRoute({ isAuthenticated: true, role: "usuario", allowedRoles: ["nutriologo"] });
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders protected content for an authorized user", () => {
        renderRoute({ isAuthenticated: true, role: "nutriologo", allowedRoles: ["nutriologo"] });
        expect(screen.getByText("Contenido privado")).toBeInTheDocument();
    });
});
