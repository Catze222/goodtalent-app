-- ===============================================
-- MIGRACIÓN: Hacer nullable el número de contrato
-- Fecha: 2025-01-15
-- Descripción: Permite que numero_contrato_helisa sea NULL hasta la aprobación
-- ===============================================

-- Simplemente hacer que la columna pueda ser NULL
ALTER TABLE contracts 
ALTER COLUMN numero_contrato_helisa DROP NOT NULL;

-- Limpiar números temporales existentes si los hay
UPDATE contracts 
SET numero_contrato_helisa = NULL 
WHERE numero_contrato_helisa LIKE 'TEMP-%';

-- Actualizar función de aprobación para aceptar número de contrato
CREATE OR REPLACE FUNCTION approve_contract(
  contract_id UUID,
  approver_user_id UUID,
  contract_number TEXT DEFAULT NULL
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
  
  -- Verificar que el usuario tiene permisos
  IF NOT has_permission(approver_user_id, 'contracts', 'edit') THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'No tienes permisos para aprobar contratos'
    );
  END IF;
  
  -- Si se proporciona número de contrato, verificar que no exista y actualizarlo
  IF contract_number IS NOT NULL AND trim(contract_number) != '' THEN
    IF EXISTS (SELECT 1 FROM contracts WHERE numero_contrato_helisa = contract_number AND id != contract_id) THEN
      RETURN JSON_BUILD_OBJECT(
        'success', false,
        'error', 'Ya existe un contrato con ese número'
      );
    END IF;
    
    -- Actualizar el número de contrato
    UPDATE contracts 
    SET numero_contrato_helisa = contract_number
    WHERE id = contract_id;
  END IF;
  
  -- Verificar que ahora tiene número de contrato
  SELECT numero_contrato_helisa INTO contract_number 
  FROM contracts 
  WHERE id = contract_id;
  
  IF contract_number IS NULL OR trim(contract_number) = '' THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'error', 'Debe proporcionar un número de contrato para aprobar'
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
    'approved_at', NOW(),
    'contract_number', contract_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION approve_contract(UUID, UUID, TEXT) TO authenticated;

-- Verificación
DO $$
BEGIN
  RAISE NOTICE 'MIGRACIÓN COMPLETADA: numero_contrato_helisa ahora es nullable y función actualizada';
END $$;
