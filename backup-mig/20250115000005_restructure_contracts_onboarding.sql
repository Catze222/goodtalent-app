-- ===============================================
-- MIGRACIÓN RESTRUCTURACIÓN ONBOARDING CONTRACTS
-- Fecha: 2025-01-15
-- Descripción: Eliminar género, agregar auxilio_transporte y reestructurar onboarding con campos de texto y fechas
-- ===============================================

-- ===============================================
-- 1. ELIMINAR COLUMNA GÉNERO
-- ===============================================

-- Eliminar constraint de género primero
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_genero_check;

-- Eliminar columna género
ALTER TABLE contracts DROP COLUMN IF EXISTS genero;

-- ===============================================
-- 2. AGREGAR AUXILIO DE TRANSPORTE EN DETALLES DEL CONTRATO
-- ===============================================

-- Agregar auxilio de transporte
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS auxilio_transporte NUMERIC(14,2) DEFAULT 0 CHECK (auxilio_transporte >= 0);

-- ===============================================
-- 3. AGREGAR NUEVAS COLUMNAS DE ONBOARDING - INFORMACIÓN ADICIONAL
-- ===============================================

-- ARL - Cambiar radicado a texto y agregar nombre y fecha
ALTER TABLE contracts ALTER COLUMN radicado_eps TYPE TEXT USING CASE WHEN radicado_eps THEN 'Pendiente' ELSE NULL END;
ALTER TABLE contracts ALTER COLUMN radicado_ccf TYPE TEXT USING CASE WHEN radicado_ccf THEN 'Pendiente' ELSE NULL END;

-- Agregar nuevas columnas para información detallada
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS arl_nombre TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS arl_fecha_confirmacion DATE;

-- Fechas de confirmación para procesos existentes
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS examenes_fecha DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contrato_fecha_confirmacion DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS eps_fecha_confirmacion DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS caja_fecha_confirmacion DATE;

-- Nuevas columnas para CESANTÍAS
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS solicitud_cesantias BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS fondo_cesantias TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS cesantias_fecha_confirmacion DATE;

-- Nuevas columnas para FONDO DE PENSIÓN
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS solicitud_fondo_pension BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS fondo_pension TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS pension_fecha_confirmacion DATE;

-- ===============================================
-- 4. ACTUALIZAR FUNCIÓN DE PROGRESO DE ONBOARDING
-- ===============================================

-- Actualizar función para incluir nuevos campos en el cálculo
CREATE OR REPLACE FUNCTION contracts_onboarding_progress(c contracts)
RETURNS INTEGER AS $$
  SELECT ROUND(
    (
      CASE WHEN c.programacion_cita_examenes THEN 1 ELSE 0 END +
      CASE WHEN c.examenes THEN 1 ELSE 0 END +
      CASE WHEN c.solicitud_inscripcion_arl THEN 1 ELSE 0 END +
      CASE WHEN c.inscripcion_arl THEN 1 ELSE 0 END +
      CASE WHEN c.envio_contrato THEN 1 ELSE 0 END +
      CASE WHEN c.recibido_contrato_firmado THEN 1 ELSE 0 END +
      CASE WHEN c.solicitud_eps THEN 1 ELSE 0 END +
      CASE WHEN c.confirmacion_eps THEN 1 ELSE 0 END +
      CASE WHEN c.envio_inscripcion_caja THEN 1 ELSE 0 END +
      CASE WHEN c.confirmacion_inscripcion_caja THEN 1 ELSE 0 END +
      CASE WHEN c.radicado_eps IS NOT NULL AND c.radicado_eps != '' THEN 1 ELSE 0 END +
      CASE WHEN c.radicado_ccf IS NOT NULL AND c.radicado_ccf != '' THEN 1 ELSE 0 END +
      CASE WHEN c.solicitud_cesantias THEN 1 ELSE 0 END +
      CASE WHEN c.solicitud_fondo_pension THEN 1 ELSE 0 END
    ) * 100.0 / 14
  )::INTEGER
$$ LANGUAGE sql STABLE;

-- ===============================================
-- 5. COMENTARIOS PARA DOCUMENTACIÓN
-- ===============================================

COMMENT ON COLUMN contracts.auxilio_transporte IS 'Auxilio de transporte mensual';
COMMENT ON COLUMN contracts.arl_nombre IS 'Nombre de la ARL seleccionada';
COMMENT ON COLUMN contracts.arl_fecha_confirmacion IS 'Fecha de confirmación de inscripción ARL';
COMMENT ON COLUMN contracts.examenes_fecha IS 'Fecha de realización de exámenes médicos';
COMMENT ON COLUMN contracts.contrato_fecha_confirmacion IS 'Fecha de confirmación de contrato firmado';
COMMENT ON COLUMN contracts.eps_fecha_confirmacion IS 'Fecha de confirmación EPS';
COMMENT ON COLUMN contracts.caja_fecha_confirmacion IS 'Fecha de confirmación caja de compensación';
COMMENT ON COLUMN contracts.solicitud_cesantias IS 'Solicitud de cesantías realizada';
COMMENT ON COLUMN contracts.fondo_cesantias IS 'Nombre del fondo de cesantías';
COMMENT ON COLUMN contracts.cesantias_fecha_confirmacion IS 'Fecha de confirmación cesantías';
COMMENT ON COLUMN contracts.solicitud_fondo_pension IS 'Solicitud de fondo de pensión realizada';
COMMENT ON COLUMN contracts.fondo_pension IS 'Nombre del fondo de pensión';
COMMENT ON COLUMN contracts.pension_fecha_confirmacion IS 'Fecha de confirmación fondo de pensión';

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================
