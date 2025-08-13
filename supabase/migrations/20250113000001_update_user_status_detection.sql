-- ===============================================
-- MIGRACIÓN: Actualizar detección de estado de usuario
-- Fecha: 2025-01-13
-- Descripción: Actualiza get_users_with_permissions para detectar usuarios banned
-- ===============================================

-- Borrar la función existente para evitar conflicto de tipos
DROP FUNCTION IF EXISTS get_users_with_permissions();

-- Actualizar función para detectar estado real del usuario
CREATE OR REPLACE FUNCTION get_users_with_permissions()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  permissions_count BIGINT,
  is_active BOOLEAN,
  is_banned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at,
    COALESCE(p.permissions_count, 0) as permissions_count,
    CASE 
      WHEN u.email_confirmed_at IS NOT NULL THEN true
      ELSE false
    END as is_active,
    CASE 
      WHEN u.banned_until IS NOT NULL AND u.banned_until::timestamp > NOW() THEN true
      ELSE false
    END as is_banned
  FROM auth.users u
  LEFT JOIN (
    SELECT 
      up.user_id,
      COUNT(*) as permissions_count
    FROM user_permissions up
    WHERE up.is_active = true
    GROUP BY up.user_id
  ) p ON u.id = p.user_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos
GRANT EXECUTE ON FUNCTION get_users_with_permissions() TO authenticated;

-- Comentario
COMMENT ON FUNCTION get_users_with_permissions() IS 'Obtiene todos los usuarios con conteo de permisos y estado de ban actualizado';

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================
