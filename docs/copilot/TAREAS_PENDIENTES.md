## 🎯 RESUMEN EJECUTIVO - Sesión del 14 de Noviembre de 2025

### ✅ SISTEMA DE REPORTES PDF DE VOTACIÓN: COMPLETADO Y FUNCIONAL

**Estado General:** Sistema completo de generación de reportes PDF para votaciones implementado, con indicadores visuales profesionales, tabla de criterios de aprobación, estado vacío amigable, y soporte multi-idioma.

**Cambios Backend — Nueva Función RPC:**
- ✅ **`fn_gestionar_votos_con_responsable`**: Nueva función RPC que retorna votos con JOIN a tabla `usuarios`
- Devuelve todos los votos de un proyecto con nombres de responsables (texto, no solo IDs)
- Permite generar reportes completos sin necesidad de múltiples consultas
- Estructura: `id_voto, id_proyecto, id_evidencia, id_usuario, responsable (text), fecha_voto, votante_proxy_id`

**Cambios Frontend — Generación de Reportes PDF:**
1. **Componente VotingReport.tsx (`/src/app/menu/voting/VotingReport.tsx`):**
   - Componente PDF completo con @react-pdf/renderer
   - Header con logo y título "Reporte de Votación"
   - Sección de información del proyecto (sin campo notas_clave)
   - **Indicadores visuales sin estrellas Unicode:**
     - Contador numérico grande (20pt, bold) para votos
     - Barra de progreso visual que muestra porcentaje relativo
     - Eliminadas estrellas ★ que no renderizaban en PDFs
   - **Badge de aprobación verde:**
     - Aparece solo cuando hay 100% de consenso
     - Texto: "✓ PROYECTO APROBADO - 100% DE CONSENSO"
     - Color verde (#10B981) destacado
   - **Lista de responsables en grid de 3 columnas:**
     - Cada columna 33% del ancho
     - Formato: "• Casa X - Nombre"
     - Mejor para nombres largos
   - **Tabla de criterios de aprobación:**
     - 4 escenarios explicados (100% consenso, mayoría simple, empate, dispersión)
     - Colores: verde para APROBADO, rojo para NO APROBADO
     - Nota explicativa sobre distribución de costos
   - **Filtrado inteligente:**
     - Solo muestra cotizaciones con votos > 0
     - Ordenamiento descendente por votos
     - Cotizaciones sin votos no aparecen (transparencia)
   - Paleta de 8 colores para cotizaciones
   - Warning de ESLint suprimido con comentario

2. **Página de visualización (`/src/app/menu/voting/report/page.tsx`):**
   - Visor full-screen del PDF generado
   - Carga datos desde localStorage ('votingReportData')
   - Botones de compartir y descargar
   - Nombre de archivo sanitizado y descriptivo

3. **Actualización página de votación (`/src/app/menu/voting/page.tsx`):**
   - ✅ Botón verde "Generar Reporte PDF" con icono Download
   - ✅ Tipo `Vote` actualizado: agregado campo `responsable?: string`
   - ✅ Función `handleGenerateReport()` refactorizada:
     - Usa nueva RPC `fn_gestionar_votos_con_responsable`
     - Campo `notas_clave: null` para no mostrarlo en reporte
     - Cuenta TODOS los votos por cotización (no solo casa seleccionada)
     - Crea campo `responsables` (plural): "Casa 1 - Name, Casa 2 - Name, ..."
   - ✅ Import `useRouter` removido (no usado)

**Lógica de Aprobación (100% Consenso):**
```typescript
const todasVotaronPorGanador = 
  ganadorVotos === totalCasas &&           // Ganador tiene todos los votos
  totalCasas > 0 &&                        // Hay al menos 1 voto
  sortedCotizaciones.filter(c => c.votos === totalCasas).length === 1;  // Solo 1 con máximo
```

**Estado Vacío — Sin Proyectos en Votación:**
- ✅ Diseño moderno con icono checkmark circular en fondo azul
- ✅ Tarjeta blanca centrada con sombra y bordes redondeados
- ✅ Mensaje claro: "Sin Proyectos en Votación"
- ✅ Explicación: "Los proyectos aparecerán cuando el administrador los active"
- ✅ Sugerencia con emoji 💡: "Revisar grupos o calendario"
- ✅ Botones de navegación:
  - "Ver Grupos de Trabajo" (azul sólido)
  - "Ver Calendario" (borde azul)
- ✅ Responsive para móvil y desktop
- ✅ Solo se muestra cuando `votableProjects.length === 0 && !loading`

**Traducciones (i18n) — `/src/locales/*.json`:**
- ✅ Español: `voting.noProjectsTitle`, `voting.noProjectsMessage`, `voting.noProjectsHint`
- ✅ Inglés: Traducciones correspondientes
- ✅ Francés: Traducciones correspondientes
- ✅ Claves existentes: `voting.generateReport`, `voting.reportTitle`, `voting.downloadPdf`

**Mejoras UI/UX Adicionales:**
- ✅ Icono de navegación actualizado: CheckCircle2 → Gavel (consistencia)
- ✅ Color hover botón votación: azul
- ✅ Mobile overflow corregido: `w-screen overflow-x-hidden`

**Validaciones Completadas:**
- ✅ Build compiló exitosamente sin errores
- ✅ Warning de ESLint eliminado (imagen PDF)
- ✅ Tipos TypeScript sincronizados (`Vote`, `Cotizacion`)
- ✅ PDF genera correctamente con datos reales
- ✅ Estado vacío muestra correctamente cuando no hay proyectos
- ✅ Tabla de criterios renderiza en PDF

**Comando Git para Commit:**
```bash
feat(voting): add PDF report generation with approval criteria table and empty state UI - includes vote tracking with responsible names, progress bars, 100% consensus validation, 3-column layout for voters, professional empty state with navigation buttons, and multi-language support (es/en/fr)
```

---

## 🔍 OPORTUNIDADES DE MEJORA IDENTIFICADAS

### **A. Técnicas (Arquitectura y Rendimiento):**

1. **⚠️ Paginación en Reportes PDF:**
   - **Problema:** Si hay muchas cotizaciones o muchos responsables por cotización, el contenido puede desbordar una página
   - **Impacto:** Medio - puede cortarse información en PDFs con datos extensos
   - **Solución sugerida:** Implementar lógica de paginación automática en VotingReport.tsx

2. **⚠️ Fuentes limitadas en PDF:**
   - **Problema:** @react-pdf/renderer solo soporta fuentes estándar (Helvetica, Times, Courier)
   - **Impacto:** Bajo - limita símbolos Unicode avanzados (por eso se removieron estrellas)
   - **Solución actual:** Usar indicadores visuales (números, barras, colores) en lugar de símbolos

3. **⚠️ Cache de reportes en localStorage:**
   - **Problema:** localStorage puede llenarse con reportes grandes (límite ~5-10MB)
   - **Impacto:** Bajo - solo afecta si se generan muchos reportes sin cerrar navegador
   - **Solución sugerida:** Limpiar localStorage después de descargar o implementar TTL

4. **🔄 Validación dinámica de número de casas:**
   - **Problema:** Lógica de 100% asume número fijo de casas
   - **Impacto:** Bajo - funciona correctamente pero podría ser más flexible
   - **Solución sugerida:** Consultar total de casas activas desde DB dinámicamente

### **B. UX/UI (Experiencia de Usuario):**

1. **💡 Preview del PDF antes de generar:**
   - **Problema:** No hay vista previa, solo se ve después de generar
   - **Impacto:** Medio - usuario no sabe cómo se verá hasta generarlo
   - **Solución sugerida:** Modal con preview en miniatura antes de generar

2. **💡 Historial de reportes generados:**
   - **Problema:** No se guardan reportes anteriores, solo el último en localStorage
   - **Impacto:** Medio - si cierran el navegador pierden el reporte
   - **Solución sugerida:** Tabla `reportes_votacion` en BD con URLs a bucket de Supabase

3. **💡 Feedback visual durante generación:**
   - **Problema:** No hay loading spinner o progress indicator al generar PDF
   - **Impacto:** Bajo - puede parecer que no pasa nada en proyectos grandes
   - **Solución sugerida:** Toast de "Generando PDF..." con spinner

4. **💡 Notificación cuando todos voten:**
   - **Problema:** Admin no recibe alerta cuando se alcanza 100% de participación
   - **Impacto:** Medio - tiene que revisar manualmente
   - **Solución sugerida:** Sistema de notificaciones push web (ver roadmap)

### **C. Funcionales (Lógica de Negocio):**

1. **🔄 Votación en tiempo real:**
   - **Problema:** Votos no se actualizan automáticamente, requiere refresh manual
   - **Impacto:** Medio - admin debe recargar para ver nuevos votos
   - **Solución sugerida:** Implementar Supabase Realtime subscriptions

2. **🔄 Estados intermedios no visibles:**
   - **Problema:** En UI principal no se ve estado "parcialmente votado" claramente
   - **Impacto:** Bajo - solo afecta visibilidad de progreso
   - **Solución sugerida:** Barra de progreso en tarjeta de proyecto (ej. "7/10 casas han votado")

3. **🔄 Export adicional a Excel/CSV:**
   - **Problema:** Solo se puede exportar a PDF, no a formatos editables
   - **Impacto:** Bajo - suficiente para reporte formal, pero limitado para análisis
   - **Solución sugerida:** Botón adicional "Exportar a Excel" con biblioteca xlsx

---

## 📋 CONSIDERACIONES PARA PRÓXIMAS SESIONES

### **Corto Plazo (Próxima Sesión):**
- [ ] Agregar loading spinner al generar PDF
- [ ] Implementar botón "Refrescar votos" sin reload completo de página
- [ ] Mejorar mensajes de error si falla generación de PDF

### **Mediano Plazo (1-2 Meses):**
- [ ] Sistema de notificaciones cuando todos voten (Supabase Realtime)
- [ ] Historial de reportes generados con fechas (tabla en BD + bucket)
- [ ] Preview en miniatura antes de generar reporte completo
- [ ] Export adicional a Excel/CSV para análisis

### **Largo Plazo (Roadmap 2025-2026):**
- [ ] Dashboard de estadísticas de votación con gráficos
- [ ] Gráficos visuales de distribución de votos (Chart.js o Recharts)
- [ ] Sistema de recordatorios automáticos para casas sin votar
- [ ] Análisis histórico de votaciones por proyecto
- [ ] Integración con sistema de mensajería para notificar resultados

---

## 🎯 RESUMEN EJECUTIVO - Sesión del 13 de Noviembre de 2025

### ✅ SISTEMA DE VOTACIONES: COMPLETADO, RESPONSIVE Y LISTO PARA TESTING

**Estado General:** Función SQL refactorizada, frontend integrado, optimización mobile-first, build sin errores, lógica de restricción única implementada.

**Cambios SQL — `fn_gestionar_votos()`:**
- Parámetros `p_id_usuario` y `p_votante_proxy_id` cambiados a `BIGINT` (era UUID).
- Sin validación contra `auth.users` — sistema usa tabla `public.usuarios` como fuente de verdad.
- Tres acciones: `SELECT` (consultar votos), `VOTAR` (insertar), `ANULAR_VOTO` (eliminar).
- UNIQUE CONSTRAINT en `(id_proyecto, id_usuario)` garantiza un voto por usuario por proyecto.

**Cambios Frontend — `/src/app/menu/voting/page.tsx`:**
- **Responsive Design (Mobile-First):**
  - En mobile: Título horizontal en la parte superior (elimina scroll lateral).
  - En desktop: Barra lateral vertical con título rotado (diseño original).
  - Usa `md:hidden` y `hidden md:flex` para adaptar la UI según el tamaño de pantalla.
- Selector de proyectos en votación (dropdown).
- Selector de casas: PRE/OPE ven solo su casa (preseleccionada); ADM pueden elegir cualquiera.
- Indicador visual (check verde) para casas que ya votaron.
- Cotizaciones ordenadas por valor (menor a mayor).
- **Restricción crítica:** Una casa vota por UNA cotización máximo.
  - Si ya votó: botón "ANULAR VOTO" (rojo) solo en esa cotización.
  - Otros "VOTAR" deshabilitados (gris).
- Llamadas RPC: `handleVote()` pasa `p_id_usuario: selectedCasa.id`, `p_votante_proxy_id: (ADM && otra casa) ? currentUser.id : null`.

**Cambios UI/UX — Navegación (`layout.tsx`) e Iconografía:**
- ✅ Ícono de navegación para votación cambió a **Gavel** (martillo de juez) para consistencia con el botón "Enviar a Votación" en lista de proyectos.
- ✅ Color hover en botón de votación: azul (`text-blue-600`) para alineación visual.
- ✅ Clave de traducción `navigation.voting` agregada a `es.json`, `en.json`, `fr.json`.

**Validaciones Completadas:**
- ✅ Build compiló sin errores de TypeScript/ESLint (17.8s, 20 páginas generadas).
- ✅ SELECT RPC probado en SQL editor — funciona.
- ✅ Lógica de restricción única verificada en código.
- ✅ Responsive design verificado en navegador (sin desbordamiento en mobile).

**Próximo Paso — Testing en Navegador:**
1. Login como PRE → Vota una cotización → Verifica check verde en su casa.
2. Intenta votar otra → Verifica que botón está deshabilitado.
3. Anula voto → Vota otra cotización → Verifica cambio exitoso.
4. Login como ADM → Selecciona otra casa → Vota → Verifica `votante_proxy_id` en BD.
5. Prueba en mobile: Verifica que no hay scroll horizontal y el layout se adapta correctamente.

---

## II. Logros Recientes (Tareas Completadas)

### 9. Refactorización de Tipos de Evidencia (Enums) para Escalabilidad
*   ✅ **Diagnóstico del Problema:** Se identificó que los tipos de evidencia (`COTIZACION`, `FACTURA`, etc.) estaban definidos de forma estática (hardcodeados) en múltiples archivos del frontend (`EvidenceUploader`, `FinancialReport`, `locales/*.json`). Esto hacía que agregar un nuevo tipo de evidencia fuera un proceso manual, propenso a errores y difícil de mantener.
*   ✅ **Solución de Backend Genérica:** Se creó una única función RPC en la base de datos (`get_enum_values`) capaz de leer y devolver los valores de cualquier tipo `ENUM` de PostgreSQL, eliminando la necesidad de funciones específicas por cada catálogo.
*   ✅ **Frontend Dinámico y Resiliente:**
    *   **Formulario de Carga:** El componente `EvidenceUploader` ahora consume la lista de tipos de evidencia directamente desde la base de datos, asegurando que el formulario siempre esté sincronizado.
    *   **Reporte PDF Inteligente:** Se implementó una función (`getEvidenceColor`) que asigna colores dinámicamente. Mantiene colores predefinidos para los tipos conocidos y genera colores únicos y consistentes para cualquier nuevo tipo (como `CONTRATO`), evitando que el reporte se rompa o muestre colores genéricos.
*   ✅ **Prueba de Fuego Superada:** Se validó la arquitectura agregando el nuevo tipo `CONTRATO` a la base de datos. El sistema lo integró automáticamente en la UI y el reporte PDF sin necesidad de modificar la lógica de los componentes, solo requiriendo la actualización de los archivos de traducción.
*   **Resultado:** El sistema es ahora significativamente más robusto, escalable y fácil de mantener. La dependencia del frontend en listas estáticas ha sido eliminada.

---

## II. Logros Recientes (Tareas Completadas)

### XI. Corrección y Robustecimiento de la Lógica de Creación de Proyectos
*   ✅ **Diagnóstico del Bug Crítico:** Se detectó que la creación de proyectos por la vía "heredada" (con costos) no estaba generando las cuotas de aporte correspondientes para cada casa, un error introducido en una refactorización previa.
*   ✅ **Refactorización y Reutilización de Lógica:**
    *   Se corrigió la función `gestionar_proyectos` para que, al crear un proyecto con costos, invoque correctamente a la función ya existente `crear_contribuciones_para_proyecto`.
    *   Se eliminó la lógica duplicada y se mejoró la robustez del sistema al modificar `crear_contribuciones_para_proyecto` para que reciba el `valor_estimado` como parámetro directo. Esto hace el flujo de datos explícito, elimina consultas redundantes a la base de datos y previene posibles fallos de transaccionalidad (OLTP).
*   ✅ **Creación de Activo de Prueba Reutilizable:** Se encapsuló el script de prueba en un procedimiento almacenado (`test_creacion_proyecto_y_aportes`), convirtiéndolo en un activo de DDL permanente. Esto permite validar la funcionalidad completa (creación, validación y limpieza) de forma rápida y segura en el futuro.
*   **Resultado:** El flujo de creación de proyectos con costos ahora es fiable, robusto y genera automáticamente los aportes por casa como se esperaba. La base de datos cuenta con un procedimiento de prueba para garantizar la estabilidad a largo plazo.

---

## II. Logros Recientes (Tareas Completadas)

### X. Integración de Fechas de Proyecto y Mejoras de UI en Modal
*   ✅ **Ampliación de la Base de Datos:** Se añadieron los campos `fecha_inicial_proyecto` y `fecha_final_proyecto` a la tabla `proyectos` y se actualizaron las funciones RPC (`gestionar_proyectos`, `get_project_info_with_status`) para soportar su inserción y consulta.
*   ✅ **Mejora Radical de UI en Modal (`ProjectModal.tsx`):**
    *   Se añadieron controles de fecha (`<input type="date">`) optimizados para una experiencia "mobile-first".
    *   Se refactorizó el modal para usar un sistema de pestañas ("Información General" y "Detalles y Notas"), solucionando el problema de sobrecarga de campos en pantallas pequeñas y mejorando drásticamente la usabilidad.
*   ✅ **Internacionalización Completa:** Se actualizaron los archivos de traducción (`es.json`, `en.json`, `fr.json`) con etiquetas más cortas y claras para los nuevos campos, asegurando una UI consistente en todos los idiomas.
*   ✅ **Integración en Reporte Financiero:** Las nuevas fechas de inicio y fin ahora se muestran de manera prominente en el reporte PDF (`FinancialReport.tsx`), proporcionando un contexto temporal completo del proyecto.
*   **Resultado:** La creación y edición de proyectos es ahora más completa y la experiencia de usuario en el modal ha sido significativamente mejorada, especialmente en dispositivos móviles.

---

## II. Logros Recientes (Tareas Completadas)

### 12. Optimización del Flujo "Enviar a Votación"
*   ✅ **Diagnóstico del Problema de UX:** Se identificó que el proceso para cambiar un proyecto de estado "Abierto" a "En Votación" era ineficiente, ya que requería que el administrador entrara al modal de edición para realizar esta acción.
*   ✅ **Inteligencia en el Backend:** Se refactorizó la función `gestionar_proyectos` para que devuelva un campo dinámico `es_propuesta`. Este campo booleano indica si un proyecto tiene al menos una evidencia del tipo `COTIZACION_PARA_VOTACION`, sirviendo como una fuente de verdad para la lógica del frontend.
*   ✅ **Mejora de UI en la Lista de Proyectos:**
    *   Se añadió un nuevo botón "Enviar a Votación" directamente en la tarjeta de cada proyecto en `ProjectList.tsx`, visible solo para administradores y en proyectos con estado "Abierto".
    *   El botón se habilita o deshabilita dinámicamente basándose en el campo `es_propuesta`, previniendo que se envíen a votación proyectos que no tienen cotizaciones.
    *   Se implementaron tooltips informativos para guiar al administrador sobre por qué el botón podría estar deshabilitado.
*   ✅ **Depuración y Robustecimiento de la Base de Datos:** Se diagnosticó y corrigió un error crítico de ambigüedad (`ERROR: 42702`) en la acción `UPDATE` de la función `gestionar_proyectos`, aplicando la norma de calificar explícitamente todas las columnas con un alias de tabla.
*   **Resultado:** El flujo para iniciar una votación es ahora significativamente más rápido, intuitivo y seguro. Se ha mejorado la experiencia del administrador al reducir los pasos necesarios y proporcionar retroalimentación visual directa en la lista de proyectos.

---

## II. Logros Recientes (Tareas Completadas)

### 9. Refactorización de Tipos de Evidencia (Enums) para Escalabilidad
*   ✅ **Diagnóstico del Problema:** Se identificó que los tipos de evidencia (`COTIZACION`, `FACTURA`, etc.) estaban definidos de forma estática (hardcodeados) en múltiples archivos del frontend (`EvidenceUploader`, `FinancialReport`, `locales/*.json`). Esto hacía que agregar un nuevo tipo de evidencia fuera un proceso manual, propenso a errores y difícil de mantener.
*   ✅ **Solución de Backend Genérica:** Se creó una única función RPC en la base de datos (`get_enum_values`) capaz de leer y devolver los valores de cualquier tipo `ENUM` de PostgreSQL, eliminando la necesidad de funciones específicas por cada catálogo.
*   ✅ **Frontend Dinámico y Resiliente:**
    *   **Formulario de Carga:** El componente `EvidenceUploader` ahora consume la lista de tipos de evidencia directamente desde la base de datos, asegurando que el formulario siempre esté sincronizado.
    *   **Reporte PDF Inteligente:** Se implementó una función (`getEvidenceColor`) que asigna colores dinámicamente. Mantiene colores predefinidos para los tipos conocidos y genera colores únicos y consistentes para cualquier nuevo tipo (como `CONTRATO`), evitando que el reporte se rompa o muestre colores genéricos.
*   ✅ **Prueba de Fuego Superada:** Se validó la arquitectura agregando el nuevo tipo `CONTRATO` a la base de datos. El sistema lo integró automáticamente en la UI y el reporte PDF sin necesidad de modificar la lógica de los componentes, solo requiriendo la actualización de los archivos de traducción.
*   **Resultado:** El sistema es ahora significativamente más robusto, escalable y fácil de mantener. La dependencia del frontend en listas estáticas ha sido eliminada.

---

# I. REGLAS DE COLABORACIÓN PROFESIONAL (Inamovible)

Estas son las reglas de nuestra relación profesional. Este documento es la única fuente de verdad sobre la arquitectura y el flujo de trabajo, y debe ser respetado en todo momento.

### TAREAS CRÍTICAS (Resolver Inmediatamente)

### ✅ 0. Corregir Lógica de Guardado en Gestión de Usuarios (Admin)
*   **Solución:** Se refactorizó la función `handleSave` en la página de administración de usuarios (`/menu/admin/manage-users`) para asegurar la correcta subida y guardado de avatares. La nueva lógica gestiona de forma separada la creación y actualización de usuarios. Al crear un usuario, primero se inserta el registro en la base de datos para obtener el `ID` y luego se utiliza ese `ID` para subir el avatar y asociar la URL, solucionando la falla silenciosa que ocurría previamente.

---

### TAREAS COMPLETADAS RECIENTEMENTE

### ✅ 0. Implementar Carga de Avatar de Usuario - COMPLETADO
*   **Estado:** ✅ Implementado completamente
*   **Implementación realizada:**
    *   ✅ Campo `avatar_url` existe en tabla `usuarios`
    *   ✅ Bucket de Supabase Storage disponible
    *   ✅ UI para subir/editar avatar implementada en `ProfileModal.tsx`
    *   ✅ Preview de avatar actual con imagen circular
    *   ✅ Validación de tipo de archivo (solo imágenes)
    *   ✅ Validación de tamaño (máximo 2MB)
    *   ✅ Preview en tiempo real antes de guardar
    *   ✅ Integrado en navegación con botón de perfil
    *   ✅ Visualización en `UserCard.tsx`

### ✅ 1. Mejoras de Acceso y Perfil de Usuario - COMPLETADO
*   **Estado:** ✅ Implementado completamente
*   **Implementación realizada:**
    1.  ✅ **Backend - Autenticación Flexible:**
        *   Función `login_user` acepta `p_identifier` (texto)
        *   Busca coincidencias en `id` (número de casa) o `email`
    2.  ✅ **Frontend - Página de Login:**
        *   Input tipo `text` con placeholder flexible
        *   Función `handleLogin` implementada correctamente
    3.  ✅ **Frontend - Botón "Mi Perfil":**
        *   Botón implementado en `layout.tsx` en navegación inferior
        *   Abre `ProfileModal` al hacer clic
    4.  ✅ **Frontend - Modal de Perfil:**
        *   `ProfileModal.tsx` completamente funcional
        *   Campos editables: responsable, email, teléfono, ubicación, contraseña, avatar
        *   Campos bloqueados: id, tipo_usuario (según requerimiento)
        *   Validación de contraseña con confirmación
    5.  ✅ **Frontend - Integración:**
        *   Modal integrado en layout principal
        *   Función `handleSaveProfile` implementada
        *   RPC `update_user_profile` funcionando

---

## III. Plan de Migración a Headless UI

**Prioridad:** Alta (Inmediata)
**Objetivo:** Refactorizar todos los modales existentes para que utilicen el componente `Dialog` de Headless UI, estandarizando la lógica, mejorando la accesibilidad y las animaciones.

### Modales a Migrar (en orden de prioridad):

1.  [ ] **`ConfirmationModal.tsx`**: Modal simple de confirmación. Ideal para empezar y establecer el patrón.
2.  [ ] **`PaymentModal.tsx`**: Modal con formulario para reportar pagos.
3.  [ ] **`ImageViewerModal.tsx`**: Modal para visualizar imágenes de comprobantes.
4.  [ ] **`UserModal.tsx`**: Modal para la creación y edición de usuarios (contiene formulario).


---

### NUEVAS TAREAS (Plan de Trabajo Actual)

---

## II. Principios de Colaboración y Lecciones Aprendidas

Esta sección documenta las mejores prácticas y lecciones aprendidas durante el desarrollo, con el objetivo de mejorar la comunicación y la eficiencia entre el desarrollador y el asistente de IA.

### 1. Claridad y Precisión sobre la Base de Datos
*   **Lección Aprendida:** Suponer la estructura o el nombre de los campos de un objeto de la base de datos (tabla, vista, función) sin tener la definición exacta ha llevado a errores de compilación, bugs y retrabajo significativo. Los daños colaterales, como romper funcionalidades existentes, son inaceptables.
*   **Norma de Trabajo (Regla de Oro):**
    > **Cuando exista la más mínima duda sobre la estructura, los campos, los alias o el comportamiento de cualquier objeto de la base de datos (tabla, vista, función, etc.), es mi responsabilidad y obligación solicitar explícitamente su definición antes de proponer cualquier solución o escribir código. La precisión es más importante que la velocidad.**

### 2. Planificación y Aprobación
*   **Lección Aprendida:** Implementar soluciones complejas sin un plan de trabajo previamente acordado puede resultar en diseños que no se alinean con la visión del desarrollador.
*   **Norma de Trabajo:**
    *   **Plan de Trabajo Detallado:** Antes de implementar cualquier funcionalidad compleja, debo proponer un plan de trabajo detallado.
    *   **Aprobación Explícita:** El desarrollador debe revisar y aprobar explícitamente el plan antes de que se escriba cualquier línea de código. Esto asegura que ambos entendemos el objetivo y la estrategia.

---

### 3. Desambiguación Explícita en Funciones PL/pgSQL
*   **Lección Aprendida:** Un error recurrente y difícil de depurar fue el `ERROR: 42702: column reference "..." is ambiguous`. Este error ocurre cuando, dentro de una función de PostgreSQL, los nombres de los parámetros (ej. `p_id_proyecto`) son similares a los nombres de las columnas de la tabla (`id_proyecto`). La base de datos no puede distinguir entre ellos, especialmente en sentencias `UPDATE`. Intentar corregir solo la cláusula `WHERE` o `RETURNING` no fue suficiente.
*   **Norma de Trabajo (Regla de Oro para Funciones):**
    > **Al escribir sentencias DML (especialmente `UPDATE`) dentro de una función PL/pgSQL, si existe la más mínima posibilidad de ambigüedad entre los nombres de los parámetros y las columnas, se debe ser explícito. La solución robusta es: 1. Asignar un alias a la tabla (ej. `UPDATE mi_tabla t`). 2. Prefijar *todas* las referencias a las columnas de esa tabla con el alias (ej. `SET t.columna = ...`, `WHERE t.otra_columna = ...`).**

---

### 2. Implementación del Sistema de Votaciones
*   **Prioridad:** Alta.
*   **Objetivo:** Crear una pantalla única y adaptativa para que tanto los residentes (PRE) como los administradores (ADM) puedan gestionar y participar en las votaciones de los proyectos.
*   **Plan de Acción Detallado:**
    1.  **Backend - Estructura de Datos:**
        *   ✅ **Tabla `proyecto_votos`:** Crear una tabla para almacenar los votos. Cada fila representa un voto afirmativo, vinculando un `id_proyecto`, un `id_evidencia` (la cotización votada) y un `id_usuario`. Se incluye un `UNIQUE CONSTRAINT` en `(id_proyecto, id_usuario)` para garantizar un solo voto por usuario por proyecto a nivel de base de datos.
        *   ✅ **Función RPC `fn_gestionar_votos`:** Crear una única función que centralice la lógica de la base de datos con las siguientes acciones:
            *   `SELECT`: Para consultar los votos de un proyecto.
            *   `VOTAR`: Para insertar un nuevo voto. La restricción `UNIQUE` manejará los intentos de voto duplicado.
            *   `ANULAR_VOTO`: Para eliminar un voto existente, permitiendo al usuario volver a votar.
    2.  **Backend - Lógica de Negocio:**
        *   ✅ **Función RPC `fn_proyecto_puede_votar`:** Crear una función que devuelva `true` si un proyecto tiene al menos una evidencia del tipo `COTIZACION_PARA_VOTACION`, y `false` en caso contrario. Esto servirá para habilitar la acción de "Enviar a Votación".
    3.  **Frontend - Flujo de Administrador (Pre-Votación):**
        *   ✅ **Botón en `ProjectList.tsx`:** Añadir un botón "Enviar a Votación" directamente en la lista de proyectos.
        *   **Lógica del Botón:** El botón solo es visible para `ADM` en proyectos con estado `'abierto'`. Se habilita/deshabilita llamando a `fn_proyecto_puede_votar`. Al hacer clic, cambia el estado del proyecto a `'en_votacion'`.
    4.  **Frontend - Página de Votación (`/menu/voting/page.tsx`):**
        *   **Diseño General:**
            *   Título vertical "VOTACIÓN" a la izquierda.
            *   Selector de casas en la parte superior, mostrando todas las casas con un indicador visual (ej. color, ícono) si ya han votado.
            *   Lista de cotizaciones (`COTIZACION_PARA_VOTACION`) en el área principal, ordenadas por `valor_de_referencia`.
        *   **Lógica para Residente (PRE):**
            *   Su casa aparece preseleccionada y no puede cambiarla.
            *   Ve los botones "Votar" o "Anular Voto" según su estado de votación actual.
        *   **Lógica para Administrador (ADM):**
            *   Puede seleccionar cualquier casa para votar en su nombre (voto por proxy).
            *   La interfaz muestra claramente en nombre de qué casa se está votando.
        *   **Interacción:**
            *   El botón "Votar" llama a `fn_gestionar_votos` con la acción `VOTAR`.
            *   El botón "Anular Voto" llama a `fn_gestionar_votos` con la acción `ANULAR_VOTO`.

---

### 2. Implementación del Sistema de Votaciones
*   **Prioridad:** Alta.
*   **Objetivo:** Crear una pantalla única y adaptativa para que tanto los residentes (PRE) como los administradores (ADM) puedan gestionar y participar en las votaciones de los proyectos.
*   **Plan de Acción Detallado:**
    1.  **Backend - Estructura de Datos:**
        *   ✅ **Tabla `proyecto_votos`:** Crear una tabla para almacenar los votos. Cada fila representa un voto afirmativo, vinculando un `id_proyecto`, un `id_evidencia` (la cotización votada) y un `id_usuario`. Se incluye un `UNIQUE CONSTRAINT` en `(id_proyecto, id_usuario)` para garantizar un solo voto por usuario por proyecto a nivel de base de datos.
        *   ✅ **Función RPC `fn_gestionar_votos`:** Crear una única función que centralice la lógica de la base de datos con las siguientes acciones:
            *   `SELECT`: Para consultar los votos de un proyecto.
            *   `VOTAR`: Para insertar un nuevo voto. La restricción `UNIQUE` manejará los intentos de voto duplicado.
            *   `ANULAR_VOTO`: Para eliminar un voto existente, permitiendo al usuario volver a votar.
    2.  **Backend - Lógica de Negocio:**
        *   ✅ **Función RPC `fn_proyecto_puede_votar`:** Crear una función que devuelva `true` si un proyecto tiene al menos una evidencia del tipo `COTIZACION_PARA_VOTACION`, y `false` en caso contrario. Esto servirá para habilitar la acción de "Enviar a Votación".
    3.  **Frontend - Flujo de Administrador (Pre-Votación):**
        *   ✅ **Botón en `ProjectList.tsx`:** Añadir un botón "Enviar a Votación" directamente en la lista de proyectos.
        *   **Lógica del Botón:** El botón solo es visible para `ADM` en proyectos con estado `'abierto'`. Se habilita/deshabilita llamando a `fn_proyecto_puede_votar`. Al hacer clic, cambia el estado del proyecto a `'en_votacion'`.
    4.  **Frontend - Página de Votación (`/menu/voting/page.tsx`):**
        *   **Diseño General:**
            *   Título vertical "VOTACIÓN" a la izquierda.
            *   Selector de casas en la parte superior, mostrando todas las casas con un indicador visual (ej. color, ícono) si ya han votado.
            *   Lista de cotizaciones (`COTIZACION_PARA_VOTACION`) en el área principal, ordenadas por `valor_de_referencia`.
        *   **Lógica para Residente (PRE):**
            *   Su casa aparece preseleccionada y no puede cambiarla.
            *   Ve los botones "Votar" o "Anular Voto" según su estado de votación actual.
        *   **Lógica para Administrador (ADM):**
            *   Puede seleccionar cualquier casa para votar en su nombre (voto por proxy).
            *   La interfaz muestra claramente en nombre de qué casa se está votando.
        *   **Interacción:**
            *   El botón "Votar" llama a `fn_gestionar_votos` con la acción `VOTAR`.
            *   El botón "Anular Voto" llama a `fn_gestionar_votos` con la acción `ANULAR_VOTO`.

---

## III. Próxima Tarea Crítica (A Diagnosticar)

### 8. Finalizar Refactorización de Gestión de Aportaciones (Admin)
*   **Prioridad:** Crítica.
*   **Objetivo:** Completar la refactorización iniciada, alineando las pantallas de administración con la nueva estructura de base de datos y las funciones RPC para la gestión de aportaciones.
*   **Contexto:** Después de estabilizar las vistas del usuario (`Calendario`, `Avisos`, `Grupos de Trabajo`), es imperativo corregir las pantallas de administración que quedaron rotas.
*   **Plan de Acción por Pasos:**
    1.  **Crear Pantalla de Catálogo de Contribuciones:**
        *   **Tarea:** Crear una nueva página en `/menu/admin/contributions-catalog/page.tsx`.
        *   **Implementación:** Utilizar el componente genérico `CatalogManagement` para permitir el CRUD (Crear, Leer, Actualizar, Eliminar) de los tipos de aportes, conectándolo a la función RPC `gestionar_contribuciones_catalogo`.
    2.  **Refactorizar Pantalla de Gestión de Aportes por Casa:**
        *   **Tarea:** Corregir la página `/menu/admin/manage-house-contributions/page.tsx`.
        *   **Implementación:** Modificar la página para que obtenga y guarde los datos utilizando la función RPC `gestionar_contribuciones_casa`.

---

### 5. Implementación de Gestión de Cargos por Contribuciones
*   ✅ **Backend Robusto:** Se crearon y pulieron dos funciones RPC clave:
    *   `procesar_cargos_rotativos`: Genera una previsualización (`PREVIEW`) completa para el año siguiente, manejando correctamente la lógica de rotación tanto para contribuciones por casa como por grupo, e incluyendo el cálculo de la `fecha_maxima_pago`.
    *   `insertar_cargos_proyectados`: Recibe la proyección y la asienta de forma segura en la base de datos, incluyendo una validación para borrar cargos pendientes existentes antes de una nueva inserción.
*   ✅ **Interfaz Funcional y Coherente:**
    *   Se desarrolló una nueva página en `/menu/admin/contribution-charges` con un diseño "mobile-first" que centraliza todo el proceso en una sola pantalla (selector, parámetros, grid de previsualización y botón de guardado).
    *   Se creó un componente de grid (`ProjectionGrid`) responsivo y visualmente consistente, utilizando el color de la contribución para los bordes de las tarjetas.

### 6. Optimización de Reportes y Corrección de Bugs
*   ✅ **Optimización de Reporte PDF:** Se ajustó el diseño de las tarjetas en el reporte PDF de "Gestionar Aportaciones" para optimizar el espacio vertical, logrando que más registros quepan en una sola página. Se mejoró la jerarquía visual y se añadió la `ubicacion` y `fecha_maxima_pago` para enriquecer la información.
*   ✅ **Mejora de Diseño en Tarjetas:** Se implementó una lógica de color dinámica en las tarjetas de "Gestionar Aportaciones" (web y PDF) para que el borde y el divisor reflejen el estado del pago (verde para 'PAGADO', rojo para 'PENDIENTE').
*   ✅ **Corrección de Bugs Críticos:**
    *   Se sincronizó el tipo `ContribucionPorCasaExt` con la estructura real de la vista `v_usuarios_contribuciones`, solucionando una cascada de errores de compilación en las páginas `manage-house-contributions` y `calendarios`.
    *   Se corrigió la lógica de visualización y filtrado del estado "Pagado"/"Pendiente" en la página de "Gestionar Aportaciones" para que refleje los datos correctos.

---

## II. Logros Recientes (Tareas Completadas)

### 7. Refactorización y Corrección de Lógica de Pago en Calendario
*   ✅ **Diagnóstico y Corrección de RPC:** Se diagnosticó y corrigió la función RPC `gestionar_pago_contribucion_casa`, alineando los nombres de los parámetros y columnas con el frontend. Esto solucionó el bug crítico que impedía registrar pagos.
*   ✅ **Implementación de Anulación de Pagos:**
    *   **Backend:** Se creó una nueva función RPC `anular_pago_contribucion_casa` para revertir un pago de forma segura.
    *   **Frontend:** Se añadió un botón "Anular Pago" en las contribuciones pagadas.
    *   **Mejora de UX:** Se reemplazó el `window.confirm` nativo por un modal de confirmación personalizado (`ConfirmationModal.tsx`) para una experiencia de usuario consistente y centrada.
*   ✅ **Consistencia Visual en Modal de Pago:** Se mejoró la UI del `PaymentModal.tsx` para que su diseño (borde izquierdo amarillo, sombra sutil) sea coherente con el resto de la aplicación.

---

### X. Mejoras en Gestión de Proyectos y UI
*   ✅ **Seguridad a Nivel de Rol (Puerta Trasera):** Se implementó una capa de seguridad en `ProjectList.tsx`. El botón para editar proyectos archivados ahora solo es visible para usuarios con perfil 'ADM'.
*   ✅ **Consistencia Visual en Modales:** Se mejoró la UI del `ProjectModal.tsx` para que su diseño sea consistente con las tarjetas de la lista de proyectos.

---

### 4. Mejoras en Gestión de Proyectos y Reporte Financiero
*   ✅ **Edición Completa de Proyectos:** Se implementó la funcionalidad para editar proyectos existentes. Esto incluye un nuevo botón de edición, la adaptación del modal para pre-rellenar datos y la capacidad de cambiar el estado de un proyecto (ej. de "Abierto" a "En Progreso").
*   ✅ **Mejoras Sustanciales al Reporte Financiero (PDF):**
    *   Se añadió el campo `detalle_tarea` a la información general del proyecto.
    *   Se corrigió un bug persistente que impedía la visualización del pie de página (`notas_clave`).
    *   Se ajustó la lógica financiera para incluir `monto_saldo` en los cálculos de aportes.
    *   Se corrigió el cálculo del "Total Pendiente de Cobro" para que refleje la suma real de las cuotas no pagadas.
    *   Se mejoró la presentación visual de los aportes, mostrando el desglose del saldo de forma clara y resaltando en rojo los pagos pendientes.
*   ✅ **Estabilización y Depuración:** Se resolvieron múltiples errores de tipo de TypeScript y advertencias de linting en varios componentes (`FinancialReport`, `useFinancialData`, `ProjectModal`, etc.), asegurando la calidad y consistencia del código.

### 2 y 3. Optimización y Mejora de UX en Detalle de Propuesta
*   ✅ **Optimización de Carga:** Se eliminó la llamada RPC redundante en `ProposalDetail.tsx`. El catálogo maestro de rubros ahora se carga una sola vez en la página principal (`projects_management/page.tsx`) y se pasa como prop, mejorando el rendimiento.
*   ✅ **Mejora de Experiencia de Usuario (UX):** Se implementaron "Actualizaciones Optimistas" (Optimistic UI) para las operaciones de añadir y eliminar rubros. La interfaz ahora se actualiza de forma instantánea, eliminando el parpadeo y la recarga completa de la lista, lo que resulta en una experiencia de usuario más fluida y profesional.
*   ✅ **Corrección de Bug en Input Numérico:** Se solucionó un error en el campo de monto que impedía ingresar valores completos, formateando incorrectamente el número durante la edición.
*   ✅ **Estabilización y Depuración:** Se resolvieron múltiples errores de tipo y advertencias de linting que surgieron durante la refactorización, asegurando la calidad y consistencia del código.

### 3. Implementación de Gestión de Evidencias
*   ✅ **Infraestructura de Base de Datos:** Se creó la tabla `proyecto_evidencias` y la función RPC `fn_gestionar_proyecto_evidencias` para almacenar y gestionar los metadatos de las evidencias (descripción, fecha, nombre de archivo, URL, tipo MIME, tamaño).
*   ✅ **Subida Segura de Archivos:** Se implementó la subida de archivos a Supabase Storage (`evidencias_imagenes`) utilizando URLs firmadas generadas por una función RPC (`fn_upload_evidence_file`), garantizando la seguridad y el control de acceso.
*   ✅ **Interfaz de Usuario (Frontend):** Se desarrolló el componente `EvidenceManagement.tsx` que integra `CatalogManagement` para listar y eliminar evidencias, y `EvidenceUploader.tsx` para la subida de nuevos archivos.
*   ✅ **Manejo de Errores Mejorado:** Se mejoró la visualización de errores de la base de datos en el frontend, proporcionando mensajes más descriptivos en lugar de `[object Object]`.
*   ✅ **Consistencia Visual:** Se ajustaron los estilos de los inputs y botones para mantener la coherencia con el diseño de la aplicación.
*   ✅ **Integración Completa:** La gestión de evidencias está completamente integrada en el flujo de proyectos, accesible para proyectos en estado "abierto".

---

## II. Logros Recientes (Tareas Completadas)

**2. Refactorización de la Interfaz de Propuestas**
*   ✅ **Navegación Optimizada:** Se refactorizó la navegación principal para proyectos en estado "abierto". El botón "Aportes" se reutiliza inteligentemente, cambiando su nombre a "Evidencias" y apuntando a una nueva vista dedicada.
*   ✅ **Limpieza de UI:** Se eliminó la tarjeta estática de "Anexo de Evidencias" del componente `ProposalDetail.tsx`, ya que su funcionalidad fue reemplazada por el nuevo botón de navegación, resultando en una interfaz más limpia y coherente.

**1. Finalización de la Fase 2: Preparación de Propuestas**
*   ✅ **Vista de Detalle de Propuesta (`ProposalDetail.tsx`):** Se implementó con éxito el componente que permite a los administradores gestionar los rubros (líneas de costo) de un proyecto en estado "abierto". Incluye funcionalidades de CRUD, búsqueda con autocompletado y cálculo de totales.
*   ✅ **Integración en Flujo de Proyectos:** Se ajustó la página principal de gestión de proyectos para mostrar la nueva vista `ProposalDetail.tsx` cuando se selecciona un proyecto "abierto", integrando la nueva funcionalidad de forma coherente en la UI existente.
*   ✅ **Gestión Completa de Catálogos:** Se finalizó la sección de "Gestión de Catálogos", permitiendo el CRUD completo para `rubros` y `rubro_categorias`. Se añadió un filtro interactivo que mejora significativamente la usabilidad.
*   ✅ **Normalización y Refactorización:** Se pagó la deuda técnica relacionada con los catálogos, normalizando la estructura de la base de datos (creando `rubro_categorias`) y asegurando que toda la interacción con la BD se realice a través de funciones RPC, en línea con nuestros principios de arquitectura.

**1. Mejoras Sustanciales al Reporte Financiero (PDF):**
*   ✅ **Cálculo de Sobrante/Déficit:** Se implementó la lógica para calcular y mostrar el sobrante o déficit por casa al finalizar un proyecto.
*   ✅ **Tarjeta de Resumen Dinámica:** Se añadió una tarjeta en el PDF que cambia de color (verde para sobrante, rojo para déficit) y texto para una comunicación visual clara.
*   ✅ **Tarjeta de Estado del Proyecto:** Se agregó una tarjeta de estado en la sección de información general del proyecto, con un color distintivo para saber su estatus de un vistazo.
*   ✅ **Diseño Homogéneo:** Se reajustó el diseño de las tarjetas de resumen para que sean visualmente consistentes.
*   ✅ **Robustez en la Obtención de Datos:** Se creó y utilizó una nueva función RPC (`get_project_info_with_status`) para obtener los datos del reporte de forma segura y predecible, solucionando errores de compilación.

**2. Implementación del Nuevo Flujo de "Propuestas de Proyecto":**
*   ✅ **Doble Flujo de Creación:** Se modificó la lógica para permitir dos caminos al crear un proyecto:
    *   **Propuesta (Nuevo):** Sin costos, crea un proyecto en estado `'abierto'`.
    *   **Con Costos (Heredado):** Con un valor estimado, crea el proyecto y genera las cuotas inmediatamente.
*   ✅ **Modal con Pestañas:** Se rediseñó el modal de creación (`ProjectModal.tsx`) con pestañas para que el usuario elija explícitamente qué tipo de proyecto desea crear.
*   ✅ **Backend Adaptado:** Se actualizó la función RPC `gestionar_proyectos` para soportar la nueva acción `INSERT_PROPOSAL` sin afectar la lógica existente.

**3. Mejoras en la Interfaz de Gestión de Proyectos:**
*   ✅ **Visualización de Estados:** La lista de proyectos (`ProjectList.tsx`) ahora muestra una "píldora" de color y un borde lateral que indica el estado actual de cada proyecto (`Abierto`, `En Progreso`, etc.).
*   ✅ **Lógica de Navegación Inteligente:** Los botones de navegación superior ("Aportes", "Gastos", "Resumen") ahora se habilitan o deshabilitan correctamente según el `estado` del proyecto seleccionado, previniendo acciones inválidas.

*   **Bugs Solucionados:**
    *   ✅ **Colores Faltantes en Reporte PDF del Calendario:** Solucionado. El reporte PDF generado desde la página principal del calendario (`/menu/calendarios`) ahora muestra los colores de estado en las tarjetas.
    *   ✅ **Carga de Imágenes de Comprobantes:** Se solucionó el problema que impedía visualizar las imágenes de los comprobantes de pago desde Supabase Storage.
    *   ✅ **Visualización del Logo en Vercel:** Solucionado. El problema era que el archivo `logo.png` no se había publicado correctamente.
    *   ✅ **Lógica Incorrecta en "Avisos":** Solucionado. Se modificó la función RPC `get_proximo_compromiso` en la base de datos para que solo devuelva pagos pendientes dentro de los próximos 15 días, haciendo los avisos más relevantes.
    *   ✅ **Colores y Orden en Reporte PDF del Calendario:** Solucionado. El reporte PDF del calendario ahora muestra los colores de estado correctos y ordena los registros por fecha.
*   **Mejoras de UI/UX:**
    *   ✅ **Unificación de Interfaz a "Mobile-Only":** Se eliminaron las vistas de tabla de escritorio en las páginas de administración y calendario, dejando únicamente la vista de tarjetas para una experiencia consistente.
    *   ✅ **Diseño de Tarjeta de Avisos:** Se actualizó el diseño de la tarjeta en la página de "Avisos" para que sea consistente con el estilo moderno de la aplicación.
    *   ✅ **Solución de Favicon:** Se migró el favicon a `app/icon.png` siguiendo las convenciones de Next.js.
    *   ✅ **Implementación de Gestión de Catálogos:** Se añadió una nueva sección administrativa para la gestión completa (CRUD) de catálogos: Grupos de Mantenimiento, Tipos de Proyecto y Proveedores. Incluye una vista de consulta jerárquica con filtros y ordenamiento. La implementación se realizó con un componente genérico reutilizable para facilitar el mantenimiento y la extensibilidad.
    *   ✅ **Estandarización de Tarjeta en "Avisos":** Se asignó un ancho fijo a la tarjeta de avisos para evitar que cambie de tamaño al cambiar de idioma, mejorando la estabilidad de la UI.
    *   ✅ **Ordenamiento en Grupos de Trabajo:** Se añadió un menú para ordenar los grupos por número o fecha en el cliente.
    *   ✅ **Internacionalización de Formatos:** Se estandarizó el formato de fechas y monedas en toda la aplicación usando la API `Intl` para una correcta localización.
    *   ✅ **Implementación de Anexo de Evidencias en Reporte Financiero:** Se completó la generación de un anexo en el reporte PDF financiero. El anexo muestra tarjetas detalladas para cada gasto con un enlace funcional para visualizar la imagen de la evidencia en una nueva pestaña.
    *   ✅ **Corrección de Nombres de Archivos PDF:** Se solucionó un problema general que causaba nombres de archivo ilegibles. Ahora, todos los reportes PDF generados en la aplicación tienen un nombre de archivo claro, traducido y seguro para el sistema de archivos.

*   **Rediseño de Avisos y Grupos de Trabajo:**
    *   ✅ **Rediseño de la Página de "Avisos":**
        *   Se implementó una nueva función RPC (`get_avisos_categorizados`) para obtener todos los avisos pendientes.
        *   Se rediseñó la interfaz con un sistema de pestañas para categorizar los avisos por urgencia (Próximos, Medio Plazo, Largo Plazo).
        *   Se aplicó un código de colores (verde, amarillo, rojo) a las pestañas y tarjetas para mejorar la comunicación visual y se añadió un contador de avisos a cada pestaña.
    *   ✅ **Modernización de la UI en "Grupos de Trabajo":**
        *   Se refactorizó la vista para usar un componente de tarjeta reutilizable (`TaskCard.tsx`).
        *   Se estandarizó el diseño de las tarjetas de tareas para que coincida con el resto de la aplicación, usando un borde de color que indica el estado (Realizado, Pendiente, Vencido).
        *   Se mejoró el estilo de la tarjeta contenedora para una mejor jerarquía visual.
    *   ✅ **Corrección de Errores de Compilación y Warnings:**
        *   Se solucionaron advertencias de ESLint por variables no utilizadas.
        *   Se corrigió un error de tipo crítico al sincronizar la estructura de los archivos de traducción (`i18n`).

---

## III. Normas de Colaboración y Lecciones Aprendidas

Esta sección documenta las mejores prácticas y lecciones aprendidas durante el desarrollo, con el objetivo de mejorar la comunicación y la eficiencia entre el desarrollador y el asistente de IA.

### 1. Claridad en los Requerimientos

*   **Lección Aprendida:** Una falta de especificidad en la solicitud inicial (ej. "mejorar el reporte PDF") llevó a una implementación incorrecta (modificar la UI en lugar del PDF).
*   **Norma de Trabajo:**
    *   **Plan de Trabajo Detallado:** Antes de implementar cualquier funcionalidad compleja, el asistente de IA debe proponer un plan de trabajo detallado.
    *   **Aprobación Explícita:** El desarrollador debe revisar y aprobar explícitamente el plan antes de que se escriba cualquier línea de código. Esto asegura que ambos entiendan el objetivo y la estrategia.

### 2. Estrategia de Desarrollo Segura

*   **Lección Aprendida:** La modificación directa de una funcionalidad existente para añadir una mejora compleja introdujo múltiples errores de compilación y bloqueos.
*   **Norma de Trabajo:**
    *   **Desarrollo en Paralelo:** Para nuevas funcionalidades de alto riesgo o complejidad (como la generación de un nuevo tipo de reporte), se debe optar por un desarrollo en paralelo.
    *   **Mecanismo de Respaldo:** Se mantendrá la funcionalidad original (ej. "Reporte PDF Plano") mientras se desarrolla la nueva ("Reporte PDF con Tarjetas"). Esto garantiza que la aplicación siga siendo funcional y proporciona una red de seguridad si la nueva implementación falla.

### 3. Comunicación y Contexto

*   **Lección Aprendida:** El asistente de IA puede perder el hilo de la conversación o el contexto de los archivos si no se le recuerda el objetivo principal.
*   **Norma de Trabajo:**
    *   **Referencia a Tareas:** Es útil hacer referencia explícita al archivo `TAREAS_PENDIENTES.md` para re-enfocar la conversación en los objetivos definidos.
    *   **Feedback Constructivo:** El desarrollador debe señalar claramente cuando el asistente se desvía del plan, permitiendo una rápida corrección del rumbo.



## Tareas Canceladas

Las siguientes tareas se han cancelado y no se trabajarán.

*   **Motivo de Cancelación:** Confusión en las soluciones propuestas, lo que ha generado retrabajo y errores.

### 1. Corregir Visibilidad del Botón en Visor de Evidencias
- **Objetivo:** Hacer visible el botón de cierre en la página que muestra la imagen de la evidencia de gasto.
- **Contexto:** La página (`/report/evidence`) y el botón ya existen, pero el botón no es visible debido a un problema de contraste o estilo CSS.

### 2. Problema de Navegación en Reporte PDF en Móvil
- **Objetivo:** Permitir la navegación entre páginas en los reportes PDF cuando se visualizan en dispositivos móviles.
- **Contexto:** Actualmente, en la vista de reportes PDF (ej. Resumen Financiero), si el reporte tiene más de una página, en dispositivos móviles solo se muestra la primera.

### 5. Añadir Filtros y Ordenamiento Avanzado a "Grupos de Trabajo"
- **Objetivo:** Implementar funcionalidades de filtrado y ordenamiento más completas en la página de "Grupos de Trabajo" (`/menu/grupos-de-trabajo`).
- **Contexto:** La página actual solo tiene un menú de ordenamiento básico y carece de filtros.



---

## III. Guía de Arquitectura: Internacionalización (i18n)

Esta sección documenta la estrategia implementada para la internacionalización de la aplicación, cubriendo textos, fechas y monedas. Sirve como guía para futuras implementaciones o para replicar la arquitectura en otros proyectos.

### 1. Estructura y Componentes Clave

La estrategia se basa en tres pilares fundamentales:

1.  **Archivos de Traducción (`/src/locales/*.json`):**
    -   Se utiliza un archivo JSON por cada idioma soportado (ej. `es.json`, `en.json`).
    -   Contienen un objeto con pares `clave: valor` donde la clave es un identificador semántico (ej. `login.button`) y el valor es el texto traducido.
    -   **Oportunidad de Mejora:** Para proyectos muy grandes, se podría considerar dividir los archivos JSON por secciones de la aplicación para facilitar su mantenimiento.

2.  **Proveedor de Contexto (`/src/app/i18n-provider.tsx`):**
    -   Es un **Componente de Cliente** de React que envuelve toda la aplicación.
    -   **Responsabilidades:**
        -   **Gestión de Estado:** Mantiene el estado del idioma actual (`lang`).
        -   **Configuración Regional:** Define un objeto `locales` que asocia cada `lang` con su `locale` específico (ej. `es-GT`) y su `currency` (ej. `GTQ`). Esto es crucial para el formato correcto.
        -   **Función de Traducción `t()`:** Proporciona una función que busca y devuelve el texto correspondiente a una clave en el idioma actual.
        -   **Persistencia:** Guarda el idioma seleccionado en `localStorage` para mantener la preferencia del usuario entre sesiones.
    -   **Hook `useI18n()`:** Exporta un hook personalizado que permite a cualquier componente hijo acceder al contexto (funciones y variables como `t`, `lang`, `locale`, `currency`).

3.  **Utilidades de Formato (`/src/utils/format.ts`):**
    -   Contiene funciones puras para formatear datos según la configuración regional.
    -   **`formatDate(dateString, locale)`:** Utiliza `Intl.DateTimeFormat` para mostrar fechas en un formato legible para el usuario (ej. `DD/MM/YYYY`).
    -   **`formatCurrency(amount, locale, currency)`:** Utiliza `Intl.NumberFormat` para mostrar montos con el símbolo y formato de moneda correctos (ej. `Q150.00`, `$150.00`, `150,00 €`).

### 2. Flujo de Implementación

Para internacionalizar un nuevo componente, el proceso es el siguiente:

1.  **Añadir Claves:** Agregar todos los textos estáticos del componente como nuevas claves en todos los archivos `.json`.
2.  **Importar el Hook:** En el componente, importar y llamar al hook: `const { t, locale, currency } = useI18n();`.
3.  **Reemplazar Textos:** Sustituir cada texto estático por una llamada a la función `t('clave.correspondiente')`.
4.  **Formatear Fechas/Monedas:** Importar `formatDate` y `formatCurrency` desde `@/utils/format` y envolver cualquier fecha o monto que se muestre en la UI.
    -   Ejemplo de fecha: `{formatDate(record.fecha, locale)}`
    -   Ejemplo de moneda: `{formatCurrency(record.pagado, locale, currency)}`

### 3. Oportunidades de Mejora

-   **Detección Automática de Idioma:** Actualmente, el idioma por defecto es 'es'. Se podría mejorar para que la primera vez que un usuario visita la aplicación, se detecte el idioma de su navegador (`navigator.language`) y se establezca como el idioma inicial.
-   **Gestión de Moneda por Entidad:** En un sistema multi-regional más complejo, la moneda podría no depender solo del idioma, sino de la entidad o usuario. En ese caso, el código de la moneda podría venir de la base de datos junto con los datos del usuario y pasarse a la función `formatCurrency`. Para el alcance actual, la configuración por `locale` es la solución más limpia y adecuada.

---



### Log de Actividades Recientes (Post-Refactorización de Catálogos)

Hemos finalizado una serie de mejoras importantes en la **Gestión de Catálogos**, dejando esta sección robusta y completamente funcional.

*   ✅ **Gestión Completa de Rubros y Categorías:** Se implementó la funcionalidad completa de Crear, Leer, Actualizar y Eliminar (CRUD) tanto para el catálogo de `rubros` como para el de `rubro_categorias`.
*   ✅ **Filtro Interactivo:** Se añadió una nueva característica clave: al hacer clic en una tarjeta de "Categoría de Rubro", la vista cambia automáticamente para mostrar únicamente los rubros que pertenecen a esa categoría, con un indicador visual claro del filtro aplicado.
*   ✅ **Estabilización y Depuración:** Se resolvieron múltiples errores de compilación, advertencias de ESLint y bugs de tiempo de ejecución que surgieron durante la refactorización. Esto incluyó la sincronización precisa de los tipos de datos y parámetros entre los componentes de React y las funciones RPC de la base de datos.

Con la gestión de catálogos finalizada, estamos listos para continuar con el objetivo principal.


---

## IV. Roadmap y Consideraciones Futuras

### 1. Migración a Aplicación Móvil Nativa (iOS/Android) con Capacitor.js

*   **Prioridad:** Mediana (Post-implementación de funcionalidades web clave).
*   **Objetivo:** Empaquetar la aplicación web actual (Next.js) en una aplicación móvil nativa para iOS y Android, permitiendo su distribución en la App Store y Google Play Store.
*   **Tecnología Propuesta:** **Capacitor.js**. Es un runtime que permite tomar una aplicación web existente y darle acceso a funcionalidades nativas del dispositivo.

*   **Análisis de Viabilidad:**
    *   **Pros (Ventajas):**
        *   **Reutilización de Código:** Se reutilizaría ~95% del código React ya desarrollado, incluyendo componentes, lógica de negocio y conexión con Supabase.
        *   **Acceso Nativo:** Desbloquearía funcionalidades clave para tareas pendientes, como el uso directo de la **cámara** para la "Gestión de Evidencias".
        *   **Mantenimiento Centralizado:** Un solo proyecto y base de código para web, iOS y Android, reduciendo costos y tiempos de desarrollo a largo plazo.
    *   **Contras (Consideraciones):**
        *   **Complejidad de Configuración:** No es un proceso transparente. Requiere configurar y mantener proyectos nativos en Xcode (para iOS) y Android Studio (para Android).
        *   **Proceso de Compilación:** Se necesitaría un nuevo flujo de trabajo para compilar, firmar y desplegar los binarios (`.ipa` y `.aab`) a las tiendas, adicional al despliegue web actual.
        *   **Adaptación de Next.js:** Capacitor funciona con Aplicaciones de una Sola Página (SPA). Para integrar nuestra app, se usaría `next export`, lo que significa que se perderían las capacidades de renderizado en el servidor (SSR) dentro de la app móvil. Sin embargo, dado que la app ya funciona en gran medida como una SPA, el impacto sería mínimo.

*   **Plan de Acción Propuesto:**
    1.  **Fase 1 (Actual):** Finalizar las funcionalidades web pendientes para consolidar el producto base.
    2.  **Fase 2 (Futuro):** Abordar la integración de Capacitor.js. Esto incluirá la configuración inicial de los proyectos nativos y el aprendizaje del nuevo flujo de compilación y despliegue para las tiendas de aplicaciones.

### 2. Implementación de Notificaciones Push Web

*   **Prioridad:** Alta (Roadmap Q4 2025).
*   **Objetivo:** Implementar notificaciones push para la aplicación web utilizando Supabase para notificar a los usuarios sobre eventos importantes (ej. cambios de estado de proyectos, nuevos aportes pendientes, etc.) y así aumentar la interacción.
*   **Tecnología Propuesta:** Service Workers, Push API del navegador, Supabase Edge Functions.

*   **Análisis de Viabilidad:**
    *   **Pros:** Permite el re-engagement de los usuarios sin necesidad de una app nativa. Funciona bien en navegadores de escritorio y Android.
    *   **Contras:** Requiere permiso explícito del usuario. En iOS, el soporte es limitado (a partir de iOS 16.4 y solo para PWAs añadidas a la pantalla de inicio).

*   **Plan de Acción por Fases:**
    1.  **Fase 1: Configuración de Backend e Infraestructura (Invisible para el usuario):**
        *   Configurar las credenciales de los servicios de notificación (FCM, APNs) y las VAPID keys en el dashboard de Supabase.
        *   Crear y registrar el archivo `service-worker.js` en la carpeta `public` del frontend. Este script se encargará de recibir y mostrar las notificaciones.

    2.  **Fase 2: Interfaz de Usuario y Lógica de Suscripción (Visible para el usuario):**
        *   Crear una nueva tabla `push_subscriptions` en la base de datos para almacenar los tokens de suscripción de cada usuario.
        *   Añadir un botón o interruptor en la UI (ej. en el perfil de usuario) para que puedan "Activar notificaciones".
        *   Implementar la lógica para solicitar el permiso del navegador y, si es aceptado, guardar el objeto de suscripción en la nueva tabla.

    3.  **Fase 3: Lógica de Envío de Notificaciones (Backend):**
        *   Desarrollar una Supabase Edge Function que se active por eventos de la base de datos (ej. un `UPDATE` en la tabla `proyectos`).
        *   Esta función buscará las suscripciones de los usuarios relevantes y enviará el mensaje de la notificación a través de la API de Supabase.

---



###Prompt Detallado para Claude Sonnet 4.5

Objetivo: Crear un único archivo de componente de página en React (page.tsx) para un sistema de votación de proyectos. Este componente debe ser funcional, robusto y seguir todas las especificaciones detalladas a continuación.

Archivo a Crear: /src/app/menu/voting/page.tsx

Tecnologías a Utilizar:

Next.js 14 (App Router)
React (con Hooks: useState, useEffect, useCallback, useMemo)
TypeScript
Supabase (para llamadas a funciones RPC)
react-hot-toast (para notificaciones al usuario)
lucide-react (para iconos)


Requisitos Funcionales y de Lógica
1. Carga de Datos Inicial:

La página debe leer el projectId de los parámetros de la URL (ej. /menu/voting?projectId=123) usando el hook useSearchParams de next/navigation.
Si no se encuentra un projectId, debe mostrar un toast de error y redirigir al usuario a /menu/admin/projects_management.
Debe obtener la información del usuario actual (incluyendo id, id_casa y tipo_usuario) desde el localStorage.
Debe realizar las siguientes llamadas asíncronas a la base de datos al cargar:
Obtener todas las casas (residentes): Consultar la tabla usuarios para obtener una lista de todos los usuarios donde tipo_usuario = 'PRE'. La consulta debe traer los campos id (uuid) y id_casa (número de casa), ordenados por id_casa.
Obtener las cotizaciones: Llamar a la función RPC fn_gestionar_proyecto_evidencias con los parámetros p_accion: 'SELECT', p_id_proyecto: projectId, y p_tipo_evidencia: 'COTIZACION_PARA_VOTACION'. Los resultados deben ordenarse en el cliente por valor_de_referencia de menor a mayor.
Obtener los votos existentes: Llamar a la función RPC fn_gestionar_votos con p_accion: 'SELECT' y p_id_proyecto: projectId para obtener todos los votos ya emitidos para este proyecto.
2. Diseño de la Interfaz de Usuario (UI):

Layout General: La página debe tener un layout principal de dos columnas usando Flexbox.
Barra Lateral Izquierda: Un div estrecho (ancho w-16) con fondo oscuro (bg-gray-800) que contenga un título <h1> con el texto "VOTACIÓN" orientado verticalmente (writing-mode: 'vertical-rl').
Contenido Principal: Un div que ocupe el resto del espacio, con un padding adecuado.
Sección Superior (Selección de Casa):
Un contenedor con el título "Seleccionar Casa para Votar".
Debe renderizar una lista de botones, uno por cada casa obtenida de la base de datos.
Cada botón debe mostrar un ícono de casa (<Home /> de lucide-react) y el número de la casa (id_casa).
Sección Principal (Lista de Cotizaciones):
Debe renderizar una lista de tarjetas, una por cada cotización obtenida.
Cada tarjeta debe mostrar:
La descripción de la cotización (descripcion_evidencia).
El valor de referencia (valor_de_referencia), formateado como moneda local (usa formatCurrency de @/utils/format).
Un botón con el ícono <FileText /> que funcione como un enlace (<a>) para abrir la url_publica de la cotización en una nueva pestaña.
Un botón para la acción de votar (ver lógica a continuación).
3. Lógica de Interacción y Roles:

Estado de Carga: La página debe mostrar un mensaje de "Cargando..." mientras se obtienen los datos iniciales.
Selección de Casa:
Si el usuario es Residente (PRE): Su propia casa debe aparecer preseleccionada por defecto. Todos los demás botones de casa deben estar deshabilitados (disabled) y con un estilo de opacidad reducida.
Si el usuario es Administrador (ADM): Todos los botones de casa deben estar habilitados. Por defecto, se debe seleccionar la primera casa de la lista. El ADM puede hacer clic en cualquier botón de casa para cambiar la "casa activa" en cuyo nombre va a votar.
Estado Visual de las Casas (Feedback al Usuario):
El botón de la casa actualmente seleccionada debe tener un estilo distintivo (ej. un anillo de color azul alrededor).
Si una casa ya ha emitido su voto para este proyecto, su botón debe tener un fondo de color diferente (ej. bg-green-100) y mostrar un pequeño ícono de check (<CheckCircle2 />) en una esquina para indicar que ya votó.
Lógica de los Botones de Votación:
Se debe determinar si la selectedCasa ya ha votado en este proyecto.
Si la casa seleccionada NO ha votado:
Todas las tarjetas de cotización deben mostrar un botón "Votar".
Si la casa seleccionada YA ha votado por una cotización específica:
Esa cotización específica debe mostrar un botón "Anular Voto" (con estilo de color rojo).
Todas las demás cotizaciones deben mostrar su botón "Votar" en estado deshabilitado (disabled).
Acciones de Voto (Llamadas a RPC):
Al hacer clic en "Votar":
Llamar a la función RPC fn_gestionar_votos con los siguientes parámetros:
p_accion: 'VOTAR'
p_id_proyecto: El ID del proyecto actual.
p_id_evidencia: El ID de la cotización por la que se está votando.
p_id_usuario: El id (UUID) de la selectedCasa.
p_votante_proxy_id: Si el currentUser es ADM, enviar su id; si no, enviar null.
Usar toast.promise para mostrar mensajes de "Registrando voto...", "¡Voto registrado!", o el error de la base de datos.
En caso de éxito, actualizar el estado local de votos para reflejar el cambio en la UI inmediatamente.
Al hacer clic en "Anular Voto":
Llamar a la función RPC fn_gestionar_votos con:
p_accion: 'ANULAR_VOTO'
p_id_proyecto: El ID del proyecto actual.
p_id_usuario: El id (UUID) de la selectedCasa.
Usar toast.promise para mostrar mensajes de "Anulando voto...", "¡Voto anulado!", o el error.
En caso de éxito, actualizar el estado local de votos para reflejar el cambio en la UI.
Ejemplo de Estructura de Tipos (para guiar a TypeScript):

type EvidenciaVotacion = {
  id_evidencia: number;
  descripcion_evidencia: string;
  url_publica: string;
  valor_de_referencia: number | null;
};

type Voto = {
  id_voto: number;
  id_evidencia: number;
  id_usuario: string; // uuid
};

type Casa = {
  id: string; // uuid del usuario
  id_casa: number;
};


---

## 📚 ARCHIVOS DE CONTEXTO PARA COPILOT

**Importante:** Al iniciar nuevas sesiones, GitHub Copilot debe leer estos archivos primero:

1. **CONTEXTO_COPILOT.md** - Historial completo de sesiones, arquitectura, reglas de negocio
2. **ESTILO_DE_TRABAJO.md** - Metodología de colaboración, preferencias técnicas, patrones
3. **PLAN_DE_TRABAJO_PROFESIONAL.md** - Roadmap estratégico, análisis completo del proyecto
4. **TAREAS_PENDIENTES.md** - Este archivo (estado actual de tareas)

Estos archivos garantizan que no se pierda contexto entre sesiones.

---

**Última actualización:** 14 de Noviembre de 2025, 23:50 hrs
