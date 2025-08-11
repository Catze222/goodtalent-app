-- ===============================================
-- MIGRACIÓN: Sistema de Permisos GOOD Talent
-- Fecha: 2025-01-12
-- Descripción: Crea tablas de permisos y user_permissions con RLS
-- ===============================================

-- 1. Crear tabla permissions si no existe
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_table_action UNIQUE(table_name, action)
);

-- 2. Crear tabla user_permissions si no existe
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_permission UNIQUE(user_id, permission_id)
);

-- 3. Agregar foreign keys si no existen
DO $$
BEGIN
  -- Foreign key para user_id a auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_permissions_user_id'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT fk_user_permissions_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Foreign key para permission_id a permissions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_permissions_permission_id'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT fk_user_permissions_permission_id 
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
  END IF;

  -- Foreign key para granted_by a auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_permissions_granted_by'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT fk_user_permissions_granted_by 
    FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Crear índices para optimizar rendimiento
CREATE INDEX IF NOT EXISTS idx_permissions_table_action ON permissions(table_name, action);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_active ON user_permissions(user_id, is_active);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Triggers para updated_at
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- RLS (Row Level Security)
-- ===============================================

-- 7. Habilitar RLS en ambas tablas
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- 8. Función helper para verificar si un usuario tiene un permiso específico
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

-- 9. Función para verificar si un usuario es super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Un super admin tiene permisos de 'create' y 'delete' en 'user_permissions'
  RETURN has_permission(user_uuid, 'user_permissions', 'create') AND 
         has_permission(user_uuid, 'user_permissions', 'delete');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- POLÍTICAS RLS
-- ===============================================

-- 10. Políticas para tabla PERMISSIONS

-- Ver permisos: Solo usuarios con permiso 'view' en 'permissions' o super admins
DROP POLICY IF EXISTS "view_permissions" ON permissions;
CREATE POLICY "view_permissions" ON permissions
  FOR SELECT
  USING (
    has_permission(auth.uid(), 'permissions', 'view') OR
    is_super_admin(auth.uid())
  );

-- Crear permisos: Solo super admins
DROP POLICY IF EXISTS "create_permissions" ON permissions;
CREATE POLICY "create_permissions" ON permissions
  FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

-- Actualizar permisos: Solo super admins
DROP POLICY IF EXISTS "update_permissions" ON permissions;
CREATE POLICY "update_permissions" ON permissions
  FOR UPDATE
  USING (is_super_admin(auth.uid()));

-- Eliminar permisos: Solo super admins
DROP POLICY IF EXISTS "delete_permissions" ON permissions;
CREATE POLICY "delete_permissions" ON permissions
  FOR DELETE
  USING (is_super_admin(auth.uid()));

-- 11. Políticas para tabla USER_PERMISSIONS

-- Ver asignaciones de permisos: Solo quien puede gestionar permisos de usuarios
DROP POLICY IF EXISTS "view_user_permissions" ON user_permissions;
CREATE POLICY "view_user_permissions" ON user_permissions
  FOR SELECT
  USING (
    has_permission(auth.uid(), 'user_permissions', 'view') OR
    is_super_admin(auth.uid()) OR
    user_id = auth.uid() -- Los usuarios pueden ver sus propios permisos
  );

-- Crear asignaciones de permisos: Solo quien puede crear permisos de usuarios
DROP POLICY IF EXISTS "create_user_permissions" ON user_permissions;
CREATE POLICY "create_user_permissions" ON user_permissions
  FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'user_permissions', 'create') OR
    is_super_admin(auth.uid())
  );

-- Actualizar asignaciones de permisos: Solo quien puede editar permisos de usuarios
DROP POLICY IF EXISTS "update_user_permissions" ON user_permissions;
CREATE POLICY "update_user_permissions" ON user_permissions
  FOR UPDATE
  USING (
    has_permission(auth.uid(), 'user_permissions', 'edit') OR
    is_super_admin(auth.uid())
  );

-- Eliminar asignaciones de permisos: Solo quien puede eliminar permisos de usuarios
DROP POLICY IF EXISTS "delete_user_permissions" ON user_permissions;
CREATE POLICY "delete_user_permissions" ON user_permissions
  FOR DELETE
  USING (
    has_permission(auth.uid(), 'user_permissions', 'delete') OR
    is_super_admin(auth.uid())
  );

-- ===============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ===============================================

COMMENT ON TABLE permissions IS 'Tabla que define todos los permisos disponibles en el sistema';
COMMENT ON COLUMN permissions.table_name IS 'Nombre de la tabla o módulo al que se aplica el permiso';
COMMENT ON COLUMN permissions.action IS 'Acción permitida: view, create, edit, delete, archive, etc.';
COMMENT ON COLUMN permissions.description IS 'Descripción legible del permiso para interfaces de usuario';

COMMENT ON TABLE user_permissions IS 'Tabla que asigna permisos específicos a usuarios';
COMMENT ON COLUMN user_permissions.user_id IS 'ID del usuario al que se asigna el permiso';
COMMENT ON COLUMN user_permissions.permission_id IS 'ID del permiso que se asigna';
COMMENT ON COLUMN user_permissions.granted_by IS 'ID del usuario que otorgó este permiso';
COMMENT ON COLUMN user_permissions.is_active IS 'Indica si el permiso está activo o revocado';

-- ===============================================
-- CONCEDER PERMISOS A USUARIOS AUTENTICADOS
-- ===============================================

-- Los usuarios autenticados pueden ejecutar las funciones helper
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;

-- Los usuarios autenticados pueden acceder a las tablas (RLS controla el acceso)
GRANT SELECT, INSERT, UPDATE, DELETE ON permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissions TO authenticated;

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================
