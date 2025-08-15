-- ===============================================
-- MIGRACIÓN: Helper para obtener "handle" (parte local del email) de un usuario
-- Fecha: 2025-08-13
-- Descripción: Expone función segura para obtener el texto antes de '@' del email
--               de un usuario dado su UUID. Útil para mostrar creador/editor.
-- ===============================================

CREATE OR REPLACE FUNCTION get_user_handle(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT u.email::TEXT INTO v_email
  FROM auth.users u
  WHERE u.id = user_uuid;

  IF v_email IS NULL OR position('@' IN v_email) = 0 THEN
    RETURN NULL;
  END IF;

  RETURN split_part(v_email, '@', 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_handle(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_handle(UUID) IS 'Retorna la parte local del email (antes de @) para un usuario dado';

-- ===============================================
-- FIN
-- ===============================================


