-- ===============================================
-- MIGRACIÓN: Arreglar conflicto de tipos en función get_users_with_permissions
-- Fecha: 2025-08-12
-- Descripción: Borra y recrea la función con los tipos correctos
-- ===============================================

-- Borrar la función existente para evitar conflicto de tipos
DROP FUNCTION IF EXISTS get_users_with_permissions();

-- Recrear la función con los tipos correctos
CREATE OR REPLACE FUNCTION get_users_with_permissions()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  permissions_count BIGINT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,  -- Casting explícito a TEXT
    u.created_at,
    u.email_confirmed_at,
    u.last_sign_in_at,
    COALESCE(p.permissions_count, 0) as permissions_count,
    CASE 
      WHEN u.email_confirmed_at IS NOT NULL THEN true
      ELSE false
    END as is_active
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
COMMENT ON FUNCTION get_users_with_permissions() IS 'Obtiene todos los usuarios con conteo de permisos (tipos corregidos)';

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================
