# 📋 Plan de Reorganización de Schemas en Supabase

## 📌 Objetivo

Mover las tablas de proyectos existentes a schemas dedicados, **NO se crean sistemas nuevos**, solo se reorganizan las tablas existentes en nuevos schemas.

> **Importante:** Este proceso es una **reorganización**, no una migración con creación de nuevas tablas. Solo se trasladan tablas existentes a un schema específico.

---

## ⚠️ Proyectos a Reorganizar

| # | Proyecto | Schema destino | Estado |
|---|----------|---------------|--------|
| 1 | AutoProductorEnergia (pwa) | `energia` | ✅ Completado (09-Abr-2026) |
| 2 | Villas de Alcala App (val-app) | `public` | ⏸️ Revertido a public (09-Abr-2026) |

---

## ✅ AutoProductorEnergia - Schema: energia

### Fecha: 09-Abr-2026

**Tablas movidas (6):**
- companies
- tariffs
- meters
- readings
- equipment_types
- meter_equipment

**特殊情况 (1):**
- `usuarios` → Vista en `energia` apuntando a `public.usuarios` (compartida con otra app)

### Implementación en código:

```typescript
// pwa/src/services/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'energia'
  }
})
```

---

## ✅ Villas de Alcala App - Schema: alcala

### Fecha: 09-Abr-2026

**Tablas movidas (22):**
- contribuciones
- contribucionesporcasa
- proyectos
- proyecto_votos
- usuarios
- contribuciones_proyectos
- empresas
- grupos
- grupos_mantenimiento
- liquidacion_de_gastos
- logs
- nits
- programa_mantenimiento
- proyecto_evidencias
- proyecto_rubros
- rubro_categorias
- rubros
- tipos_proyecto
- votos_proyectos

**Vistas movidas (3):**
- v_usuarios_contribuciones
- v_contribuciones_detalle
- v_ultimo_grupo_id

**Funciones RPC actualizadas (1):**
- login_user - apuntando a `alcala.usuarios`

### Script:
- `sqlscripts/move-tables-to-alcala.sql`

### Implementación en código:

```typescript
// val-app/src/lib/supabaseClient.ts
export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'alcala'
  }
})
```

---

## 📋 Pasos para Migrar un Proyecto a un Nuevo Schema

### Requisitos previos:
1. ✅ Schema creado (CREATE SCHEMA IF NOT EXISTS nombre_schema)
2. Tablas movidas al nuevo schema con `ALTER TABLE schema.tabla SET SCHEMA nuevo_schema`
3. Schema expuesto en **Dashboard → API → Data API Settings**
4. ✅ Cliente configurado con `db.schema`

### Código a cambiar en el cliente:
```typescript
{
  db: {
    schema: 'nombre_schema'  // Cambiar aquí
  }
}
```

### NO se necesita:
- ❌ Crear nuevas tablas (ya existen)
- ❌ Cambiar queries individuales
- ❌ Usar prefijos como `schema.tabla`
- ❌ Configurar search_path a nivel de base de datos

---

## 📋 Instrucciones para Siguiente App: val-app (Villas de Alcala App)

### Objetivo
Mover las tablas de val-app al schema `valapp`.

### Paso 1: Identificar tablas de val-app
En Supabase SQL Editor, ejecutar:
```sql
-- Ver todas las tablas en public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Paso 2: Crear schema valapp
```sql
CREATE SCHEMA IF NOT EXISTS valapp;
```

### Paso 3: Mover tablas a valapp
```sql
-- EJEMPLO (reemplazar con nombres reales de tablas de val-app)
ALTER TABLE public.tabla1 SET SCHEMA valapp;
ALTER TABLE public.tabla2 SET SCHEMA valapp;
-- ... más tablas según sea necesario
```

### Paso 4: Crear vistas para tablas compartidas (si aplica)
Si alguna tabla como `usuarios` necesita estar en public y también accesible desde valapp:
```sql
CREATE OR REPLACE VIEW valapp.usuarios AS
SELECT * FROM public.usuarios;
```

### Paso 5: Exponer schema en Supabase
1. Ir a **API → Data API Settings**
2. Agregar `valapp` en **Exposed schemas**
3. Guardar cambios

### Paso 6: Actualizar cliente de val-app
```typescript
// En el archivo de cliente de val-app
export const supabase = createClient(url, key, {
  db: {
    schema: 'valapp'
  }
})
```

### Paso 7: Verificar conexión
Crear script de prueba similar a `jsutils/test-solar-tables.js` para valapp.

---

## 📋 Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `PGRST205` - "Could not find the table" | Schema no expuesto o tablas en otro schema | Verificar en Dashboard API Settings |
| `TypeError: Cannot read properties of undefined (reading 'get')` | Cookies no inicializadas | Wrapped getAll/setAll en try/catch |
| `public.valapp.tabla` | Usar prefijo en queries | NO usar prefijo - el cliente lo maneja |

---

## 📋 Scripts de referencia

| Script | Propósito |
|--------|-----------|
| `sqlscripts/move-tables-to-energia.sql` | Mover tablas a schema energia (referencia) |
| `sqlscripts/move-tables-to-alcala.sql` | Mover tablas a schema alcala |
| `sqlscripts/move-usuarios-to-public.sql` | Mover usuarios a public (referencia) |
| `sqlscripts/create-usuarios-alias.sql` | Crear vista alias para usuarios (referencia) |
| `jsutils/test-solar-tables.js` | Test de conexión y tablas (referencia) |

---

*Documento actualizado: 09-Abr-2026*
*Estado: AutoProductorEnergia ✅ completo, val-app ✅ completo*