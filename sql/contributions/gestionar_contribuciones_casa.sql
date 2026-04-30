-- ============================================================================
-- FUNCIÓN: gestionar_contribuciones_casa
-- Tabla: contribucionesporcasa
-- ============================================================================
-- Descripción: Función RPC para gestionar contribuciones por casa.
-- Acciones soportadas:
--   - SELECT: Devuelve registros (opcionalmente filtrados por p_id_casa)
--   - UPDATE_PAGADO: Marca una contribución como PAGADA con monto, fecha y comprobante
-- ============================================================================
-- Parámetros:
--   p_accion: Acción a ejecutar ('SELECT' | 'UPDATE_PAGADO')
--   p_id_casa: ID de la casa (opcional para SELECT, obligatorio para UPDATE_PAGADO)
--   p_id_contribucion: ID del tipo de contribución (obligatorio para UPDATE_PAGADO)
--   p_fecha_cargo: Fecha del cargo (obligatorio para UPDATE_PAGADO)
--   p_monto_pagado: Monto pagado (obligatorio para UPDATE_PAGADO)
--   p_fecha_pago: Fecha en que se realizó el pago (obligatorio para UPDATE_PAGADO)
--   p_url_comprobante: URL del comprobante de pago (opcional)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gestionar_contribuciones_casa(
    p_accion text,
    p_id_casa bigint DEFAULT NULL::bigint,
    p_id_contribucion bigint DEFAULT NULL::bigint,
    p_fecha_cargo date DEFAULT NULL::date,
    p_monto_pagado double precision DEFAULT NULL::double precision,
    p_fecha_pago date DEFAULT NULL::date,
    p_url_comprobante text DEFAULT NULL::text
)
RETURNS SETOF tipo_contribucion_casa_detalle
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- ACCIÓN: SELECCIONAR (para leer datos)
    IF p_accion = 'SELECT' THEN
        RETURN QUERY
        SELECT
            cpc.id_casa,
            cpc.id_contribucion,
            cpc.fecha_cargo,
            cpc.estado,
            cpc.monto_pagado,
            cpc.url_comprobante,
            cpc.fechapago,
            cpc.fecha_maxima_pago,
            u.responsable,
            c.nombre as contribucion_nombre,
            c.descripcion as contribucion_descripcion,
            c.color_del_borde as contribucion_color
        FROM public.contribucionesporcasa cpc
        JOIN public.usuarios u ON cpc.id_casa = u.id
        JOIN public.contribuciones c ON cpc.id_contribucion = c.id_contribucion
        WHERE (p_id_casa IS NULL OR cpc.id_casa = p_id_casa)
        ORDER BY cpc.fecha_cargo;

    -- ACCIÓN: ACTUALIZAR A PAGADO (para registrar un pago)
    ELSIF p_accion = 'UPDATE_PAGADO' THEN
        IF p_id_casa IS NULL OR p_id_contribucion IS NULL OR p_fecha_cargo IS NULL OR p_monto_pagado IS NULL OR p_fecha_pago IS NULL THEN
            RAISE EXCEPTION 'Para registrar un pago, se requiere id_casa, id_contribucion, fecha_cargo, monto_pagado y fecha_pago.';
        END IF;

        -- Devolver la fila actualizada usando RETURN QUERY con CTE
        RETURN QUERY
        WITH updated AS (
            UPDATE public.contribucionesporcasa
            SET
                estado = 'PAGADO',
                monto_pagado = p_monto_pagado,
                fechapago = p_fecha_pago,
                url_comprobante = p_url_comprobante
            WHERE
                id_casa = p_id_casa
                AND id_contribucion = p_id_contribucion
                AND fecha_cargo = p_fecha_cargo
            RETURNING *
        )
        SELECT
            upd.id_casa,
            upd.id_contribucion,
            upd.fecha_cargo,
            upd.estado,
            upd.monto_pagado,
            upd.url_comprobante,
            upd.fechapago,
            upd.fecha_maxima_pago,
            u.responsable,
            c.nombre as contribucion_nombre,
            c.descripcion as contribucion_descripcion,
            c.color_del_borde as contribucion_color
        FROM updated upd
        JOIN public.usuarios u ON upd.id_casa = u.id
        JOIN public.contribuciones c ON upd.id_contribucion = c.id_contribucion;

    END IF;
END;
$function$;

-- ============================================================================
-- COMENTARIO
-- ============================================================================
COMMENT ON FUNCTION gestionar_contribuciones_casa IS 
'Gestiona las contribuciones por casa.
Acciones:
  - SELECT: Obtiene registros (filtra por p_id_casa si se proporciona)
  - UPDATE_PAGADO: Marca como PAGADO actualizando monto, fecha y comprobante.
Nota: La tabla contribucionesporcasa maneja estados: ''PAGADO'', ''PENDIENTE'', ''MOROSO''.';
