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

## I. Tareas Pendientes (Siguiente Fase)

### Fase 2: Preparación de Propuestas (Cotización y Rubros)

Ahora que un proyecto puede existir en estado `'abierto'`, el siguiente paso es darle al administrador las herramientas para trabajar sobre él. El objetivo es construir la vista donde se puedan **añadir los rubros (líneas de costo) y las cotizaciones (documentos de respaldo)**.

**Propuesta:** Crear una nueva vista de detalle que se muestre cuando un proyecto en estado `'abierto'` es seleccionado.

#### Paso 1: Crear la Vista de Detalle de la Propuesta

1.  **Crear un Nuevo Componente: `ProposalDetail.tsx`**
    *   Este componente se mostrará en el área principal cuando `selectedProject.estado === 'abierto'`.
    *   Tendrá un diseño claro con varias secciones:
        *   **Información General:** Mostrará los detalles del proyecto (descripción, notas, etc.).
        *   **Sección de Rubros:** Una tabla o lista donde el administrador podrá añadir, editar y eliminar las líneas de costo del proyecto (ej. "Pintura: Q500", "Mano de obra: Q1000").
        *   **Sección de Cotizaciones:** Un área para subir los archivos (PDF, imágenes) que respaldan los costos.
        *   **Resumen de Costos:** Una tarjeta que mostrará el `valor_estimado` total, calculado automáticamente como la suma de todos los rubros.
        *   **Botón de Acción:** Un botón principal como "Enviar a Votación" que cambiará el estado del proyecto a `'en_votacion'`.

#### Paso 1.2: Gestión del Catálogo de Rubros
*   **Objetivo:** Crear una interfaz administrativa para el CRUD (Crear, Leer, Actualizar, Eliminar) del catálogo maestro de `rubros`.
*   **Solución:**
    *   **Backend:** Extender la función RPC `fn_gestionar_rubros_catalogo` para que soporte las acciones `INSERT`, `UPDATE` y `DELETE`.
    *   **Frontend:**
        *   Crear un nuevo componente `RubroManagement.tsx` que utilice la función RPC anterior.
        *   Integrar este componente en la página `projects_management/page.tsx` con un nuevo botón de acceso.
        *   Añadir las traducciones necesarias.

#### Paso 1.3 (Deuda Técnica): Normalización de Categorías de Rubros
*   **Problema:** La columna `categoria` en la tabla `rubros` es un campo de texto libre, lo que puede llevar a inconsistencias.
*   **Solución Propuesta:**
    *   Crear una nueva tabla `rubro_categorias` (`id_categoria`, `nombre`).
    *   Reemplazar la columna `categoria` en `rubros` por una clave foránea `id_categoria` que apunte a la nueva tabla.
    *   Actualizar las funciones RPC y el frontend para reflejar este cambio estructural.

#### Paso 1.5 (Deuda Técnica): Refactorizar Consultas a RPC
*   **Problema:** Las consultas para leer y escribir en las tablas `rubros` y `proyecto_rubros` se están haciendo directamente desde el frontend (`supabase.from(...)`), lo cual viola el principio de abstracción de la base de datos.
*   **Solución:**
    *   Crear una nueva función RPC `gestionar_rubros_catalogo` para el CRUD de la tabla `rubros`.
    *   Crear una nueva función RPC `gestionar_proyecto_rubros` para el CRUD de la tabla `proyecto_rubros`.
    *   Refactorizar los componentes `ProposalDetail.tsx` y el futuro `RubroManagement.tsx` para que utilicen exclusivamente estas funciones RPC.

2.  **Modificar la Página Principal (`page.tsx`)**
    *   Ajustaremos la lógica para que, cuando `activeView` sea `'projects'` y se seleccione un proyecto, se renderice condicionalmente:
        *   Si `selectedProject.estado === 'abierto'`, mostrar el nuevo componente `ProposalDetail.tsx`.
        *   Si no, no mostrar nada o un mensaje indicando que se debe seleccionar una de las vistas de detalle (Aportes, Gastos, etc.).

---

## II. Logros Recientes (Tareas Completadas)

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
