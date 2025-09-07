-- ===============================================
-- MIGRACIÓN SIMPLIFICACIÓN ONBOARDING - ELIMINAR CONFIRMACIONES REDUNDANTES
-- Fecha: 2025-01-15
-- Descripción: Eliminar columnas de confirmación redundantes y simplificar estructura
-- ===============================================

-- ===============================================
-- 1. ELIMINAR COLUMNAS DE CONFIRMACIÓN REDUNDANTES
-- ===============================================

-- Eliminar columnas de confirmación que son redundantes con la información de fechas/textos
ALTER TABLE contracts DROP COLUMN IF EXISTS inscripcion_arl;
ALTER TABLE contracts DROP COLUMN IF EXISTS confirmacion_eps;
ALTER TABLE contracts DROP COLUMN IF EXISTS confirmacion_inscripcion_caja;

-- NOTA: No eliminamos solicitud_cesantias y solicitud_fondo_pension porque son las únicas
-- columnas que representan estos procesos. La confirmación se infiere por la presencia
-- de fondo_cesantias + cesantias_fecha_confirmacion y fondo_pension + pension_fecha_confirmacion

-- ===============================================
-- 2. ACTUALIZAR FUNCIÓN DE PROGRESO DE ONBOARDING
-- ===============================================

-- Actualizar función para calcular confirmaciones basado en presencia de datos
CREATE OR REPLACE FUNCTION contracts_onboarding_progress(c contracts)
RETURNS INTEGER AS $$
  SELECT ROUND(
    (
      -- Exámenes médicos (2 pasos)
      CASE WHEN c.programacion_cita_examenes THEN 1 ELSE 0 END +
      CASE WHEN c.examenes AND c.examenes_fecha IS NOT NULL THEN 1 ELSE 0 END +
      
      -- Contratos (2 pasos)
      CASE WHEN c.envio_contrato THEN 1 ELSE 0 END +
      CASE WHEN c.recibido_contrato_firmado AND c.contrato_fecha_confirmacion IS NOT NULL THEN 1 ELSE 0 END +
      
      -- ARL (2 pasos)
      CASE WHEN c.solicitud_inscripcion_arl THEN 1 ELSE 0 END +
      CASE WHEN c.arl_nombre IS NOT NULL AND c.arl_nombre != '' AND c.arl_fecha_confirmacion IS NOT NULL THEN 1 ELSE 0 END +
      
      -- EPS (2 pasos)
      CASE WHEN c.solicitud_eps THEN 1 ELSE 0 END +
      CASE WHEN c.radicado_eps IS NOT NULL AND c.radicado_eps != '' AND c.eps_fecha_confirmacion IS NOT NULL THEN 1 ELSE 0 END +
      
      -- Caja de Compensación (2 pasos)
      CASE WHEN c.envio_inscripcion_caja THEN 1 ELSE 0 END +
      CASE WHEN c.radicado_ccf IS NOT NULL AND c.radicado_ccf != '' AND c.caja_fecha_confirmacion IS NOT NULL THEN 1 ELSE 0 END +
      
      -- Cesantías (1 paso - confirmación se infiere por datos)
      CASE WHEN c.solicitud_cesantias AND c.fondo_cesantias IS NOT NULL AND c.fondo_cesantias != '' AND c.cesantias_fecha_confirmacion IS NOT NULL THEN 1 ELSE 0 END +
      
      -- Fondo de Pensión (1 paso - confirmación se infiere por datos)
      CASE WHEN c.solicitud_fondo_pension AND c.fondo_pension IS NOT NULL AND c.fondo_pension != '' AND c.pension_fecha_confirmacion IS NOT NULL THEN 1 ELSE 0 END
      
    ) * 100.0 / 12  -- Total de 12 pasos
  )::INTEGER
$$ LANGUAGE sql STABLE;

-- ===============================================
-- 3. COMENTARIOS PARA DOCUMENTACIÓN
-- ===============================================

COMMENT ON FUNCTION contracts_onboarding_progress(contracts) IS 'Calcula el progreso de onboarding basado en presencia de datos (0-100%). Confirmaciones se infieren por datos completos.';

-- ===============================================
-- 4. VERIFICAR MIGRACIÓN
-- ===============================================

-- Verificar que las columnas fueron eliminadas correctamente
DO $$
BEGIN
    -- Verificar que las columnas de confirmación redundantes ya no existen
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name IN ('inscripcion_arl', 'confirmacion_eps', 'confirmacion_inscripcion_caja')
    ) THEN
        RAISE NOTICE 'ADVERTENCIA: Algunas columnas de confirmación no fueron eliminadas correctamente';
    ELSE
        RAISE NOTICE 'ÉXITO: Columnas de confirmación redundantes eliminadas correctamente';
    END IF;
    
    -- Verificar que las columnas principales siguen existiendo
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name IN (
            'solicitud_inscripcion_arl', 'arl_nombre', 'arl_fecha_confirmacion',
            'solicitud_eps', 'radicado_eps', 'eps_fecha_confirmacion',
            'envio_inscripcion_caja', 'radicado_ccf', 'caja_fecha_confirmacion',
            'solicitud_cesantias', 'fondo_cesantias', 'cesantias_fecha_confirmacion',
            'solicitud_fondo_pension', 'fondo_pension', 'pension_fecha_confirmacion'
        )
    ) THEN
        RAISE NOTICE 'ÉXITO: Todas las columnas principales de onboarding están presentes';
    ELSE
        RAISE NOTICE 'ERROR: Faltan columnas principales de onboarding';
    END IF;
END $$;

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================
