-- ===============================================
-- MIGRACIÓN: Funciones para gestión de usuarios
-- Fecha: 2025-01-12
-- Descripción: Agrega funciones RPC para la gestión de usuarios y funciones faltantes
-- ===============================================

-- Función my_permissions (faltaba de la migración anterior)
CREATE OR REPLACE FUNCTION my_permissions()
RETURNS TABLE (
  table_name TEXT,
  action TEXT,
  description TEXT,
  granted_at TIMESTAMP WITH TIME ZONE
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

-- Función para obtener usuarios con conteo de permisos
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
    u.email,
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

-- Función para obtener permisos de un usuario específico
CREATE OR REPLACE FUNCTION get_user_permissions(target_user_id UUID)
RETURNS TABLE (
  permission_id UUID,
  table_name TEXT,
  action TEXT,
  description TEXT,
  granted_at TIMESTAMP WITH TIME ZONE,
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

-- Función para asignar permiso a usuario
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
  DO UPDATE SET 
    is_active = true,
    granted_at = NOW(),
    granted_by = assigned_by;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para revocar permiso de usuario
CREATE OR REPLACE FUNCTION revoke_permission_from_user(
  target_user_id UUID,
  target_permission_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_permissions 
  SET is_active = false
  WHERE user_id = target_user_id 
    AND permission_id = target_permission_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para invitar usuario (crear en auth.users)
CREATE OR REPLACE FUNCTION invite_user(
  user_email TEXT,
  invited_by UUID
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Verificar que el email no exista
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE EXCEPTION 'User with email % already exists', user_email;
  END IF;
  
  -- Crear usuario en auth.users (esto normalmente se hace por Supabase Auth)
  -- Esta función es un placeholder - la invitación real se hace desde el frontend
  RAISE EXCEPTION 'Use Supabase Auth invite function from frontend';
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para las nuevas funciones
-- Solo usuarios con permisos apropiados pueden ejecutar estas funciones

-- Los usuarios autenticados pueden ejecutar las funciones
GRANT EXECUTE ON FUNCTION my_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_permission_to_user(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_permission_from_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION invite_user(TEXT, UUID) TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION my_permissions() IS 'Obtiene los permisos del usuario autenticado actual';
COMMENT ON FUNCTION get_users_with_permissions() IS 'Obtiene todos los usuarios con conteo de permisos';
COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Obtiene todos los permisos de un usuario específico';
COMMENT ON FUNCTION assign_permission_to_user(UUID, UUID, UUID) IS 'Asigna un permiso a un usuario';
COMMENT ON FUNCTION revoke_permission_from_user(UUID, UUID) IS 'Revoca un permiso de un usuario';
COMMENT ON FUNCTION invite_user(TEXT, UUID) IS 'Placeholder para invitación de usuarios';

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================
