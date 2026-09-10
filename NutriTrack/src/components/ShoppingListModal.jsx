import { useState, useMemo } from "react";
import Modal from "./Modal";
import { useToast } from "../context/ToastContext";

// Simple smart classifier for food ingredients
function categorizeFood(foodName = "") {
    const text = foodName.toLowerCase();
    
    if (/pollo|ternera|pavo|pescado|salmón|merluza|tilapia|atún|huevo|claras|carne|lomo|bacon|jamón|mariscos|proteína|whey/.test(text)) {
        return "Proteínas y Carnes";
    }
    if (/manzana|plátano|banana|kiwi|naranja|frutos rojos|arándanos|limón|aguacate|espinaca|lechuga|tomate|pepino|zanahoria|brócoli|calabacín|espárragos|apio|calabaza|verduras/.test(text)) {
        return "Frutas y Verduras";
    }
    if (/leche|yogur|queso|cottage|quark|parmesano|mantequilla|ghee/.test(text)) {
        return "Lácteos y Huevos";
    }
    if (/avena|arroz|quinoa|pan|tostadas|batata|camote|patata|pasta|chía|lentejas|garbanzos|frijoles/.test(text)) {
        return "Granos, Cereales y Tubérculos";
    }
    if (/aceite de oliva|aceite de coco|mct|nueces|almendras|maní|cacahuete|mantequilla de maní|semillas|aceitunas/.test(text)) {
        return "Frutos Secos y Grasas Saludables";
    }
    return "Especias, Infusiones y Despensa";
}

const CATEGORY_ICONS = {
    "Proteínas y Carnes": "bi-egg-fried",
    "Frutas y Verduras": "bi-flower1",
    "Lácteos y Huevos": "bi-cup-straw",
    "Granos, Cereales y Tubérculos": "bi-box-seam",
    "Frutos Secos y Grasas Saludables": "bi-shield-check",
    "Especias, Infusiones y Despensa": "bi-bag-check"
};

function ShoppingListModal({ plan, isOpen, onClose }) {
    const { showSuccess } = useToast();
    const [checkedItems, setCheckedItems] = useState({});

    // Extract all unique foods from all meals
    const categorizedList = useMemo(() => {
        if (!plan?.meals) return {};

        const map = {
            "Frutas y Verduras": [],
            "Proteínas y Carnes": [],
            "Lácteos y Huevos": [],
            "Granos, Cereales y Tubérculos": [],
            "Frutos Secos y Grasas Saludables": [],
            "Especias, Infusiones y Despensa": []
        };

        const seen = new Set();

        const mealCollections = Array.isArray(plan.meals)
            ? plan.meals.map((m) => (Array.isArray(m.foods) ? m.foods : []))
            : Object.values(plan.meals);

        mealCollections.forEach((mealList) => {
            if (!Array.isArray(mealList)) return;
            mealList.forEach((food) => {
                const name = typeof food === "string" ? food : food.name;
                const qty = food.qty ? `${food.qty} ${food.unit || ""}` : "";
                const cleanName = name?.trim();
                if (!cleanName || seen.has(cleanName.toLowerCase())) return;

                seen.add(cleanName.toLowerCase());
                const category = categorizeFood(cleanName);
                if (!map[category]) map[category] = [];
                map[category].push({ name: cleanName, qty, id: cleanName.toLowerCase().replace(/\s+/g, "-") });
            });
        });

        return map;
    }, [plan]);

    const totalItems = useMemo(() => {
        return Object.values(categorizedList).reduce((acc, curr) => acc + curr.length, 0);
    }, [categorizedList]);

    const checkedCount = useMemo(() => {
        return Object.values(checkedItems).filter(Boolean).length;
    }, [checkedItems]);

    const toggleItem = (id) => {
        setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = () => {
        let text = `🛒 LISTA DE COMPRAS — ${plan?.name || "NutriTrack"}\n\n`;
        Object.entries(categorizedList).forEach(([cat, items]) => {
            if (items.length === 0) return;
            text += `📌 ${cat.toUpperCase()}:\n`;
            items.forEach((item) => {
                text += `  • ${item.name} ${item.qty ? `(${item.qty})` : ""}\n`;
            });
            text += `\n`;
        });
        text += `Generado automáticamente por NutriTrack.`;

        navigator.clipboard.writeText(text);
        showSuccess("¡Lista copiada al portapapeles! Puedes pegarla en WhatsApp o Notas.");
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="🛒 Lista de Compras del Supermercado"
            size="large"
        >
            <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--primary-soft)", padding: "0.85rem 1.15rem", borderRadius: "var(--radius)", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                        <strong style={{ color: "var(--primary-strong)", fontSize: "0.95rem", display: "block" }}>
                            Plan: {plan?.name || "Plan Alimenticio"}
                        </strong>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                            Progreso de compras: {checkedCount} de {totalItems} artículos listos ({totalItems ? Math.round((checkedCount / totalItems) * 100) : 0}%)
                        </span>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            type="button"
                            className="btn secondary small"
                            onClick={copyToClipboard}
                            style={{ fontSize: "0.8rem", display: "flex", gap: "0.3rem", alignItems: "center" }}
                        >
                            <i className="bi bi-clipboard-check" /> Copiar texto
                        </button>
                        <button
                            type="button"
                            className="btn small"
                            onClick={() => window.print()}
                            style={{ fontSize: "0.8rem", background: "var(--primary)", border: "none", display: "flex", gap: "0.3rem", alignItems: "center" }}
                        >
                            <i className="bi bi-printer" /> Imprimir
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: "6px", background: "var(--surface-elevated)", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                        style={{
                            height: "100%",
                            width: `${totalItems ? (checkedCount / totalItems) * 100 : 0}%`,
                            background: "var(--primary)",
                            transition: "width 0.3s ease"
                        }}
                    />
                </div>

                {/* Categorized items grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", maxHeight: "60vh", overflowY: "auto", paddingRight: "0.25rem" }}>
                    {Object.entries(categorizedList).map(([category, items]) => {
                        if (items.length === 0) return null;
                        const icon = CATEGORY_ICONS[category] || "bi-bag";
                        return (
                            <div key={category} className="panel" style={{ padding: "1rem", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
                                <h5 style={{ fontSize: "0.88rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text)", borderBottom: "1px solid var(--line)", paddingBottom: "0.4rem", margin: 0, marginBottom: "0.6rem" }}>
                                    <i className={`bi ${icon}`} style={{ color: "var(--primary)" }} />
                                    {category}
                                    <span className="badge" style={{ marginLeft: "auto", fontSize: "0.68rem" }}>{items.length}</span>
                                </h5>
                                <div style={{ display: "grid", gap: "0.45rem" }}>
                                    {items.map((item) => {
                                        const isChecked = !!checkedItems[item.id];
                                        return (
                                            <label
                                                key={item.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.6rem",
                                                    fontSize: "0.84rem",
                                                    cursor: "pointer",
                                                    padding: "0.3rem 0.4rem",
                                                    borderRadius: "var(--radius-xs)",
                                                    background: isChecked ? "var(--surface-soft)" : "transparent",
                                                    textDecoration: isChecked ? "line-through" : "none",
                                                    color: isChecked ? "var(--muted)" : "var(--text)",
                                                    transition: "background 0.2s ease"
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleItem(item.id)}
                                                    style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
                                                />
                                                <span style={{ flex: 1 }}>{item.name}</span>
                                                {item.qty && (
                                                    <span style={{ fontSize: "0.74rem", color: "var(--muted)", fontStyle: "italic" }}>
                                                        {item.qty}
                                                    </span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
}

export default ShoppingListModal;
