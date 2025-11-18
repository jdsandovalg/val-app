# 🎯 LECCIÓN: Separación de Responsabilidades - RPC vs Frontend

**Fecha:** 18 de Noviembre de 2025  
**Contexto:** Sistema de votaciones - Filtro de cotizaciones  
**Decisión:** Mantener RPC genérica, filtrar en frontend

---

## 📋 Situación

### Problema Inicial
Página de votación mostraba evidencias de TODOS los tipos, no solo `COTIZACION_PARA_VOTACION`.

### Primera Reacción (❌ Incorrecta)
Agregar parámetro `p_tipo_evidencia` a la función RPC para filtrar en la BD:

```sql
-- ❌ ENFOQUE INCORRECTO
CREATE FUNCTION fn_gestionar_proyecto_evidencias(
    p_accion TEXT,
    p_id_proyecto BIGINT,
    p_tipo_evidencia tipo_evidencia_enum DEFAULT NULL  -- ❌ Lógica de UI en BD
)
WHERE pe.id_proyecto = p_id_proyecto
  AND (p_tipo_evidencia IS NULL OR pe.tipo_evidencia = p_tipo_evidencia);
```

### Análisis del Desarrollador (✅ Correcto)
> "La idea de esta función sí es traer todos los tipos de evidencia, pero específicamente para el tema de votación existe la `COTIZACION_PARA_VOTACION`, por lo que considero que el filtro debe ser en la capa de desarrollo del frontend, no en la base de datos."

---

## ✅ Solución Correcta

### Principio Fundamental
**Las funciones RPC deben retornar datos, NO decidir qué mostrar en la UI.**

### Por qué esto es correcto:

#### 1. **Separación de Responsabilidades**
```
┌─────────────────────────────────────────┐
│  BASE DE DATOS (PostgreSQL + RPC)      │
│  Responsabilidad: CRUD, validaciones,   │
│  integridad, transacciones             │
└─────────────────────────────────────────┘
                    ↓
            RETORNA DATOS PUROS
                    ↓
┌─────────────────────────────────────────┐
│  FRONTEND (React/Flutter)               │
│  Responsabilidad: Filtrar, ordenar,     │
│  formatear, decidir QUÉ mostrar        │
└─────────────────────────────────────────┘
```

#### 2. **Reusabilidad**
Una sola función sirve para múltiples vistas:

```typescript
// Mismo endpoint, diferentes usos
const { data: allEvidencias } = await supabase.rpc('fn_gestionar_proyecto_evidencias', {
  p_accion: 'SELECT',
  p_id_proyecto: projectId
});

// Vista 1: Página de votación
const cotizacionesVotacion = allEvidencias.filter(
  e => e.tipo_evidencia === 'COTIZACION_PARA_VOTACION'
);

// Vista 2: Gestión de proyecto (admin)
const todasEvidencias = allEvidencias; // Sin filtro

// Vista 3: Reporte PDF
const facturas = allEvidencias.filter(e => e.tipo_evidencia === 'FACTURA');
const fotos = allEvidencias.filter(e => e.tipo_evidencia.startsWith('FOTOGRAFIA'));

// Vista 4: Dashboard
const stats = {
  cotizaciones: allEvidencias.filter(e => e.tipo_evidencia.includes('COTIZACION')).length,
  facturas: allEvidencias.filter(e => e.tipo_evidencia === 'FACTURA').length,
  contratos: allEvidencias.filter(e => e.tipo_evidencia === 'CONTRATO').length,
};
```

#### 3. **Flexibilidad**
Cambios en la UI no requieren cambios en BD:

```typescript
// Hoy: Solo COTIZACION_PARA_VOTACION
const votables = evidencias.filter(e => e.tipo_evidencia === 'COTIZACION_PARA_VOTACION');

// Mañana: Agregar COTIZACION normal también (cambio solo en frontend)
const votables = evidencias.filter(e => 
  ['COTIZACION_PARA_VOTACION', 'COTIZACION'].includes(e.tipo_evidencia)
);

// No se toca la BD ✅
```

#### 4. **Performance**
Evita múltiples round-trips:

```typescript
// ❌ MAL: 3 llamadas a BD
const cotizaciones = await supabase.rpc('get_cotizaciones', {...});
const facturas = await supabase.rpc('get_facturas', {...});
const contratos = await supabase.rpc('get_contratos', {...});

// ✅ BIEN: 1 llamada, filtrar en cliente
const allEvidencias = await supabase.rpc('fn_gestionar_proyecto_evidencias', {...});
const cotizaciones = allEvidencias.filter(e => e.tipo_evidencia.includes('COTIZACION'));
const facturas = allEvidencias.filter(e => e.tipo_evidencia === 'FACTURA');
const contratos = allEvidencias.filter(e => e.tipo_evidencia === 'CONTRATO');
```

---

## 🔧 Implementación

### Función RPC (SIN cambios - ya está correcta)

```sql
CREATE OR REPLACE FUNCTION public.fn_gestionar_proyecto_evidencias(
    p_accion TEXT,
    p_id_evidencia BIGINT DEFAULT NULL,
    p_id_proyecto BIGINT DEFAULT NULL,
    p_descripcion_evidencia TEXT DEFAULT NULL,
    p_fecha_evidencia DATE DEFAULT NULL,
    p_nombre_archivo TEXT DEFAULT NULL,
    p_url_publica TEXT DEFAULT NULL,
    p_tipo_mime TEXT DEFAULT NULL,
    p_tamano_bytes BIGINT DEFAULT NULL,
    p_tipo_evidencia tipo_evidencia DEFAULT NULL,
    p_valor_de_referencia NUMERIC DEFAULT NULL
)
RETURNS TABLE(...) AS $$
BEGIN
    IF p_accion = 'SELECT' THEN
        RETURN QUERY
        SELECT pe.*
        FROM public.proyecto_evidencias pe
        WHERE (p_id_proyecto IS NULL OR pe.id_proyecto = p_id_proyecto)
        ORDER BY pe.fecha_evidencia DESC, pe.fecha_subida DESC;
        -- ✅ Sin filtro de tipo: retorna TODO
    END IF;
    -- ... INSERT, DELETE ...
END;
$$;
```

### Frontend (página de votación)

**ANTES (❌ Incorrecto):**
```typescript
// Esperaba que la RPC filtrara
const { data } = await supabase.rpc('fn_gestionar_proyecto_evidencias', { 
  p_accion: 'SELECT', 
  p_id_proyecto: projectId,
  p_tipo_evidencia: 'COTIZACION_PARA_VOTACION'  // ❌ Este parámetro no existe
});
```

**DESPUÉS (✅ Correcto):**
```typescript
// Obtiene TODAS las evidencias
const { data: evidenciasData } = await supabase.rpc('fn_gestionar_proyecto_evidencias', { 
  p_accion: 'SELECT', 
  p_id_proyecto: Number(selectedProjectId) 
});

// ✅ Filtra en el frontend según la vista
const cotizacionesParaVotar = (evidenciasData as EvidenciaVotacion[])
  .filter(e => e.tipo_evidencia === 'COTIZACION_PARA_VOTACION')
  .sort((a, b) => (a.valor_de_referencia || Infinity) - (b.valor_de_referencia || Infinity));

setCotizaciones(cotizacionesParaVotar);
```

---

## 📚 Reglas Generales

### ✅ HACER en RPC:
- Validaciones de datos (tipos, rangos, obligatorios)
- Lógica de negocio (cálculos, agregaciones)
- Integridad referencial
- Transacciones complejas
- Seguridad (RBAC, RLS)

### ❌ NO HACER en RPC:
- Filtros específicos de vistas de UI
- Ordenamiento específico de UI (salvo default razonable)
- Formateo de datos para presentación
- Lógica de "qué mostrar según el contexto"
- Decisiones de UX

---

## 🎓 Aplicación Universal

Este principio aplica a **cualquier stack**:

### React/Next.js
```typescript
const allData = await fetchData();
const filteredForView = allData.filter(condition);
```

### Flutter/Dart
```dart
final allData = await repository.getData();
final filteredForView = allData.where((item) => condition).toList();
```

### Vue/Nuxt
```javascript
const allData = await $fetch('/api/data');
const filteredForView = allData.filter(item => condition);
```

---

## 🔍 Cuándo SÍ filtrar en la BD

**Excepción:** Cuando el filtro es para **performance/paginación**, no para lógica de UI:

```sql
-- ✅ CORRECTO: Filtro de performance
WHERE created_at > NOW() - INTERVAL '30 days'  -- Solo últimos 30 días
LIMIT 100 OFFSET 0;  -- Paginación

-- ❌ INCORRECTO: Filtro de lógica de UI
WHERE tipo = 'COTIZACION_PARA_VOTACION';  -- Esto es decisión de la vista
```

---

## 📊 Tipos de Evidencia (Val-App)

El enum `tipo_evidencia` contiene:
- `COTIZACION`
- `FACTURA`
- `RECIBO`
- `TRANSFERENCIA`
- `RECOMENDACION`
- `FOTOGRAFIA_01`, `FOTOGRAFIA_02`, `FOTOGRAFIA_03`
- `COTIZACION_PARA_VOTACION` ← Específico para votaciones
- `CONTRATO`

**Diseño correcto:** La RPC retorna TODOS los tipos, cada vista decide cuáles mostrar.

---

## 💡 Conclusión

**Lección aprendida:**  
No siempre "arreglar en la BD" es la solución correcta. A veces el "bug" es simplemente filtrar en el lugar equivocado.

**Principio arquitectónico:**  
> "La base de datos provee datos. El frontend decide qué mostrar."

**Beneficio:**  
Código más mantenible, flexible y reusable.

---

**Autor:** Equipo Val-App  
**Revisado por:** Desarrollador (análisis correcto)  
**Aplicable a:** Cualquier stack (React, Flutter, Vue, Angular, etc.)
