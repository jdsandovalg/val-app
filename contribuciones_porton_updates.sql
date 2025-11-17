-- Actualización de contribuciones proyecto 4
-- Total: Q15,050.00
-- Registros: 10

BEGIN;

-- Casa 1 - 2 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1430.0,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 1;

-- Casa 2 - 2 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1430.0,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 2;

-- Casa 5 - 2 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1430.0,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 5;

-- Casa 6 - 2 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1430.0,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 6;

-- Casa 7 - 2 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1430.0,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 7;

-- Casa 8 - 2 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1430.0,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 8;

-- Casa 9 - 3 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1680.0,
    metadata_json = '{"controles": 3, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 3 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 9;

-- Casa 10 - 4 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1930.0,
    metadata_json = '{"controles": 4, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 4 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 10;

-- Casa 11 - 2 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1430.0,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 11;

-- Casa 12 - 2 controles
UPDATE contribuciones_proyectos
SET
    monto_esperado = 1430.0,
    metadata_json = '{"controles": 2, "proyecto": "AUTOMATIZACION DEL PORTON CONDOMINIO"}'::jsonb,
    notas = 'CONTRIBUCION RECIBIDA POR AUTOMATIZACION DEL PORTON - 2 controles remotos'
WHERE id_proyecto = 4 AND id_casa = 12;

COMMIT;
