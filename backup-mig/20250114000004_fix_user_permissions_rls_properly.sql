-- ===============================================
-- MIGRACIÓN: Corregir RLS de user_permissions CORRECTAMENTE
-- Fecha: 2025-01-14
-- Descripción: Soluciona el problema crítico de seguridad causado por deshabilitar RLS
-- ===============================================

-- PROBLEMA IDENTIFICADO:
-- La migración anterior (20250114000003) deshabilitó RLS en user_permissions
-- esto es un grave problema de seguridad y causa problemas en las políticas de companies

-- SOLUCIÓN:
-- 1. Re-habilitar RLS en user_permissions
-- 2. Crear políticas RLS que NO dependan de funciones circulares
-- 3. Asegurar que las funciones helper funcionen correctamente

-- ===============================================
-- PASO 1: Re-habilitar RLS en user_permissions
-- ===============================================

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- PASO 2: Recrear funciones helper SIN dependencias circulares
-- ===============================================

-- Función has_permission con SECURITY DEFINER para bypass de RLS
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, table_name_param TEXT, action_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN := false;
BEGIN
  -- SECURITY DEFINER permite ejecutar esta consulta sin restricciones RLS
  -- Verificamos directamente en las tablas sin depender de políticas RLS
  SELECT EXISTS (
    SELECT 1
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = user_uuid
      AND p.table_name = table_name_param
      AND p.action = action_param
      AND up.is_active = true
      AND p.is_active = true
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Un super admin tiene permisos de 'create' y 'delete' en 'user_permissions'
  RETURN has_permission(user_uuid, 'user_permissions', 'create') AND 
         has_permission(user_uuid, 'user_permissions', 'delete');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función my_permissions
CREATE OR REPLACE FUNCTION my_permissions()
RETURNS TABLE (
  table_name TEXT,
  action TEXT,
  description TEXT,
  granted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- SECURITY DEFINER permite acceso directo sin restricciones RLS
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

-- ===============================================
-- PASO 3: Crear políticas RLS para user_permissions SIN recursión
-- ===============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "view_user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "create_user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "update_user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "delete_user_permissions" ON user_permissions;

-- Nueva política para SELECT: más simple, sin recursión
CREATE POLICY "view_user_permissions" ON user_permissions
  FOR SELECT TO authenticated
  USING (
    -- Los usuarios pueden ver sus propios permisos
    user_id = auth.uid()
    OR
    -- Los usuarios con permiso explícito pueden ver otros permisos
    -- Usamos una subconsulta directa sin funciones para evitar recursión
    EXISTS (
      SELECT 1 
      FROM user_permissions up2 
      JOIN permissions p2 ON up2.permission_id = p2.id
      WHERE up2.user_id = auth.uid()
        AND p2.table_name = 'user_permissions'
        AND p2.action = 'view'
        AND up2.is_active = true
        AND p2.is_active = true
    )
  );

-- Política para INSERT: solo quien puede crear permisos
CREATE POLICY "create_user_permissions" ON user_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM user_permissions up 
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.table_name = 'user_permissions'
        AND p.action = 'create'
        AND up.is_active = true
        AND p.is_active = true
    )
  );

-- Política para UPDATE: solo quien puede editar permisos
CREATE POLICY "update_user_permissions" ON user_permissions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM user_permissions up 
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.table_name = 'user_permissions'
        AND p.action = 'edit'
        AND up.is_active = true
        AND p.is_active = true
    )
  );

-- Política para DELETE: solo quien puede eliminar permisos
CREATE POLICY "delete_user_permissions" ON user_permissions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM user_permissions up 
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = auth.uid()
        AND p.table_name = 'user_permissions'
        AND p.action = 'delete'
        AND up.is_active = true
        AND p.is_active = true
    )
  );

-- ===============================================
-- PASO 4: Asegurar que las políticas de companies funcionen
-- ===============================================

-- Las políticas de companies ya están bien definidas, pero vamos a confirmar
-- que usen la función has_permission correctamente

-- Eliminar y recrear las políticas de companies para asegurar consistencia
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

-- Política para SELECT companies: usa la función has_permission
CREATE POLICY "companies_select_policy" ON companies
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'companies', 'view'));

-- Política para INSERT companies: usa la función has_permission
CREATE POLICY "companies_insert_policy" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'companies', 'create'));

-- Política para UPDATE companies: usa la función has_permission
CREATE POLICY "companies_update_policy" ON companies
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'companies', 'edit'))
  WITH CHECK (has_permission(auth.uid(), 'companies', 'edit'));

-- Política para DELETE companies: usa la función has_permission
CREATE POLICY "companies_delete_policy" ON companies
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'companies', 'delete'));

-- ===============================================
-- PASO 5: Verificar permisos de ejecución
-- ===============================================

-- Asegurar que las funciones tengan los permisos correctos
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION my_permissions() TO authenticated;

-- ===============================================
-- PASO 6: Comentarios para documentación
-- ===============================================

COMMENT ON FUNCTION has_permission(UUID, TEXT, TEXT) IS 'Verifica si un usuario tiene un permiso específico - SECURITY DEFINER para evitar problemas de RLS circular - CORREGIDO';
COMMENT ON FUNCTION is_super_admin(UUID) IS 'Verifica si un usuario es super administrador - SECURITY DEFINER - CORREGIDO';
COMMENT ON FUNCTION my_permissions() IS 'Obtiene los permisos del usuario actual - SECURITY DEFINER - CORREGIDO';

-- ===============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ===============================================

-- Script de verificación que se puede ejecutar después de la migración:
/*
-- Verificar que RLS está habilitado en user_permissions:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_permissions';

-- Verificar que las políticas existen:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_permissions', 'companies');

-- Probar las funciones:
SELECT has_permission(auth.uid(), 'companies', 'view');
SELECT * FROM my_permissions();
*/

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================
