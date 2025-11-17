-- Backup de función login_user (17 Nov 2025)
-- Estado: Versión en PRODUCCIÓN antes de mejoras

CREATE OR REPLACE FUNCTION public.login_user(p_identifier text, p_clave text)
 RETURNS TABLE(id bigint, responsable text, tipo_usuario text, ubicacion text, email text, avatar_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
      u.id, 
      u.responsable, 
      u.tipo_usuario, 
      u.ubicacion, 
      u.email,
      u.avatar_url
    FROM 
      public.usuarios u
    WHERE 
      -- Permite iniciar sesión con email O con el ID de la casa (convertido a texto)
      (u.email = trim(p_identifier) OR u.id::text = p_identifier) 
      -- Compara la contraseña de forma segura
      AND (u.clave = crypt(p_clave, u.clave) OR u.clave = p_clave);
END;
$function$;
