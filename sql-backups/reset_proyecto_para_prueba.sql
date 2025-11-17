-- ============================================================================
-- SCRIPT DE RESET PARA PROBAR DISTRIBUCIÓN PERSONALIZADA
-- ============================================================================
-- Ejecutar estos pasos en orden para resetear el proyecto 4 y probarlo de nuevo

-- PASO 1: Eliminar contribuciones existentes del proyecto 4
DELETE FROM contribuciones_proyectos 
WHERE id_proyecto = 4;

-- PASO 2: Cambiar estado del proyecto de vuelta a 'en_votacion'
UPDATE proyectos 
SET estado = 'en_votacion'
WHERE id_proyecto = 4;

-- PASO 3: Verificar que se reseteo correctamente
SELECT 
    id_proyecto, 
    descripcion_tarea, 
    estado,
    (SELECT COUNT(*) FROM contribuciones_proyectos WHERE id_proyecto = 4) as num_contribuciones
FROM proyectos 
WHERE id_proyecto = 4;

-- Resultado esperado:
-- - estado: 'en_votacion'
-- - num_contribuciones: 0

-- ============================================================================
-- NOTA: Después de ejecutar esto, ve a la página de votación en el frontend
-- y prueba el botón "Distribución Personalizada (CSV)"
-- ============================================================================
