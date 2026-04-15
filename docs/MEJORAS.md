# Plan de Mejoras para Val-App
## Ordenado por Prioridad y Facilidad de Implementación

---

## 🔴 PRIORIDAD ALTA (Fáciles de implementar, alto impacto)

### 1. Error Boundaries [Fácil, Alto Impacto]
**Qué**: Capturar errores de React para evitar pantalla blanca
**Cómo**: Crear componente `<ErrorBoundary><Componente /><ErrorBoundary>`
**Dónde**: En `/components/ErrorBoundary.tsx`
**Beneficio**: Estabilidad inmediata

### 2. Limpiar Código Muerto [Fácil, Alto Impacto]
**Qué**: Eliminar código commentado y console.log de debug
**Cómo**: Buscar `//.*` y `console.` en código
**Archivos**: Todo `/page.tsx` y componentes
**Beneficio**: Código más limpio y mantenible

### 3. Loading StatesMejorados [Fácil, Alto Impacto]
**Qué**: Agregar skeletons en lugar de "Cargando..."
**Cómo**: Usar componente skeleton de Tailwind
**Dónde**: Page tsx, ContributionCard, tables
**Beneficio**: Mejor UX percepción de velocidad

### 4. Konsolidar Tipos [Fácil, Alto Impacto]
**Qué**: Unificar tipos duplicados en `/types/`
**Cómo**: Consolidar en `/types/index.ts`, eliminar de `/utils/`
**Beneficio**: Type safety consistente

---

## 🟡 PRIORIDAD MEDIA (Requiere más trabajo)

### 5. Tipos Centralizados con Hooks [Medio, Alto Impacto]
**Qué**: Extraer lógica de negocio a hooks customizados
**Cómo**: Crear `/hooks/useContribuciones.ts`
```typescript
// Ejemplo estructura
export function useContribuciones() {
  const [data, setData] = useState()
  const fetchData = useCallback(async () => {...}, [])
  const save = useCallback(async (record) => {...}, [])
  return { data, fetchData, save, loading }
}
```
**Beneficio**: DRY, reusable en modal y página

### 6. Sistema de Componentes [Medio, Alto Impacto]
**Qué**: Crear biblioteca de componentes base
**Cómo**: Button, Card, Modal, Badge reutilizables
**Dónde**: `/components/ui/`
**Ejemplo**:
```typescript
// /components/ui/Button.tsx
<Button variant="primary">Guardar</Button>
<Button variant="danger">Eliminar</Button>
<Button variant="ghost">Cancelar</Button>
```
**Beneficio**: Consistencia visual

### 7. Validación en Frontend [Medio, Alto Impacto]
**Qué**: Validar inputs antes de enviar a servidor
**Cómo**: Usar Zod para schemas
```typescript
const contribucionSchema = z.object({
  id_casa: z.number().min(1),
  monto_pagado: z.number().positive().optional(),
})
```
**Beneficio**: UX mejor y menos errores

---

## 🟢 PRIORIDAD BAJA (Proyectos grandes)

### 8. Pagination/Infinite Scroll [Mayor Trabajo]
**Qué**: Cargar solo necesarios, no todo
**Cómo**: Usar Supabase `.range()` pagination
**Dónde**: manage-house-contributions, calendarios
**Beneficio**: Performance con muchos datos

### 9. Cache con TanStack Query [Mayor Trabajo]
**Qué**: Cache de datos server-state
**Cómo**: Reemplazar useEffect con useQuery
```typescript
const { data } = useQuery({
  queryKey: ['contribuciones'],
  queryFn: () => supabase.from('...').select(),
})
```
**Beneficio**: Reduce llamadas a BD

### 10. Dashboard de Métricas [Mayor Trabajo]
**Qué**: Página principal con estadísticas
**KPIs**: Total pendiente vs pagado, casas morosas
**Beneficio**: Visibilidad del estado general

---

## 📋 Lista de Seguimiento

| # | Mejora | Prioridad | Facilidad | Estado |
|---|-------|----------|-----------|--------|
| 1 | Error Boundaries | Alta | Fácil | ⬜ |
| 2 | Limpiar código muerto | Alta | Fácil | ⬜ |
| 3 | Loading States | Alta | Fácil | ⬜ |
| 4 | Consolidar Tipos | Alta | Fácil | ⬜ |
| 5 | Hooks reuse | Media | Medio | ⬜ |
| 6 | Componentes UI | Media | Medio | ⬜ |
| 7 | Validación Zod | Media | Medio | ⬜ |
| 8 | Pagination | Baja | Mayor | ��� |
| 9 | TanStack Query | Baja | Mayor | ⬜ |
| 10 | Dashboard | Baja | Mayor | ⬜ |

---

*Documento creado: 2026-04-15*
*Última actualización: 2026-04-15*
*Proyecto: Val-App - Villas de Alcalá*