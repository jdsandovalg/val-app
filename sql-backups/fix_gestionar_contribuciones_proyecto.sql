-- ============================================================================
-- FIX: gestionar_contribuciones_proyecto - Incluir metadata_json y notas
-- ============================================================================
-- Fecha: 17 Noviembre 2025
-- Problema: La función RPC no retornaba metadata_json y notas
-- Solución: 
--   1. Actualizar el tipo tipo_contribucion_proyecto_detalle
--   2. Actualizar la función para incluir los nuevos campos
-- ============================================================================

-- PASO 1: Actualizar el tipo personalizado (si existe, DROP y CREATE)
DROP TYPE IF EXISTS tipo_contribucion_proyecto_detalle CASCADE;

CREATE TYPE tipo_contribucion_proyecto_detalle AS (
    id_contribucion BIGINT,
    id_casa BIGINT,
    id_proyecto BIGINT,
    monto_esperado NUMERIC,
    fecha_vencimiento DATE,
    estado TEXT,
    monto_pagado NUMERIC,
    fecha_pago DATE,
    url_comprobante TEXT,
    responsable TEXT,
    metadata_json JSONB,
    notas TEXT
);

-- PASO 2: Recrear la función con los campos nuevos
CREATE OR REPLACE FUNCTION gestionar_contribuciones_proyecto(
-- PASO 2: Recrear la función con los campos nuevos
CREATE OR REPLACE FUNCTION gestionar_contribuciones_proyecto(
    p_action TEXT,
    p_id_proyecto BIGINT DEFAULT NULL,
    p_id_contribucion BIGINT DEFAULT NULL,
    p_monto_pagado NUMERIC DEFAULT NULL,
    p_fecha_pago DATE DEFAULT NULL
)
RETURNS SETOF tipo_contribucion_proyecto_detalle
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_action = 'SELECT' THEN
        RETURN QUERY
        SELECT
            cp.id_contribucion,
            cp.id_casa,
            cp.id_proyecto,
            cp.monto_esperado,
            cp.fecha_vencimiento,
            cp.estado,
            cp.monto_pagado,
            cp.fecha_pago,
            cp.url_comprobante,
            u.responsable,
            cp.metadata_json,  -- ✅ AGREGADO
            cp.notas           -- ✅ AGREGADO
        FROM contribuciones_proyectos cp
        JOIN usuarios u ON cp.id_casa = u.id
        WHERE cp.id_proyecto = p_id_proyecto
        ORDER BY u.id;

    ELSIF p_action = 'UPDATE_PAGADO' THEN
        IF p_monto_pagado IS NULL OR p_fecha_pago IS NULL THEN
            RAISE EXCEPTION 'Para registrar un pago, el monto y la fecha son obligatorios.';
        END IF;

        UPDATE contribuciones_proyectos
        SET
            estado = 'PAGADO',
            fecha_pago = p_fecha_pago,
            monto_pagado = p_monto_pagado
        WHERE id_contribucion = p_id_contribucion;

        RETURN QUERY
        SELECT
            cp.id_contribucion,
            cp.id_casa,
            cp.id_proyecto,
            cp.monto_esperado,
            cp.fecha_vencimiento,
            cp.estado,
            cp.monto_pagado,
            cp.fecha_pago,
            cp.url_comprobante,
            u.responsable,
            cp.metadata_json,
            cp.notas
        FROM contribuciones_proyectos cp
        JOIN usuarios u ON cp.id_casa = u.id
        WHERE cp.id_contribucion = p_id_contribucion;

    ELSIF p_action = 'UPDATE_ANULAR' THEN
        UPDATE contribuciones_proyectos
        SET
            estado = 'PENDIENTE',
            fecha_pago = NULL,
            monto_pagado = NULL
        WHERE id_contribucion = p_id_contribucion;

        RETURN QUERY
        SELECT
            cp.id_contribucion,
            cp.id_casa,
            cp.id_proyecto,
            cp.monto_esperado,
            cp.fecha_vencimiento,
            cp.estado,
            cp.monto_pagado,
            cp.fecha_pago,
            cp.url_comprobante,
            u.responsable,
            cp.metadata_json,
            cp.notas
        FROM contribuciones_proyectos cp
        JOIN usuarios u ON cp.id_casa = u.id
        WHERE cp.id_contribucion = p_id_contribucion;

    END IF;
END;
$$;

-- ============================================================================
-- COMENTARIO
-- ============================================================================
COMMENT ON FUNCTION gestionar_contribuciones_proyecto IS 
'Gestiona las contribuciones de los proyectos. 
Acciones: SELECT (por proyecto), UPDATE_PAGADO, UPDATE_ANULAR.
ACTUALIZACIÓN 17/11/2025: Agregados campos metadata_json y notas al tipo de retorno.';

-- ============================================================================
-- PRUEBA
-- ============================================================================
-- Verificar que devuelve metadata_json y notas:
-- SELECT * FROM gestionar_contribuciones_proyecto('SELECT', 4);
-- 
-- Deberías ver columnas adicionales:
-- - metadata_json: {"controles": 2, "distribucion_personalizada": true}
-- - notas: "CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos"
