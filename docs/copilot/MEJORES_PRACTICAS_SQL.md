# 🛡️ MEJORES PRÁCTICAS SQL - VAL-APP

**Fecha:** 15 de Noviembre de 2025  
**Propósito:** Guía de referencia para modificar funciones SQL de forma segura

---

## 📋 PROTOCOLO DE MODIFICACIÓN DE FUNCIONES

### **ANTES de modificar cualquier función SQL:**

#### 1. **Solicitar código actual**
```markdown
"Por favor comparte el código actual de la función [nombre_funcion]"
```

#### 2. **Crear backup**
```bash
# Ejecutar en Supabase SQL Editor:
SELECT pg_get_functiondef('public.[nombre_funcion]'::regproc);

# Guardar resultado en:
/sql-backups/[nombre_funcion]_ORIGINAL_[YYYY-MM-DD].sql
```

#### 3. **Analizar dependencias**
```bash
# Buscar en codebase dónde se usa:
grep -r "rpc('[nombre_funcion]'" src/
grep -r "[nombre_funcion]" src/**/*.tsx
```

#### 4. **Identificar estructura esperada**
- Ver interfaces TypeScript que consumen la función
- Verificar qué columnas se utilizan en el frontend
- Confirmar tipos de datos coinciden

#### 5. **Modificar incrementalmente**
- ✅ Solo AGREGAR funcionalidad
- ❌ Nunca REEMPLAZAR código funcional
- ✅ Probar cada cambio inmediatamente
- ✅ Si falla, restaurar desde backup

#### 6. **Validar en todas las páginas**
```markdown
Probar:
1. Página principal que usa la función
2. Todas las páginas admin relacionadas
3. Reportes PDF (si aplica)
4. npm run build (compilación exitosa)
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### **Error 1: Ambigüedad de columnas**

**❌ Problema:**
```sql
SELECT count(*) 
FROM usuarios 
WHERE activo = true;
```
**Error:** `column "activo" is ambiguous`

**✅ Solución:**
```sql
SELECT count(*) 
FROM usuarios u
WHERE u.activo = true;
```

**Regla:** Siempre usar aliases explícitos (`u`, `p`, `pe`, etc.)

---

### **Error 2: RETURNING * con subqueries**

**❌ Problema:**
```sql
UPDATE proyectos
SET estado = 'aprobado'
WHERE id_proyecto = p_id_proyecto
RETURNING *;  -- Falla si hay EXISTS en RETURNS TABLE
```

**✅ Solución:**
```sql
UPDATE proyectos
SET estado = 'aprobado'
WHERE id_proyecto = p_id_proyecto
RETURNING 
    proyectos.id_proyecto,
    proyectos.descripcion_tarea,
    proyectos.estado,
    EXISTS (
        SELECT 1
        FROM proyecto_evidencias pe
        WHERE pe.id_proyecto = proyectos.id_proyecto
        AND pe.tipo_evidencia = 'COTIZACION_PARA_VOTACION'
    ) AS es_propuesta;
```

**Regla:** Nunca usar `RETURNING *` si hay columnas calculadas en RETURNS TABLE.

---

### **Error 3: Múltiples operaciones sin transacción**

**❌ Problema:**
```typescript
// Frontend - Si la segunda falla, la primera ya se ejecutó
await supabase.rpc('update_proyecto', { estado: 'aprobado' });
await supabase.rpc('crear_contribuciones', { ... });
```

**✅ Solución:**
```sql
-- Backend - Función transaccional
CREATE FUNCTION aprobar_y_contribuir(...)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Transacción atómica (todo o nada)
    UPDATE proyectos SET estado = 'aprobado' WHERE ...;
    PERFORM crear_contribuciones_para_proyecto(...);
    -- Si cualquier paso falla, ROLLBACK automático
END;
$$;
```

```typescript
// Frontend - Una sola llamada
await supabase.rpc('aprobar_y_contribuir', { ... });
```

**Regla:** Operaciones críticas multi-paso = Función transaccional dedicada.

---

### **Error 4: Tipos de datos inconsistentes**

**❌ Problema:**
```sql
-- Tabla: valor_estimado double precision
-- Función: p_valor_estimado numeric
PERFORM crear_contribuciones(p_id, p_valor_estimado);
```
**Error:** `function does not exist`

**✅ Solución:**
```sql
-- Cast explícito
PERFORM crear_contribuciones(p_id, p_valor_estimado::numeric);
```

**Regla:** Verificar tipos de datos en definición de tabla vs función.

---

## ✅ CHECKLIST DE VALIDACIÓN

### **Antes de hacer commit:**

- [ ] ✅ Backup creado en `/sql-backups/`
- [ ] ✅ README.md de backups actualizado
- [ ] ✅ Función probada en Supabase SQL Editor
- [ ] ✅ Todas las páginas que usan la función probadas
- [ ] ✅ `npm run build` exitoso
- [ ] ✅ No hay errores en consola del navegador
- [ ] ✅ Tipos TypeScript coinciden con estructura SQL

### **Después de deploy:**

- [ ] ✅ Probar en producción (Vercel)
- [ ] ✅ Validar flujo end-to-end
- [ ] ✅ Documentar en PLAN_DE_TRABAJO_PROFESIONAL.md

---

## 📚 PATRONES RECOMENDADOS

### **Patrón 1: Función de Consulta**
```sql
CREATE FUNCTION get_proyectos_activos()
RETURNS TABLE(...) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id_proyecto,
        p.descripcion,
        EXISTS(...) AS es_propuesta
    FROM proyectos p
    WHERE p.activo = true;
END;
$$;
```

### **Patrón 2: Función de Mutación**
```sql
CREATE FUNCTION update_proyecto(p_id bigint, p_estado text)
RETURNS void AS $$
BEGIN
    UPDATE proyectos
    SET estado = p_estado
    WHERE id_proyecto = p_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proyecto % no encontrado', p_id;
    END IF;
END;
$$;
```

### **Patrón 3: Función Transaccional**
```sql
CREATE FUNCTION operacion_compleja(p_id bigint)
RETURNS void AS $$
BEGIN
    -- Paso 1
    UPDATE tabla1 SET ... WHERE ...;
    
    -- Paso 2
    INSERT INTO tabla2 (...) VALUES (...);
    
    -- Paso 3
    PERFORM funcion_auxiliar(...);
    
    -- Si cualquier paso falla, todo se revierte
END;
$$;
```

---

## 🎯 PRINCIPIOS KISS (Keep It Simple, Stupid)

### **DO:**
- ✅ Una función = Una responsabilidad
- ✅ Funciones pequeñas y específicas
- ✅ Transacciones explícitas
- ✅ Nombres descriptivos
- ✅ Comentarios para lógica compleja

### **DON'T:**
- ❌ Funciones monolíticas con múltiples acciones
- ❌ Lógica compleja mezclada
- ❌ `RETURNING *` con columnas calculadas
- ❌ Operaciones críticas sin transacción
- ❌ Aliases ambiguos o faltantes

---

## 📖 REFERENCIAS

### **Documentación Oficial:**
- PostgreSQL Functions: https://www.postgresql.org/docs/current/sql-createfunction.html
- Supabase RPC: https://supabase.com/docs/guides/database/functions

### **Archivos del Proyecto:**
- `/sql-backups/` - Backups de funciones
- `/sql-backups/README.md` - Historial de cambios
- `PLAN_DE_TRABAJO_PROFESIONAL.md` - Lecciones aprendidas

---

**Última actualización:** 15 de Noviembre de 2025  
**Mantenedor:** Daniel Sandoval  
**Estado:** Activo
