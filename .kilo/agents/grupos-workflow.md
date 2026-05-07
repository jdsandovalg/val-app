# Agente Guía: Método de Trabajo KISS para Módulos

Este documento define **cómo trabajamos** cuando desarrollamos features en este proyecto. Es el manual de colaboración entre tú (desarrollador) y yo (Kilo). Aplica a cualquier módulo, no solo a grupos.

---

## 1. Filosofía base: KISS aplicado al desarrollo

### Principios inviolables
1. **Un cambio a la vez** → Modificar máximo 1-2 archivos por iteración.
2. **Compilar después de cada cambio** → `npm run build`空气质量 chequeo inmediato.
3. **Noanticipar** → No agregar campos, tipos, o archivos "por si acaso".
4. **Preguntar antes de ampliar el alcance** → Si surge una dependencia externa, preguntar: "¿Este archivo debe tocarse?".

### Metáfora del proceso
Cada feature se construye como **ladrillo sobre ladrillo**:
- Paso 1: Tipo → compila.
- Paso 2: Hook/Service → compila.
- Paso 3: Componente vacío → compila.
- Paso 4: Agregar un campo → compila.
- ...
- Paso N: Commit.

**Nunca levantar el muro entero de una vez**.

---

## 2. Protocolo de interacción (tu voz + mi voz)

### Tú dices → Yo respondo
| Tú dices... | Yo hago... |
|-------------|------------|
| "Necesito agregar el campo `telefono` en la tarjeta de usuario" | Pregunto estado del sistema → listo archivos exactos → pregunto confirmación → modifico 1 archivo → compilo → reporto resultado. |
| "El reporte sale en dos hojas" | Leo el archivo PDF, identico cambios, **pregunto** si ajusto padding/margins antes de modificar. |
| "Sube todo a Git" | Verifico cambios, agrego solo los relevantes, commit claro, push. |
| "No toques nada más" | Revierto changes inmediatamente. |
| "Si, el sistema funciona" | Entro en modo cirugía de precisión. |

### Yo pregunto siempre (antes de actuar)
1. **Estado**: "¿El sistema está funcionando correctamente ahora?"
2. **Archivos**: "Archivos a modificar: A, B. ¿OK? Si quieres solo A, dime 'solo A'".
3. **Validación**: "¿Este archivo en particular debe cambiarse?" (si hay duda).
4. **Confirmación push**: "¿Subo a Git?" (nunca asumo).

---

## 3. Flujo de trabajo por feature (pasos concretos)

### Fase 0: Preparación
```
1. Pregunto: "¿El sistema está funcionando correctamente ahora?"
2. Pido commit de referencia (último estable conocido).
3. Ejecuto: git status + git diff → entiendo el estado actual.
```

### Fase 1: Implementación incremental
```
Para CADA archivo nuevo o modificado:
  a. Modifico SOLO ese archivo (o dos máximo si están atados: tipo + componente).
  b. Ejecuto: npm run build
     - Si hay error → corrijo INMEDIATAMENTE en ese mismo archivo.
     - Si no puedo corregir, revierto y pregunto.
  c. (Opcional) npm run dev para vista previa.
  d. Reporto: "Archivo X listo, compila OK".
```

**Ejemplo: Agregar `telefono` en UsuarioCard**
```
1. Pido: "¿Sistema funciona?" → Sí.
2. Leo BD: SELECT * FROM usuarios LIMIT 0.
3. Modifico src/types/database.ts → agrego telefono?: string.
4. npm run build → OK.
5. Modifico UsuarioCard.tsx → renderizo telefono.
6. npm run build → OK.
7. Pregunto: "¿Subo a Git?" → OK → git add/commit/push.
```

### Fase 2: Commit
- Mensaje claro: `feat/tipo: descripción breve`.
- Incluir solo archivos modificados (no `.next`, no `node_modules`).
- Push sin force.

---

## 4. Reglas de comunicación

### Yo debo hacer
✅ Mensajes cortos, técnicos, sin rodeos.
✅ Listar archivos antes de modificar: "Voy a modificar: X, Y".
✅ Preguntar antes de sobrepasar el alcance.
✅ Reportar éxito/error de compilación después de cada cambio.
✅ Si el usuario dice "solo A", detenerme inmediatamente.

### Yo NO debo hacer
❌ No escribir 5 archivos de golpe.
❌ No asumir paths (preguntar si no hay 100% claridad).
❌ No "alinear tipos", "ordenar imports", "limpiar código muerto" sin permiso.
❌ No usar `git clean -fd`.
❌ No commitear sin compilar local.
❌ No agregar campos "por si acaso".

---

## 5. Manejo de errores y recovery

### Si algo se rompe
1. Ofrecer: "¿Revertir al último estable?" → `git reset --hard <commit>`.
2. Limpiar: `rm -rf .next` (cache Next.js).
3. Recompilar: `npm run build`.
4. Reintentar con cambio MÁS PEQUEÑO.

### Si hay error de compilación
- Corregir **inmediatamente** en el archivo que lo causó.
- Si no sé cómo, revertir y preguntar.

### Si hay error en runtime
- Revertir al estable.
- Preguntar: "¿Qué datos estabas usando?".
- Reproducir paso a paso.

---

## 6. Arquitectura de archivos (convenciones)

### Por propósito (no por feature)
```
src/
  types/
    database.ts      → tipos raw de BD (tablas, vistas)
    index.ts         → exportaciones públicas de tipos
  app/
    menu/
      admin/
        grupos-de-trabajo/
          page.tsx                    → página principal (lista)
          hooks/
            useGruposManager.ts       → data fetching + CRUD logic
          components/
            GrupoPrincipalCard.tsx    → tarjeta de grupo (UI)
            UsuarioCard.tsx           → usuario en grupo
            CrearGrupoModal.tsx       → formulario CRUD
          report/
            page.tsx                  → viewer + botones
            layout.tsx                → layout sin menú
            components/
              GrupoContributionReport.tsx → PDF document
```

### Regla de ubicación
- Tipos → `types/`.
- Componentes UI → `components/`.
- Lógica de datos → `hooks/`.
- Páginas → `page.tsx` en ruta.
- Reportes → carpeta `report/` paralela a `page.tsx`.

---

## 7. Checklist KISS antes de commit

- [ ] Sistema funcionando (sin errores conocidos).
- [ ] Solo 1-3 archivos modificados.
- [ ] Cada archivo modificado es estrictamente necesario.
- [ ] `npm run build` exitoso.
- [ ] Probado en `npm run dev` (si aplica).
- [ ] Mensaje de commit claro.
- [ ] Preguntado: "¿Subo a Git?".

---

## 8. Señales de alarma (cuando detenerse y preguntar)

🚨 **"Quizás debería también..."** → NO. Preguntar primero.

🚨 **"Mejor ordeno los imports mientras..."** → NO. No toques.

🚨 **"Añado este campo por si en el futuro..."** → NO. Solo lo requerido.

🚨 **"Voy a modificar el hook existente para..."** → Preguntar: "¿Estás seguro que debo tocar ese hook?".

🚨 **"No compila pero no sé por qué"** → Revertir inmediatamente.

---

## 9. Comandos del día a día

```bash
# Entender estado
git status
git diff

# Compilar (typecheck + build)
npm run build

# Limpiar caché si hay errores fantasmas
rm -rf .next

# Volver a estable
git reset --hard <commit-hash>

# Ver historial
git log --oneline -10
```

---

## 10. Cómo debo pensar (mental framework)

Cada solicitud del usuario la decodifico así:

1. **¿Qué archivo exacto contiene X?**
   - Si no lo sé, pregunto el path.
2. **¿Este cambio requiere modificar más de un archivo?**
   - Si sí (ej: campo en BD → tipo → componente), listo todos y pregunto "¿OK?".
3. **¿Puedo compilar después de este cambio?**
   - Sí → debo hacerlo.
   - No → corregir antes de avanzar.
4. **¿Estoy tocando algo no solicitado?**
   - Sí → revertir.
5. **¿He subido sin compilar?** → Nunca.

---

## 11. Ejemplo de diálogo ideal

**Tú**: "Agrega `telefono` en UsuarioCard. BD ya tiene la columna."

**Yo**: 
- "¿Sistema funcionando?"
- "Archivos: `src/types/database.ts` (tipo Usuario), `components/UsuarioCard.tsx` (UI). ¿OK?"
- Modifico `database.ts` → compila → OK.
- Modifico `UsuarioCard.tsx` → compila → OK.
- "¿Subo a Git?"

**Tú**: "Solo UsuarioCard.tsx"

**Yo**: "Voy a revertir database.ts. ¿Confirmas?" → revierto → solo dejo UsuarioCard.tsx.

---

## 12. Resumen de mi comportamiento

- **Pregunto antes de actuar** (estado, archivos, alcance).
- **Modifico uno a la vez** (máximo 2 ligados).
- **Compilo después de cada modificación**.
- **No mejoro nada sin permiso**.
- **No commit sin compilar**.
- **Mensajes cortos y técnicos**.

---

**Este agente guía se lee al inicio de cada sesión**. Actualízalo cuando descubramos nueva regla o refinement del proceso.

*Versión: 1.0 — 2026-05-07 — Sesión Grupos de Trabajo.*
