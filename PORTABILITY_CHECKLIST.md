# Checklist: Portabilidad del Módulo Grupos de Trabajo

## Objetivo
Trasladar el módulo completo de grupos de trabajo (CRUD por usuario + reporte PDF) a otro proyecto, independientemente del lenguaje, framework o base de datos utilizado.

---

## 1. Conceptos de dominio (agnóstico)

### Entidades
| Entidad | Descripción | Relaciones |
|---------|-------------|------------|
| **Contribución** | Cargo o tarea periódica (ej: "Limpieza", "Portería") | 1 → N Grupos |
| **Usuario** | Persona/casa beneficiaria | 1 → N Grupos (en distintas contribuciones) |
| **Grupo** | Conjunto de usuarios asignados a UNA contribución | N → 1 Contribución, N → N Usuarios |
| **Cargo** | Pago/estado de contribución por usuario | Marca grupos como "Con pagos" → bloqueo |

### Reglas de negocio invariantes
1. **Unicidad por contribución**: Un usuario puede estar en múltiples contribuciones, pero **solo una vez** por contribución.
2. **Reinicio de `id_grupo`**: Los IDs de grupo se reinician por contribución (no son globales). Siguiente ID = `MAX(id_grupo) WHERE id_contribucion = X + 1`.
3. **Bloqueo por cargos**: Si **algún** usuario de un grupo tiene cargos registrados → grupo marcado "Con pagos" → botones Editar/Eliminar deshabilitados.
4. **Disponibilidad de contribución**: Una contribución puede usarse para crear grupos **solo si todos sus grupos existentes están sin cargos**.

---

## 2. Capas a implementar (por stack)

### Frontend (cualquier framework)
```
UI:
  - Lista principal: Accordion por contribución → Grupos → Usuarios (tarjetas)
  - Modal CRUD: Selección de contribución (filtrada por disponibilidad) + multi-select de usuarios disponibles
  - Reporte PDF: Documento single-page (LETTER) con:
      * Info de contribución (tarjeta con borde coloreado)
      * Tarjetas de grupos (borde izquierdo cíclico, badge rojo si con pagos)
  - Botón Cerrar X: cierra popup o navega atrás

Estado/Data fetching:
  - Hook/Service que:
    * Obtiene usuarios, contribuciones y grupos en una consulta (join 3 vías).
    * Construye mapa: Map<`${id_contribucion}-${id_grupo}`, GrupoConDetalles>.
    * Construye Set: gruposConCargos (claves compuestas).
    * Calcula vecinos disponibles: usuarios no asignados a la contribución actual.
    * CRUD: create (calcula id_grupo), delete, move.
```

### Backend / API
```
Endpoints mínimos:
  GET    /api/usuarios
  GET    /api/contribuciones
  GET    /api/grupos?with=usuarios,contribucion
  POST   /api/grupos           { id_contribucion, usuarios: [{id_usuario}] }
  PUT    /api/grupos/mover     { id_contribucion, id_grupo, id_usuario, nuevo_id_grupo? }
  DELETE /api/grupos/:id_contribucion/:id_grupo/:id_usuario
  GET    /api/grupos/:id_contribucion/:id_grupo/tiene-cargos → boolean
  (Opcional) POST /api/grupos/calcular-id  { id_contribucion } → { id_grupo: number }
```

### Base de datos
```sql
-- Esquema mínimo (SQL)
CREATE TABLE usuarios (
  id BIGINT PRIMARY KEY,
  responsable TEXT NOT NULL,
  ubicacion TEXT
  -- otros campos...
);

CREATE TABLE contribuciones (
  id_contribucion BIGINT PRIMARY KEY,
  nombre TEXT,
  descripcion TEXT,
  color_del_borde TEXT,
  tipo_cargo TEXT,
  periodicidad_dias SMALLINT,
  dia_cargo SMALLINT,
  comentarios_contribucion TEXT
);

CREATE TABLE grupos (
  id_grupo BIGINT NOT NULL,
  id_usuario BIGINT NOT NULL,
  id_contribucion BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id_grupo, id_usuario, id_contribucion),
  FOREIGN KEY (id_contribucion) REFERENCES contribuciones(id_contribucion) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
  -- NOTA: id_grupo NO es identity; se asigna manualmente (reinicia por contribución)
);

CREATE TABLE contribucionesporcasa (
  id BIGINT PRIMARY KEY,
  id_casa BIGINT NOT NULL,
  id_contribucion BIGINT NOT NULL,
  estado TEXT,
  fecha_cargo DATE,
  id_grupo BIGINT NULL,
  FOREIGN KEY (id_casa) REFERENCES usuarios(id),
  FOREIGN KEY (id_contribucion) REFERENCES contribuciones(id_contribucion),
  FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo, id_contribucion) -- opcional
);
```

**Índices recomendados:**
```sql
CREATE INDEX idx_grupos_usuario ON grupos(id_usuario);
CREATE INDEX idx_grupos_contribucion ON grupos(id_contribucion);
```

---

## 3. Decisiones técnicas no negociables

### a) Clave compuesta `${id_contribucion}-${id_grupo}`
- **Motivo**: `id_grupo` se repite entre contribuciones.
- **Uso**: 
  - Key en mapas/arrays en memoria.
  - Valor en `gruposConCargos` (Set).
  - Identificador único en UI (botones, selecciones).

### b) Cálculo de `id_grupo`
```sql
-- Antes de INSERT
SELECT COALESCE(MAX(id_grupo), 0) + 1 AS next_id
FROM grupos
WHERE id_contribucion = :id_contribucion;
```
- **No usar** secuencias globales ni identity.
- **No confiar** en auto-increment de BD; calcular explícitamente.

### c) Filtro de contribuciones disponibles
```logic
contribucion.disponible =
  gruposDeContribucion(id_contribucion).every(g =>
    !gruposConCargos.has(`${id_contribucion}-${g.id_grupo}`)
  )
```
- Una contribución con **al menos un grupo con cargos** → no disponible.
- Una contribución sin grupos → disponible.
- Una contribución con grupos **todos sin cargos** → disponible.

### d) Vecinos disponibles para una contribución X
```logic
vecinos = todosLosUsuarios.except(
  usuariosQueYaEstanEnGruposDe(id_contribucion = X)
)
```
- Un usuario puede estar en otras contribuciones → solo se excluye de **esta**.

### e) Reporte PDF: single-page LETTER
- **Tamaño**: 8.5×11 pulgadas.
- **Layout**:
  - Padding general: 20px.
  - Info de contribución: tarjeta con borde izquierdo (`borderLeftWidth: 4px`) usando `color_del_borde`.
  - Grupos: tarjetas compactas (`padding: 8px`, `marginBottom: 6px`).
  - Fuente base: 9-10px; títulos 12-14px.
- **Colores de borde cíclicos** (grupos sin cargos): `['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']` → `grupos[id_grupo % 8]`.
- **Grupos con cargos**: borde izquierdo rojo (`#DC2626`) + badge "Con pagos".

---

## 4. Adaptación porTechnology Stack

### React / Next.js (origen)
- Mantener estructura de archivos.
- Usar `@react-pdf/renderer`.
- Hook con `useState`/`useEffect`.

### Vue 3
- Convertir hook a `useGruposManager` composable.
- JSX → Vue templates (`<template>`).
- PDF: `@react-pdf/renderer` funciona en Vue también, o usar `vue-pdf`.

### Angular
- Servicio `GruposService` en lugar de hook.
- Componentes con templateUrl/styleUrl.
- PDF: `jspdf` + `angular-pdf`.

### Backend: Node.js (Express/Fastify)
- Endpoints como se describen.
- Cálculo `id_grupo` en capa de servicio antes de INSERT.
- Validaciones: unicidad usuario-por-contribución, verificación de cargos.

### Backend: Python (FastAPI/DRF)
- ViewSets/APIClases.
- `@property` para calculated fields.
- Serializers con validación de negocio.

### Backend: PHP (Laravel)
- Resource Controllers.
- Eloquent models con relationships.
- `DB::table('grupos')->where(...)->max('id_grupo')`.

### Base de datos: MySQL / PostgreSQL / SQLite
- **PostgreSQL**: soporte nativo de tipos, constraints.
- **MySQL**: usar `BIGINT`, `FOREIGN KEY`, `ON DELETE CASCADE`.
- **SQLite**: restricciones algo limitadas; asegurar unicidad con `INSERT OR IGNORE` + triggers.

### Base de datos: MongoDB / NoSQL
- Colección `grupos`: documentos con `id_grupo`, `id_contribucion`, `usuarios: [{id_usuario}]`.
- Índice compuesto: `{ id_contribucion: 1, id_grupo: 1 }` y `{ id_usuario: 1, id_contribucion: 1 }` (unicidad).
- Cálculo de `id_grupo`: agregación `$max` por `id_contribucion`.

---

## 5. Archivos clave a portar (con propósito)

| Archivo origen | Propósito | Qué copiar/adaptar |
|----------------|-----------|--------------------|
| `hooks/useGruposManager.ts` | Lógica de datos, mapas, CRUD | Re-escribir en tu stack; claves compuestas son críticas |
| `components/GrupoPrincipalCard.tsx` | Tarjeta de grupo (UI) | Estilos, badge rojo, color cíclico borde |
| `components/UsuarioCard.tsx` | Usuario dentro de grupo | Layout simple |
| `components/CrearGrupoModal.tsx` | Modal CRUD | Filtros de disponibilidad, cálculo id_grupo, multi-select |
| `page.tsx` (principal) | Accordion por contribución | Estructura de listado |
| `report/components/GrupoContributionReport.tsx` | PDF | Estilos compactos, tarjeta info con borde coloreado |
| `report/page.tsx` | Página reporte (viewer + botones) | Botón Cerrar X (popup vs navigate) |
| `database.ts` / tipos | Definiciones de datos | Convertir a tipos de tu lenguaje |

---

## 6. API Response shapes (JSON)

### GET /api/grupos?with=usuarios,contribucion
```json
[
  {
    "id_grupo": 1,
    "id_contribucion": 3,
    "contribucion": {
      "id_contribucion": 3,
      "nombre": "Limpieza",
      "descripcion": "...",
      "color_del_borde": "#3B82F6",
      "tipo_cargo": "...",
      "periodicidad_dias": 30,
      "dia_cargo": 5,
      "comentarios_contribucion": "..."
    },
    "usuarios": [
      { "id": 12, "responsable": "Juan Pérez", "ubicacion": "A1" },
      { "id": 15, "responsable": "María García", "ubicacion": "B3" }
    ]
  }
]
```

### GET /api/usuarios
```json
[
  { "id": 1, "responsable": "Casa 1", "ubicacion": "1A" },
  ...
]
```

### GET /api/contribuciones
```json
[
  { "id_contribucion": 1, "nombre": "Limpieza", "color_del_borde": "#10B981", ... },
  ...
]
```

### POST /api/grupos
```json
Request:
{
  "id_contribucion": 3,
  "usuarios": [{ "id_usuario": 12 }, { "id_usuario": 15 }]
}
Response:
{ "id_grupo": 2, "mensaje": "Grupo creado" }
```

---

## 7. Checklist de validación post-portabilidad

- [ ] BD: tablas/colecciones creadas con constraints correctos.
- [ ] API: endpoints responden con shapes correctos.
- [ ] Frontend: hook/store realiza fetch y construye mapas compuestos.
- [ ] CRUD: `POST /grupos` calcula `id_grupo` por contribución (reinicia).
- [ ] Filtros: modal solo muestra contribuciones disponibles (sin grupos con cargos).
- [ ] Vecinos: multi-select excluye usuarios ya en esta contribución.
- [ ] Bloqueo: botones de grupo con cargos deshabilitados, badge rojo visible.
- [ ] Reporte PDF: se genera en UNA hoja LETTER, info en tarjeta borde coloreado, grupos compactos.
- [ ] Navegación: botón Cerrar X funciona (popup close o router back).
- [ ] Compilación/ejecución sin errores.
- [ ] Probado con datos reales (mínimo 1 contribución, 2 grupos, 5 usuarios).

---

## 8. Preguntas de diagnóstico (al migrar)

1. **¿Mi BD soporta PK compuesta?** Si no, ¿cómo garantizo unicidad `(id_grupo, id_usuario, id_contribucion)`?
2. **¿Cómo calculo el siguiente `id_grupo` por contribución?** (Secuencia filtrada, max+1, auto-increment scope).
3. **¿Mi ORM soporta joins M:N en una consulta?** Si no, ¿hago N consultas o uso aggregation?
4. **¿Qué library PDF elegí?** ¿Soporta `borderLeftWidth`, `flexDirection: row`, márgenes en px?
5. **¿Cómo manejo el estado global?** Context, Redux, Pinia, Zustand, signals...
6. **¿Cómo implemento el Set de `gruposConCargos`?** (Set<string> de claves compuestas).

---

## 9. Archivos de referencia en este proyecto (origen)

```
 módulo grupos:
  • src/app/menu/admin/grupos-de-trabajo/hooks/useGruposManager.ts
  • src/app/menu/admin/grupos-de-trabajo/components/GrupoPrincipalCard.tsx
  • src/app/menu/admin/grupos-de-trabajo/components/UsuarioCard.tsx
  • src/app/menu/admin/grupos-de-trabajo/components/CrearGrupoModal.tsx
  • src/app/menu/admin/grupos-de-trabajo/page.tsx
  • src/app/menu/admin/grupos-de-trabajo/report/components/GrupoContributionReport.tsx
  • src/app/menu/admin/grupos-de-trabajo/report/page.tsx
 tipos:
  • src/types/database.ts
  • src/types/index.ts
```

---

## 10. Mantener KISS durante la portabilidad

1. **Un concepto a la vez**: Primero BD → luego API → luego un componente UI → luego PDF.
2. **Compilar/ejecutar después de cada pieza**.
3. **No portar "por si acaso"**: solo lo que el producto necesita.
4. **Si algo falla**: revertir al último estado funcional y reintentar con cambio mínimo.

---

**Creado**: 2026-05-07 — Basado en implementación React + Next.js + Supabase + react-pdf.

**Uso**: Copia este archivo al nuevo proyecto, marca el checklist y adapta cada sección a tu stack.
