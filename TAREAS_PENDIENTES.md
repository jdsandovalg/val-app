# REGLAS DE COLABORACIÓN PROFESIONAL (Inamovible)

Estas son las reglas de nuestra relación profesional. Este documento es la única fuente de verdad sobre la arquitectura y el flujo de trabajo, y debe ser respetado en todo momento.

## Principios de Arquitectura y Decisiones Clave
*   **Fuente de Datos:** Las funciones de base de datos **NO DEBEN** depender de vistas (`VIEW`). Toda la lógica debe operar directamente sobre las **tablas base** (`usuarios`, `contribucionesporcasa`, etc.).
*   **Enfoque "Mobile-Only":** La aplicación se desarrollará y diseñará exclusivamente para una experiencia móvil (WebApp). Se eliminarán las vistas y componentes específicos para escritorio (como tablas complejas) para simplificar el código, reducir el mantenimiento y alinear el producto con su objetivo primario.
*   **Autenticación:** El inicio de sesión se realiza **únicamente** a través de la función RPC `login_user`, que valida contra la tabla `public.usuarios`. **NO SE UTILIZA** el sistema de autenticación de Supabase (`supabase.auth`).
*   **Rendimiento en "Grupos de Trabajo":** La página de "Grupos de Trabajo" **DEBE** usar la función RPC `get_grupos_trabajo_usuario` para delegar la agrupación de datos al servidor. No se debe realizar la agrupación en el cliente.
*   **Organización del Código:** Toda la lógica de las páginas (obtención de datos, manejo de estado, funciones de guardado) debe permanecer dentro del archivo `page.tsx` correspondiente. **NO SE CREARÁN** archivos separados como hooks o servicios a menos que sea solicitado explícitamente.
*   **Seguridad:** No se deben introducir nuevas prácticas de seguridad (como encriptación de contraseñas con `crypt`) sin una discusión y aprobación previa.

*   **Diseño Extensible y Preparado para el Futuro:** Todas las sugerencias de código deben considerar la futura implementación de características como temas (claro/oscuro), internacionalización (múltiples idiomas) y accesibilidad. Se debe evitar el uso de valores "hardcodeados" (ej. colores como `#FFFFFF` o texto como `"Guardar"`) en favor de abstracciones (ej. variables de tema, claves de traducción) que faciliten la extensibilidad sin romper el diseño existente.
## Flujo de Trabajo para Cambios (Workflow)
*   **Propuesta Detallada:** Para cualquier cambio que no sea una corrección trivial (como un error de tipeo), se debe presentar un plan de propuesta detallado que incluya el "Razonamiento del Problema" y la "Solución Propuesta".
*   **Aprobación por Pasos:** La solución propuesta debe desglosarse en pasos pequeños e incrementales. Cada paso debe ser lo suficientemente pequeño como para ser compilado y verificado de forma independiente.
*   **Autorización Explícita:** Se debe obtener la autorización explícita del usuario ("aprobado", "adelante", etc.) para **cada paso individual** antes de proporcionar el código o `diff` correspondiente. No se procederá al siguiente paso sin la aprobación del anterior.
*   **Comando de Sincronización "LEE":** Al inicio de cada sesión, el usuario proporcionará este archivo y usará la instrucción "LEE". Esto servirá como señal para que el asistente lea, entienda y se adhiera estrictamente a todos los principios y flujos de trabajo aquí definidos antes de realizar cualquier análisis o sugerencia.
*   **Propuesta de Mejoras:** Cualquier mejora o "buena práctica" no solicitada (ej. seguridad, rendimiento) debe ser propuesta primero como un nuevo ítem en la sección "I. Tareas Pendientes". La propuesta debe incluir una justificación y un análisis del impacto potencial sobre el sistema existente. No se implementará hasta que sea discutida y aprobada.
*   **Indicación Explícita de Acción:** Al final de cada respuesta que contenga un cambio de código, debo indicar explícitamente la acción que espero de ti. Por ejemplo: "Ahora, por favor, **compila y verifica** que los cambios se aplican correctamente" o "Ahora, por favor, **sube los cambios a Git** con el siguiente mensaje:".
sh
---

# TAREAS PENDIENTES - Val App

Este documento detalla las mejoras pendientes y completadas para el proyecto Val App, según lo determinado por una evaluación de ingeniería de software.

## I. Tareas Pendientes

### Siguiente Tarea
- **Objetivo:** Optimizar la generación de PDF en la página de "Calendarios".
    - **Acción:** Investigar el uso de una función *serverless* o un hilo de trabajador para generar el PDF, evitando bloquear la interfaz de usuario.
    - **Justificación:** Mejora la experiencia de usuario en reportes grandes.

7.  **Bugs Solucionados:**
    -   ✅ **Carga de Imágenes de Comprobantes:** Se solucionó el problema que impedía visualizar las imágenes de los comprobantes de pago desde Supabase Storage.
    -   ✅ **Visualización del Logo en Vercel:** Solucionado. El problema era que el archivo `logo.png` no se había publicado correctamente.
    -   ✅ **Unificación de Interfaz a "Mobile-Only":** Se eliminaron las vistas de tabla de escritorio en las páginas de administración y calendario, dejando únicamente la vista de tarjetas para una experiencia consistente.
    -   ✅ **UI/UX - Tarjeta de Avisos:** Se actualizó el diseño de la tarjeta en la página de "Avisos" para que sea consistente con el estilo moderno de la aplicación.
    -   ✅ **UI/UX - Favicon:** Solucionado. Se migró el favicon a `app/icon.png` siguiendo las convenciones de Next.js y se limpiaron los archivos antiguos.
    -   ✅ **UI/UX - Ordenamiento en Grupos:** Se añadió un menú para ordenar los grupos de trabajo por número de grupo o por fecha en el lado del cliente.
    -   ✅ **UI/UX - Internacionalización de Formatos:** Se estandarizó el formato de fechas y monedas en toda la aplicación usando la API `Intl` para una correcta localización.


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

Estructura de las Tablas:

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
  realizado text null default '1'::text,
  pagado double precision null,
  url_comprobante text null,
  fechapago date null,
  constraint contribucionesporcasa_pkey primary key (id_casa, id_contribucion, fecha),
  constraint tmp_fk_casa foreign KEY (id_casa) references usuarios (id),
  constraint tmp_fk_contribucion foreign KEY (id_contribucion) references contribuciones (id_contribucion)
) TABLESPACE pg_default;

create table public.grupos (
  id_grupo bigint generated by default as identity not null,
  id_usuario bigint not null,
  id_contribucion bigint not null,
  created_at timestamp with time zone null default now(),
  constraint grupos_pkey primary key (id_grupo, id_usuario, id_contribucion),
  constraint fk_grupos_contribucion foreign KEY (id_contribucion) references contribuciones (id_contribucion) on delete CASCADE,
  constraint fk_grupos_usuario foreign KEY (id_usuario) references usuarios (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.nits (
  nit text not null,
  nombre text not null,
  direccion text null,
  constraint nits_pkey primary key (nit)
) TABLESPACE pg_default;

create table public.nits (
  nit text not null,
  nombre text not null,
  direccion text null,
  constraint nits_pkey primary key (nit)
) TABLESPACE pg_default;


create table public.liquidacion_de_gastos (
  id_contribucion bigint not null,
  fecha_documento date not null default now(),
  no_documento text not null,
  tipo_documento text not null default 'factura'::text,
  nit_contribuyente text not null,
  valor numeric null,
  constraint id_contribucion_pkey primary key (
    id_contribucion,
    fecha_documento,
    no_documento,
    tipo_documento,
    nit_contribuyente
  ),
  constraint id_contribucion_id_contribucion_fkey foreign KEY (id_contribucion) references contribuciones (id_contribucion),
  constraint liquidacion_de_gastos_nit_contribuyente_fkey foreign KEY (nit_contribuyente) references nits (nit)
) TABLESPACE pg_default;

create index IF not exists idx_grupos_usuario on public.grupos using btree (id_usuario) TABLESPACE pg_default;

create index IF not exists idx_grupos_contribucion on public.grupos using btree (id_contribucion) TABLESPACE pg_default;


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

VISTAS (NO DEBEN DE USARSE MAS QUE PARA CUANDO SE REQUIERAN REPORTES MUY PLANOS Y GENERALES)

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