-- Backup de funciones de actualización de perfil (16 Nov 2025)
-- Estado: Versión en PRODUCCIÓN antes de mejoras

-- ============================================
-- Función: update_user_profile
-- ============================================
-- Nota: Esta es la versión EXACTA que está en producción
-- Obtenida con: SELECT pg_get_functiondef('public.update_user_profile'::regproc);

CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_id INTEGER, 
    p_responsable TEXT, 
    p_email TEXT, 
    p_clave TEXT DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE usuarios u
    SET 
        responsable = p_responsable,
        email = p_email,
        -- Solo actualiza la clave si se proporciona una nueva no vacía
        clave = CASE 
                    WHEN p_clave IS NOT NULL AND p_clave <> '' THEN crypt(p_clave, gen_salt('bf'))
                    ELSE u.clave 
                END
    WHERE u.id = p_id;
END;
$function$;

-- ============================================
-- Función: update_user_avatar
-- ============================================
-- Nota: Esta es la versión EXACTA que está en producción
-- Obtenida con: SELECT pg_get_functiondef('public.update_user_avatar'::regproc);

CREATE OR REPLACE FUNCTION public.update_user_avatar(
    p_id INTEGER, 
    p_avatar_url TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE usuarios
    SET avatar_url = p_avatar_url
    WHERE id = p_id;
END;
$function$;
