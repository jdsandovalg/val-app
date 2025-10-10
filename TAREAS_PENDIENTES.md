# REGLAS DE COLABORACIÓN PROFESIONAL (Inamovible)

Estas son las reglas de nuestra relación profesional. Este documento es la única fuente de verdad sobre la arquitectura y el flujo de trabajo, y debe ser respetado en todo momento.

## Principios de Arquitectura y Decisiones Clave
*   **Fuente de Datos:** Las funciones de base de datos **NO DEBEN** depender de vistas (`VIEW`). Toda la lógica debe operar directamente sobre las **tablas base** (`usuarios`, `contribucionesporcasa`, etc.).
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
*   **Indicación del Siguiente Paso:** Al final de cada respuesta que involucre un cambio, el asistente debe indicar claramente cuál es el siguiente paso esperado por parte del usuario (ej. "Compila y verifica el cambio", "Sube los cambios a Git con este mensaje", etc.).
*   **Propuesta de Mejoras:** Cualquier mejora o "buena práctica" no solicitada (ej. seguridad, rendimiento) debe ser propuesta primero como un nuevo ítem en la sección "I. Tareas Pendientes". La propuesta debe incluir una justificación y un análisis del impacto potencial sobre el sistema existente. No se implementará hasta que sea discutida y aprobada.
sh
---

# TAREAS PENDIENTES - Val App

Este documento detalla las mejoras pendientes y completadas para el proyecto Val App, según lo determinado por una evaluación de ingeniería de software.

## I. Tareas Pendientes

1.  **Rendimiento:**
    -   **Objetivo:** Optimizar la generación de PDF en la página de "Calendarios".
    -   **Acción:** Investigar el uso de una función *serverless* o un hilo de trabajador para generar el PDF, evitando bloquear la interfaz de usuario.
    -   **Justificación:** Mejora la experiencia de usuario en reportes grandes.
    -   **Objetivo (BLOQUEADO):** Corregir y finalizar la optimización de PDF con Edge Functions.
    -   **Acción:** Diagnosticar y solucionar el error `Edge Function returned a non-2xx status code` en la función `generate-calendar-pdf`. La función falla al consultar la base de datos. Se debe restaurar la funcionalidad anterior (generación en cliente) temporalmente.
    -   **Justificación:** La implementación actual de la Edge Function no es funcional. Es prioritario tener un reporte funcional, aunque sea en el cliente, antes de reintentar la optimización.

2.  **UI/UX:**
    -   **Objetivo:** Estandarizar el sistema de notificaciones.
    -   **Decisión:** Se utilizará la librería `react-hot-toast` para todas las notificaciones (éxito, error, información).
    -   **Justificación:** Es una librería ligera, personalizable y fácil de integrar, mejorando la experiencia de usuario sin bloquear la interfaz.
    -   **Estado:** ✅ Instalada e integrada en el proveedor raíz. ✅ Implementada en la página de Login.

3.  **UI/UX (Decisión de Diseño):**
    -   **Objetivo:** Confirmar la estrategia de ubicación del selector de idioma.
    -   **Decisión:** Se mantendrán **dos** selectores de idioma: uno en la página de Login (para accesibilidad antes de autenticar) y otro en el menú principal (para que los usuarios autenticados puedan cambiarlo sin salir).
    -   **Justificación:** Asegura la mejor experiencia de usuario en todas las etapas de la navegación.

4.  **Plan de Refactorización por Página:**
    -   **Objetivo:** Modernizar y estandarizar las páginas restantes de la aplicación.
    -   **Metodología:** Abordar cada página de forma individual para aplicar dos mejoras principales:
        1.  **Internacionalización (i18n):** Reemplazar todo el texto estático con claves del sistema de traducción.
        2.  **Notificaciones Toast:** Reemplazar todos los `alert()` con notificaciones `toast`.
    -   **Páginas Pendientes:**
        -   `admin/manage-users`
        -   `admin/manage-house-contributions`

5.  **Bugs:**
    -   **Objetivo:** Solucionar la carga de imágenes de comprobantes de pago.
    -   **Problema:** En la página de "Calendarios", al hacer clic en "Ver Comprobante", el modal se queda en "Cargando imagen..." indefinidamente.
    -   **Contexto:** La configuración de `next.config.ts` es correcta. El problema parece estar en la URL generada o en las políticas de acceso del bucket de Supabase.
    -   **Estado:** Pendiente de investigación.

6.  **UI/UX (Formato de Fechas):**
    -   **Objetivo:** Estandarizar el formato de fecha en toda la aplicación para mejorar la experiencia de usuario.
    -   **Problema:** Las fechas se muestran en formato `YYYY-MM-DD`. El formato local deseado es `DD-MM-YYYY`.
    -   **Acción Propuesta:** Investigar e implementar una librería de manejo de fechas (como `date-fns` o `dayjs`) o una función de utilidad para formatear todas las fechas mostradas al usuario.
    -   **Justificación:** Mejora la legibilidad y la experiencia del usuario al presentar la información en un formato familiar.
    -   **Estado:** Pendiente de análisis y aprobación.

---

## II. Tareas Terminadas

1.  **Arquitectura y Rendimiento:**
    -   ✅ **Layout Persistente:** Se implementó un layout principal (`/menu/layout.tsx`) que mantiene el encabezado y el menú inferior siempre visibles, solucionando el problema del menú que desaparecía.
    -   ✅ **Optimización de "Grupos de Trabajo":** Se restauró la lógica de agrupación de datos en el servidor mediante la función RPC `get_grupos_trabajo_usuario`, eliminando el procesamiento pesado del lado del cliente y mejorando significativamente el rendimiento.

2.  **Estructura del Código y Mantenibilidad:**
    -   ✅ **Modularidad:** Se dividieron las páginas de administración en componentes más pequeños (Modales, Tablas, etc.).
    -   ✅ **Centralización de Tipos:** Se organizaron los tipos de TypeScript en una ubicación central.
    -   ✅ **Documentación:** Se añadió documentación técnica al inicio de cada archivo de página, explicando su propósito y funcionamiento.

4.  **Flujo de la Aplicación y UI/UX:**
    -   ✅ **Estandarización de Títulos:** Se unificó el estilo de los títulos en todas las páginas de la aplicación.
    -   ✅ **Retroalimentación de Carga CSV:** Se añadió un indicador de "Procesando..." durante la carga de archivos CSV.
    -   ✅ **Eliminación de Splash Screen:** Se unificó la página de login en la raíz del sitio, eliminando el paso intermedio.
    -   ✅ **Botón de Idioma Dinámico:** Se mejoró el botón de cambio de idioma para que su texto de ayuda (tooltip) y su etiqueta visible se actualicen dinámicamente según el idioma seleccionado.

5.  **Accesibilidad:**
    -   ✅ **Texto `alt` en Imágenes:** Se agregó texto alternativo a las imágenes del logo para mejorar la accesibilidad.

6.  **Internacionalización (i18n):**
    -   ✅ **Proveedor de Contexto:** Se creó un `I18nProvider` para gestionar el estado del idioma y las traducciones en toda la aplicación.
    -   ✅ **Archivos de Idioma:** Se implementaron los archivos `es.json` y `en.json` con una estructura de claves unificada.
    -   ✅ **Integración Global:** Se integró el `I18nProvider` en el layout raíz (`/app/layout.tsx`) para dar soporte a toda la aplicación.
    -   ✅ **Páginas Traducidas:** Se refactorizaron las páginas de Login (`/app/page.tsx`), el Layout del Menú (`/app/menu/layout.tsx`) y la página de Bienvenida (`/app/menu/page.tsx`) para usar el nuevo sistema.
    -   ✅ **Notificaciones en Login:** Se implementó `react-hot-toast` para los mensajes de error en la página de Login.
    -   ✅ **Refactorización de "Calendarios":** Se aplicó i18n y notificaciones toast.
    -   ✅ **Refactorización de "Grupos de Trabajo":** Se aplicó i18n y notificaciones toast.
    -   ✅ **Refactorización de "Avisos":** Se aplicó i18n y notificaciones toast.
    -   ✅ **Prueba de Extensibilidad (Francés):** Se añadió con éxito un tercer idioma (francés) para demostrar la facilidad de expansión del sistema de internacionalización.


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