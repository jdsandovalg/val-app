# Kilo Skill: Gestión de Grupos de Trabajo (val-app)

## Descripción
Guía especializada para trabajar con el módulo de grupos de trabajo en val-app. Cubre la arquitectura completa, lecciones aprendidas, y el flujo de trabajo KISS validado.

## Arquitectura del módulo

### Estructura de archivos
```
src/app/menu/admin/grupos-de-trabajo/
├── page.tsx                          # Página principal (accordion por contribución)
├── hooks/
│   └── useGruposManager.ts           # Lógica de datos (fetch, CRUD, mapas)
├── components/
│   ├── GrupoPrincipalCard.tsx        # Tarjeta full-width por grupo (colores cíclicos)
│   ├── UsuarioCard.tsx               # Tarjeta de usuario dentro de grupo
│   └── CrearGrupoModal.tsx          # Modal de creación/edición
├── report/
│   ├── page.tsx                      # Página de reporte (PDF viewer + botones)
│   ├── layout.tsx                    # Layout sin menú (full-screen)
│   └── components/
│       └── GrupoContributionReport.tsx # Documento PDF (react-pdf)
└── locales/                          # Traducciones (manageGroups.*)
```

### Flujo de datos
1. **useGruposManager** → fetch con join 3 vías (grupos + usuarios + contribuciones)
2. **Mapa compuesto** → `Map<string, GrupoConDetalles>` donde key = `${id_contribucion}-${id_grupo}`
3. **Grupos con cargos** → `Set<string>` con misma clave compuesta para bloqueo
4. **Render** → Accordion por contribución → GrupoPrincipalCard → UsuarioCard grid

## Reglas de oro (KISS aplicado)

### BD First
- **SIEMPRE** pedir DDL o `SELECT * FROM tabla LIMIT 0` antes de modificar tipos.
- En grupos: `id_grupo BIGINT NOT NULL` (no identity) → se calcula `MAX(id_grupo)+1` por contribución.
- Vista esperada: `SELECT g.id_grupo, g.id_usuario, u.responsable, u.ubicacion, c.nombre AS contribucion, ... FROM grupos g JOIN usuarios u ON g.id_usuario = u.id JOIN contribuciones c ON g.id_contribucion = c.id_contribucion`.

### Mínimo cambio
- Si el usuario pide "agregar campo X en tarjeta Y": modificar **solo** `Y.tsx` y el tipo en `.ts`.
- No tocar hooks, no "alinear", no "limpiar" sin permiso explícito.

### Compilar después de cada cambio
- `npm run build` → si falla, corregir **antes** de proseguir.
- Máximo 2-3 archivos nuevos sin compilar.

### Restauración segura
- Si algo se rompe: `git reset --hard <commit-estable>` → `rm -rf .next` → recompilar.
- **NUNCA** `git clean -fd` sin confirmación explícita.

### Protocolo de sistemas estables
1. Preguntar: "¿El sistema está funcionando correctamente ahora?"
2. Si SÍ → modo **cirugía de precisión**. Solo lo solicitado.
3. Pedir commit de referencia. Hacer `git status` y `git diff` antes de editar.
4. Si el usuario dice "solo archivo A", detenerse ahí.

## Lecciones aprendidas (errores resueltos)

### Error 1: Clave compuesta omitida
- **Problema**: Usar solo `id_grupo` como clave → grupos de distintas contribuciones con mismo ID se sobrescribían.
- **Fix**: Usar `` `${id_contribucion}-${id_grupo}` `` en **mapa** y **Set de cargos**.

### Error 2: Arrays vs objetos en joins M:N
- **Problema**: Suponer que `row.usuarios` es objeto cuando Supabase devuelve **array** en joins many-to-many.
- **Fix**: `flatMap(g => g.usuarios ?? [])` para aplanar lista de usuarios.

### Error 3: Duplicados en tarjeta
- **Problema**: Filas duplicadas en BD o join erróneo → mismo usuarioaparece múltiples veces.
- **Fix**: Dedup en hook (`uniqueBy`) y usar `key={usuario.id}` en `UsuarioCard`.

### Error 4: Cálculo de `id_grupo`
- **Regla**: Reiniciar numeración por contribución: `SELECT COALESCE(MAX(id_grupo), 0) + 1 FROM grupos WHERE id_contribucion = ?`.
- No usar identity; respetar DDL `bigint not null`.

### Error 5: Filtro de contribuciones disponibles
- **Regla**: Una contribución está disponible **solo si** `gruposConCargos` no contiene **ningún** grupo de esa contribución.
- No basta con "no tiene grupos" → debe verificarse que **todos** sus grupos estén sin cargos.

### Error 6: Vecinos disponibles
- **Regla**: Un usuario puede estar en múltiples contribuciones, pero solo **una vez** por contribución.
- `vecinosDisponibles` = usuarios no asignados a **esta** contribución (pueden estar en otras).

### Error 7: Report PDF close behavior
- **Problema**: `window.close()` falla si no es popup.
- **Fix**: Detectar `window.opener` → si existe, cerrar; si no, `router.push()` a lista.

## Convenciones de nombres BD

### Vista `v_usuarios_contribuciones` (referencia)
- `id` → ID del usuario (casa)
- `id_casa` → redundante (mismo ID)
- `responsable` → `usuarios.responsable`
- `ubicacion` → `usuarios.ubicacion`
- `contribucion` → alias de `c.nombre`
- `descripcion` → `contribuciones.descripcion`
- `fecha` → `fecha_cargo` de `contribucionesporcasa`
- `pagado`, `realizado` (estado), `fecha_maxima_pago`, `fechapago`, `url_comprobante` → de `contribucionesporcasa`

### Tipos TypeScript
- `Grupo` → fila cruda de `grupos` (sin joins)
- `Usuario` → `{ id, responsable, ubicacion }` (mínimo necesario)
- `Contribuciones` → `{ id_contribucion, nombre, descripcion, color_del_borde, ... }`
- `GrupoConDetalles` → grupo expandido con `usuarios: Usuario[]` y `contribucion: Contribuciones`

## Flujo de trabajo estándar (KISS)

### Paso a paso para cualquier modificación
1. **Estado actual**: `git status` + `git diff` → entender qué hay.
2. **Identificar archivos exactos**: pedir path si no es obvio.
3. **Modificar UN archivo** (o máximo 2 relacionados).
4. **Compilar**: `npm run build` → corregir errores inmediatamente.
5. **Probar**: `npm run dev` (si aplica).
6. **Commit**: mensaje claro, push.

### Ejemplo: Agregar campo `telefono` en UsuarioCard
```
1. Verificar BD: SELECT telefono FROM usuarios LIMIT 0;
2. Modificar tipo Usuario en src/types/database.ts (agregar telefono?: string)
3. Modificar UsuarioCard.tsx para renderizar telefono
4. npm run build
5. Probarlo en dev
6. git add + commit + push
```

## Archivos de referencia crítica

| Archivo | Propósito | No tocar a menos que… |
|---------|-----------|-----------------------|
| `useContribucionesManager.ts` | Fetch de contribuciones | Se modifica lógica de contribuciones (no grupos) |
| `database.ts` | Tipos de BD | Se agrega tabla/vista nueva |
| `index.ts` (types) | Exportaciones | Se añade tipo exportable nuevo |
| `GrupoPrincipalCard.tsx` | Tarjeta de grupo | Cambio visual de grupo (colores, layout) |
| `CrearGrupoModal.tsx` | Modal CRUD | Cambio en formulario de creación |
| `GrupoContributionReport.tsx` | PDF | Cambio en contenido/estilos del PDF |

## Comandos útiles

```bash
# Ver estado
git status
git diff

# Compilar
npm run build

# Limpiar caché (si hay errores fantasmos)
rm -rf .next

# Restaurar a estable
git reset --hard <commit-hash>

# Ver logs (encontrar último estable)
git log --oneline -10
```

## Resumen de implementation (grupos de trabajo)

### Estado: ✅ Funcional
- CRUD completo por usuario
- Bloqueo por cargos (badge rojo, botones deshabilitados)
- Accordion por contribución
- Colores cíclicos de borde (8 colores + rojo)
- `id_grupo` reiniciable por contribución
- Reporte PDF single-page LETTER, sin menú
- Botón Cerrar X: cierra popup o navega a lista

### Commits en main
- `8327696` → feat(grupos): agregar botón Cerrar X que navega de vuelta a lista de grupos
- ( commits anteriores ya existían antes de esta sesión )

### Archivos modificados en esta sesión
- `src/app/menu/admin/grupos-de-trabajo/report/page.tsx`
- `src/app/menu/admin/grupos-de-trabajo/report/layout.tsx` (nuevo)

## Cómo trabajaré contigo (mi protocolo)

1. **Preguntaré estado del sistema** antes de cualquier cambio.
2. **Listaré archivos exactos** a modificar. Dirás "solo A" o "OK".
3. **Modificaré UN archivo a la vez** (o máximo 2 si están íntimamente ligados).
4. **Compilaré después de CADA cambio** y te reportaré error o éxito.
5. **No haré mejoras paralelas** (no "alinear tipos", no "ordenar imports").
6. **Si dices "no toques nada más"**, revertiré inmediatamente.
7. **Mensajes cortos**: "Modificando X en Y" → acción → resultado.
8. **Si hay duda**, preguntaré antes de actuar.

## Lo que NO haré
- ❌ Escribir 10 archivos de golpe.
- ❌ Asumir estructuras de BD sin verificar.
- ❌ Modificar hooks existentes "por inercia".
- ❌ Usar `git clean -fd`.
- ❌ Commitear sin compilar local.
- ❌ Agregar campos "por si acaso".

---

**Skill creada**: Viernes 07 Mayo 2026 — Sesión de implementación de grupos de trabajo (KISS validated).
