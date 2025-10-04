# TAREAS PENDIENTES - Val App

Este documento detalla las mejoras propuestas para el proyecto Val App, según lo determinado por una evaluación de ingeniería de software. No se realizarán cambios en el código fuente hasta que se conceda la autorización explícita para cada tarea.

## I. Estructura del Código y Mantenibilidad
 
1. **[VERIFICADO Y COMPLETADO] Mejorar la modularidad en `src/app/admin/manage-house-contributions/page.tsx`:**
   - Dividir el componente en componentes más pequeños, cada uno con una única responsabilidad.
     - Crear componentes para Modales (`ContributionModal`).
     - Crear componentes para Tablas (`ContributionTable`).
     - Crear custom hooks para la obtención de datos (`useContributions`, `useUsuarios`, etc.).
   - Justificación: Los componentes más pequeños son más fáciles de entender, probar y reutilizar, promoviendo la separación de responsabilidades, lo que hace que el código base sea más mantenible y escalable.
 
2. **[VERIFICADO Y COMPLETADO] Centralizar la inicialización del cliente de Supabase:**
   - Crear un módulo dedicado (p. ej., `src/lib/supabase.js`) para inicializar y exportar el cliente de Supabase.
   - Justificación: Evita la inicialización redundante y facilita la gestión de la configuración de Supabase.
 
3. **[VERIFICADO Y COMPLETADO] Centralizar los tipos de Typescript:**
   - Exportar los tipos `ContribucionPorCasaExt` y `SortableKeys` a una carpeta única `src/types`.
   - Justificación: Tener los tipos en un solo lugar facilita su búsqueda y reutilización.
 
## II. Mejoras de Rendimiento

1. **Optimizar la generación de PDF:**
   - Utilizar una función serverless o un hilo de trabajador independiente para la generación de PDF.
   - Justificación: Evita bloquear el hilo principal y garantiza una experiencia de usuario más fluida.

2. **Investigar los tiempos de carga prolongados:**
   - Examinar las consultas a Supabase para garantizar que se utilice el mejor índice posible y que solo se descarguen las columnas necesarias.
   - Justificación: Disminuir el tamaño de la carga útil y optimizar la ejecución de la consulta acelera el rendimiento.

3. **Memorizar cálculos costosos:**
   - Utilizar el hook `useMemo` para el cálculo de `filteredAndSortedRecords`.
   - Justificación: Almacenar en caché el cálculo de la tabla reduce el número de veces que tiene que volver a renderizarse.

## III. Manejo de Errores y Experiencia del Usuario

1. **Implementar un manejo de errores más robusto:**
   - Implementar un mecanismo de visualización de errores más fácil de usar (p. ej., una notificación toast o un banner de error).
   - Registrar los errores en un servicio de monitoreo.
   - Justificación: Mejora la experiencia del usuario y permite un mejor monitoreo de la salud de la aplicación.

2. **Mejorar la retroalimentación del usuario durante la carga de CSV:**
   - Agregar un indicador de progreso o retroalimentación más granular durante el procesamiento y la carga de CSV.
   - Justificación: Mantiene al usuario informado sobre el proceso de carga.

## IV. Accesibilidad

1. **Agregar texto `alt` al Logo.**
   - Agregar texto `alt` que describa la imagen.
   - Justificación: Los lectores de pantalla podrán indicar al usuario de qué se trata la imagen.
