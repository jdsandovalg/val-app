-- ============================================================================
-- ACTUALIZACIÓN DE CONTRIBUCIONES PROYECTO PORTÓN CON MONTOS REALES
-- ============================================================================
-- Fecha: 2025-11-17
-- Descripción: Actualiza los montos del proyecto 4 (AUTOMATIZACIÓN DEL PORTÓN)
--              con los valores reales basados en cantidad de controles remotos
--              
-- Contexto: El proyecto fue creado con prorrateo igual (Q1,505 c/u) pero los
--           montos reales varían según cantidad de controles por casa:
--           - 2 controles: Q1,430.00
--           - 3 controles: Q1,680.00  
--           - 4 controles: Q1,930.00
--           Total: Q15,050.00 (10 casas)
-- ============================================================================

-- Paso 1: Verificar registros actuales
SELECT 
    id_contribucion,
    id_casa,
    monto_esperado,
    estado,
    fecha_vencimiento
FROM contribuciones_proyectos
WHERE id_proyecto = 4
ORDER BY id_casa;

-- Paso 2: Actualizar con montos reales y metadata
BEGIN;

-- Casa 1 (Carlos Alvarado) - 2 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1430.00,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 1;

-- Casa 2 (Leonor Vda de Bran) - 2 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1430.00,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 2;

-- Casa 5 (Eliseo Gálvez) - 2 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1430.00,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 5;

-- Casa 6 (Pablo Girón) - 2 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1430.00,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 6;

-- Casa 7 (Leonor Vda de Bran - segunda casa) - 2 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1430.00,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 7;

-- Casa 8 (Sergio Iván Pérez) - 2 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1430.00,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 8;

-- Casa 9 (Vilma de Sandoval) - 3 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1680.00,
    metadata_json = '{"controles": 3, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 3 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 9;

-- Casa 10 (José Ismael Illescas) - 4 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1930.00,
    metadata_json = '{"controles": 4, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 4 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 10;

-- Casa 11 (Emilsa Matta) - 2 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1430.00,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 11;

-- Casa 12 (Ericka Flores) - 2 controles
UPDATE contribuciones_proyectos 
SET 
    monto_esperado = 1430.00,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 12;

COMMIT;

-- Paso 3: Verificar actualización
SELECT 
    id_contribucion,
    id_casa,
    monto_esperado,
    metadata_json->>'controles' as controles,
    LEFT(notas, 50) as notas_preview,
    estado
FROM contribuciones_proyectos
WHERE id_proyecto = 4
ORDER BY id_casa;

-- Paso 4: Verificar suma total
SELECT 
    COUNT(*) as total_casas,
    SUM(monto_esperado) as total_esperado,
    SUM((metadata_json->>'controles')::int) as total_controles
FROM contribuciones_proyectos
WHERE id_proyecto = 4;

-- Resultado esperado:
-- total_casas: 10
-- total_esperado: 15050.00
-- total_controles: 23 (8 casas con 2 + 1 casa con 3 + 1 casa con 4 = 16+3+4=23)

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
-- Casas con 2 controles (Q1,430.00): 1, 2, 5, 6, 7, 8, 11, 12 (8 casas)
-- Casas con 3 controles (Q1,680.00): 9 (1 casa)
-- Casas con 4 controles (Q1,930.00): 10 (1 casa)
-- 
-- Distribución de costos:
-- 8 × Q1,430.00 = Q11,440.00
-- 1 × Q1,680.00 = Q 1,680.00
-- 1 × Q1,930.00 = Q 1,930.00
-- -------------------------
-- TOTAL         = Q15,050.00 ✓
-- ============================================================================
