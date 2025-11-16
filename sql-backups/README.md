# SQL Backups

Este directorio contiene respaldos de funciones SQL críticas antes de realizar modificaciones.

## Convención de nombres

```
[nombre_funcion]_[ESTADO]_[YYYY-MM-DD].sql
```

**Estados:**
- `ORIGINAL` - Versión funcional antes de cambios
- `v2`, `v3`, etc. - Versiones modificadas
- `ROLLBACK` - Versión de emergencia para restaurar

## Historial

### 2025-11-15 - gestionar_proyectos + crear_contribuciones_para_proyecto + aprobar_proyecto_y_generar_contribuciones

**Cambio solicitado:** Agregar funcionalidad para aprobar proyectos con 100% consenso y generar contribuciones automáticamente.

**Problema encontrado:** 
- Modificación de función `gestionar_proyectos` sin backup previo
- Errores de ambigüedad de columnas (`activo`, `id_proyecto`, etc.)
- Funcionalidad existente dejó de funcionar temporalmente
- Sistema inestable durante ~1.5 horas

**Estrategia implementada:** 
- ❌ Primera aproximación: Agregar acción `APROBAR_Y_CONTRIBUIR` con parámetro `p_valor_cotizacion`
- ❌ Segunda aproximación: Hacer 2 llamadas separadas (UPDATE + crear_contribuciones) → Problema: No transaccional
- ✅ **Solución final:** Crear función dedicada transaccional `aprobar_proyecto_y_generar_contribuciones`

**Funciones creadas/modificadas:**
1. `gestionar_proyectos` - Corregida con RETURNING explícito (sin `*`)
2. `crear_contribuciones_para_proyecto` - Corregida con aliases (`u.activo`)
3. `aprobar_proyecto_y_generar_contribuciones` - Nueva función transaccional

**Archivos:**
- `gestionar_proyectos_ORIGINAL_2025-11-15.sql` - Versión funcional antes de cambios
- `gestionar_proyectos_CORREGIDO_2025-11-15.sql` - Versión con RETURNING explícito

**Lecciones aprendidas:**
1. **Siempre crear backup ANTES de modificar funciones SQL críticas**
2. **Usar aliases explícitos en todas las tablas** (`p`, `u`, `pe`)
3. **Nunca usar `RETURNING *`** cuando hay columnas calculadas con EXISTS
4. **Operaciones multi-paso deben ser transaccionales** (función dedicada)
5. **Probar en TODAS las páginas que usan la función** (voting + admin)
6. **KISS: Keep It Simple, Stupid** - Funciones dedicadas > Funciones monolíticas

**Impacto:**
- ⚠️ Tiempo perdido: ~1.5 horas en debugging
- ✅ Sistema restaurado completamente
- ✅ Nueva funcionalidad implementada correctamente
- ✅ Protocolo de backups establecido
- ✅ Mejores prácticas documentadas

---

## Cómo usar estos backups

1. **Antes de modificar una función SQL:**
   ```bash
   # Crear backup con fecha
   cp current_function.sql sql-backups/[nombre]_ORIGINAL_$(date +%Y-%m-%d).sql
   ```

2. **Para restaurar:**
   ```sql
   -- Copiar contenido del archivo _ORIGINAL y ejecutar en Supabase SQL Editor
   ```

3. **Actualizar README.md con:**
   - Fecha del cambio
   - Motivo del cambio
   - Estrategia implementada
   - Lecciones aprendidas
