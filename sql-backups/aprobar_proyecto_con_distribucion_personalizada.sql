-- ============================================================================
-- FUNCIÓN: aprobar_proyecto_con_distribucion_personalizada
-- ============================================================================
-- Descripción: Aprueba un proyecto y genera contribuciones con montos personalizados
--              basados en un array JSONB de datos (similar a importar desde CSV)
--
-- Parámetros:
--   p_id_proyecto: ID del proyecto a aprobar
--   p_datos_contribuciones: JSONB con array de contribuciones personalizadas
--                           Formato: [{"id_casa": 1, "monto": 1430.00, "notas": "...", "controles": 2}, ...]
--
-- Retorna: VOID
--
-- Ejemplo de uso:
/*
SELECT aprobar_proyecto_con_distribucion_personalizada(
    4,  -- id_proyecto
    '[
        {"id_casa": 1, "monto": 1430.00, "notas": "2 controles remotos", "controles": 2},
        {"id_casa": 2, "monto": 1430.00, "notas": "2 controles remotos", "controles": 2},
        {"id_casa": 9, "monto": 1680.00, "notas": "3 controles remotos", "controles": 3}
    ]'::JSONB
);
*/
-- ============================================================================

CREATE OR REPLACE FUNCTION aprobar_proyecto_con_distribucion_personalizada(
    p_id_proyecto BIGINT,
    p_datos_contribuciones JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_proyecto_existe BOOLEAN;
    v_contribucion_record JSONB;
    v_fecha_vencimiento DATE;
    v_casa_existe BOOLEAN;
    v_metadata JSONB;
BEGIN
    -- 1. Validar que el proyecto existe y está en votación
    SELECT EXISTS(
        SELECT 1 FROM proyectos 
        WHERE id_proyecto = p_id_proyecto 
        AND estado = 'en_votacion'
    ) INTO v_proyecto_existe;

    IF NOT v_proyecto_existe THEN
        RAISE EXCEPTION 'El proyecto % no existe o no está en votación', p_id_proyecto;
    END IF;

    -- 2. Calcular fecha de vencimiento (30 días desde hoy)
    v_fecha_vencimiento := CURRENT_DATE + INTERVAL '30 days';

    -- 3. Validar que no existan contribuciones previas para este proyecto
    IF EXISTS(SELECT 1 FROM contribuciones_proyectos WHERE id_proyecto = p_id_proyecto) THEN
        RAISE EXCEPTION 'El proyecto % ya tiene contribuciones generadas', p_id_proyecto;
    END IF;

    -- 4. Iterar sobre cada registro del JSON e insertar
    FOR v_contribucion_record IN SELECT * FROM jsonb_array_elements(p_datos_contribuciones)
    LOOP
        -- Validar que la casa existe
        SELECT EXISTS(
            SELECT 1 FROM usuarios 
            WHERE id = (v_contribucion_record->>'id_casa')::BIGINT
        ) INTO v_casa_existe;

        IF NOT v_casa_existe THEN
            RAISE EXCEPTION 'La casa % no existe', v_contribucion_record->>'id_casa';
        END IF;

        -- Construir metadata JSON si existen campos opcionales
        v_metadata := NULL;
        IF v_contribucion_record ? 'controles' THEN
            v_metadata := jsonb_build_object(
                'controles', (v_contribucion_record->>'controles')::INTEGER,
                'distribucion_personalizada', true
            );
        END IF;

        -- Insertar contribución
        INSERT INTO contribuciones_proyectos (
            id_casa,
            id_proyecto,
            monto_esperado,
            fecha_vencimiento,
            estado,
            metadata_json,
            notas
        ) VALUES (
            (v_contribucion_record->>'id_casa')::BIGINT,
            p_id_proyecto,
            (v_contribucion_record->>'monto')::NUMERIC,
            v_fecha_vencimiento,
            'PENDIENTE',
            v_metadata,
            v_contribucion_record->>'notas'
        );
    END LOOP;

    -- 5. Actualizar estado del proyecto a 'aprobado'
    UPDATE proyectos
    SET estado = 'aprobado'
    WHERE id_proyecto = p_id_proyecto;

    RAISE NOTICE 'Proyecto % aprobado con % contribuciones personalizadas', 
                  p_id_proyecto, 
                  jsonb_array_length(p_datos_contribuciones);
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION aprobar_proyecto_con_distribucion_personalizada IS 
'Aprueba un proyecto y genera contribuciones con montos personalizados (no prorrateados). 
Útil para casos donde las contribuciones varían por casa según criterios especiales 
(ej: cantidad de controles remotos, metros cuadrados, etc.)';

-- ============================================================================
-- PERMISOS
-- ============================================================================
-- Otorgar permisos de ejecución al rol público (ajustar según tu configuración)
GRANT EXECUTE ON FUNCTION aprobar_proyecto_con_distribucion_personalizada TO public;
