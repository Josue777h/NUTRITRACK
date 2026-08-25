# 🥗 NUTRITRACK — Plataforma Nutricional Inteligente

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2.1-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing%2036%2F36-729B1B?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)

**NutriTrack** es una plataforma web y PWA de diseño profesional y experiencia de usuario (UX/UI) de alto nivel creada para la gestión clínica de nutricionistas y el acompañamiento interactivo de pacientes.

---

## 🎨 Sistema de Diseño y Paleta de Colores

La interfaz fue diseñada con una identidad visual moderna, accesible y 100% responsiva:

| Color | Hex | Función / Propósito |
| :--- | :--- | :--- |
| 🟢 **Verde Hoja Vibrante** | `#49b54c` | **Color Primario:** Representa salud, nutrición, progreso y botones de acción principal. |
| 🔵 **Azul Eléctrico Real** | `#382ffd` | **Color Secundario:** Aporta contraste tecnológico, elementos interactivos y gráficos. |
| 🌿 **Menta Suave / Esmeralda** | `#6dd377` | **Color de Acento:** Resaltados, estados de éxito, barras de hidratación e insignias. |
| 🌙 **Obsidiana & Carbón** | `#090d16` / `#111827` | **Dark Mode:** Superficies profundas con bordes sutiles y micro-sombras. |
| ☀️ **Porcelana & Pizarra** | `#f8fafc` / `#ffffff` | **Light Mode:** Entorno limpio, luminoso y de alto contraste tipográfico. |

* **Tipografía:** *Plus Jakarta Sans* (encabezados e interfaz moderna) e *Inter* (lectura clínica).
* **Micro-interacciones:** Transiciones fluidas, elevación suave en *hover*, modales tipo *bottom-sheet* en móvil y gráficos dinámicos en SVG.

---

## ✨ Características Principales

### 🩺 Para el Nutriólogo (Especialista)
- **Directorio de Pacientes (`/pacientes`):** Expediente clínico completo, historial de mediciones, cálculo automático de IMC y notas evolutivas.
- **Agenda de Citas Inteligente (`/citas`):** Control por estados (*Pendiente, Confirmada, Completada, Cancelada*) con filtros rápidos.
- **Creador de Planes y Dietas (`/planes`):** Biblioteca de plantillas (*Déficit, Mantenimiento, Hipertrofia, Keto*), distribución de comidas y desglose de macronutrientes.
- **Compartir por WhatsApp:** Generación de mensajes enriquecidos con formato listo para enviar el plan al paciente en 1 clic.
- **Reportes Clínicos (`/reportes`):** Gráficos evolutivos de peso, calorías e IMC en el tiempo.

### 👤 Para el Paciente (Salud & Hábitos)
- **Dashboard Personalizado (`/dashboard`):** Próxima cita, objetivos actuales y resumen de evolución.
- **Rastreador de Hidratación:** Registro diario interactivo de consumo de agua (meta de 2,000 ml / 8 vasos).
- **Checklist de Comidas de Hoy:** Marca de cumplimiento diario en tiempo real con barra de porcentaje.
- **Check-in Emocional:** Registro diario de energía y estado de ánimo.
- **Generador de Lista del Súper:** Clasificación automática de ingredientes por pasillos del supermercado para facilitar las compras.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 (Hooks, Context API, Suspense, Lazy Loading)
- **Enrutamiento:** React Router v7
- **Estilos:** Vanilla CSS moderno con tokens CSS3, CSS Grid, Flexbox y Glassmorphism
- **Iconografía:** Bootstrap Icons
- **Base de Datos & Auth:** Supabase (PostgreSQL con Row Level Security)
- **Bundler & Build Tool:** Vite 8
- **Testing:** Vitest + React Testing Library + JSDOM
- **PWA:** Manifest PWA con compatibilidad móvil para instalación directa

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar o acceder al directorio
```powershell
cd C:\Users\josue\Documents\nutritrack
```

### 2. Instalar dependencias
```powershell
npm --prefix NutriTrack install
```

### 3. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env.local` dentro de la carpeta `NutriTrack/` y añade tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

### 4. Configurar la Base de Datos en Supabase
En el **SQL Editor** de Supabase, ejecuta en orden:
1. `NutriTrack/sql/schema.sql` (Tablas y estructura)
2. `NutriTrack/sql/migrations/001_secure_tenant_data.sql` (Políticas de aislamiento y RLS)

### 5. Iniciar Servidor de Desarrollo
```powershell
npm run dev
```
La aplicación estará disponible en: **http://localhost:5173/**

---

## 🧪 Scripts Disponibles

Desde la raíz del proyecto:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con recarga rápida (HMR). |
| `npm run build` | Compila el bundle optimizado para producción en `NutriTrack/dist`. |
| `npm run preview` | Previsualiza la versión compilada de producción localmente. |
| `npm --prefix NutriTrack test` | Ejecuta la suite de pruebas unitarias con Vitest. |
| `npm --prefix NutriTrack run lint` | Analiza el código con ESLint 9. |

---

## 📱 Accesibilidad y Responsividad

- **Mobile First:** Navegación inferior ergonómica (*Bottom Navigation*) adaptada al uso con una sola mano.
- **Desktop & Tablet:** Barra lateral retraíble y paneles divididos optimizados para pantallas anchas.
- **Modales Adaptables:** Se convierten en paneles deslizables desde la parte inferior (*Bottom Sheets*) en pantallas móviles.

---

## 📄 Licencia
Este proyecto es privado y propiedad de NutriTrack.
