-- ===============================================
-- MIGRACIÓN: Actualizar get_users_with_permissions para incluir is_banned
-- Fecha: 2025-08-14
-- Descripción: Restaura el campo is_banned y ajusta is_active para considerar usuarios baneados.
-- ===============================================

DROP FUNCTION IF EXISTS get_users_with_permissions();

CREATE OR REPLACE FUNCTION get_users_with_permissions()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
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
    COALESCE(p.permissions_count, 0) AS permissions_count,
    CASE 
      WHEN u.email_confirmed_at IS NOT NULL 
       AND (u.banned_until IS NULL OR u.banned_until::timestamp <= NOW())
      THEN true
      ELSE false
    END AS is_active,
    CASE 
      WHEN u.banned_until IS NOT NULL AND u.banned_until::timestamp > NOW() THEN true
      ELSE false
    END AS is_banned
  FROM auth.users u
  LEFT JOIN (
    SELECT up.user_id, COUNT(*) AS permissions_count
    FROM user_permissions up
    WHERE up.is_active = true
    GROUP BY up.user_id
  ) p ON u.id = p.user_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_users_with_permissions() TO authenticated;

COMMENT ON FUNCTION get_users_with_permissions() IS 'Usuarios con conteo de permisos, estado activo (no baneado) y bandera is_banned';

-- ===============================================
-- FIN
-- ===============================================


