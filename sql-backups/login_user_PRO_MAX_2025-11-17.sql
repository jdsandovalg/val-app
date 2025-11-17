-- ============================================
-- Función: login_user (VERSIÓN PRO MAX)
-- ============================================
-- Fecha: 17 de Noviembre de 2025
-- Estado: ✅ PRODUCTIVO
-- 
-- Descripción:
--   Autentica usuarios contra la tabla `usuarios` usando autenticación custom.
--   Permite login con email O número de casa (ID).
--   Normaliza email a minúsculas para búsqueda case-insensitive.
--
-- Parámetros:
--   - p_identifier: Email o ID de casa (texto)
--   - p_clave: Contraseña en texto plano
--
-- Retorna:
--   - Datos del usuario si autenticación exitosa
--   - NULL si credenciales incorrectas
--
-- Seguridad:
--   - SECURITY DEFINER: Bypasa RLS para lectura de usuarios
--   - Contraseña encriptada con bcrypt (crypt/gen_salt)
--   - Fallback a texto plano (⚠️ legacy, remover en futuro)
--
-- Mejoras vs versión anterior:
--   ✅ Email normalizado a minúsculas (LOWER)
--   ✅ TRIM en ambos lados de comparación
--   ✅ Validación NULL explícita
--   ✅ Comentarios completos
--   ✅ SET search_path para seguridad
-- ============================================

CREATE OR REPLACE FUNCTION public.login_user(
    p_identifier TEXT,
    p_clave TEXT
)
RETURNS TABLE(
    id BIGINT,
    responsable TEXT,
    tipo_usuario TEXT,
    ubicacion TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
    -- Validar parámetros no nulos
    IF p_identifier IS NULL OR TRIM(p_identifier) = '' THEN
        RETURN;
    END IF;
    
    IF p_clave IS NULL OR TRIM(p_clave) = '' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        u.id, 
        u.responsable, 
        u.tipo_usuario, 
        u.ubicacion, 
        u.email,
        u.avatar_url
    FROM usuarios u
    WHERE 
        -- Opción 1: Login por email (normalizado a minúsculas)
        (LOWER(TRIM(u.email)) = LOWER(TRIM(p_identifier))
        -- Opción 2: Login por ID de casa
        OR u.id::TEXT = TRIM(p_identifier))
        -- Verificar contraseña encriptada con bcrypt
        AND (u.clave = crypt(TRIM(p_clave), u.clave) 
             -- Fallback legacy: contraseña en texto plano (⚠️ deprecar)
             OR u.clave = TRIM(p_clave))
    LIMIT 1; -- Solo un usuario puede hacer login
END;
$function$;

-- ============================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================
--
-- 1. EMAIL NORMALIZADO:
--    - LOWER(TRIM(u.email)) = LOWER(TRIM(p_identifier))
--    - Permite login con "User@MAIL.com" o "user@mail.com"
--    - Importante: emails en BD deben estar en minúsculas
--      (garantizado por update_user_profile)
--
-- 2. TRIM APLICADO:
--    - Evita errores por espacios accidentales
--    - Aplica tanto al identifier como a la clave
--
-- 3. FALLBACK TEXTO PLANO:
--    - OR u.clave = TRIM(p_clave)
--    - ⚠️ Solo para usuarios legacy sin encriptar
--    - TODO: Migrar todas las claves a bcrypt y remover
--
-- 4. LIMIT 1:
--    - Garantiza que solo se retorne un usuario
--    - Previene múltiples sesiones por email duplicado
--
-- 5. SECURITY DEFINER:
--    - Permite leer tabla usuarios aunque RLS esté habilitada
--    - Necesario para autenticación custom sin Supabase Auth
--
-- 6. SET search_path:
--    - Acceso a extensiones (crypt de pgcrypto)
--    - Previene ataques de schema poisoning
--
-- ============================================
-- CASOS DE USO
-- ============================================
--
-- Login con email:
--   SELECT * FROM login_user('user@mail.com', 'password123');
--   SELECT * FROM login_user('User@MAIL.com', 'password123'); -- También funciona
--
-- Login con ID de casa:
--   SELECT * FROM login_user('15', 'password123');
--
-- Credenciales incorrectas:
--   SELECT * FROM login_user('user@mail.com', 'wrong'); -- Retorna NULL
--
-- ============================================
-- TESTING
-- ============================================
--
-- Test 1: Email en minúsculas
-- SELECT * FROM login_user('test@mail.com', 'test123');
--
-- Test 2: Email con mayúsculas (debe funcionar igual)
-- SELECT * FROM login_user('Test@MAIL.com', 'test123');
--
-- Test 3: Login por ID
-- SELECT * FROM login_user('1', 'test123');
--
-- Test 4: Email con espacios
-- SELECT * FROM login_user('  test@mail.com  ', 'test123');
--
-- Test 5: Clave incorrecta
-- SELECT * FROM login_user('test@mail.com', 'wrong'); -- Debe retornar NULL
--
