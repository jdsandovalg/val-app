# Plan de Mejoras para Val-App

## 1. Arquitectura y Estructura

### 1.1 Separación de Componentes
- **Separar lógica de negocio del UI**: Extraer `handleSave`, `handleDelete`, `fetchData` a hooks customizados
- Crear `/hooks/useContribuciones.ts` para reutilizar lógica entre página y modal
- **Beneficio**: Mantenibilidad y reuse

### 1.2 Manejo de Estado
- **Evaluar Zustand o Jotai**: El estado global con `useState` en cada página es dificil de mantener
- Crear stores para estado compartido (usuario, filtros persistentes)
- **Beneficio**: Un solo source of truth

### 1.3 Tipos TypeScript
- **Centralizar tipos en `/types/`**: Algunos están duplicados en `/utils/` y `/database.ts`
- Crear archivo único de tipos del dominio
- **Beneficio**: Type safety consistente

---

## 2. Base de Datos

### 2.1 Vistas SQL
- **Optimizar `v_usuarios_contribuciones`**: Agregar índices para los filtros comunes
- Crear vista para MOROSO automático (fecha_maxima_pago < NOW() AND pagado IS NULL)

### 2.2 Funciones RPC
- **Usar RPC para operaciones críticas**: `handleSave`, `handleDelete` deben llamar funciones stored
- Agregar validación en bd, no solo en frontend
- **Beneficio**: Seguridad y consistencia

### 2.3 Constraints
- Agregar constraint CHECK para `estado` (PENDIENTE, PAGADO, MOROSO)
- Agregar FK con ON DELETE RESTRICT

---

## 3. UI/UX

### 3.1 Sistema de Diseño
- **Crear biblioteca de componentes**: Button, Card, Modal, Badge reutilizables
- Documentar en Storybook o similar
- **Beneficio**: Consistencia visual

### 3.2 Loading States
- Agregar skeletons en lugar de "Cargando..."
- Mostrar progreso para operaciones largas
- **Beneficio**: Percepción de velocidad

### 3.3 Accesibilidad
- Agregar `aria-label` a todos los botones sin texto
- Soporte para keyboard navigation completo
- **Beneficio**: WCAG compliance

---

## 4. Performance

### 4.1 Optimización de Cargas
- **Implementar infinite scroll** en lugar de cargar todo
- Virtualizar listas largas (>100 items)
- Agregar `loading` states aSupabase queries

### 4.2 Cache
- Agregar SWR o TanStack Query para cache de datos
- Invalidar cache después de mutaciones
- **Beneficio**: Reduce llamadas a BD

### 4.3 Imágenes
- Comprimir imágenes antes de subir
- Usar WebP para fotos de evidencia
- Implementar lazy loading

---

## 5. Funcionalidades

### 5.1 Reportes
- **Migrar a @react-pdf/renderer**: jspdf será deprecado
- Agregar parámetros de fecha a reportes
- Exportar a Excel además de PDF

### 5.2 Notificaciones
- Agregar notificaciones in-app para eventos importantes
- Soporte para email cuando se agregue moroso
- **Beneficio**: Comunicación proactiva

### 5.3 Dashboard
- Crear página principal con métricas clave:
  - Total pendiente vs pagado
  - Casas morosas
  - Próximos vencimientos

---

## 6. Testing y Calidad

### 6.1 Testing
- Agregar Jest para lógica de negocio
- Agregar tests para funciones utils (format, dates)
- **Beneficio**: Confianza en cambios

### 6.2 Error Handling
- Agregar error boundaries por sección
- Logging estructurado (no solo console.log)
- Feedback de errores al usuario

### 6.3 Documentación
- Documentar arquitectura en /docs/ARCHITECTURE.md
- Crear CHANGELOG.md
- Documentar decisiones de diseño en ADR

---

## 7. Seguridad

### 7.1 Validación
- Validar todo input en servidor (no solo cliente)
- Sanitizar uploads de archivos
- **Beneficio**: Previene inyecciones

### 7.2 RLS Policies
- Revisar policies de Supabase
- Agregar audit logs
- **Beneficio**: Compliance

---

## 8. Tech Debt

### 8.1 Limpieza
- Eliminar código commented o dead code
- Unificar estilos (Tailwind config)
- Consolidar variables de entorno

### 8.2 Dependencias
- Mantener vigentes las dependencias
- Remove dependencias no usadas
- Actualizar a Next.js 16 stable

---

## Priorización Sugerida

| Prioridad | Mejora | Impacto |
|----------|-------|---------|
| Alta | Tipos centralizados | Mantenibilidad |
| Alta | Error boundaries | Estabilidad |
| Media | Quick filters UI | UX |
| Media | Testing setup | Confianza |
| Baja | Dashboard | Visibilidad |

---

*Documento creado: 2026-04-15*
*Proyecto: Val-App - Villas de Alcalá*