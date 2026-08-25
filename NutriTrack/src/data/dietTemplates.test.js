import { describe, expect, it } from "vitest";
import { PRESET_DIET_TEMPLATES } from "./dietTemplates";

describe("dietTemplates", () => {
    it("debe contener plantillas preconfiguradas válidas", () => {
        expect(PRESET_DIET_TEMPLATES.length).toBeGreaterThan(0);
        PRESET_DIET_TEMPLATES.forEach((tpl) => {
            expect(tpl.name).toBeDefined();
            expect(tpl.calories).toBeGreaterThan(500);
            expect(tpl.meals).toBeDefined();
            expect(Array.isArray(tpl.meals.desayuno)).toBe(true);
        });
    });

    it("debe incluir opciones populares como Déficit, Mantenimiento, Hipertrofia y Keto", () => {
        const ids = PRESET_DIET_TEMPLATES.map((t) => t.id);
        expect(ids).toContain("tpl-deficit-1500");
        expect(ids).toContain("tpl-balanced-2000");
        expect(ids).toContain("tpl-hypertrophy-2600");
        expect(ids).toContain("tpl-keto-1800");
    });
});
