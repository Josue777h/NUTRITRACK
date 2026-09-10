import { useState, useEffect, useRef, useMemo } from "react";
import Modal from "./Modal";
import { foodService, calculatePortionNutrition } from "../services/foodService";
import { FOOD_CATEGORIES } from "../data/foodLibrary";
import CustomFoodModal from "./CustomFoodModal";
import { useToast } from "../context/ToastContext";

function FoodSearchModal({ isOpen, onClose, onSelectFood, targetMealName = "Comida" }) {
    const { showSuccess } = useToast();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [activeTab, setActiveTab] = useState("all"); // 'all', 'favorites', 'recents', 'custom'
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Alimento actualmente seleccionado para ajustar porción
    const [selectedFood, setSelectedFood] = useState(null);
    const [selectedQty, setSelectedQty] = useState("100");
    const [selectedUnit, setSelectedUnit] = useState("g");
    const [foodNotes, setFoodNotes] = useState("");

    // Modal para crear alimento personalizado
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

    const debounceTimerRef = useRef(null);

    // Cargar resultados iniciales al abrir
    useEffect(() => {
        if (!isOpen) return;
        setSearchQuery("");
        setSelectedCategory("Todos");
        setActiveTab("all");
        setSelectedFood(null);
        executeSearch("", "Todos", "all");
    }, [isOpen]);

    const executeSearch = async (query, cat, tab) => {
        setIsLoading(true);

        if (tab === "favorites") {
            const favs = foodService.getFavorites();
            setResults(favs);
            setIsLoading(false);
            return;
        }

        if (tab === "recents") {
            const recents = foodService.getRecentFoods();
            setResults(recents);
            setIsLoading(false);
            return;
        }

        if (tab === "custom") {
            const custom = foodService.getLocalCustomFoods();
            setResults(custom);
            setIsLoading(false);
            return;
        }

        try {
            const data = await foodService.searchFoods(query, {
                category: cat,
                includeExternal: true
            });
            setResults(data);
        } catch (err) {
            console.warn("Error en búsqueda de alimentos:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            executeSearch(val, selectedCategory, activeTab);
        }, 350);
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        executeSearch(searchQuery, selectedCategory, tab);
    };

    const handleCategoryClick = (cat) => {
        setSelectedCategory(cat);
        executeSearch(searchQuery, cat, activeTab);
    };

    const handlePickFood = (food) => {
        setSelectedFood(food);
        setSelectedQty(String(food.servingSize || 100));
        setSelectedUnit(food.servingUnit || "g");
        setFoodNotes("");
    };

    const handleToggleFavorite = (e, food) => {
        e.stopPropagation();
        const isFav = foodService.toggleFavorite(food.id);
        setResults((prev) =>
            prev.map((f) => (f.id === food.id ? { ...f, isFavorite: isFav } : f))
        );
        if (selectedFood?.id === food.id) {
            setSelectedFood((prev) => ({ ...prev, isFavorite: isFav }));
        }
    };

    // Nutrición calculada en tiempo real según la cantidad
    const calculatedNutrition = useMemo(() => {
        if (!selectedFood) return null;
        return calculatePortionNutrition(selectedFood, selectedQty);
    }, [selectedFood, selectedQty]);

    const handleConfirmAdd = () => {
        if (!calculatedNutrition) return;

        const foodPayload = {
            name: selectedFood.name,
            brand: selectedFood.brand || null,
            qty: String(selectedQty || selectedFood.servingSize),
            unit: selectedUnit || selectedFood.servingUnit,
            calories: calculatedNutrition.calories,
            protein: calculatedNutrition.protein,
            carbohydrates: calculatedNutrition.carbohydrates,
            fat: calculatedNutrition.fat,
            fiber: calculatedNutrition.fiber,
            notes: foodNotes.trim()
        };

        // Guardar en recientes
        foodService.addRecentFood(selectedFood);

        onSelectFood(foodPayload);
        showSuccess(`"${selectedFood.name}" agregado a ${targetMealName}.`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`🔍 Biblioteca de Alimentos para ${targetMealName}`}
                size="large"
            >
                <div style={{ display: "grid", gap: "1rem" }}>
                    {/* Barra de búsqueda y botón de nuevo alimento */}
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
                            <i
                                className="bi bi-search"
                                style={{
                                    position: "absolute",
                                    left: "0.85rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--muted)",
                                    fontSize: "0.95rem"
                                }}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Buscar por nombre o marca (ej: pollo, huevo, avena, manzana)..."
                                style={{ paddingLeft: "2.4rem", width: "100%", height: "2.6rem" }}
                                autoFocus
                            />
                            {isLoading && (
                                <span
                                    style={{
                                        position: "absolute",
                                        right: "0.85rem",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        fontSize: "0.8rem",
                                        color: "var(--primary)"
                                    }}
                                >
                                    <i className="bi bi-arrow-repeat spin" />
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            className="btn secondary"
                            onClick={() => setIsCustomModalOpen(true)}
                            style={{ height: "2.6rem", display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                        >
                            <i className="bi bi-plus-circle" /> Alimento personalizado
                        </button>
                    </div>

                    {/* Pestañas rápidas */}
                    <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            className={`btn ghost small ${activeTab === "all" ? "active-tab" : ""}`}
                            onClick={() => handleTabClick("all")}
                            style={{
                                background: activeTab === "all" ? "var(--primary-soft)" : "transparent",
                                color: activeTab === "all" ? "var(--primary-strong)" : "var(--muted)",
                                fontWeight: activeTab === "all" ? 700 : 500,
                                border: "none"
                            }}
                        >
                            <i className="bi bi-collection" style={{ marginRight: "0.3rem" }} /> Todos
                        </button>
                        <button
                            type="button"
                            className={`btn ghost small ${activeTab === "favorites" ? "active-tab" : ""}`}
                            onClick={() => handleTabClick("favorites")}
                            style={{
                                background: activeTab === "favorites" ? "var(--warning-soft)" : "transparent",
                                color: activeTab === "favorites" ? "#b45309" : "var(--muted)",
                                fontWeight: activeTab === "favorites" ? 700 : 500,
                                border: "none"
                            }}
                        >
                            ⭐ Favoritos
                        </button>
                        <button
                            type="button"
                            className={`btn ghost small ${activeTab === "recents" ? "active-tab" : ""}`}
                            onClick={() => handleTabClick("recents")}
                            style={{
                                background: activeTab === "recents" ? "var(--surface-soft)" : "transparent",
                                color: activeTab === "recents" ? "var(--text)" : "var(--muted)",
                                fontWeight: activeTab === "recents" ? 700 : 500,
                                border: "none"
                            }}
                        >
                            🕒 Recientes
                        </button>
                        <button
                            type="button"
                            className={`btn ghost small ${activeTab === "custom" ? "active-tab" : ""}`}
                            onClick={() => handleTabClick("custom")}
                            style={{
                                background: activeTab === "custom" ? "var(--accent-soft)" : "transparent",
                                color: activeTab === "custom" ? "var(--accent)" : "var(--muted)",
                                fontWeight: activeTab === "custom" ? 700 : 500,
                                border: "none"
                            }}
                        >
                            ✨ Mis Alimentos
                        </button>
                    </div>

                    {/* Categorías (cuando tab es 'all') */}
                    {activeTab === "all" && (
                        <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", paddingBottom: "0.3rem" }}>
                            {FOOD_CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleCategoryClick(cat)}
                                    style={{
                                        border: "1px solid var(--line)",
                                        borderRadius: "999px",
                                        padding: "0.25rem 0.65rem",
                                        fontSize: "0.72rem",
                                        whiteSpace: "nowrap",
                                        background: selectedCategory === cat ? "var(--primary)" : "var(--surface)",
                                        color: selectedCategory === cat ? "#fff" : "var(--text)",
                                        fontWeight: selectedCategory === cat ? "700" : "500",
                                        cursor: "pointer"
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Contenido dividido: Lista de resultados a la izquierda, Calculadora a la derecha */}
                    <div style={{ display: "grid", gridTemplateColumns: selectedFood ? "1.1fr 1fr" : "1fr", gap: "1rem" }}>
                        {/* Lista de alimentos */}
                        <div style={{ display: "grid", gap: "0.5rem", maxHeight: "420px", overflowY: "auto", paddingRight: "0.25rem" }}>
                            {results.length > 0 ? (
                                results.map((food) => {
                                    const isSelected = selectedFood?.id === food.id;
                                    return (
                                        <div
                                            key={food.id}
                                            onClick={() => handlePickFood(food)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "0.65rem 0.85rem",
                                                borderRadius: "var(--radius)",
                                                border: isSelected ? "2px solid var(--primary)" : "1px solid var(--line)",
                                                background: isSelected ? "var(--primary-soft)" : "var(--surface)",
                                                cursor: "pointer",
                                                transition: "all 0.15s ease",
                                                gap: "0.75rem"
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                                                {food.image ? (
                                                    <img
                                                        src={food.image}
                                                        alt={food.name}
                                                        style={{ width: "38px", height: "38px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{food.icon || "🥗"}</span>
                                                )}
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                                        <strong style={{ fontSize: "0.85rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                            {food.name}
                                                        </strong>
                                                        {food.brand && (
                                                            <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontStyle: "italic", whiteSpace: "nowrap" }}>
                                                                ({food.brand})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.15rem", flexWrap: "wrap" }}>
                                                        <span>Ref: {food.servingSize}{food.servingUnit}</span>
                                                        <span>•</span>
                                                        <span style={{ color: "var(--primary-strong)", fontWeight: 700 }}>{food.calories} kcal</span>
                                                        <span>•</span>
                                                        <span>P: {food.protein}g</span>
                                                        <span>C: {food.carbohydrates}g</span>
                                                        <span>G: {food.fat}g</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleToggleFavorite(e, food)}
                                                    title={food.isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        fontSize: "1.1rem",
                                                        color: food.isFavorite ? "#f59e0b" : "var(--muted)",
                                                        padding: "0.2rem"
                                                    }}
                                                >
                                                    <i className={`bi ${food.isFavorite ? "bi-star-fill" : "bi-star"}`} />
                                                </button>
                                                <i className="bi bi-chevron-right" style={{ fontSize: "0.75rem", color: "var(--muted)" }} />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: "center", padding: "2rem 1rem", border: "1px dashed var(--line)", borderRadius: "var(--radius)" }}>
                                    <i className="bi bi-search" style={{ fontSize: "2rem", color: "var(--muted)", marginBottom: "0.5rem", display: "block" }} />
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                                        No encontramos resultados para "{searchQuery}".
                                    </p>
                                    <button
                                        type="button"
                                        className="btn small"
                                        onClick={() => setIsCustomModalOpen(true)}
                                        style={{ marginTop: "0.75rem", background: "var(--primary)", border: "none", fontSize: "0.8rem" }}
                                    >
                                        <i className="bi bi-plus-circle" /> Crear "{searchQuery}" como alimento
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Panel de porción y cálculo proporcional */}
                        {selectedFood && calculatedNutrition && (
                            <div
                                style={{
                                    border: "1px solid var(--primary)",
                                    borderRadius: "var(--radius-lg)",
                                    padding: "1rem",
                                    background: "var(--surface)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.85rem",
                                    animation: "fadeIn 0.2s ease"
                                }}
                            >
                                <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "0.5rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <h5 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--text)" }}>
                                                {selectedFood.name}
                                            </h5>
                                            <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                                                Base de referencia: {selectedFood.servingSize} {selectedFood.servingUnit}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFood(null)}
                                            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.9rem" }}
                                        >
                                            <i className="bi bi-x-lg" />
                                        </button>
                                    </div>
                                </div>

                                {/* Inputs para porción */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                    <div className="field" style={{ margin: 0 }}>
                                        <label style={{ fontSize: "0.76rem" }}>Cantidad a servir *</label>
                                        <input
                                            type="number"
                                            step="any"
                                            min="1"
                                            value={selectedQty}
                                            onChange={(e) => setSelectedQty(e.target.value)}
                                            style={{ fontWeight: "700", fontSize: "0.95rem" }}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="field" style={{ margin: 0 }}>
                                        <label style={{ fontSize: "0.76rem" }}>Unidad</label>
                                        <input
                                            type="text"
                                            value={selectedUnit}
                                            onChange={(e) => setSelectedUnit(e.target.value)}
                                            placeholder="g, ml, unidad..."
                                        />
                                    </div>
                                </div>

                                {/* Desglose nutricional automático calculado */}
                                <div style={{ background: "var(--surface-soft)", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)" }}>Aporte Nutricional Proporcional:</span>
                                        <strong style={{ fontSize: "1.1rem", color: "var(--primary-strong)" }}>
                                            {calculatedNutrition.calories} kcal
                                        </strong>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem", textAlign: "center" }}>
                                        <div style={{ background: "var(--surface)", padding: "0.4rem 0.2rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                                            <span style={{ fontSize: "0.68rem", color: "var(--muted)", display: "block" }}>Proteína</span>
                                            <strong style={{ fontSize: "0.85rem", color: "#16a34a" }}>{calculatedNutrition.protein} g</strong>
                                        </div>
                                        <div style={{ background: "var(--surface)", padding: "0.4rem 0.2rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                                            <span style={{ fontSize: "0.68rem", color: "var(--muted)", display: "block" }}>Carbohidratos</span>
                                            <strong style={{ fontSize: "0.85rem", color: "#2563eb" }}>{calculatedNutrition.carbohydrates} g</strong>
                                        </div>
                                        <div style={{ background: "var(--surface)", padding: "0.4rem 0.2rem", borderRadius: "6px", border: "1px solid var(--line)" }}>
                                            <span style={{ fontSize: "0.68rem", color: "var(--muted)", display: "block" }}>Grasas</span>
                                            <strong style={{ fontSize: "0.85rem", color: "#f59e0b" }}>{calculatedNutrition.fat} g</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="field" style={{ margin: 0 }}>
                                    <label style={{ fontSize: "0.76rem" }}>Notas o modo de preparación (opcional)</label>
                                    <input
                                        type="text"
                                        value={foodNotes}
                                        onChange={(e) => setFoodNotes(e.target.value)}
                                        placeholder="Ej: A la plancha con 1 cdta de aceite de oliva"
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="btn large"
                                    onClick={handleConfirmAdd}
                                    style={{
                                        background: "var(--primary)",
                                        border: "none",
                                        marginTop: "auto",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "0.5rem"
                                    }}
                                >
                                    <i className="bi bi-plus-circle-fill" />
                                    Agregar a {targetMealName}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Modal para crear alimento personalizado */}
            <CustomFoodModal
                isOpen={isCustomModalOpen}
                onClose={() => setIsCustomModalOpen(false)}
                onSaved={(newFood) => {
                    executeSearch(searchQuery, selectedCategory, activeTab);
                    handlePickFood(newFood);
                }}
            />
        </>
    );
}

export default FoodSearchModal;
