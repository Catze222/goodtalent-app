-- ===============================================
-- MIGRACIÓN SISTEMA DE ESTADOS - GOOD Talent
-- Fecha: 2025-01-15
-- Descripción: Agrega sistema de aprobación y estados de vigencia para contratos
-- ===============================================

-- ===============================================
-- 1. AGREGAR COLUMNAS DE ESTADO
-- ===============================================

-- Agregar columna de estado de aprobación
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS status_aprobacion TEXT DEFAULT 'borrador'
CHECK (status_aprobacion IN ('borrador', 'aprobado'));

-- Agregar columna para fecha de aprobación (auditoría)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL;

-- Agregar columna para usuario que aprobó (auditoría)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS approved_by UUID NULL;

-- ===============================================
-- 2. FUNCIÓN PARA CALCULAR STATUS DE VIGENCIA
-- ===============================================

CREATE OR REPLACE FUNCTION calculate_contract_status_vigencia(fecha_fin DATE)
RETURNS TEXT AS $$
BEGIN
  -- Si no hay fecha de fin (contrato indefinido), siempre es activo
  IF fecha_fin IS NULL THEN
    RETURN 'activo';
  -- Si la fecha de fin ya pasó, está terminado
  ELSIF fecha_fin <= CURRENT_DATE THEN
    RETURN 'terminado';
  -- Si la fecha de fin es futura, está activo
  ELSE
    RETURN 'activo';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===============================================
-- 3. FUNCIÓN PARA APROBAR CONTRATO
-- ===============================================

CREATE OR REPLACE FUNCTION approve_contract(
  contract_id UUID,
  approver_user_id UUID
) RETURNS JSON AS $$
DECLARE
  contract_record RECORD;
  result JSON;
BEGIN
  -- Verificar que el contrato existe y está en borrador
  SELECT * INTO contract_record
  FROM contracts 
  WHERE id = contract_id AND status_aprobacion = 'borrador';
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'Contrato no encontrado o ya está aprobado'
    );
  END IF;
  
  -- Verificar que el usuario tiene permisos (esto se valida en RLS, pero agregamos verificación extra)
  IF NOT has_permission(approver_user_id, 'contracts', 'edit') THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'No tienes permisos para aprobar contratos'
    );
  END IF;
  
  -- Aprobar el contrato
  UPDATE contracts 
  SET 
    status_aprobacion = 'aprobado',
    approved_at = NOW(),
    approved_by = approver_user_id,
    updated_at = NOW(),
    updated_by = approver_user_id
  WHERE id = contract_id;
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'message', 'Contrato aprobado exitosamente',
    'approved_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 4. FUNCIÓN HELPER PARA OBTENER ESTADO COMPLETO
-- ===============================================

CREATE OR REPLACE FUNCTION get_contract_full_status(contract_row contracts)
RETURNS JSON AS $$
BEGIN
  RETURN JSON_BUILD_OBJECT(
    'status_aprobacion', contract_row.status_aprobacion,
    'status_vigencia', calculate_contract_status_vigencia(contract_row.fecha_fin),
    'can_edit', CASE 
      WHEN contract_row.status_aprobacion = 'borrador' THEN true 
      ELSE false 
    END,
    'can_delete', CASE 
      WHEN contract_row.status_aprobacion = 'borrador' THEN true 
      ELSE false 
    END,
    'can_approve', CASE 
      WHEN contract_row.status_aprobacion = 'borrador' THEN true 
      ELSE false 
    END,
    'days_until_expiry', CASE
      WHEN contract_row.fecha_fin IS NULL THEN NULL
      WHEN contract_row.fecha_fin <= CURRENT_DATE THEN 0
      ELSE EXTRACT(DAYS FROM contract_row.fecha_fin - CURRENT_DATE)::INTEGER
    END
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===============================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ===============================================

-- Índice para filtrar por estado de aprobación
CREATE INDEX IF NOT EXISTS idx_contracts_status_aprobacion 
ON contracts(status_aprobacion);

-- Índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_contracts_status_fecha_fin 
ON contracts(status_aprobacion, fecha_fin);

-- Índice para auditoría de aprobaciones
CREATE INDEX IF NOT EXISTS idx_contracts_approved_by 
ON contracts(approved_by) WHERE approved_by IS NOT NULL;

-- ===============================================
-- 6. FOREIGN KEYS PARA AUDITORÍA
-- ===============================================

-- FK para usuario que aprobó
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_contracts_approved_by'
  ) THEN
    ALTER TABLE contracts 
    ADD CONSTRAINT fk_contracts_approved_by 
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===============================================
-- 7. MIGRAR DATOS EXISTENTES
-- ===============================================

-- Todos los contratos existentes se consideran aprobados
-- (asumiendo que los datos actuales ya están en uso)
UPDATE contracts 
SET 
  status_aprobacion = 'aprobado',
  approved_at = created_at,
  approved_by = created_by
WHERE status_aprobacion = 'borrador';

-- ===============================================
-- 8. PERMISOS Y GRANTS
-- ===============================================

-- Dar permisos de ejecución a las funciones
GRANT EXECUTE ON FUNCTION calculate_contract_status_vigencia(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_contract(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contract_full_status(contracts) TO authenticated;

-- ===============================================
-- 9. COMENTARIOS PARA DOCUMENTACIÓN
-- ===============================================

COMMENT ON COLUMN contracts.status_aprobacion IS 'Estado de aprobación: borrador (editable) o aprobado (solo lectura)';
COMMENT ON COLUMN contracts.approved_at IS 'Fecha y hora de aprobación del contrato';
COMMENT ON COLUMN contracts.approved_by IS 'Usuario que aprobó el contrato';

COMMENT ON FUNCTION calculate_contract_status_vigencia(DATE) IS 'Calcula si un contrato está activo o terminado basado en fecha_fin';
COMMENT ON FUNCTION approve_contract(UUID, UUID) IS 'Función segura para aprobar un contrato en estado borrador';
COMMENT ON FUNCTION get_contract_full_status(contracts) IS 'Retorna estado completo del contrato con flags de permisos';

-- ===============================================
-- 10. VERIFICACIÓN DE LA MIGRACIÓN
-- ===============================================

DO $$
BEGIN
  -- Verificar que las columnas existen
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'status_aprobacion') THEN
    RAISE NOTICE 'SUCCESS: Columna status_aprobacion agregada correctamente';
  ELSE
    RAISE EXCEPTION 'ERROR: Columna status_aprobacion no existe';
  END IF;
  
  -- Verificar que las funciones existen
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_contract_status_vigencia') THEN
    RAISE NOTICE 'SUCCESS: Función calculate_contract_status_vigencia creada correctamente';
  ELSE
    RAISE EXCEPTION 'ERROR: Función calculate_contract_status_vigencia no existe';
  END IF;
  
  RAISE NOTICE 'MIGRACIÓN COMPLETADA: Sistema de estados de contratos implementado exitosamente';
END $$;
