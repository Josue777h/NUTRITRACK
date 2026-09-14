import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NutriPreloader from "./NutriPreloader";

describe("NutriPreloader", () => {
    it("renders brand title and initial loading status", () => {
        render(<NutriPreloader />);
        expect(screen.getByText("NUTRITRACK")).toBeInTheDocument();
        expect(screen.getByText(/PLATAFORMA CLÍNICA NUTRICIONAL/i)).toBeInTheDocument();
    });

    it("displays custom message when provided", () => {
        render(<NutriPreloader message="Sincronizando base de datos clínica..." />);
        expect(screen.getByText("Sincronizando base de datos clínica...")).toBeInTheDocument();
    });
});
