# Expense App - Documento de Diseño

**Fecha:** 2026-03-14
**Estado:** Aprobado

## Resumen

App móvil Android para registro y visualización de gastos personales. Diseñada para un solo usuario (sin autenticación). Interfaz limpia, minimalista, fondo blanco con badges de color por categoría.

## Stack Tecnológico

- **Framework:** Expo SDK 54 + React Native
- **Routing:** expo-router (file-based)
- **Base de datos:** expo-sqlite (local, migratable a Supabase después)
- **Gráficas:** react-native-chart-kit
- **Excel:** xlsx (SheetJS) + expo-file-system + expo-sharing
- **Date picker:** @react-native-community/datetimepicker
- **Plataforma:** Android
- **Moneda:** MXN ($1,234.50)

## Modelo de Datos

### Tabla: categories

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Auto-increment |
| name | TEXT NOT NULL | Nombre de la categoría |
| color | TEXT NOT NULL | Color hex para el badge |
| icon | TEXT | Emoji del icono |
| is_default | INTEGER | 1 = predefinida, 0 = custom |
| created_at | TEXT | ISO timestamp |

### Tabla: expenses

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Auto-increment |
| name | TEXT NOT NULL | Nombre del gasto |
| amount | REAL NOT NULL | Monto en MXN |
| category_id | INTEGER FK | Referencia a categories.id |
| date | TEXT NOT NULL | Fecha YYYY-MM-DD |
| notes | TEXT | Notas opcionales |
| created_at | TEXT | ISO timestamp |

## Categorías Predefinidas

| Categoría | Color | Emoji |
|-----------|-------|-------|
| Hogar | #4A90D9 | 🏠 |
| Entretenimiento | #9B59B6 | 🎬 |
| Servicios | #3498DB | 📱 |
| Auto | #E67E22 | 🚗 |
| Comida | #E74C3C | 🍽️ |
| Salud | #2ECC71 | 💊 |
| Educación | #1ABC9C | 📚 |
| Transporte | #F39C12 | 🚌 |
| Ropa | #E91E63 | 👕 |

## Navegación (4 Tabs)

| Tab | Icono | Pantalla |
|-----|-------|----------|
| Inicio | home | Lista de gastos del mes + resumen |
| Dashboard | pie-chart | Métricas y gráfica de pastel |
| Historial | calendar | Listado de meses con exportación |
| Config | settings | Gestión de etiquetas y ajustes |

## Pantallas

### Inicio (Home)

- Header: mes actual + total gastado en grande
- Lista de gastos agrupados por día con separador de fecha ("Hoy", "Ayer", "12 Mar")
- Cada item: nombre del gasto, badge de categoría, monto a la derecha
- FAB (+) posicionado absolute en bottom-right para agregar gasto

### Agregar Gasto (Modal bottom sheet)

- Campos: Monto (numérico, primero), Nombre, Categoría (grid de badges), Fecha (default hoy), Notas (expandible)
- Botón "Guardar" al fondo

### Dashboard

- Filtros: Hoy | 7 días | Este mes | Personalizado (chips)
- Cards: Total gastado, Promedio diario, Categoría top
- Gráfica de pastel con leyenda

### Historial

- Lista de meses con total gastado
- Detalle del mes: total, desglose por categoría, botón exportar Excel (superior derecho)
- Excel: Hoja 1 "Gastos" (detalle), Hoja 2 "Resumen" (por categoría)

### Configuración

- Gestión de etiquetas: ver, agregar, editar, eliminar (predefinidas no se eliminan)
- Info de la app

## Estructura de Archivos

```
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx              → Home
    dashboard.tsx          → Dashboard
    history.tsx            → Historial
    settings.tsx           → Config
  modal/
    add-expense.tsx        → Modal agregar gasto
    month-detail.tsx       → Detalle de mes
    add-category.tsx       → Modal agregar categoría

db/
  database.ts              → Init SQLite, migrations
  repository.ts            → CRUD functions
  seed.ts                  → Categorías por defecto

components/
  expense-list-item.tsx
  day-separator.tsx
  category-badge.tsx
  expense-summary-card.tsx
  pie-chart.tsx
  filter-chips.tsx
  fab-button.tsx
  category-picker.tsx

hooks/
  use-expenses.ts
  use-categories.ts
  use-dashboard-stats.ts

utils/
  format-currency.ts
  export-excel.ts
  date-helpers.ts

constants/
  default-categories.ts
  theme.ts
```

## Fuera de Alcance (v1)

- Autenticación / login
- Sincronización en la nube
- Presupuestos / metas
- Gastos recurrentes
- Múltiples monedas
- Notificaciones / recordatorios
- Dark mode
