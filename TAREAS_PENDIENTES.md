# REGLAS DE COLABORACIÓN PROFESIONAL (Inamovible)

Estas son las reglas de nuestra relación profesional. Este documento es la única fuente de verdad sobre la arquitectura y el flujo de trabajo, y debe ser respetado en todo momento.
### 4. Implementar Sistema de Votación
*   **Prioridad:** Alta.
*   **Objetivo:** Desarrollar la funcionalidad para que los usuarios puedan votar sobre propuestas de proyectos.
*   **Detalle Clave de Implementación:** Esto implicará la creación de tablas para registrar votos, funciones RPC para gestionar el proceso de votación y una interfaz de usuario para que los usuarios puedan emitir sus votos y ver los resultados.

### 5. Generar Reporte Final (Rubros -> Evidencias -> Votaciones)
*   **Prioridad:** Alta.
*   **Objetivo:** Crear un reporte consolidado que muestre la información detallada de un proyecto, incluyendo sus rubros, las evidencias adjuntas y los resultados de las votaciones.
*   **Detalle Clave de Implementación:** Este reporte probablemente será en formato PDF y requerirá la integración de datos de múltiples fuentes (tablas de proyectos, rubros, evidencias y votaciones) a través de funciones RPC.

### 6. Corregir Fondo de Modal de Confirmación (Deuda Técnica)
*   **Prioridad:** Baja.
*   **Problema:** El modal de confirmación (`ConfirmationModal`) muestra un fondo negro que cubre toda la pantalla (`bg-black bg-opacity-50`), lo cual resulta visualmente intrusivo en la versión de escritorio.
*   **Solución Propuesta:** Reducir la opacidad del fondo (ej. `bg-opacity-30`) y añadir un efecto de desenfoque (`backdrop-blur-sm`) para una apariencia más moderna y menos agresiva.

### 7. Refactorizar y Corregir Lógica de Pago en Calendario (Deuda Técnica Crítica)
*   **Prioridad:** Crítica.
*   **Problema:** La funcionalidad para registrar un pago desde la página de "Calendarios" está rota. La fecha de pago no se guarda en la base de datos y no se muestra en la interfaz. La causa raíz es una combinación de una vista (`v_usuarios_contribuciones`) desactualizada y una lógica de guardado incorrecta que mezclaba contextos (proyectos vs. calendario) y rompía la arquitectura de la aplicación.
*   **Solución Propuesta (Reinicio):**
    *   **Backend:** Crear una única función RPC multipropósito para la tabla `contribucionesporcasa`. Esta función reemplazará a la vista `v_usuarios_contribuciones` con una acción `SELECT` y manejará la lógica de `UPDATE` para registrar los pagos.
    *   **Frontend:** Refactorizar completamente la página `/menu/calendarios/page.tsx` y sus componentes para que utilicen exclusivamente la nueva función RPC, asegurando que la fecha de pago se guarde y se muestre correctamente.

---

## II. Logros Recientes (Tareas Completadas)

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



## Tareas Canceladas

Las siguientes tareas se han cancelado y no se trabajarán.
