import { describe, it, expect, beforeEach, vi } from 'vitest';
import { foodService, normalizeFood, calculatePortionNutrition } from './foodService';

describe('foodService & Nutrition Calculations', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe('calculatePortionNutrition (Cálculo Proporcional)', () => {
        const referenceFood = {
            id: 'test-1',
            name: 'Pechuga de pollo',
            servingSize: 100,
            servingUnit: 'g',
            calories: 165,
            protein: 31.0,
            carbohydrates: 0,
            fat: 3.6,
            fiber: 0,
            sugar: 0
        };

        it('debe calcular exactamente los valores proporcionales al aumentar la cantidad (ej. 150g)', () => {
            const calculated = calculatePortionNutrition(referenceFood, 150);
            expect(calculated.calories).toBe(248); // 165 * 1.5 = 247.5 -> Math.round 248
            expect(calculated.protein).toBe(46.5); // 31 * 1.5 = 46.5
            expect(calculated.carbohydrates).toBe(0);
            expect(calculated.fat).toBe(5.4); // 3.6 * 1.5 = 5.4
        });

        it('debe calcular valores proporcionales para porciones reducidas (ej. 50g)', () => {
            const calculated = calculatePortionNutrition(referenceFood, 50);
            expect(calculated.calories).toBe(83); // 165 * 0.5 = 82.5 -> Math.round 83
            expect(calculated.protein).toBe(15.5);
            expect(calculated.fat).toBe(1.8);
        });

        it('debe manejar cantidades cero o negativas de forma segura', () => {
            const calculated = calculatePortionNutrition(referenceFood, 0);
            expect(calculated.calories).toBe(0);
            expect(calculated.protein).toBe(0);
        });
    });

    describe('normalizeFood (Normalización Estándar)', () => {
        it('debe normalizar productos de Open Food Facts correctamente', () => {
            const mockOffProduct = {
                code: '7702001',
                product_name_es: 'Avena en Hojuelas',
                brands: 'Quaker',
                serving_size: '100g',
                nutriments: {
                    'energy-kcal_100g': 380,
                    'proteins_100g': 14.5,
                    'carbohydrates_100g': 67.2,
                    'fat_100g': 6.8,
                    'fiber_100g': 9.5,
                    'sugars_100g': 1.2
                }
            };

            const normalized = normalizeFood(mockOffProduct, 'openfoodfacts');
            expect(normalized.id).toContain('7702001');
            expect(normalized.name).toBe('Avena en Hojuelas');
            expect(normalized.brand).toBe('Quaker');
            expect(normalized.calories).toBe(380);
            expect(normalized.protein).toBe(14.5);
            expect(normalized.carbohydrates).toBe(67.2);
            expect(normalized.fat).toBe(6.8);
        });

        it('debe normalizar alimentos de biblioteca local manteniendo sus campos', () => {
            const raw = {
                id: 'lib-huevo',
                name: 'Huevo entero',
                servingSize: 1,
                servingUnit: 'unidad',
                calories: 72,
                protein: 6.3,
                carbs: 0.4,
                fat: 4.8
            };

            const normalized = normalizeFood(raw, 'library');
            expect(normalized.id).toBe('lib-huevo');
            expect(normalized.name).toBe('Huevo entero');
            expect(normalized.calories).toBe(72);
            expect(normalized.protein).toBe(6.3);
            expect(normalized.carbohydrates).toBe(0.4);
            expect(normalized.fat).toBe(4.8);
        });
    });

    describe('Gestión de Favoritos', () => {
        it('debe alternar favorito correctamente (agregar y remover)', () => {
            const foodId = 'lib-platano';
            expect(foodService.getFavoriteIds().has(foodId)).toBe(false);

            const isFav1 = foodService.toggleFavorite(foodId);
            expect(isFav1).toBe(true);
            expect(foodService.getFavoriteIds().has(foodId)).toBe(true);

            const isFav2 = foodService.toggleFavorite(foodId);
            expect(isFav2).toBe(false);
            expect(foodService.getFavoriteIds().has(foodId)).toBe(false);
        });
    });

    describe('Alimentos Personalizados (Custom Foods)', () => {
        it('debe crear y almacenar un alimento personalizado en localStorage', async () => {
            const newFood = {
                name: 'Batido Proteico Casero',
                servingSize: 300,
                servingUnit: 'ml',
                calories: 350,
                protein: 30,
                carbohydrates: 40,
                fat: 10,
                isFavorite: true
            };

            const saved = await foodService.saveCustomFood(newFood, null);
            expect(saved.id).toBeDefined();
            expect(saved.name).toBe('Batido Proteico Casero');

            const allCustom = foodService.getLocalCustomFoods();
            expect(allCustom.length).toBe(1);
            expect(allCustom[0].name).toBe('Batido Proteico Casero');
        });

        it('debe eliminar un alimento personalizado', async () => {
            const food = await foodService.saveCustomFood({
                name: 'Té Matcha con Leche',
                calories: 80,
                protein: 2
            });

            expect(foodService.getLocalCustomFoods().length).toBe(1);
            await foodService.deleteCustomFood(food.id);
            expect(foodService.getLocalCustomFoods().length).toBe(0);
        });
    });

    describe('Búsqueda de Alimentos (searchFoods)', () => {
        it('debe encontrar alimentos de la biblioteca local por nombre parcial en español', async () => {
            const results = await foodService.searchFoods('pollo', { includeExternal: false });
            expect(results.length).toBeGreaterThan(0);
            expect(results.some((f) => f.name.toLowerCase().includes('pollo'))).toBe(true);
        });

        it('debe filtrar por categoría cuando se especifica', async () => {
            const results = await foodService.searchFoods('', { category: 'Frutas', includeExternal: false });
            expect(results.length).toBeGreaterThan(0);
            results.forEach((f) => {
                expect(f.category).toBe('Frutas');
            });
        });
    });
});
