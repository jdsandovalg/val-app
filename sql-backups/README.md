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

## 📅 16 de Noviembre de 2025 - Perfeccionamiento de Funciones de Perfil

**Cambio solicitado:** Mejorar funciones de actualización de perfil de usuario con validaciones y manejo de avatar.

**Problema reportado:**
Usuario experimentó error al actualizar su perfil desde móvil:
```
Error al guardar el usuario: new row violates row-level security policy
```

**Causa raíz:**
Las funciones `update_user_profile` y `update_user_avatar` existían y funcionaban básicamente, pero:
1. No tenían validaciones robustas de entrada (TRIM, NULLIF)
2. No normalizaban datos (emails minúsculas, espacios)
3. Faltaba `updated_at` automático
4. Mensaje de error confuso (sugería "new row" cuando era UPDATE)

**Estrategia implementada:**

**Mejoras en `update_user_profile`:**
- ✅ Validación explícita de existencia de usuario con mensaje claro
- ✅ TRIM en todos los campos de texto para evitar espacios fantasma
- ✅ Email normalizado a minúsculas (LOWER + TRIM)
- ✅ Clave solo actualiza si se proporciona valor no vacío
- ✅ `updated_at` se actualiza automáticamente
- ✅ NO toca el campo avatar (separación de responsabilidades)

**Mejoras en `update_user_avatar`:**
- ✅ Validación de existencia de usuario
- ✅ Validación de URL no vacía
- ✅ TRIM en URL del avatar
- ✅ Obtiene avatar anterior (preparado para limpieza futura en storage)
- ✅ `updated_at` se actualiza automáticamente

**Funciones modificadas:**
1. `update_user_profile` - Mejorada con validaciones y normalización
2. `update_user_avatar` - Mejorada con validaciones

**Archivos:**
- `update_user_profile_ORIGINAL_2025-11-16.sql` - Backup de versiones funcionales
- `update_user_profile_CORREGIDO_2025-11-16.sql` - Versión mejorada

**Lecciones aprendidas:**
1. **TRIM y validación son críticos** - Espacios en blanco causan errores silenciosos
2. **Normalizar emails** - Siempre a minúsculas para evitar duplicados
3. **Separación de responsabilidades** - Perfil y avatar en funciones distintas
4. **Mensajes de error claros** - Especificar qué falló y por qué
5. **SECURITY DEFINER necesario** - Para que PRE/OPE puedan actualizar su perfil

**Impacto:**
- ✅ Usuarios PRE/OPE pueden actualizar su perfil sin errores RLS
- ✅ Datos se validan y normalizan automáticamente
- ✅ Mensajes de error específicos y útiles
- ✅ Preparado para limpieza automática de avatars antiguos (feature futuro)

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
