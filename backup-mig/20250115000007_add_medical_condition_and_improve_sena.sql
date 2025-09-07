-- Migration: Add medical condition fields and improve SENA handling
-- Description: Adds medical condition tracking and updates SENA default behavior

-- Add new medical condition fields
ALTER TABLE contracts 
ADD COLUMN tiene_condicion_medica BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN condicion_medica_detalle TEXT;

-- Update existing contracts to have base_sena as true by default
UPDATE contracts 
SET base_sena = TRUE 
WHERE base_sena IS NULL OR base_sena = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN contracts.tiene_condicion_medica IS 'Indica si el empleado tiene alguna condición médica especial';
COMMENT ON COLUMN contracts.condicion_medica_detalle IS 'Descripción detallada de la condición médica (solo si tiene_condicion_medica es true)';
COMMENT ON COLUMN contracts.base_sena IS 'Indica si el empleado aporta al SENA. Por defecto TRUE, excepto para conductores, aprendices, extranjeros, dirección/confianza y manejo';
