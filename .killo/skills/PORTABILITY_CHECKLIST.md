# Checklist: Portabilidad del Skill "Gestión de Grupos de Trabajo"

## Objetivo
Trasladar el módulo de grupos de trabajo (CRUD + reporte PDF) a otro proyecto, independientemente del lenguaje, framework o base de datos.

---

## 1. Conceptos de dominio (lenguaje neutro)

### Entidades core
| Concepto | Descripción | Relaciones |
|----------|-------------|------------|
| **Contribución** | Cargo o tarea periódica (ej: "Limpieza", "Seguridad") | 1 contribución → N grupos |
| **Usuario** | Persona/casa asignada | 1 usuario → puede estar en N grupos (distintas contribuciones) |
| **Grupo** | Conjunto de usuarios asignados a UNA contribución | Pertenecen a 1 contribución, tienen N usuarios |
| **Cargo** | Pago/estado de contribución por usuario | Se registra en tabla aparte; marca grupos como "Con pagos" (bloqueo) |

### Reglas de negocio
1. **Unicidad por contribución**: Un usuario puede estar en múltiples contribuciones, pero solo **una vez** por contribución.
2. **Reinicio de IDs**: `id_grupo` se reinicia por contribución (no es global). En BD: `MAX(id_grupo)+1` donde `id_contribucion = X`.
3. **Bloqueo por cargos**: Si **algún** usuario de un grupo tiene cargos registrados (pagos), el grupo se marca "Con pagos" → no se puede editar/eliminar.
4. **Disponibilidad de contribuciones**: Una contribución está disponible para crear grupos **solo si** todos sus grupos existentes están sin cargos.

---

## 2. Arquitectura de capas (a adaptar por stack)

### Frontend (cualquier framework)
```
Componentes UI:
  - Página principal: lista de contribuciones (accordion) → grupos → usuarios
  - Modal CRUD: crear/editar grupo (selección de contribución + multi-select usuarios)
  - Reporte PDF: documento single-page con info + tarjetas de grupos
Estado:
  - Hook/Store: fetch de datos, mapas compuestos, operaciones CRUD
Tipos:
  - Definir estructuras: Usuario, Contribucion, Grupo, GrupoConDetalles
```

### Backend / API
```
Endpoints mínimos:
  GET    /usuarios              → lista todos los usuarios
  GET    /contribuciones        → lista todas las contribuciones
  GET    /grupos                → lista grupos con joins (usuarios + contribucion)
  POST   /grupos                → crear grupo (id_grupo calculado por contribución)
  DELETE /grupos/:id_grupo/:id_contribucion/:id_usuario → eliminar usuario de grupo
  PUT    /grupos/mover          → mover usuario entre grupos (o eliminar)
  GET    /cargos/:id_contribucion/:id_grupo → verificar si grupo tiene cargos
```

### Base de datos
```
Tablas mínimas:
  usuarios (id, responsable,ubicacion,...)
  contribuciones (id_contribucion, nombre, descripcion, color_del_borde, tipo_cargo, periodicidad_dias, dia_cargo,...)
  grupos (id_grupo, id_usuario, id_contribucion) → PK compuesta (id_grupo, id_usuario, id_contribucion)
  contribucionesporcasa (id_casa, id_contribucion, estado, fecha_cargo,..., id_grupo=NULL) → opcional, para marcar cargos
```

---

## 3. Decisiones técnicas críticas (no negociables)

### a) Clave compuesta en mapas
- **Problema**: `id_grupo` se repite entre contribuciones.
- **Solución**: Usar clave `` `${id_contribucion}-${id_grupo}` `` en:
  - Mapa de grupos en memoria.
  - Set de grupos con cargos.
  - Cualquier identificación única en UI.

### b) Cálculo de `id_grupo`
```sql
SELECT COALESCE(MAX(id_grupo), 0) + 1 
FROM grupos 
WHERE id_contribucion = :id_contribucion
```
- No usar `IDENTITY` ni `AUTOINCREMENT`.
- Reinicia por contribución.

### c) Filtro de contribuciones disponibles
```logic
contribucion.disponible = 
  todos sus grupos existentes cumplen: 
    gruposConCargos NO contiene clave `${id_contribucion}-${id_grupo}`
```
- No basta con "no tiene grupos": si tiene grupos sin cargos → disponible.

### d) Vecinos disponibles (usuario no asignado a esta contribución)
```logic
vecinosDisponibles(contribucionId) = 
  todosLosUsuarios - usuariosQueYaEstanEn(contribucionId)
```
- Un usuario puede estar en otras contribuciones; solo se excluye de **esta**.

### e) Reporte PDF: una hoja LETTER
- Tamaño: `LETTER` (8.5×11 pulgadas).
- Padding general reducido (ej: 20px).
- Info de contribución en tarjeta con borde izquierdo coloreado (`color_del_borde`).
- Tarjetas de grupo: padding compacto (8px), margin entre tarjetas (6-8px).
- Si desborda, ajustar fuentes (9-10px base).

---

## 4. Adaptación porTechnology Stack

### Si es React / Next.js
- Mantener estructura de archivos:
  ```
  app/menu/admin/grupos-de-trabajo/
    page.tsx
    hooks/useGruposManager.ts
    components/
    report/
  ```
- Usar `@react-pdf/renderer` para PDF.
- Estado: `useState` + `useEffect` (o state manager existente).

### Si es Vue / Angular / Svelte
- Traducir hook a composable/service.
- Traducir JSX/TSX a templates del framework.
- PDF: buscar library equivalente (ej: `vue-pdf`, `jspdf`).

### Si es backend en Node/Express, Python/FastAPI, etc.
- Replicar endpoints listados en sección 2.
- Lógica de cálculo `id_grupo` en servidor.
- Validar reglas de negocio en BD o capa de servicio.

### Si es otra BD (MySQL, SQLite, MongoDB)
- **Relacional**: replicar tablas con PK compuesta y FK.
- **NoSQL** (Mongo): usar documentos anidados o colecciones separadas; mantener reglas de unicidad con índices compuestos.
- Ajustar consultas de `MAX(id_grupo)` y joins.

---

## 5. Qué archivos copiar / adaptar

| Archivo origen | Propósito | Qué adaptar |
|----------------|-----------|-------------|
| `GrupoContributionReport.tsx` | PDF (react-pdf) | Traducir a framework PDF elegido; conservar estilos compactos |
| `useGruposManager.ts` | Lógica de datos | Re-escribir en lenguaje/framework; mantener claves compuestas y filtros |
| `GrupoPrincipalCard.tsx` | Tarjeta de grupo (UI) | Adaptar colores cíclicos y badge de cargos |
| `CrearGrupoModal.tsx` | Modal CRUD | Adaptar multi-select y cálculo de `id_grupo` |
| `page.tsx` (principal) | Accordion por contribución | Mantener estructura de listado |
| `database.ts` + `index.ts` | Tipos TypeScript | Convertir a tipos de tu lenguaje (interfaces, types, clases) |

---

## 6. Datos mínimos a preservar

### API responses (JSON)
```json
{
  "usuarios": [{ "id": number, "responsable": string, "ubicacion": string }],
  "contribuciones": [{ 
    "id_contribucion": number, 
    "nombre": string, 
    "descripcion": string, 
    "color_del_borde": string, 
    "tipo_cargo": string, 
    "periodicidad_dias": number, 
    "dia_cargo": number,
    "comentarios_contribucion": string 
  }],
  "grupos": [{ 
    "id_grupo": number, 
    "id_contribucion": number, 
    "usuarios": [{ "id": number, "responsable": string, "ubicacion": string }],
    "contribucion": { ... } 
  }],
  "gruposConCargos": ["1-1", "1-2", ...] // claves compuestas
}
```

---

## 7. Validación de portabilidad

### Checklist antes de considerar "listo"
- [ ] BD: tablas/colecciones creadas con constraints (unidad por contribución).
- [ ] API: endpoints funcionando con los datos esperados.
- [ ] Frontend: hook/store obtiene y procesa datos correctamente.
- [ ] CRUD: crear grupo calcula `id_grupo` por contribución.
- [ ] Bloqueo: botones Editar/Eliminar deshabilitados si grupo tiene cargos.
- [ ] Reporte: PDF single-page, info en tarjeta, grupos en tarjetas compactas.
- [ ] Compilación/ejecución sin errores.
- [ ] Navegación: botón cerrar vuelve a lista (o cierra popup).

---

## 8. Preguntas clave al adaptar

1. **¿Cómo se manejan las claves compuestas en mi BD/framework?**
2. **¿Cómo se calcula el siguiente ID por grupo en mi BD?** (Secuencia, max+1, auto-increment scope).
3. **¿Mi ORM/DB soporta joins M:N?** Si no, ¿cómo traigo usuarios + contribuciones en una consulta?
4. **¿Cómo implemento el filtro "vecinos disponibles"?** (usuarios no asignados a esta contribución).
5. **¿Hay library PDF en mi stack?** ¿Soporta estilos similares a react-pdf?
6. **¿Cómo manejo el estado compartido?** (Context, store, props drilling).

---

## 9. Mantener el espíritu KISS

- **Un archivo a la vez**: No portar todo en bloque.
- **Compilar/ejecutar después de cada pieza**.
- **Probar con datos reales** (una contribución, 2-3 grupos).
- **Si algo falla**: revertir y portar solo lo mínimo funcional.

---

## 10. Entregable de portabilidad

Al migrar a otro proyecto, crear en ese repositorio:
```
docs/portabilidad-grupos.md   → este checklist adaptado
.kilo/skills/grupos-de-trabajo-skill.md → skill documentado específico del proyecto
```
Y actualizar este archivo con:
- Tech stack destino.
- Diferencias encontradas.
- Comandos de build/run específicos.
- Notas de compatibilidad.

---

**Creado**: 2026-05-07 — Basado en implementación val-app (React + Next.js + Supabase + react-pdf).
