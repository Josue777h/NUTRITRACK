import { FOOD_LIBRARY } from "../data/foodLibrary";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const LOCAL_STORAGE_CUSTOM_FOODS = "nutritrack_custom_foods";
const LOCAL_STORAGE_FAVORITES = "nutritrack_food_favorites";
const LOCAL_STORAGE_RECENTS = "nutritrack_recent_foods";

// Control de solicitudes concurrentes a API externa
let activeAbortController = null;
const apiCache = new Map();

/**
 * Normaliza cualquier alimento a la estructura estándar de NutriTrack.
 */
export function normalizeFood(raw, source = "library") {
    if (!raw) return null;

    if (source === "openfoodfacts") {
        const nutriments = raw.nutriments || {};
        const servingSizeStr = raw.serving_size || "100g";
        const numericMatch = servingSizeStr.match(/(\d+(\.\d+)?)/);
        const parsedServing = numericMatch ? parseFloat(numericMatch[0]) : 100;
        const servingUnit = servingSizeStr.toLowerCase().includes("ml") ? "ml" : "g";

        const calPer100 = Number(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0);
        const pPer100 = Number(nutriments["proteins_100g"] || nutriments["proteins"] || 0);
        const cPer100 = Number(nutriments["carbohydrates_100g"] || nutriments["carbohydrates"] || 0);
        const fPer100 = Number(nutriments["fat_100g"] || nutriments["fat"] || 0);
        const fibPer100 = Number(nutriments["fiber_100g"] || 0);
        const sugPer100 = Number(nutriments["sugars_100g"] || 0);

        return {
            id: `off-${raw.code || raw.id || Math.random().toString(36).substring(7)}`,
            source: "openfoodfacts",
            name: raw.product_name_es || raw.product_name || "Alimento comercial",
            brand: raw.brands || null,
            category: raw.categories_tags?.[0]?.replace(/^.*?:/, "") || "Comercial",
            image: raw.image_front_small_url || raw.image_url || null,
            servingSize: 100,
            servingUnit: servingUnit,
            calories: Math.round(calPer100),
            protein: +pPer100.toFixed(1),
            carbohydrates: +cPer100.toFixed(1),
            fat: +fPer100.toFixed(1),
            fiber: +fibPer100.toFixed(1),
            sugar: +sugPer100.toFixed(1),
            icon: "🛒",
            isFavorite: false
        };
    }

    // Alimento de biblioteca o personalizado
    return {
        id: String(raw.id),
        source: source,
        name: raw.name,
        brand: raw.brand || null,
        category: raw.category || "General",
        image: raw.image || null,
        servingSize: Number(raw.servingSize || raw.serving_size || 100),
        servingUnit: raw.servingUnit || raw.serving_unit || "g",
        calories: Number(raw.calories || 0),
        protein: Number(raw.protein || 0),
        carbohydrates: Number(raw.carbohydrates || raw.carbs || 0),
        fat: Number(raw.fat || 0),
        fiber: Number(raw.fiber || 0),
        sugar: Number(raw.sugar || 0),
        icon: raw.icon || (source === "custom" ? "✨" : "🥗"),
        isFavorite: Boolean(raw.isFavorite || raw.is_favorite)
    };
}

/**
 * Cálculo proporcional automático según la cantidad y unidad seleccionada.
 */
export function calculatePortionNutrition(food, newQuantity) {
    if (!food) return null;
    const qty = Math.max(0, Number(newQuantity) || 0);
    const base = Number(food.servingSize) || 100;
    const ratio = base > 0 ? qty / base : 1;

    return {
        ...food,
        selectedQty: qty,
        selectedUnit: food.servingUnit,
        calories: Math.round(food.calories * ratio),
        protein: +(food.protein * ratio).toFixed(1),
        carbohydrates: +(food.carbohydrates * ratio).toFixed(1),
        fat: +(food.fat * ratio).toFixed(1),
        fiber: +(food.fiber * ratio).toFixed(1),
        sugar: +(food.sugar * ratio).toFixed(1)
    };
}

export const foodService = {
    /**
     * Búsqueda integral de alimentos: biblioteca local + personalizados + Open Food Facts.
     */
    async searchFoods(query = "", { category = "Todos", includeExternal = true } = {}) {
        const cleanQuery = query.trim().toLowerCase();
        const favoriteIds = this.getFavoriteIds();

        // 1. Obtener alimentos personalizados
        const customFoods = this.getLocalCustomFoods().map((f) => ({
            ...f,
            isFavorite: favoriteIds.has(String(f.id))
        }));

        // 2. Filtrar biblioteca local y personalizados
        const localResults = [];

        // Primero los personalizados
        for (const f of customFoods) {
            if (!cleanQuery || f.name.toLowerCase().includes(cleanQuery) || f.brand?.toLowerCase().includes(cleanQuery)) {
                if (category === "Todos" || f.category === category) {
                    localResults.push(f);
                }
            }
        }

        // Luego la biblioteca estándar curada
        for (const raw of FOOD_LIBRARY) {
            const item = normalizeFood(raw, "library");
            item.isFavorite = favoriteIds.has(item.id);
            if (!cleanQuery || item.name.toLowerCase().includes(cleanQuery) || item.category.toLowerCase().includes(cleanQuery)) {
                if (category === "Todos" || item.category === category) {
                    localResults.push(item);
                }
            }
        }

        // 3. Si la búsqueda tiene al menos 3 caracteres y se solicita API externa, consultar Open Food Facts
        let externalResults = [];
        if (includeExternal && cleanQuery.length >= 3) {
            if (apiCache.has(cleanQuery)) {
                externalResults = apiCache.get(cleanQuery);
            } else {
                try {
                    if (activeAbortController) {
                        activeAbortController.abort();
                    }
                    activeAbortController = new AbortController();

                    const url = `https://es.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=8`;
                    
                    const response = await fetch(url, {
                        signal: activeAbortController.signal,
                        headers: {
                            "User-Agent": "NutriTrackApp - Academic/Clinical Diet Planner - contact@nutritrack.app"
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const products = (data.products || [])
                            .filter((p) => p.product_name && p.nutriments && (p.nutriments["energy-kcal_100g"] !== undefined || p.nutriments["energy-kcal"] !== undefined))
                            .map((p) => {
                                const norm = normalizeFood(p, "openfoodfacts");
                                if (norm) norm.isFavorite = favoriteIds.has(norm.id);
                                return norm;
                            })
                            .filter(Boolean);

                        externalResults = products;
                        apiCache.set(cleanQuery, products);
                    }
                } catch (err) {
                    if (err.name !== "AbortError") {
                        console.warn("NutriTrack: Open Food Facts API error, usando biblioteca local:", err.message);
                    }
                }
            }
        }

        // Combinar resultados: favoritos primero, luego locales curados, luego externos
        const combined = [...localResults, ...externalResults];
        
        // Ordenar con favoritos al principio
        combined.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

        return combined;
    },

    // ── Favoritos ──
    getFavoriteIds() {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_FAVORITES);
            const list = raw ? JSON.parse(raw) : [];
            return new Set(list.map(String));
        } catch {
            return new Set();
        }
    },

    toggleFavorite(foodId) {
        const idStr = String(foodId);
        const ids = this.getFavoriteIds();
        let isNowFavorite = false;

        if (ids.has(idStr)) {
            ids.delete(idStr);
            isNowFavorite = false;
        } else {
            ids.add(idStr);
            isNowFavorite = true;
        }

        localStorage.setItem(LOCAL_STORAGE_FAVORITES, JSON.stringify([...ids]));

        // Si es un alimento personalizado y hay Supabase, actualizar en DB
        if (isSupabaseConfigured && !idStr.startsWith("lib-") && !idStr.startsWith("off-")) {
            supabase
                .from("custom_foods")
                .update({ is_favorite: isNowFavorite })
                .eq("id", Number(idStr))
                .catch((e) => console.warn("Error actualizando favorito en DB:", e));
        }

        return isNowFavorite;
    },

    getFavorites() {
        const ids = this.getFavoriteIds();
        const custom = this.getLocalCustomFoods();
        const allLocal = [
            ...custom,
            ...FOOD_LIBRARY.map((f) => normalizeFood(f, "library"))
        ];

        return allLocal.filter((f) => ids.has(String(f.id)));
    },

    // ── Recientes ──
    getRecentFoods() {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_RECENTS);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    addRecentFood(food) {
        if (!food) return;
        try {
            const current = this.getRecentFoods().filter((f) => f.id !== food.id);
            const updated = [normalizeFood(food, food.source || "library"), ...current].slice(0, 15);
            localStorage.setItem(LOCAL_STORAGE_RECENTS, JSON.stringify(updated));
        } catch (e) {
            console.warn("Error guardando reciente:", e);
        }
    },

    // ── Alimentos Personalizados (Local + Supabase) ──
    getLocalCustomFoods() {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_FOODS);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    async loadCustomFoods(nutriologoId) {
        if (isSupabaseConfigured && nutriologoId) {
            try {
                const { data, error } = await supabase
                    .from("custom_foods")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (!error && data) {
                    const normalized = data.map((d) => normalizeFood(d, "custom"));
                    localStorage.setItem(LOCAL_STORAGE_CUSTOM_FOODS, JSON.stringify(normalized));
                    return normalized;
                }
            } catch (err) {
                console.warn("NutriTrack: Fallback a almacenamiento local para alimentos personalizados:", err);
            }
        }
        return this.getLocalCustomFoods();
    },

    async saveCustomFood(foodData, nutriologoId) {
        let savedFood = {
            id: foodData.id || `custom-${Date.now()}`,
            name: foodData.name.trim(),
            brand: foodData.brand?.trim() || null,
            category: foodData.category || "General",
            servingSize: Number(foodData.servingSize) || 100,
            servingUnit: foodData.servingUnit?.trim() || "g",
            calories: Number(foodData.calories) || 0,
            protein: Number(foodData.protein) || 0,
            carbohydrates: Number(foodData.carbohydrates || foodData.carbs) || 0,
            fat: Number(foodData.fat) || 0,
            fiber: Number(foodData.fiber) || 0,
            sugar: Number(foodData.sugar) || 0,
            icon: "✨",
            isFavorite: Boolean(foodData.isFavorite)
        };

        if (isSupabaseConfigured && nutriologoId) {
            try {
                const dbPayload = {
                    nutriologo_id: nutriologoId,
                    name: savedFood.name,
                    brand: savedFood.brand,
                    category: savedFood.category,
                    serving_size: savedFood.servingSize,
                    serving_unit: savedFood.servingUnit,
                    calories: savedFood.calories,
                    protein: savedFood.protein,
                    carbs: savedFood.carbohydrates,
                    fat: savedFood.fat,
                    fiber: savedFood.fiber,
                    sugar: savedFood.sugar,
                    is_favorite: savedFood.isFavorite
                };

                let res;
                if (foodData.id && !String(foodData.id).startsWith("custom-")) {
                    res = await supabase
                        .from("custom_foods")
                        .update(dbPayload)
                        .eq("id", Number(foodData.id))
                        .select()
                        .single();
                } else {
                    res = await supabase
                        .from("custom_foods")
                        .insert(dbPayload)
                        .select()
                        .single();
                }

                if (res.data) {
                    savedFood = normalizeFood(res.data, "custom");
                }
            } catch (err) {
                console.warn("NutriTrack: No se pudo guardar en Supabase, persistiendo localmente:", err.message);
            }
        }

        // Guardar siempre en local storage
        const current = this.getLocalCustomFoods().filter((f) => f.id !== savedFood.id);
        const updated = [savedFood, ...current];
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_FOODS, JSON.stringify(updated));

        return savedFood;
    },

    async deleteCustomFood(foodId) {
        if (isSupabaseConfigured && !String(foodId).startsWith("custom-")) {
            try {
                await supabase.from("custom_foods").delete().eq("id", Number(foodId));
            } catch (e) {
                console.warn("Error eliminando alimento de Supabase:", e);
            }
        }

        const current = this.getLocalCustomFoods().filter((f) => f.id !== foodId);
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_FOODS, JSON.stringify(current));
        return true;
    }
};
