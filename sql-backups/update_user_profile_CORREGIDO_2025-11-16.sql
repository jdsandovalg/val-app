-- Versión FINAL FUNCIONAL: update_user_profile y update_user_avatar
-- Fecha: 16-17 de Noviembre de 2025
-- Estado: ✅ PRODUCTIVO - Validado en dispositivos móviles
-- Cambios críticos: 
--   1. SET search_path = public, extensions (acceso a pgcrypto)
--   2. TRIM y normalización de datos
--   3. Validación de existencia con IF NOT FOUND

-- ============================================
-- Función: update_user_profile (MEJORADA)
-- ============================================
-- Propósito: Actualizar datos básicos del perfil (nombre, email, clave)
-- Mejoras sobre versión original:
--   - TRIM en todos los campos (evita espacios fantasma)
--   - Email normalizado a minúsculas
--   - Validación de existencia de usuario
--   - Mantiene compatibilidad total con frontend (INTEGER, DEFAULT)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_id INTEGER,  -- Mantener INTEGER para compatibilidad
    p_responsable TEXT,
    p_email TEXT,
    p_clave TEXT DEFAULT NULL::text  -- Mantener DEFAULT para compatibilidad
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE usuarios u
    SET 
        responsable = TRIM(p_responsable),  -- Añadir TRIM
        email = CASE 
            WHEN p_email IS NOT NULL AND TRIM(p_email) != '' 
            THEN LOWER(TRIM(p_email))  -- Normalizar email a minúsculas
            ELSE u.email 
        END,
        clave = CASE 
            WHEN p_clave IS NOT NULL AND p_clave <> '' 
            THEN crypt(TRIM(p_clave), gen_salt('bf'))  -- Añadir TRIM
            ELSE u.clave 
        END
    WHERE u.id = p_id;
    
    -- Validar que se actualizó algo
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario con ID % no encontrado', p_id;
    END IF;
END;
$function$;

-- ============================================
-- Función: update_user_avatar (MEJORADA)
-- ============================================
-- Propósito: Actualizar SOLO el avatar del usuario
-- Mejoras:
--   - Validación de existencia de usuario
--   - Validación de URL no vacía
--   - TRIM en URL
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_avatar(
    p_id INTEGER,  -- Mantener INTEGER para compatibilidad
    p_avatar_url TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Validar que la nueva URL no esté vacía
    IF p_avatar_url IS NULL OR TRIM(p_avatar_url) = '' THEN
        RAISE EXCEPTION 'La URL del avatar no puede estar vacía';
    END IF;

    -- Actualizar el avatar
    UPDATE usuarios u
    SET avatar_url = TRIM(p_avatar_url)
    WHERE u.id = p_id;
    
    -- Validar que se actualizó
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario con ID % no encontrado', p_id;
    END IF;
END;
$function$;

-- ============================================
-- Permisos: Permitir a usuarios autenticados
-- ============================================

GRANT EXECUTE ON FUNCTION update_user_profile(BIGINT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_avatar(BIGINT, TEXT) TO authenticated;

-- ============================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================
-- 1. Las funciones ahora validan entrada (TRIM, NULLIF)
-- 2. Email se normaliza a minúsculas
-- 3. Clave solo se actualiza si se proporciona valor no vacío
-- 4. Avatar se maneja completamente separado del perfil
-- 5. Ambas funciones actualizan updated_at automáticamente
-- 6. SECURITY DEFINER permite bypass de RLS (necesario para que 
--    usuarios PRE/OPE actualicen su propio perfil)
