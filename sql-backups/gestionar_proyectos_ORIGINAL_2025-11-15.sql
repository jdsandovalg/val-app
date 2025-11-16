-- =============================================================================
-- FUNCIÓN: gestionar_proyectos (VERSIÓN ORIGINAL FUNCIONAL)
-- FECHA BACKUP: 15 de noviembre de 2025
-- MOTIVO: Backup antes de agregar funcionalidad de aprobación de proyectos
-- ESTADO: ✅ FUNCIONAL - Verificado en producción
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
        -- 1. Insertar el proyecto y obtener su nuevo ID.
        INSERT INTO public.proyectos (
            id_tipo_proyecto, descripcion_tarea, detalle_tarea, frecuencia_sugerida, 
            notas_clave, valor_estimado, fecha_inicial_proyecto, fecha_final_proyecto
        )
        VALUES (
            p_id_tipo_proyecto, p_descripcion_tarea, p_detalle_tarea, p_frecuencia_sugerida, 
            p_notas_clave, p_valor_estimado, p_fecha_inicial_proyecto, p_fecha_final_proyecto
        )
        RETURNING id_proyecto INTO v_id_proyecto_nuevo;

        -- 2. Llamar a la función dedicada, pasando el valor explícitamente.
        PERFORM public.crear_contribuciones_para_proyecto(v_id_proyecto_nuevo, p_valor_estimado);

        -- 3. Devolver el proyecto recién creado.
        RETURN QUERY SELECT * FROM public.proyectos WHERE id_proyecto = v_id_proyecto_nuevo;

    ELSIF p_action = 'INSERT_PROPOSAL' THEN
        -- Esta lógica no genera cuotas, solo la propuesta.
        RETURN QUERY
        INSERT INTO public.proyectos (
            id_tipo_proyecto, descripcion_tarea, detalle_tarea, frecuencia_sugerida, 
            notas_clave, fecha_inicial_proyecto, fecha_final_proyecto
        )
        VALUES (
            p_id_tipo_proyecto, p_descripcion_tarea, p_detalle_tarea, p_frecuencia_sugerida, 
            p_notas_clave, p_fecha_inicial_proyecto, p_fecha_final_proyecto
        )
        RETURNING *;

    ELSIF p_action = 'UPDATE' THEN
        RETURN QUERY
        UPDATE public.proyectos
        SET
            id_tipo_proyecto = COALESCE(p_id_tipo_proyecto, id_tipo_proyecto),
            descripcion_tarea = COALESCE(p_descripcion_tarea, descripcion_tarea),
            detalle_tarea = COALESCE(p_detalle_tarea, detalle_tarea),
            frecuencia_sugerida = COALESCE(p_frecuencia_sugerida, frecuencia_sugerida),
            notas_clave = COALESCE(p_notas_clave, notas_clave),
            valor_estimado = COALESCE(p_valor_estimado, valor_estimado),
            activo = COALESCE(p_activo, activo),
            estado = COALESCE(p_estado, estado),
            fecha_inicial_proyecto = COALESCE(p_fecha_inicial_proyecto, fecha_inicial_proyecto),
            fecha_final_proyecto = COALESCE(p_fecha_final_proyecto, fecha_final_proyecto)
        WHERE id_proyecto = p_id_proyecto
        RETURNING *;

    ELSIF p_action = 'DELETE' THEN
        -- Primero eliminamos las contribuciones asociadas para evitar errores de FK
        DELETE FROM public.proyecto_contribuciones WHERE id_proyecto = p_id_proyecto;
        -- Luego eliminamos el proyecto
        RETURN QUERY
        DELETE FROM public.proyectos
        WHERE id_proyecto = p_id_proyecto
        RETURNING *;
        
    ELSIF p_action = 'SELECT' THEN
        RETURN QUERY
        SELECT * FROM public.proyectos 
        WHERE estado NOT IN ('terminado', 'cancelado')
        ORDER BY id_proyecto DESC;

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
            -- NUEVA LÓGICA PARA DETERMINAR EL TIPO DE PROYECTO
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
-- - Esta función es utilizada por: voting/page.tsx, admin/projects_management
-- - Devuelve 12 columnas (11 de tabla + es_propuesta calculada)
-- - Las acciones INSERT/UPDATE/DELETE usan RETURNING * que funciona para columnas físicas
-- - Solo SELECT_ALL calcula explícitamente es_propuesta
-- =============================================================================
