-- ===============================================
-- MIGRACIÓN: Agregar fecha de expedición del documento
-- Fecha: 2025-01-15
-- Descripción: Agregar columna fecha_expedicion_documento a la tabla contracts
-- ===============================================

-- ===============================================
-- 1. AGREGAR COLUMNA FECHA_EXPEDICION_DOCUMENTO
-- ===============================================

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS fecha_expedicion_documento DATE;

-- ===============================================
-- 2. COMENTARIO PARA DOCUMENTACIÓN
-- ===============================================

COMMENT ON COLUMN contracts.fecha_expedicion_documento IS 'Fecha de expedición del documento de identificación';

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================
