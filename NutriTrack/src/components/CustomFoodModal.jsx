import { useState, useEffect } from "react";
import Modal from "./Modal";
import { foodService } from "../services/foodService";
import { useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";

function CustomFoodModal({ isOpen, onClose, foodToEdit, onSaved }) {
    const { showSuccess, showError } = useToast();
    const { auth } = useApp();

    const [form, setForm] = useState({
        name: "",
        brand: "",
        category: "Proteínas y Carnes",
        servingSize: "100",
        servingUnit: "g",
        calories: "",
        protein: "",
        carbohydrates: "",
        fat: "",
        fiber: "",
        sugar: "",
        isFavorite: false
    });

    useEffect(() => {
        if (!isOpen) return;
        if (foodToEdit) {
            setForm({
                name: foodToEdit.name || "",
                brand: foodToEdit.brand || "",
                category: foodToEdit.category || "General",
                servingSize: String(foodToEdit.servingSize || 100),
                servingUnit: foodToEdit.servingUnit || "g",
                calories: String(foodToEdit.calories ?? ""),
                protein: String(foodToEdit.protein ?? ""),
                carbohydrates: String(foodToEdit.carbohydrates ?? ""),
                fat: String(foodToEdit.fat ?? ""),
                fiber: String(foodToEdit.fiber ?? ""),
                sugar: String(foodToEdit.sugar ?? ""),
                isFavorite: Boolean(foodToEdit.isFavorite)
            });
        } else {
            setForm({
                name: "",
                brand: "",
                category: "Proteínas y Carnes",
                servingSize: "100",
                servingUnit: "g",
                calories: "",
                protein: "",
                carbohydrates: "",
                fat: "",
                fiber: "",
                sugar: "",
                isFavorite: false
            });
        }
    }, [isOpen, foodToEdit]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            showError("Ingresa el nombre del alimento.");
            return;
        }

        const payload = {
            id: foodToEdit?.id,
            name: form.name.trim(),
            brand: form.brand.trim() || null,
            category: form.category,
            servingSize: Number(form.servingSize) || 100,
            servingUnit: form.servingUnit.trim() || "g",
            calories: Number(form.calories) || 0,
            protein: Number(form.protein) || 0,
            carbohydrates: Number(form.carbohydrates) || 0,
            fat: Number(form.fat) || 0,
            fiber: Number(form.fiber) || 0,
            sugar: Number(form.sugar) || 0,
            isFavorite: form.isFavorite
        };

        try {
            const saved = await foodService.saveCustomFood(payload, auth?.uid);
            showSuccess(foodToEdit ? "Alimento actualizado." : "Alimento personalizado guardado con éxito.");
            if (onSaved) onSaved(saved);
            onClose();
        } catch (err) {
            showError("Error al guardar alimento: " + err.message);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={foodToEdit ? "✏️ Editar Alimento Personalizado" : "✨ Crear Alimento Personalizado"}
            size="medium"
        >
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.1rem" }}>
                <div className="field">
                    <label>Nombre del alimento *</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Ej: Batido proteico de avena casero"
                        required
                        autoFocus
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div className="field">
                        <label>Marca / Fabricante (opcional)</label>
                        <input
                            name="brand"
                            value={form.brand}
                            onChange={handleChange}
                            placeholder="Ej: Casero, Doria, San Fernando"
                        />
                    </div>
                    <div className="field">
                        <label>Categoría</label>
                        <select name="category" value={form.category} onChange={handleChange}>
                            <option value="Proteínas y Carnes">Proteínas y Carnes</option>
                            <option value="Lácteos">Lácteos</option>
                            <option value="Granos y Cereales">Granos y Cereales</option>
                            <option value="Tubérculos">Tubérculos</option>
                            <option value="Legumbres">Legumbres</option>
                            <option value="Frutas">Frutas</option>
                            <option value="Verduras">Verduras</option>
                            <option value="Grasas Saludables">Grasas Saludables</option>
                            <option value="Frutos Secos">Frutos Secos</option>
                            <option value="Suplementos">Suplementos</option>
                            <option value="General">General</option>
                        </select>
                    </div>
                </div>

                {/* Porción de referencia */}
                <div style={{ background: "var(--surface-soft)", padding: "0.85rem", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--primary-strong)", display: "block", marginBottom: "0.5rem" }}>
                        📏 Porción de Referencia (Base para cálculos proporcionales)
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.76rem" }}>Cantidad base *</label>
                            <input
                                name="servingSize"
                                type="number"
                                step="any"
                                min="1"
                                value={form.servingSize}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontSize: "0.76rem" }}>Unidad de medida *</label>
                            <select name="servingUnit" value={form.servingUnit} onChange={handleChange}>
                                <option value="g">Gramos (g)</option>
                                <option value="ml">Mililitros (ml)</option>
                                <option value="unidad">Unidad</option>
                                <option value="porción">Porción</option>
                                <option value="taza">Taza</option>
                                <option value="cucharada">Cucharada</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Macronutrientes para esa porción */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                    <div className="field">
                        <label style={{ fontSize: "0.76rem" }}>Calorías (kcal)</label>
                        <input
                            name="calories"
                            type="number"
                            step="any"
                            value={form.calories}
                            onChange={handleChange}
                            placeholder="0"
                            required
                        />
                    </div>
                    <div className="field">
                        <label style={{ fontSize: "0.76rem" }}>Proteínas (g)</label>
                        <input
                            name="protein"
                            type="number"
                            step="any"
                            value={form.protein}
                            onChange={handleChange}
                            placeholder="0"
                        />
                    </div>
                    <div className="field">
                        <label style={{ fontSize: "0.76rem" }}>Carbohidratos (g)</label>
                        <input
                            name="carbohydrates"
                            type="number"
                            step="any"
                            value={form.carbohydrates}
                            onChange={handleChange}
                            placeholder="0"
                        />
                    </div>
                    <div className="field">
                        <label style={{ fontSize: "0.76rem" }}>Grasas (g)</label>
                        <input
                            name="fat"
                            type="number"
                            step="any"
                            value={form.fat}
                            onChange={handleChange}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div className="field">
                        <label style={{ fontSize: "0.76rem" }}>Fibra (g, opcional)</label>
                        <input
                            name="fiber"
                            type="number"
                            step="any"
                            value={form.fiber}
                            onChange={handleChange}
                            placeholder="0"
                        />
                    </div>
                    <div className="field">
                        <label style={{ fontSize: "0.76rem" }}>Azúcar (g, opcional)</label>
                        <input
                            name="sugar"
                            type="number"
                            step="any"
                            value={form.sugar}
                            onChange={handleChange}
                            placeholder="0"
                        />
                    </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}>
                    <input
                        type="checkbox"
                        name="isFavorite"
                        checked={form.isFavorite}
                        onChange={handleChange}
                        style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
                    />
                    ⭐ Marcar como favorito para acceso rápido
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", borderTop: "1px solid var(--line)", paddingTop: "0.85rem" }}>
                    <button type="button" className="btn secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn" style={{ background: "var(--primary)", border: "none" }}>
                        {foodToEdit ? "Guardar Cambios" : "Guardar Alimento"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default CustomFoodModal;
