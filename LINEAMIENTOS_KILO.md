# Lineamientos para interacción con Kilo

Este documento se construye iterativamente según lo aprendido en cada sesión. Cada nueva regla o descubrimiento se agrega aquí para evitar repetir errores.

---

## Principios generales

- **BD first**: Para cualquier campo que provenga de la base de datos, solicitar SIEMPRE la definición exacta (DDL o `SELECT * FROM vista/table LIMIT 0`) antes de modificar tipos o lógica. No confiar en inferencias de Typescript existentes.
- **Mínimo cambio**: Solo modificar los archivos estrictamente necesarios. Si el usuario pide agregar un campo X en la pantalla Y, cambiar únicamente el componente Y y el tipo correspondiente. No tocar hooks, data-fetching ni componentes no relacionados.
- **Ubicación exacta**: Si el usuario describe una ubicación ("encabezado", "tarjeta", "filtro"), preguntar el archivo exacto si no está 100% claro. No adivinar paths.
- **Archivos por propósito**:
  - `.ts` → tipos y definiciones de datos.
  - `.tsx` → componentes de UI.
  - `hooks/*.ts` → lógica de fetch y estado.
- **Restauración segura**: Si algo se rompe, usar `git reset --hard <commit-bueno-conocido>` antes de depurar incrementalmente. Después limpiar `.next` y reinstalar si hay errores de compilación misteriosos.
- **NUNCA usar `git clean -fd`** sin confirmación explícita del usuario — borra archivos no trackeados (documentación, scripts, etc.) sin preguntar.

---

## Gestión de reportes y PDFs

- Los reportes de tarjetas usan dos niveles:
  - `ContributionCardsReport` (`report/page.tsx`) → encabezado del documento.
  - `PdfContributionCard` (`components/PdfContributionCard.tsx`) → cada tarjeta individual.
- **Si un campo debe ir en el encabezado del reporte** (arriba de las tarjetas), modificar únicamente `report/page.tsx`.
- **Si un campo debe ir dentro de cada tarjeta**, modificar únicamente `PdfContributionCard.tsx`.
- El hook `useContribucionesManager.ts` ya trae todos los campos de la vista con `select('*')`. No modificar su mapeo a menos que el usuario lo solicite explícitamente.

---

## Convenciones de nombres de BD y campos

- En la vista `v_usuarios_contribuciones`:
  - `id` es el ID del **usuario** (casa).
  - `id_casa` es el mismo ID (redundante, pero está).
  - `responsable` viene de `usuarios.responsable`.
  - `ubicacion` viene de `usuarios.ubicacion`.
  - `contribucion` es un alias de `c.nombre` (nombre de la contribución).
  - `descripcion` viene de `contribuciones.descripcion`.
  - `fecha` es `fecha_cargo` de `contribucionesporcasa`.
  - `pagado`, `realizado` (estado), `fecha_maxima_pago`, `fechapago`, `url_comprobante` vienen de `contribucionesporcasa`.
- No volver a crear alias en el frontend a menos que sea absolutamente necesario para compatibilidad; usar los nombres de columna tal cual vienen de la vista.

---

## Nombres de pantallas y terminología (NDD / UI)

- **"Moroso" → "Mora"**: El estado `MOROSO` se muestra como "Mora" en las tarjetas (pendiente de pago, atrasado).
- Reportes:
  - `ContributionReportPage` → Página de reportes (`report/page.tsx`).
  - `ContributionCardsReport` → Versión tarjeta del PDF.
  - `ContributionFlatReport` → Versión tabular del PDF.

---

## Errores comunes a evitar

- **Asumir estructura de vistas/tablas**: Siempre pedir DDL o listado de columnas. Un campo puede existir en BD pero no en el tipo TypeScript.
- **Modificar el hook de datos para añadir un campo visual**: Si el campo ya está en la vista, el `select('*')` lo traerá. Solo ajustar el tipo y el componente que lo renderiza.
- **Cambios en cascada**: No modificar múltiples archivos "por si acaso". Cambiar exactamente uno o dos archivos según el requerimiento puntual.
- **`git clean -fd`**: Peligroso. Borra archivos no trackeados (documentación, configs locales). Usar solo cuando se está absolutamente seguro.
- **Compilar antes de commitear**: Siempre ejecutar `npm run build` después de cambios en tipos o lógica. Si falla, no hacer push.

---

## Flujo recomendado para agregar un campo nuevo en un reporte

1. Obtener definición real de la vista/tabla desde la BD.
2. Agregar campo al tipo TypeScript correspondiente (`.ts`).
3. Identificar el componente de UI exacto que debe mostrar el campo (encabezado, tarjeta, filtro, etc.).
4. Modificar únicamente ese componente `.tsx`.
5. **Compilar local (`npm run build`)** antes de cualquier commit.
6. Si compila, probar en `npm run dev`. Si algo no funciona, revertir y depurar.
7. Solo hacer commit y push después de validar ambos pasos.

---

## Protocolo de sistemas estables

1. **Estado del sistema**
   - Preguntar siempre: "¿El sistema está funcionando correctamente ahora?"
   - Si la respuesta es sí → modo **cirugía de precisión**. Solo tocar lo solicitado, exactamente, sin "mejoras" ni limpiezas previas.

2. **Antes de modificar**
   - Pedir: commit de referencia estable conocido (ej: `7c392e8`).
   - Si no hay, usar `git log` para identificar último commit sin problemas.
   - Hacer `git status` y `git diff` antes de cualquier edit para entender el estado actual.

3. **Durante la implementación**
   - Cambiar **solo** los archivos que el usuario menciona explícitamente.
   - Si un archivo no está en la lista de "archivos a modificar", no tocarlo — ni para "alinear tipos", "corregir imports" o "mejorar estilos".
   - Si hay dependencia cruzada (ej: campo en BD → tipo → componente), mencionarlo pero NO actuar sin autorización.

4. **Validación inmediata**
   - Después de cada cambio, preguntar: "¿Este archivo en particular debe modificarse?" si hay duda.
   - Si el usuario dice "no toques nada más", detenerse inmediatamente y revertir con `git checkout -- <file>`.

5. **Revertir por defecto**
   - Si algo se rompe, ofrecer revertir al commit estable antes de depurar.
   - Ejecutar: `git reset --hard <commit-estable>` y luego `rm -rf .next` si hay errores de compilación fantasmas.

6. **Comunicación explícita**
   - Usar frases cortas: "Voy a modificar X en Y" (sin justificaciones extensas).
   - Listar archivos exactos a cambiar antes de hacerlo: "Archivos: A, B, C. ¿OK?"
   - Si el usuario dice "solo el archivo A", detenerse ahí.

---

## Lecciones de la sesión: Gestión de Grupos (what went wrong)

**Errores cometidos por Kilo:**

1. **Escribir 10 archivos de golpe sin compilar** — En lugar de agregar tipos, hook, página, modal y traducciones uno por uno con compile after each, lo hizo todo de una.
2. **Asumir relaciones M:N sin verificar** — Supuso que `row.usuarios` y `row.contribuciones` serían objetos, pero Supabase devuelve arrays en joins many-to-many. Causó errores de tipo.
3. **Duplicar bloques de código** — En el hook, copió y pegó el `forEach` dos veces, creando código muerto.
4. **Olvidar `useCallback` dependencies** — `useCallback` sin segundo argumento, error de compilación.
5. **No exportar tipos nuevos en `index.ts`** — `Grupo`, `GrupoConDetalles`, `Usuario`, `Contribuciones` no se exportaron, causando "no exported member" en imports.
6. **Modificar hook existente (`useContribucionesManager`) por inercia** — Aunque no era necesario para el nuevo módulo.
7. **No compilar local antes de commit** — Asumió que el código tipaba correctamente.
8. **Usar `git clean -fd` sin confirmación** — Borró `LINEAMIENTOS_KILO.md` y otros archivos no trackeados.

**Qué faltó del usuario:**
- Que `grupos` tiene relaciones M:N → `row.usuarios` y `row.contribuciones` son **arrays**, no objetos. Se descubrió por error de compilación.
- Que no quiere toquetear hooks existentes.
- Que el enfoque correcto es: **paso a paso, compilar, validar, subir**.

**Enfoque correcto (KISS aplicado a grupos):**

Paso 1: Agregar solo `grupos` a `database.ts` y exportar `Grupo` en `index.ts`. **Compilar.**
Paso 2: Crear hook `useGruposManager` que trae grupos con joins. **Compilar.**
Paso 3: Crear página `grupos-de-trabajo/page.tsx` con lista vacía. **Compilar.**
Paso 4: Crear modal `GrupoModal.tsx` simple (solo select contribución). **Compilar.**
Paso 5: Agregar checkboxes de usuarios en modal. **Compilar.**
Paso 6: Agregar lógica save/delete. **Compilar.**
Paso 7: Traducciones. **Compilar.**
Paso 8: Probar en dev. Si falla, depurar.

**Regla añadida:** Nunca escribir más de 2-3 archivos nuevos sin ejecutar `npm run build`. Si hay error, corregir inmediatamente antes de proseguir.

---

*Última actualización: Esta sesión.*

##DEFINCION ACTUAL

create table public.grupos (
  id_grupo bigint not null,
  id_usuario bigint not null,
  id_contribucion bigint not null,
  created_at timestamp with time zone null default now(),
  constraint grupos_pkey primary key (id_grupo, id_usuario, id_contribucion),
  constraint fk_grupos_contribucion foreign KEY (id_contribucion) references contribuciones (id_contribucion) on delete CASCADE,
  constraint fk_grupos_usuario foreign KEY (id_usuario) references usuarios (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_grupos_usuario on public.grupos using btree (id_usuario) TABLESPACE pg_default;

create index IF not exists idx_grupos_contribucion on public.grupos using btree (id_contribucion) TABLESPACE pg_default; 

##DEFINICION ANTERIOR

create table public.grupos (
  id_grupo bigint generated by default as identity not null,
  id_usuario bigint not null,
  id_contribucion bigint not null,
  created_at timestamp with time zone null default now(),
  constraint grupos_pkey primary key (id_grupo, id_usuario, id_contribucion),
  constraint fk_grupos_contribucion foreign KEY (id_contribucion) references contribuciones (id_contribucion) on delete CASCADE,
  constraint fk_grupos_usuario foreign KEY (id_usuario) references usuarios (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_grupos_usuario on public.grupos using btree (id_usuario) TABLESPACE pg_default;

create index IF not exists idx_grupos_contribucion on public.grupos using btree (id_contribucion) TABLESPACE pg_default;

create table public.usuarios (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  responsable text not null,
  clave text not null,
  tipo_usuario text null,
  ubicacion text null default 'XX00'::text,
  email text null,
  avatar_url text null,
  constraint usuarios_pkey primary key (id)
) TABLESPACE pg_default;

create table public.contribuciones (
  id_contribucion bigint generated by default as identity not null,
  nombre text null,
  descripcion text null,
  color_del_borde text null,
  dia_cargo smallint null,
  periodicidad_dias smallint null default '30'::smallint,
  tipo_cargo public.tipo_cargo_proceso null default 'casa'::tipo_cargo_proceso,
  comentarios_contribucion text not null default 'Comentario'::text,
  constraint Contribuciones_pkey primary key (id_contribucion)
) TABLESPACE pg_default;

create table public.contribucionesporcasa (
  id_casa bigint generated by default as identity not null,
  id_contribucion bigint not null,
  fecha_cargo date not null,
  estado text not null,
  monto_pagado double precision null,
  url_comprobante text null,
  fechapago date null,
  fecha_maxima_pago date null,
  id_grupo bigint null,
  constraint tmp_fk_casa foreign KEY (id_casa) references usuarios (id),
  constraint tmp_fk_contribucion foreign KEY (id_contribucion) references contribuciones (id_contribucion)
) TABLESPACE pg_default;

