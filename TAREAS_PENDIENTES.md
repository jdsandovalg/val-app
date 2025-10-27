# REGLAS DE COLABORACIÓN PROFESIONAL (Inamovible)

Estas son las reglas de nuestra relación profesional. Este documento es la única fuente de verdad sobre la arquitectura y el flujo de trabajo, y debe ser respetado en todo momento.

## Principios de Arquitectura y Decisiones Clave
*   **Verificación de Dependencias Cruzadas:** Al modificar un archivo central (como un proveedor de contexto, una utilidad global o un archivo de configuración), se debe identificar y revisar explícitamente todos los archivos que lo importan. Esto se hará para anticipar y corregir errores de compilación o efectos secundarios de manera proactiva, en lugar de reactiva.
*   **Fuente de Datos:** Las funciones de base de datos **NO DEBEN** depender de vistas (`VIEW`). Toda la lógica debe operar directamente sobre las **tablas base** (`usuarios`, `contribucionesporcasa`, etc.).
*   **Abstracción de Base de Datos:** Toda la interacción con la base de datos (lectura y escritura) **DEBE** realizarse a través de funciones RPC (`supabase.rpc('nombre_funcion', ...)`). **NO SE DEBE** consultar tablas directamente desde el frontend (ej. `supabase.from('tabla').select()`). Esto centraliza la lógica de negocio en la base de datos y mejora la seguridad.
*   **Enfoque "Mobile-Only":** La aplicación se desarrollará y diseñará exclusivamente para una experiencia móvil (WebApp). Se eliminarán las vistas y componentes específicos para escritorio (como tablas complejas) para simplificar el código, reducir el mantenimiento y alinear el producto con su objetivo primario.
*   **Autenticación:** El inicio de sesión se realiza **únicamente** a través de la función RPC `login_user`, que valida contra la tabla `public.usuarios`. **NO SE UTILIZA** el sistema de autenticación de Supabase (`supabase.auth`).
*   **Rendimiento en "Grupos de Trabajo":** La página de "Grupos de Trabajo" **DEBE** usar la función RPC `get_grupos_trabajo_usuario` para delegar la agrupación de datos al servidor. No se debe realizar la agrupación en el cliente.
*   **Organización del Código:** Toda la lógica de las páginas (obtención de datos, manejo de estado, funciones de guardado) debe permanecer dentro del archivo `page.tsx` correspondiente. **NO SE CREARÁN** archivos separados como hooks o servicios a menos que sea solicitado explícitamente.
*   **Seguridad:** No se deben introducir nuevas prácticas de seguridad (como encriptación de contraseñas con `crypt`) sin una discusión y aprobación previa.
*   **Alteración de Funciones de BD:** Antes de proponer cualquier modificación (DDL) a una función de base de datos existente, debo solicitarte la versión actual que está en producción para usarla como base.
**DDL de Base de Datos:** Toda definición de funciones de base de datos (DDL) que se proporcione **DEBE** incluir la cláusula `SECURITY DEFINER` para asegurar que se ejecuten con los permisos adecuados y evitar problemas de acceso a datos por RLS.
*   **Diseño Extensible y Preparado para el Futuro:** Todas las sugerencias de código deben considerar la futura implementación de características como temas (claro/oscuro), internacionalización (múltiples idiomas) y accesibilidad. Se debe evitar el uso de valores "hardcodeados" (ej. colores como `#FFFFFF` o texto como `"Guardar"`) en favor de abstracciones (ej. variables de tema, claves de traducción) que faciliten la extensibilidad sin romper el diseño existente.
## Flujo de Trabajo para Cambios (Workflow)
*   **Propuesta Detallada:** Para cualquier cambio que no sea una corrección trivial (como un error de tipeo), se debe presentar un plan de propuesta detallado que incluya el "Razonamiento del Problema" y la "Solución Propuesta".
*   **Aprobación por Pasos:** La solución propuesta debe desglosarse en pasos pequeños e incrementales. Cada paso debe ser lo suficientemente pequeño como para ser compilado y verificado de forma independiente.
*   **Autorización Explícita:** Se debe obtener la autorización explícita del usuario ("aprobado", "adelante", etc.) para **cada paso individual** antes de proporcionar el código o `diff` correspondiente. No se procederá al siguiente paso sin la aprobación del anterior.
*   **Comando de Sincronización "LEE":** Al inicio de cada sesión, el usuario proporcionará este archivo y usará la instrucción "LEE". Esto servirá como señal para que el asistente lea, entienda y se adhiera estrictamente a todos los principios y flujos de trabajo aquí definidos antes de realizar cualquier análisis o sugerencia.
*   **Propuesta de Mejoras:** Cualquier mejora o "buena práctica" no solicitada (ej. seguridad, rendimiento) debe ser propuesta primero como un nuevo ítem en la sección "I. Tareas Pendientes". La propuesta debe incluir una justificación y un análisis del impacto potencial sobre el sistema existente. No se implementará hasta que sea discutida y aprobada.
*   **Indicación Explícita de Acción:** Al final de cada respuesta que contenga un cambio de código, debo indicar explícitamente la acción que espero de ti. Por ejemplo: "Ahora, por favor, **compila y verifica** que los cambios se aplican correctamente" o "Ahora, por favor, **sube los cambios a Git** con el siguiente mensaje:".


*   **Nivel de Servicio 'Pro' y Verificación (Compromiso del Asistente):** Se establece que la cuenta del desarrollador es de nivel "Pro". Esto implica un compromiso inquebrantable por parte del asistente de IA de adherirse a todas las reglas y flujos de trabajo definidos en este documento. El asistente debe verificar cada paso y no asumir intenciones. Cualquier desviación de este principio se considerará una falta grave al nivel de servicio acordado.


---

## I. Tareas Pendientes (Deuda Técnica y Refinamiento)

### 1. Implementar Gestión de Evidencias
*   **Prioridad:** Alta.
*   **Objetivo:** Desarrollar la funcionalidad para que los administradores puedan subir y gestionar archivos (PDF, imágenes) como evidencia o cotizaciones para un proyecto en estado "abierto".
*   **Detalle Clave de Implementación:** La visualización de las evidencias se realizará mediante tarjetas. Cada tarjeta mostrará la información del archivo y un **enlace público** para verlo o descargarlo. Esto sigue el patrón implementado en el reporte financiero y evita sobrecargar la interfaz o los reportes con archivos incrustados.
*   **Solución Propuesta:**
    *   **Paso 1 (Backend):** Crear la infraestructura en la base de datos. Esto incluye una nueva tabla `proyecto_evidencias` para almacenar los metadatos de los archivos y una nueva función RPC `fn_gestionar_proyecto_evidencias` para manejar las operaciones CRUD.
    *   **Paso 2 (Frontend):** Implementar la interfaz de usuario en `EvidenceManagement.tsx`. Se mostrará una lista de las evidencias existentes y se añadirá un formulario para subir nuevos archivos.

---

### 2. Optimizar Carga de Datos en `ProposalDetail` (Deuda Técnica)
*   **Prioridad:** Baja.
*   **Problema:** El componente `ProposalDetail.tsx` realiza una llamada RPC (`fn_gestionar_rubros_catalogo`) para obtener el catálogo maestro de rubros. Esta llamada es redundante, ya que la página principal podría obtener estos datos una sola vez.
*   **Solución Propuesta:** Modificar la página `projects_management/page.tsx` para que obtenga el catálogo maestro y lo pase como `prop` a `ProposalDetail.tsx`, eliminando la llamada duplicada y mejorando el rendimiento.

### 3. Mejorar la Experiencia de Usuario (UX) en `ProposalDetail` (Deuda Técnica)
*   **Prioridad:** Baja.
*   **Problema:** Después de añadir, actualizar o eliminar un rubro en `ProposalDetail.tsx`, se vuelve a llamar a la base de datos para recargar toda la lista (`fetchProyectoRubros()`). Esto genera un parpadeo en la UI y un consumo de red innecesario.
*   **Solución Propuesta:** Refactorizar las funciones de guardado, actualización y borrado para que manipulen el estado local de React (`proyectoRubros`). Esto proporcionará una actualización instantánea y fluida (Optimistic UI) y solo se recurrirá a una recarga completa si la operación falla.

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

---



## Tareas Canceladas

Las siguientes tareas se han cancelado y no se trabajarán.

