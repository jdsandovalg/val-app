-- ============================================================================
-- FUNCIÓN: gestionar_contribuciones_casa
-- Tabla: contribucionesporcasa
-- ============================================================================
-- Descripción: Función RPC para gestionar contribuciones por casa.
-- Acciones:
--   - SELECT: Devuelve registros (opcionalmente filtrados por p_id_casa)
--   - INSERT: Inserta o actualiza (ON CONFLICT) un registro de contribución
--   - UPDATE_PAGADO: Marca una contribución como PAGADA con monto, fecha y comprobante
--   - RESET_PAGO: Resetea una contribución a PENDIENTE (limpia datos de pago)
-- ============================================================================
-- Parámetros comunes:
--   p_accion: Acción a ejecutar (SELECT | INSERT | UPDATE_PAGADO | RESET_PAGO)
--   p_id_casa: ID de la casa (opcional para SELECT, obligatorio para otras)
--   p_id_contribucion: ID del tipo de contribución (obligatorio para INSERT/UPDATE)
--   p_fecha_cargo: Fecha del cargo (obligatorio para INSERT/UPDATE/RESET)
--   p_monto_pagado: Monto pagado (opcional, para INSERT/UPDATE_PAGADO)
--   p_estado: Estado del registro (PAGADO | PENDIENTE | MOROSO) (opcional, default PENDIENTE)
--   p_fechapago: Fecha en que se realizó el pago (opcional)
--   p_url_comprobante: URL del comprobante de pago (opcional)
-- ============================================================================

CREATE OR REPLACE FUNCTION gestionar_contribuciones_casa(
    p_accion TEXT,
    p_id_casa BIGINT DEFAULT NULL,
    p_id_contribucion BIGINT DEFAULT NULL,
    p_fecha_cargo DATE DEFAULT NULL,
    p_monto_pagado NUMERIC DEFAULT NULL,
    p_estado TEXT DEFAULT NULL,
    p_fechapago DATE DEFAULT NULL,
    p_url_comprobante TEXT DEFAULT NULL
)
RETURNS SETOF contribucionesporcasa
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -------------------------------------------------------------------------
    -- ACCIÓN: SELECT - Obtener registros
    -------------------------------------------------------------------------
    IF p_accion = 'SELECT' THEN
        RETURN QUERY
        SELECT *
        FROM contribucionesporcasa
        WHERE (p_id_casa IS NULL OR id_casa = p_id_casa)
        ORDER BY fecha_cargo DESC;

    -------------------------------------------------------------------------
    -- ACCIÓN: INSERT - Insertar o actualizar (upsert) un registro
    -------------------------------------------------------------------------
    ELSIF p_accion = 'INSERT' THEN
        IF p_id_casa IS NULL OR p_id_contribucion IS NULL OR p_fecha_cargo IS NULL THEN
            RAISE EXCEPTION 'Para INSERT se requieren: id_casa, id_contribucion, fecha_cargo';
        END IF;

        INSERT INTO contribucionesporcasa (
            id_casa,
            id_contribucion,
            fecha_cargo,
            estado,
            monto_pagado,
            fechapago,
            url_comprobante
        )
        VALUES (
            p_id_casa,
            p_id_contribucion,
            p_fecha_cargo,
            COALESCE(p_estado, 'PENDIENTE'),
            p_monto_pagado,
            p_fechapago,
            p_url_comprobante
        )
        ON CONFLICT (id_casa, id_contribucion, fecha_cargo)
        DO UPDATE SET
            estado = EXCLUDED.estado,
            monto_pagado = EXCLUDED.monto_pagado,
            fechapago = EXCLUDED.fechapago,
            url_comprobante = EXCLUDED.url_comprobante
        RETURNING *;

    -------------------------------------------------------------------------
    -- ACCIÓN: UPDATE_PAGADO - Marcar como PAGADO
    -------------------------------------------------------------------------
    ELSIF p_accion = 'UPDATE_PAGADO' THEN
        IF p_id_casa IS NULL OR p_id_contribucion IS NULL OR p_fecha_cargo IS NULL THEN
            RAISE EXCEPTION 'Para UPDATE_PAGADO se requieren: id_casa, id_contribucion, fecha_cargo';
        END IF;
        IF p_monto_pagado IS NULL OR p_fechapago IS NULL THEN
            RAISE EXCEPTION 'Para registrar un pago, el monto y la fecha son obligatorios.';
        END IF;

        UPDATE contribucionesporcasa
        SET
            estado = 'PAGADO',
            monto_pagado = p_monto_pagado,
            fechapago = p_fechapago,
            url_comprobante = p_url_comprobante
        WHERE
            id_casa = p_id_casa
            AND id_contribucion = p_id_contribucion
            AND fecha_cargo = p_fecha_cargo
        RETURNING *;

    -------------------------------------------------------------------------
    -- ACCIÓN: RESET_PAGO - Resetear pago a PENDIENTE
    -------------------------------------------------------------------------
    ELSIF p_accion = 'RESET_PAGO' THEN
        IF p_id_casa IS NULL OR p_id_contribucion IS NULL OR p_fecha_cargo IS NULL THEN
            RAISE EXCEPTION 'Para RESET_PAGO se requieren: id_casa, id_contribucion, fecha_cargo';
        END IF;

        UPDATE contribucionesporcasa
        SET
            estado = 'PENDIENTE',
            monto_pagado = NULL,
            fechapago = NULL,
            url_comprobante = NULL
        WHERE
            id_casa = p_id_casa
            AND id_contribucion = p_id_contribucion
            AND fecha_cargo = p_fecha_cargo
        RETURNING *;

    -------------------------------------------------------------------------
    -- ACCIÓN NO VÁLIDA
    -------------------------------------------------------------------------
    ELSE
        RAISE EXCEPTION 'Acción no válida: %. Acciones permitidas: SELECT, INSERT, UPDATE_PAGADO, RESET_PAGO', p_accion;
    END IF;
END;
$$;

-- ============================================================================
-- COMENTARIO
-- ============================================================================
COMMENT ON FUNCTION gestionar_contribuciones_casa IS 
'Gestiona las contribuciones por casa.
Acciones:
  - SELECT: Obtiene registros (filtra por p_id_casa si se proporciona)
  - INSERT: Inserta o actualiza un registro (upsert por PK: id_casa, id_contribucion, fecha_cargo)
  - UPDATE_PAGADO: Marca como PAGADO actualizando monto, fecha y comprobante
  - RESET_PAGO: Resetea a PENDIENTE limpiando datos de pago.
Nota: La tabla contribucionesporcasa maneja estados: ''PAGADO'', ''PENDIENTE'', ''MOROSO''.';
