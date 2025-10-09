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

---

# TAREAS PENDIENTES - Val App

Este documento detalla las mejoras pendientes y completadas para el proyecto Val App, según lo determinado por una evaluación de ingeniería de software.

## I. Tareas Pendientes

1.  **Rendimiento:**
    -   **Objetivo:** Optimizar la generación de PDF en la página de "Calendarios".
    -   **Acción:** Investigar el uso de una función *serverless* o un hilo de trabajador para generar el PDF, evitando bloquear la interfaz de usuario.
    -   **Justificación:** Mejora la experiencia de usuario en reportes grandes.
    -   **Objetivo:** Restaurar la optimización de rendimiento en la página de "Grupos de Trabajo".
    -   **Acción:** Volver a implementar la lógica de agrupación de datos en el servidor (usando la función RPC `get_grupos_trabajo_usuario`) para evitar el "congelamiento" de la UI en dispositivos móviles.
    -   **Justificación:** El procesamiento en el cliente es lento y esta optimización ya se había logrado.

2.  **UI/UX:**
    -   **Objetivo:** Implementar notificaciones modernas en toda la aplicación.
    -   **Acción:** Reemplazar los `alert()` restantes (ej. en "Gestionar Aportaciones" y "Gestionar Usuarios") por notificaciones "toast".
    -   **Justificación:** Mejora la experiencia de usuario al no bloquear la interfaz.

---

## II. Tareas Terminadas

1.  **Arquitectura y Rendimiento:**
    -   ✅ **Layout Persistente:** Se implementó un layout principal (`/menu/layout.tsx`) que mantiene el encabezado y el menú inferior siempre visibles, solucionando el problema del menú que desaparecía.

2.  **Estructura del Código y Mantenibilidad:**
    -   ✅ **Modularidad:** Se dividieron las páginas de administración en componentes más pequeños (Modales, Tablas, etc.).
    -   ✅ **Centralización de Tipos:** Se organizaron los tipos de TypeScript en una ubicación central.
    -   ✅ **Documentación:** Se añadió documentación técnica al inicio de cada archivo de página, explicando su propósito y funcionamiento.

4.  **Flujo de la Aplicación y UI/UX:**
    -   ✅ **Estandarización de Títulos:** Se unificó el estilo de los títulos en todas las páginas de la aplicación.
    -   ✅ **Retroalimentación de Carga CSV:** Se añadió un indicador de "Procesando..." durante la carga de archivos CSV.
    -   ✅ **Eliminación de Splash Screen:** Se unificó la página de login en la raíz del sitio, eliminando el paso intermedio.

5.  **Accesibilidad:**
    -   ✅ **Texto `alt` en Imágenes:** Se agregó texto alternativo a las imágenes del logo para mejorar la accesibilidad.
