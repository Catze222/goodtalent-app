-- ===============================================
-- MIGRACIÓN INICIAL CONSOLIDADA - GOOD Talent
-- Fecha: 2025-01-15
-- Versión: 1.0.0
-- Descripción: Schema completo del sistema de permisos y empresas
-- 
-- CONTENIDO:
-- 1. Tablas base: permissions, user_permissions, companies
-- 2. Índices optimizados para rendimiento
-- 3. Triggers para auditoría automática
-- 4. Funciones helper y RPC con SECURITY DEFINER
-- 5. Políticas RLS basadas en permisos
-- 6. Permisos iniciales del sistema
-- 7. Computed columns para manejo de handles
-- 8. GRANTs para rol authenticated
--
-- PRINCIPIOS DE DISEÑO:
-- ✅ Idempotencia: CREATE IF NOT EXISTS, ON CONFLICT DO NOTHING
-- ✅ Seguridad: RLS habilitado con políticas estrictas
-- ✅ Auditoría: Tracking de creación/modificación
-- ✅ Performance: Índices en consultas frecuentes
-- ✅ Mantenibilidad: Funciones con SECURITY DEFINER
-- ===============================================

-- ===============================================
-- 1. EXTENSIONES Y CONFIGURACIÓN
-- ===============================================

-- Asegurar que las extensiones necesarias estén disponibles
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===============================================
-- 2. TABLA PERMISSIONS - Catálogo de permisos del sistema
-- ===============================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_table_action UNIQUE(table_name, action),
  CONSTRAINT permissions_table_name_not_empty CHECK (length(trim(table_name)) > 0),
  CONSTRAINT permissions_action_not_empty CHECK (length(trim(action)) > 0)
);

-- Índices para permissions
CREATE INDEX IF NOT EXISTS idx_permissions_table_action ON permissions(table_name, action);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_table_name ON permissions(table_name);

-- ===============================================
-- 3. TABLA USER_PERMISSIONS - Asignación usuario-permiso
-- ===============================================

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_permission UNIQUE(user_id, permission_id)
);

-- Foreign Keys para user_permissions
DO $$
BEGIN
  -- FK a auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_permissions_user_id'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT fk_user_permissions_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- FK a permissions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_permissions_permission_id'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT fk_user_permissions_permission_id 
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
  END IF;

  -- FK para granted_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_permissions_granted_by'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT fk_user_permissions_granted_by 
    FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índices para user_permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_active ON user_permissions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_granted_by ON user_permissions(granted_by);

-- ===============================================
-- 4. TABLA COMPANIES - Entidades cliente/empresa
-- ===============================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT NOT NULL UNIQUE,
  accounts_contact_name TEXT NOT NULL,
  accounts_contact_email TEXT NOT NULL,
  accounts_contact_phone TEXT NOT NULL,
  status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL,
  archived_at TIMESTAMPTZ,
  archived_by UUID,
  
  -- Constraints de validación
  CONSTRAINT companies_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT companies_tax_id_not_empty CHECK (length(trim(tax_id)) > 0),
  CONSTRAINT companies_contact_name_not_empty CHECK (length(trim(accounts_contact_name)) > 0),
  CONSTRAINT companies_contact_email_format CHECK (accounts_contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT companies_archived_logic CHECK (
    (archived_at IS NULL AND archived_by IS NULL) OR 
    (archived_at IS NOT NULL AND archived_by IS NOT NULL)
  )
);

-- Foreign Keys para companies
DO $$
BEGIN
  -- FK para created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_companies_created_by'
  ) THEN
    ALTER TABLE companies 
    ADD CONSTRAINT fk_companies_created_by 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;

  -- FK para updated_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_companies_updated_by'
  ) THEN
    ALTER TABLE companies 
    ADD CONSTRAINT fk_companies_updated_by 
    FOREIGN KEY (updated_by) REFERENCES auth.users(id);
  END IF;

  -- FK para archived_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_companies_archived_by'
  ) THEN
    ALTER TABLE companies 
    ADD CONSTRAINT fk_companies_archived_by 
    FOREIGN KEY (archived_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Índices para companies
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_tax_id ON companies(tax_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_updated_by ON companies(updated_by);
CREATE INDEX IF NOT EXISTS idx_companies_archived_at ON companies(archived_at) WHERE archived_at IS NULL;

-- ===============================================
-- 5. TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- ===============================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para permissions
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para user_permissions
DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función específica para companies (maneja updated_by)
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Si no se especifica updated_by, usar el usuario actual
  IF NEW.updated_by IS NULL THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para companies
DROP TRIGGER IF EXISTS trigger_companies_updated_at ON companies;
CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- ===============================================
-- 6. FUNCIONES HELPER Y RPC (SECURITY DEFINER)
-- ===============================================

-- Función para verificar permisos específicos
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

-- Función para verificar super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_permission(user_uuid, 'user_permissions', 'create')
     AND has_permission(user_uuid, 'user_permissions', 'delete');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener permisos del usuario actual
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

-- Función para obtener usuarios con conteo de permisos (incluye is_banned)
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

-- Función para obtener permisos detallados de un usuario
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
    granted_by = assigned_by,
    updated_at = NOW();
  RETURN true;
EXCEPTION WHEN OTHERS THEN
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
  SET is_active = false, updated_at = NOW()
  WHERE user_id = target_user_id AND permission_id = target_permission_id;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear super admin
CREATE OR REPLACE FUNCTION create_super_admin(admin_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_permissions (user_id, permission_id, granted_by)
  SELECT admin_user_id, p.id, admin_user_id
  FROM permissions p
  WHERE p.is_active = true
  ON CONFLICT (user_id, permission_id) 
  DO UPDATE SET 
    is_active = true, 
    granted_at = NOW(), 
    granted_by = admin_user_id,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener handle de usuario (parte antes de @)
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

-- ===============================================
-- 7. COMPUTED COLUMNS PARA COMPANIES
-- ===============================================

-- Handle del creador (computed column)
CREATE OR REPLACE FUNCTION companies_created_by_handle(c companies)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN u.email IS NULL THEN NULL
    ELSE split_part(u.email::TEXT, '@', 1)
  END
  FROM auth.users u
  WHERE u.id = c.created_by
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Handle del editor (computed column)
CREATE OR REPLACE FUNCTION companies_updated_by_handle(c companies)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN u.email IS NULL THEN NULL
    ELSE split_part(u.email::TEXT, '@', 1)
  END
  FROM auth.users u
  WHERE u.id = c.updated_by
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ===============================================
-- 8. HABILITACIÓN DE RLS
-- ===============================================

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- 9. POLÍTICAS RLS
-- ===============================================

-- Políticas para PERMISSIONS
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
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "delete_permissions" ON permissions
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()));

-- Políticas para USER_PERMISSIONS
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
  )
  WITH CHECK (
    has_permission(auth.uid(), 'user_permissions', 'edit')
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "delete_user_permissions" ON user_permissions
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid(), 'user_permissions', 'delete')
    OR is_super_admin(auth.uid())
  );

-- Políticas para COMPANIES
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
-- 10. PERMISOS INICIALES DEL SISTEMA (SIN EMPLOYEES)
-- ===============================================

INSERT INTO permissions (table_name, action, description) VALUES
-- Gestión de permisos
('permissions', 'view', 'Ver lista de permisos disponibles'),
('user_permissions', 'view', 'Ver asignaciones de permisos de usuarios'),
('user_permissions', 'create', 'Asignar permisos a usuarios'),
('user_permissions', 'edit', 'Modificar permisos de usuarios'),
('user_permissions', 'delete', 'Revocar permisos de usuarios'),

-- Gestión de empresas
('companies', 'view', 'Ver información de empresas'),
('companies', 'create', 'Crear nuevas empresas'),
('companies', 'edit', 'Editar información de empresas'),
('companies', 'delete', 'Eliminar empresas'),

-- Gestión de contratos
('contracts', 'view', 'Ver contratos laborales'),
('contracts', 'create', 'Crear nuevos contratos'),
('contracts', 'edit', 'Editar contratos existentes'),
('contracts', 'delete', 'Eliminar contratos'),
('contracts', 'archive', 'Archivar contratos'),

-- Gestión legal
('legal', 'view', 'Ver documentos legales'),
('legal', 'create', 'Crear documentos legales'),
('legal', 'edit', 'Editar documentos legales'),
('legal', 'delete', 'Eliminar documentos legales'),

-- Gestión de SST (Seguridad y Salud en el Trabajo)
('sst', 'view', 'Ver información de SST'),
('sst', 'create', 'Crear registros de SST'),
('sst', 'edit', 'Editar registros de SST'),
('sst', 'delete', 'Eliminar registros de SST'),

-- Gestión de novedades
('news', 'view', 'Ver novedades del sistema'),
('news', 'create', 'Crear nuevas novedades'),
('news', 'edit', 'Editar novedades'),
('news', 'delete', 'Eliminar novedades'),

-- Dashboard y reportes
('dashboard', 'view', 'Ver dashboard principal'),
('reports', 'view', 'Ver reportes'),
('reports', 'create', 'Generar reportes'),
('reports', 'export', 'Exportar reportes')

ON CONFLICT (table_name, action) DO NOTHING;

-- ===============================================
-- 11. GRANTS PARA ROL AUTHENTICATED
-- ===============================================

-- Grants para funciones
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION my_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_permission_to_user(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_permission_from_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_handle(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION companies_created_by_handle(companies) TO authenticated;
GRANT EXECUTE ON FUNCTION companies_updated_by_handle(companies) TO authenticated;

-- Grants para tablas
GRANT SELECT, INSERT, UPDATE, DELETE ON permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO authenticated;

-- ===============================================
-- 12. COMENTARIOS PARA DOCUMENTACIÓN
-- ===============================================

-- Comentarios en tablas
COMMENT ON TABLE permissions IS 'Catálogo de permisos disponibles en el sistema';
COMMENT ON TABLE user_permissions IS 'Asignaciones de permisos a usuarios con auditoría';
COMMENT ON TABLE companies IS 'Entidades cliente/empresa con información de contacto';

-- Comentarios en funciones principales
COMMENT ON FUNCTION has_permission(UUID, TEXT, TEXT) IS 'Verifica si un usuario tiene un permiso específico';
COMMENT ON FUNCTION is_super_admin(UUID) IS 'Determina si el usuario es super admin basado en permisos de user_permissions';
COMMENT ON FUNCTION my_permissions() IS 'Lista los permisos activos del usuario actual';
COMMENT ON FUNCTION get_users_with_permissions() IS 'Usuarios con conteo de permisos y estado de banned';
COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Permisos detallados de un usuario específico';
COMMENT ON FUNCTION assign_permission_to_user(UUID, UUID, UUID) IS 'Asigna un permiso a un usuario con auditoría';
COMMENT ON FUNCTION revoke_permission_from_user(UUID, UUID) IS 'Revoca un permiso de un usuario (soft delete)';
COMMENT ON FUNCTION create_super_admin(UUID) IS 'Convierte a un usuario en super admin otorgando todos los permisos';
COMMENT ON FUNCTION get_user_handle(UUID) IS 'Retorna la parte local del email (antes de @) para un usuario';
COMMENT ON FUNCTION companies_created_by_handle(companies) IS 'Computed column: handle del creador';
COMMENT ON FUNCTION companies_updated_by_handle(companies) IS 'Computed column: handle del editor';

-- ===============================================
-- 13. VERIFICACIONES POST-MIGRACIÓN
-- ===============================================

-- Estas consultas pueden ejecutarse para verificar el estado:
/*
-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('permissions','user_permissions','companies');

-- Verificar políticas RLS
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('permissions','user_permissions','companies') 
ORDER BY tablename, policyname;

-- Verificar permisos iniciales
SELECT table_name, action, description 
FROM permissions 
WHERE is_active = true 
ORDER BY table_name, action;

-- Verificar funciones
SELECT proname, proargnames, prosrc IS NOT NULL as has_body
FROM pg_proc 
WHERE proname IN ('has_permission', 'my_permissions', 'is_super_admin')
ORDER BY proname;
*/

-- ===============================================
-- FIN DE MIGRACIÓN INICIAL CONSOLIDADA
-- ===============================================
