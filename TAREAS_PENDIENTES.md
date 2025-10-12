w
---

# TAREAS PENDIENTES - Val App

Este documento detalla las mejoras pendientes y completadas para el proyecto Val App, según lo determinado por una evaluación de ingeniería de software.

## I. Tareas Pendientes

### Siguiente Tarea
- **Objetivo:** Optimizar la generación de PDF en la página de "Calendarios".
- **UI/UX:** Estandarizar el ancho de la tarjeta en la página de "Avisos".
    - **Problema:** La tarjeta de "Avisos" cambia de tamaño según el idioma, causando un redibujado incómodo.
    - **Acción:** Asignar un ancho fijo (`w-full`) a la tarjeta para que ocupe todo el espacio disponible hasta su `max-w-lg`, manteniendo un tamaño consistente.
∫
---

## II. Logros Recientes (Tareas Completadas)

*   **Bugs Solucionados:**
    *   ✅ **Carga de Imágenes de Comprobantes:** Se solucionó el problema que impedía visualizar las imágenes de los comprobantes de pago desde Supabase Storage.
    *   ✅ **Visualización del Logo en Vercel:** Solucionado. El problema era que el archivo `logo.png` no se había publicado correctamente.
*   **Mejoras de UI/UX:**
    *   ✅ **Unificación de Interfaz a "Mobile-Only":** Se eliminaron las vistas de tabla de escritorio en las páginas de administración y calendario, dejando únicamente la vista de tarjetas para una experiencia consistente.
    *   ✅ **Diseño de Tarjeta de Avisos:** Se actualizó el diseño de la tarjeta en la página de "Avisos" para que sea consistente con el estilo moderno de la aplicación.
    *   ✅ **Solución de Favicon:** Se migró el favicon a `app/icon.png` siguiendo las convenciones de Next.js.
    *   ✅ **Ordenamiento en Grupos de Trabajo:** Se añadió un menú para ordenar los grupos por número o fecha en el cliente.
    *   ✅ **Internacionalización de Formatos:** Se estandarizó el formato de fechas y monedas en toda la aplicación usando la API `Intl` para una correcta localización.

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

## IV. Normas de Colaboración y Lecciones Aprendidas

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
Estructura de las Tablas:

### CONTRIBUCIONES

create table public.contribuciones (
  id_contribucion bigint generated by default as identity not null,
  contribucion text null,
  descripcion text null,
  color_del_borde text null,
  constraint Contribuciones_pkey primary key (id_contribucion)
) TABLESPACE pg_default;

create table public.contribucionesporcasa (
  id_casa bigint generated by default as identity not null,
  id_contribucion bigint not null,
  fecha date not null,
  realizado text null default '1'::wtext,
  pagado double precision null,
  url_comprobante text null,
  fechapago date null,
  constraint contribucionesporcasa_pkey primary key (id_casa, id_contribucion, fecha),
  constraint tmp_fk_casa foreign KEY (id_casa) references usuarios (id),
  constraint tmp_fk_contribucion foreign KEY (id_contribucion) references contribuciones (id_contribucion)
) TABLESPACE pg_default;

### GRUPOS DE TRABAJO PARA ACTIVIDADES ADMINISTRATIVAS

create table public.grupos (
  id_grupo bigint generated by default as identity not null,
  id_usuario bigint not null,
  id_contribucion bigint not null,
  created_at timestamp with time zone null default now(),
  constraint grupos_pkey primary key (id_grupo, id_usuario, id_contribucion),
  constraint fk_grupos_contribucion foreign KEY (id_contribucion) references contribuciones (id_contribucion) on delete CASCADE,
  constraint fk_grupos_usuario foreign KEY (id_usuario) references usuarios (id) on delete CASCADE
) TABLESPACE pg_default;

### CORE 

create table public.usuarios (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  responsable text not null,
  clave text not null,
  tipo_usuario text null,
  constraint usuarios_pkey primary key (id)
) TABLESPACE pg_default;


create table public.logs (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  mensaje text null,
  constraint logs_pkey primary key (id, created_at)
) TABLESPACE pg_default;

### VISTAS (NO DEBEN DE USARSE MAS QUE PARA CUANDO SE REQUIERAN REPORTES MUY PLANOS Y GENERALES)

create view public.v_contribuciones_detalle as
select
  cpc.id_casa,
  cpc.id_contribucion,
  cpc.fecha,
  cpc.pagado,
  cpc.realizado,
  cpc.fechapago,
  cpc.url_comprobante,
  u.responsable,
  c.descripcion as contribucion_descripcion,
  c.color_del_borde
from
  contribucionesporcasa cpc
  left join usuarios u on cpc.id_casa = u.id
  left join contribuciones c on cpc.id_contribucion = c.id_contribucion;

  create view public.v_usuarios_contribuciones as
select
  u.id,
  u.responsable,
  u.clave,
  cp.id_casa,
  cp.id_contribucion,
  cp.fecha,
  cp.realizado,
  cp.pagado,
  c.contribucion,
  c.descripcion,
  CURRENT_DATE - cp.fecha as dias_restantes,
  cp.url_comprobante,
  g.id_grupo,
  c.color_del_borde
from
  usuarios u
  join contribucionesporcasa cp on cp.id_casa = u.id
  join contribuciones c on c.id_contribucion = cp.id_contribucion
  full join grupos g on cp.id_casa = g.id_usuario
  and cp.id_contribucion = g.id_contribucion;

  ### PROYECTOS

  
create table public.proyectos (
  id_proyecto bigint generated by default as identity not null,
  descripcion text not null,
  descripcion_proyecto text null,
  tipo_proyecto bigint null,
  valor double precision null default '0'::double precision,
  constraint proyectos_pkey primary key (id_proyecto)
) TABLESPACE pg_default;


create table public.contribucionesporcasa_proyectos (
  id_casa bigint generated by default as identity not null,
  id_proyecto bigint not null,
  fecha date not null,
  realizado text null default '1'::text,
  pagado double precision null,
  url_comprobante text null,
  fechapago date null,
  constraint contribucionesporcasa_proyectos_pkey primary key (id_casa, id_proyecto, fecha),
  constraint tmp_fk_casa foreign KEY (id_casa) references usuarios (id),
  constraint tmp_fk_proyectos foreign KEY (id_proyecto) references proyectos (id_proyecto)
) TABLESPACE pg_default;


create table public.liquidacion_de_gastos (
  id_proyecto bigint not null,
  fecha_documento date not null default now(),
  no_documento text not null,
  tipo_documento text not null default 'factura'::text,
  nit_contribuyente text not null,
  valor numeric null,
  constraint liquidacion_de_gastos_pkey primary key (
    id_proyecto,
    fecha_documento,
    no_documento,
    tipo_documento,
    nit_contribuyente
  ),
  constraint liquidacion_de_gastos_id_proyecto_fkey foreign KEY (id_proyecto) references proyectos (id_proyecto) on update CASCADE on delete RESTRICT,
  constraint liquidacion_de_gastos_nit_contribuyente_fkey foreign KEY (nit_contribuyente) references nits (nit)
) TABLESPACE pg_default;