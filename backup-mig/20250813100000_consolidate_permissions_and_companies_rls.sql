-- ===============================================
-- MIGRACIÓN: Consolidación y corrección de RLS (permisos y companies)
-- Fecha: 2025-08-13
-- Descripción:
--   - Rehabilita RLS en user_permissions y recrea políticas seguras
--   - Re-crea funciones helper con SECURITY DEFINER (bypass de RLS)
--   - Re-crea políticas de companies basadas en has_permission()
--   - Asegura GRANTs necesarios para rol authenticated
--   - No elimina migraciones anteriores; deja el estado final consistente
-- ===============================================

-- Asegurar que RLS esté habilitado en tablas críticas
ALTER TABLE IF EXISTS user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- Funciones Helper (idempotentes)
-- ===============================================

CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, table_name_param TEXT, action_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = user_uuid
      AND p.table_name = table_name_param
      AND p.action = action_param
      AND up.is_active = true
      AND p.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_permission(user_uuid, 'user_permissions', 'create')
     AND has_permission(user_uuid, 'user_permissions', 'delete');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION my_permissions()
RETURNS TABLE (
  table_name TEXT,
  action TEXT,
  description TEXT,
  granted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.table_name,
    p.action,
    p.description,
    up.granted_at
  FROM user_permissions up
  JOIN permissions p ON up.permission_id = p.id
  WHERE up.user_id = auth.uid()
    AND up.is_active = true
    AND p.is_active = true
  ORDER BY p.table_name, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Versión corregida de get_users_with_permissions (mantener la más reciente)
DROP FUNCTION IF EXISTS get_users_with_permissions();
CREATE OR REPLACE FUNCTION get_users_with_permissions()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  permissions_count BIGINT,
  is_active BOOLEAN
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
    CASE WHEN u.email_confirmed_at IS NOT NULL THEN true ELSE false END AS is_active
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

CREATE OR REPLACE FUNCTION get_user_permissions(target_user_id UUID)
RETURNS TABLE (
  permission_id UUID,
  table_name TEXT,
  action TEXT,
  description TEXT,
  granted_at TIMESTAMPTZ,
  granted_by UUID,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.permission_id,
    p.table_name,
    p.action,
    p.description,
    up.granted_at,
    up.granted_by,
    up.is_active
  FROM user_permissions up
  JOIN permissions p ON up.permission_id = p.id
  WHERE up.user_id = target_user_id
  ORDER BY p.table_name, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION assign_permission_to_user(
  target_user_id UUID,
  target_permission_id UUID,
  assigned_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_permissions (user_id, permission_id, granted_by)
  VALUES (target_user_id, target_permission_id, assigned_by)
  ON CONFLICT (user_id, permission_id)
  DO UPDATE SET is_active = true, granted_at = NOW(), granted_by = assigned_by;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION revoke_permission_from_user(
  target_user_id UUID,
  target_permission_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_permissions
  SET is_active = false
  WHERE user_id = target_user_id AND permission_id = target_permission_id;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_super_admin(admin_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_permissions (user_id, permission_id, granted_by)
  SELECT admin_user_id, p.id, admin_user_id
  FROM permissions p
  WHERE p.is_active = true
  ON CONFLICT (user_id, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- Políticas RLS (recrear idempotente)
-- ===============================================

-- PERMISSIONS
DROP POLICY IF EXISTS "view_permissions" ON permissions;
DROP POLICY IF EXISTS "create_permissions" ON permissions;
DROP POLICY IF EXISTS "update_permissions" ON permissions;
DROP POLICY IF EXISTS "delete_permissions" ON permissions;

CREATE POLICY "view_permissions" ON permissions
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'permissions', 'view') OR is_super_admin(auth.uid()));

CREATE POLICY "create_permissions" ON permissions
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "update_permissions" ON permissions
  FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "delete_permissions" ON permissions
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()));

-- USER_PERMISSIONS
DROP POLICY IF EXISTS "view_user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "create_user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "update_user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "delete_user_permissions" ON user_permissions;

CREATE POLICY "view_user_permissions" ON user_permissions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_permission(auth.uid(), 'user_permissions', 'view')
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "create_user_permissions" ON user_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid(), 'user_permissions', 'create')
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "update_user_permissions" ON user_permissions
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid(), 'user_permissions', 'edit')
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "delete_user_permissions" ON user_permissions
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid(), 'user_permissions', 'delete')
    OR is_super_admin(auth.uid())
  );

-- COMPANIES
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

CREATE POLICY "companies_select_policy" ON companies
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'companies', 'view'));

CREATE POLICY "companies_insert_policy" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'companies', 'create'));

CREATE POLICY "companies_update_policy" ON companies
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'companies', 'edit'))
  WITH CHECK (has_permission(auth.uid(), 'companies', 'edit'));

CREATE POLICY "companies_delete_policy" ON companies
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'companies', 'delete'));

-- ===============================================
-- GRANTs
-- ===============================================

GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION my_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_permission_to_user(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_permission_from_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_super_admin(UUID) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO authenticated;

-- ===============================================
-- Comentarios
-- ===============================================

COMMENT ON FUNCTION has_permission(UUID, TEXT, TEXT) IS 'Verifica si un usuario tiene un permiso específico (SECURITY DEFINER)';
COMMENT ON FUNCTION is_super_admin(UUID) IS 'Determina si el usuario es super admin (basado en permisos de user_permissions)';
COMMENT ON FUNCTION my_permissions() IS 'Lista los permisos activos del usuario actual (bypass RLS)';
COMMENT ON FUNCTION get_users_with_permissions() IS 'Usuarios con conteo de permisos (tipos consistentes)';

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================


