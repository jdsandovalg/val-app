# 📋 Propuesta de Mejoras - Funciones de Actualización de Perfil

**Fecha:** 16 de Noviembre de 2025  
**Estado:** EN REVISIÓN - Pendiente pruebas en producción  
**Funciones afectadas:** `update_user_profile`, `update_user_avatar`

---

## 🎯 Objetivo

Mejorar la robustez y confiabilidad de las funciones de actualización de perfil de usuario, eliminando el error de RLS reportado y añadiendo validaciones defensivas.

---

## 📊 Análisis Comparativo

### Función: `update_user_profile`

| Aspecto | Versión Actual (Producción) | Versión Propuesta (Mejorada) |
|---------|----------------------------|------------------------------|
| **TRIM en responsable** | ❌ No | ✅ Sí - Evita espacios fantasma |
| **Email normalizado** | ❌ No | ✅ Sí - Minúsculas (evita duplicados) |
| **TRIM en clave** | ❌ No | ✅ Sí - Antes de encriptar |
| **Validación EXISTS** | ❌ No | ✅ Sí - Mensaje de error claro |
| **Encriptación clave** | ✅ Sí (`crypt()`) | ✅ Sí (mantiene `crypt()`) |
| **Compatibilidad tipos** | `INTEGER` | ✅ `INTEGER` (mantiene) |
| **DEFAULT en p_clave** | ✅ Sí | ✅ Sí (mantiene) |

### Función: `update_user_avatar`

| Aspecto | Versión Actual (Producción) | Versión Propuesta (Mejorada) |
|---------|----------------------------|------------------------------|
| **TRIM en URL** | ❌ No | ✅ Sí - Evita URLs con espacios |
| **Validación URL vacía** | ❌ No | ✅ Sí - Previene NULL/vacío |
| **Validación EXISTS** | ❌ No | ✅ Sí - Mensaje de error claro |
| **Compatibilidad tipos** | `INTEGER` | ✅ `INTEGER` (mantiene) |

---

## 🔧 Cambios Propuestos

### 1. `update_user_profile` - Mejoras

```sql
-- MEJORAS APLICADAS:
-- ✅ TRIM(p_responsable) - Elimina espacios antes/después
-- ✅ LOWER(TRIM(p_email)) - Normaliza email a minúsculas
-- ✅ TRIM(p_clave) antes de crypt() - Evita claves con espacios
-- ✅ IF NOT FOUND - Detecta usuario inexistente
-- ✅ Mantiene INTEGER y DEFAULT para compatibilidad total
```

**Impacto:**
- ✅ Sin breaking changes (100% compatible con frontend)
- ✅ Previene errores silenciosos por espacios
- ✅ Emails consistentes (evita `User@mail.com` vs `user@mail.com`)
- ✅ Mensajes de error más claros

### 2. `update_user_avatar` - Mejoras

```sql
-- MEJORAS APLICADAS:
-- ✅ TRIM(p_avatar_url) - Elimina espacios en URL
-- ✅ Validación URL no vacía - Previene NULL/''
-- ✅ IF NOT FOUND - Detecta usuario inexistente
-- ✅ Mantiene INTEGER para compatibilidad
```

**Impacto:**
- ✅ Sin breaking changes
- ✅ Previene URLs inválidas en storage
- ✅ Mensajes de error específicos

---

## ✅ Plan de Pruebas

### Casos de Prueba - `update_user_profile`

| # | Caso | Entrada | Resultado Esperado |
|---|------|---------|-------------------|
| 1 | Actualizar nombre con espacios | `"  Juan Pérez  "` | TRIM → `"Juan Pérez"` |
| 2 | Email con mayúsculas | `"User@MAIL.com"` | LOWER → `"user@mail.com"` |
| 3 | Clave con espacios | `"  password123  "` | TRIM → encriptar sin espacios |
| 4 | Solo actualizar nombre | clave=`null`, email=`null` | Solo nombre cambia |
| 5 | Usuario inexistente | ID=`99999` | EXCEPTION con mensaje claro |
| 6 | Actualizar todo | nombre + email + clave | Todo actualiza correctamente |

### Casos de Prueba - `update_user_avatar`

| # | Caso | Entrada | Resultado Esperado |
|---|------|---------|-------------------|
| 1 | URL con espacios | `"  https://...  "` | TRIM → URL limpia |
| 2 | URL vacía | `""` | EXCEPTION |
| 3 | URL NULL | `null` | EXCEPTION |
| 4 | Usuario inexistente | ID=`99999` | EXCEPTION con mensaje claro |
| 5 | Primera subida | URL válida, avatar=`null` | Actualiza correctamente |
| 6 | Reemplazo de avatar | URL nueva | Actualiza correctamente |

---

## 🚀 Proceso de Implementación

### Fase 1: Backup (✅ COMPLETADO)
- [x] Backup de versión actual en `update_user_profile_ORIGINAL_2025-11-16.sql`
- [x] Versión mejorada en `update_user_profile_CORREGIDO_2025-11-16.sql`

### Fase 2: Pruebas (⏳ PENDIENTE)
- [ ] Ejecutar versión mejorada en Supabase
- [ ] Probar actualización desde móvil (usuario PRE/OPE)
- [ ] Validar todos los casos de prueba
- [ ] Verificar que NO hay breaking changes

### Fase 3: Validación (⏳ PENDIENTE)
- [ ] Confirmar que el error de RLS desapareció
- [ ] Verificar normalización de emails funciona
- [ ] Confirmar TRIM elimina espacios problemáticos
- [ ] Validar mensajes de error son claros

### Fase 4: Producción (⏳ PENDIENTE)
- [ ] Marcar como PRODUCTIVO en README.md
- [ ] Actualizar `_ORIGINAL` con `_CORREGIDO` (nuevo estándar)
- [ ] Documentar en PLAN_DE_TRABAJO_PROFESIONAL.md

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Breaking change por tipos | 🟢 Baja | 🔴 Alto | Mantener INTEGER y DEFAULT |
| Email existente en mayúsculas | 🟡 Media | 🟡 Medio | LOWER normaliza (safe) |
| TRIM rompe validaciones | 🟢 Baja | 🟡 Medio | TRIM es operación segura |
| Usuario no encuentra su perfil | 🟢 Baja | 🔴 Alto | Backup disponible para rollback |

---

## 📝 Notas Adicionales

**Por qué estas mejoras son importantes:**

1. **TRIM**: Previene bugs silenciosos donde `"admin"` ≠ `" admin "` (con espacios)
2. **LOWER en email**: Evita duplicados como `user@mail.com` y `User@MAIL.com`
3. **Validación EXISTS**: Detecta problemas temprano con mensajes claros
4. **TRIM en clave**: Evita que usuarios pongan espacios accidentales en su password

**Mantenimiento de compatibilidad:**
- ✅ Tipos de datos idénticos (`INTEGER`, no `BIGINT`)
- ✅ Parámetros con DEFAULT mantenidos
- ✅ Nombres de función sin cambios
- ✅ Firma de función 100% compatible

---

## 🎓 Lecciones Aplicadas

De la sesión del 15-Nov-2025:
- ✅ **Backup ANTES de modificar** (protocolo establecido)
- ✅ **Comparar versión actual** antes de proponer cambios
- ✅ **Mantener compatibilidad** (tipos, defaults, nombres)
- ✅ **Validaciones defensivas** (NOT FOUND, NULL checks)
- ✅ **Documentar ANTES de aplicar** (este documento)

---

**Preparado por:** GitHub Copilot (Claude Sonnet 4.5)  
**Revisado por:** Daniel Sandoval  
**Próximo paso:** Ejecutar pruebas en Supabase
