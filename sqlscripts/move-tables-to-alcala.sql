-- ==========================================
-- REVERTIR TODO A PUBLIC
-- Villas de Alcala App
-- Fecha: 09-Abr-2026
-- ==========================================

-- ==========================================
-- 1. MOVER TODAS LAS TABLAS DE ALCALA A PUBLIC
-- ==========================================

ALTER TABLE alcala.contribuciones SET SCHEMA public;
ALTER TABLE alcala.contribuciones_proyectos SET SCHEMA public;
ALTER TABLE alcala.contribucionesporcasa SET SCHEMA public;
ALTER TABLE alcala.contribucionesporcasa_duplicate SET SCHEMA public;
ALTER TABLE alcala.empresas SET SCHEMA public;
ALTER TABLE alcala.grupos SET SCHEMA public;
ALTER TABLE alcala.grupos_mantenimiento SET SCHEMA public;
ALTER TABLE alcala.liquidacion_de_gastos SET SCHEMA public;
ALTER TABLE alcala.logs SET SCHEMA public;
ALTER TABLE alcala.nits SET SCHEMA public;
ALTER TABLE alcala.programa_mantenimiento SET SCHEMA public;
ALTER TABLE alcala.proyecto_evidencias SET SCHEMA public;
ALTER TABLE alcala.proyecto_rubros SET SCHEMA public;
ALTER TABLE alcala.proyecto_votos SET SCHEMA public;
ALTER TABLE alcala.proyectos SET SCHEMA public;
ALTER TABLE alcala.rubro_categorias SET SCHEMA public;
ALTER TABLE alcala.rubros SET SCHEMA public;
ALTER TABLE alcala.tipos_proyecto SET SCHEMA public;
ALTER TABLE alcala.usuarios SET SCHEMA public;
ALTER TABLE alcala.votos_proyectos SET SCHEMA public;

-- ==========================================
-- 2. MOVER VISTAS DE ALCALA A PUBLIC
-- ==========================================
ALTER VIEW alcala.v_usuarios_contribuciones SET SCHEMA public;
ALTER VIEW alcala.v_contribuciones_detalle SET SCHEMA public;

-- ==========================================
-- 3. VERIFICAR QUE TODO ESTÁ EN PUBLIC
-- ==========================================
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema IN ('public', 'alcala')
AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
