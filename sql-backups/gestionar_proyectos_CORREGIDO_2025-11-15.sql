-- =============================================================================
-- FUNCIÓN: gestionar_proyectos (VERSIÓN CORREGIDA)
-- FECHA: 15 de noviembre de 2025
-- CAMBIOS: Reemplazar todos los RETURNING * por RETURNING explícito
-- MOTIVO: El RETURNING * causa ambigüedad con la columna calculada es_propuesta
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gestionar_proyectos(
    p_action text, 
    p_id_proyecto bigint DEFAULT NULL::bigint, 
    p_id_tipo_proyecto bigint DEFAULT NULL::bigint, 
    p_descripcion_tarea text DEFAULT NULL::text, 
    p_detalle_tarea text DEFAULT NULL::text, 
    p_frecuencia_sugerida text DEFAULT NULL::text, 
    p_notas_clave text DEFAULT NULL::text, 
    p_valor_estimado double precision DEFAULT NULL::double precision, 
    p_activo boolean DEFAULT NULL::boolean, 
    p_estado estado_proyecto DEFAULT NULL::estado_proyecto, 
    p_fecha_inicial_proyecto date DEFAULT NULL::date, 
    p_fecha_final_proyecto date DEFAULT NULL::date
)
RETURNS TABLE(
    id_proyecto bigint,
    id_tipo_proyecto bigint,
    descripcion_tarea text,
    detalle_tarea text,
    frecuencia_sugerida text,
    notas_clave text,
    valor_estimado double precision,
    activo boolean,
    estado estado_proyecto,
    fecha_inicial_proyecto date,
    fecha_final_proyecto date,
    es_propuesta boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_id_proyecto_nuevo bigint;
BEGIN
    IF p_action = 'INSERT' THEN
        -- Insertar el proyecto y obtener su nuevo ID
        INSERT INTO public.proyectos (
            id_tipo_proyecto, descripcion_tarea, detalle_tarea, frecuencia_sugerida, 
            notas_clave, valor_estimado, fecha_inicial_proyecto, fecha_final_proyecto
        )
        VALUES (
            p_id_tipo_proyecto, p_descripcion_tarea, p_detalle_tarea, p_frecuencia_sugerida, 
            p_notas_clave, p_valor_estimado, p_fecha_inicial_proyecto, p_fecha_final_proyecto
        )
        RETURNING proyectos.id_proyecto INTO v_id_proyecto_nuevo;

        -- Llamar a la función que genera las contribuciones
        PERFORM public.crear_contribuciones_para_proyecto(v_id_proyecto_nuevo, p_valor_estimado);

        -- Devolver el proyecto recién creado con todas las columnas explícitas
        RETURN QUERY 
        SELECT 
            p.id_proyecto,
            p.id_tipo_proyecto,
            p.descripcion_tarea,
            p.detalle_tarea,
            p.frecuencia_sugerida,
            p.notas_clave,
            p.valor_estimado,
            p.activo,
            p.estado,
            p.fecha_inicial_proyecto,
            p.fecha_final_proyecto,
            EXISTS (
                SELECT 1
                FROM proyecto_evidencias pe
                WHERE pe.id_proyecto = p.id_proyecto
                AND pe.tipo_evidencia = 'COTIZACION_PARA_VOTACION'
            ) AS es_propuesta
        FROM public.proyectos p 
        WHERE p.id_proyecto = v_id_proyecto_nuevo;

    ELSIF p_action = 'INSERT_PROPOSAL' THEN
        -- Insertar propuesta sin generar contribuciones
        RETURN QUERY
        INSERT INTO public.proyectos (
            id_tipo_proyecto, descripcion_tarea, detalle_tarea, frecuencia_sugerida, 
            notas_clave, fecha_inicial_proyecto, fecha_final_proyecto
        )
        VALUES (
            p_id_tipo_proyecto, p_descripcion_tarea, p_detalle_tarea, p_frecuencia_sugerida, 
            p_notas_clave, p_fecha_inicial_proyecto, p_fecha_final_proyecto
        )
        RETURNING 
            proyectos.id_proyecto,
            proyectos.id_tipo_proyecto,
            proyectos.descripcion_tarea,
            proyectos.detalle_tarea,
            proyectos.frecuencia_sugerida,
            proyectos.notas_clave,
            proyectos.valor_estimado,
            proyectos.activo,
            proyectos.estado,
            proyectos.fecha_inicial_proyecto,
            proyectos.fecha_final_proyecto,
            false AS es_propuesta;

    ELSIF p_action = 'UPDATE' THEN
        RETURN QUERY
        UPDATE public.proyectos
        SET
            id_tipo_proyecto = COALESCE(p_id_tipo_proyecto, proyectos.id_tipo_proyecto),
            descripcion_tarea = COALESCE(p_descripcion_tarea, proyectos.descripcion_tarea),
            detalle_tarea = COALESCE(p_detalle_tarea, proyectos.detalle_tarea),
            frecuencia_sugerida = COALESCE(p_frecuencia_sugerida, proyectos.frecuencia_sugerida),
            notas_clave = COALESCE(p_notas_clave, proyectos.notas_clave),
            valor_estimado = COALESCE(p_valor_estimado, proyectos.valor_estimado),
            activo = COALESCE(p_activo, proyectos.activo),
            estado = COALESCE(p_estado, proyectos.estado),
            fecha_inicial_proyecto = COALESCE(p_fecha_inicial_proyecto, proyectos.fecha_inicial_proyecto),
            fecha_final_proyecto = COALESCE(p_fecha_final_proyecto, proyectos.fecha_final_proyecto)
        WHERE proyectos.id_proyecto = p_id_proyecto
        RETURNING 
            proyectos.id_proyecto,
            proyectos.id_tipo_proyecto,
            proyectos.descripcion_tarea,
            proyectos.detalle_tarea,
            proyectos.frecuencia_sugerida,
            proyectos.notas_clave,
            proyectos.valor_estimado,
            proyectos.activo,
            proyectos.estado,
            proyectos.fecha_inicial_proyecto,
            proyectos.fecha_final_proyecto,
            EXISTS (
                SELECT 1
                FROM proyecto_evidencias pe
                WHERE pe.id_proyecto = proyectos.id_proyecto
                AND pe.tipo_evidencia = 'COTIZACION_PARA_VOTACION'
            ) AS es_propuesta;

    ELSIF p_action = 'DELETE' THEN
        -- Eliminar contribuciones asociadas primero
        DELETE FROM public.proyecto_contribuciones WHERE id_proyecto = p_id_proyecto;
        
        -- Eliminar el proyecto
        RETURN QUERY
        DELETE FROM public.proyectos
        WHERE proyectos.id_proyecto = p_id_proyecto
        RETURNING 
            proyectos.id_proyecto,
            proyectos.id_tipo_proyecto,
            proyectos.descripcion_tarea,
            proyectos.detalle_tarea,
            proyectos.frecuencia_sugerida,
            proyectos.notas_clave,
            proyectos.valor_estimado,
            proyectos.activo,
            proyectos.estado,
            proyectos.fecha_inicial_proyecto,
            proyectos.fecha_final_proyecto,
            false AS es_propuesta;
        
    ELSIF p_action = 'SELECT' THEN
        RETURN QUERY
        SELECT 
            p.id_proyecto,
            p.id_tipo_proyecto,
            p.descripcion_tarea,
            p.detalle_tarea,
            p.frecuencia_sugerida,
            p.notas_clave,
            p.valor_estimado,
            p.activo,
            p.estado,
            p.fecha_inicial_proyecto,
            p.fecha_final_proyecto,
            EXISTS (
                SELECT 1
                FROM proyecto_evidencias pe
                WHERE pe.id_proyecto = p.id_proyecto
                AND pe.tipo_evidencia = 'COTIZACION_PARA_VOTACION'
            ) AS es_propuesta
        FROM public.proyectos p
        WHERE p.estado NOT IN ('terminado', 'cancelado')
        ORDER BY p.id_proyecto DESC;

    ELSIF p_action = 'SELECT_ALL' THEN
        RETURN QUERY
        SELECT
            p.id_proyecto,
            p.id_tipo_proyecto,
            p.descripcion_tarea,
            p.detalle_tarea,
            p.frecuencia_sugerida,
            p.notas_clave,
            p.valor_estimado,
            p.activo,
            p.estado,
            p.fecha_inicial_proyecto,
            p.fecha_final_proyecto,
            EXISTS (
                SELECT 1
                FROM proyecto_evidencias pe
                WHERE pe.id_proyecto = p.id_proyecto
                AND pe.tipo_evidencia = 'COTIZACION_PARA_VOTACION'
            ) AS es_propuesta
        FROM proyectos p
        ORDER BY p.id_proyecto;
    END IF;
END;
$function$;

-- =============================================================================
-- NOTAS:
-- - Todos los RETURNING * fueron reemplazados por RETURNING explícito
-- - Todas las acciones ahora devuelven las 12 columnas correctamente
-- - INSERT_PROPOSAL y DELETE devuelven es_propuesta = false (hardcoded)
-- - Las demás acciones calculan es_propuesta con EXISTS
-- - Esta versión elimina las ambigüedades de columnas
-- =============================================================================
