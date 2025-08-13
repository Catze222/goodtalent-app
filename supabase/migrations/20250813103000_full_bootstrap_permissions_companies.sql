-- ===============================================
-- MIGRACIÓN CONSOLIDADA: Bootstrap de permisos y companies
-- Fecha: 2025-08-13
-- Propósito: Crear/asegurar tablas, funciones, RLS y datos base en un solo lugar
--   - Crea tablas permissions y user_permissions con índices y FK
--   - Inserta permisos iniciales idempotentes
--   - Crea tabla companies con RLS y políticas basadas en permisos
--   - Recrea funciones helper con SECURITY DEFINER (bypass RLS)
--   - Establece políticas RLS consistentes e idempotentes
--   - Concede GRANTs necesarios al rol authenticated
-- Nota: No elimina migraciones históricas; deja el estado final correcto al ejecutarse
--
-- Cómo usar (entornos de Supabase nube):
-- 1) (Opcional) Reset limpio del esquema public si quieres partir de cero:
--    DROP SCHEMA IF EXISTS public CASCADE;
--    CREATE SCHEMA public;
--    GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
--    GRANT ALL ON SCHEMA public TO postgres, service_role;
--    SET search_path TO public, extensions;
--    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
-- 2) Ejecuta este archivo completo en el SQL Editor (o via CLI) para crear todo
-- 3) (Opcional) Elevar un usuario a super admin:
--    SELECT create_super_admin('<USER_UUID>');
--
-- Principios clave:
-- - Idempotencia: todos los CREATE usan IF NOT EXISTS o se recrean sin romper dependencias
-- - Seguridad: RLS está HABILITADO y las políticas usan permisos explícitos
-- - Funciones críticas usan SECURITY DEFINER para evitar recursión/auto-bloqueos por RLS
-- - Simplicidad: un solo archivo deja el estado final coherente
-- ===============================================

-- ===============================================
-- Tablas base: permissions y user_permissions
-- ===============================================
--
-- Tabla permissions:
--   Catálogo de permisos del sistema. Clave única por (table_name, action)
-- Tabla user_permissions:
--   Asignación usuario-permiso con bandera is_active y auditoría básica
-- Notas:
--   - Índices cubren consultas comunes por usuario, permiso y activos
--   - updated_at se mantiene vía trigger genérico
--   - FK a auth.users y permissions con ON DELETE seguro

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_table_action UNIQUE(table_name, action)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_permission UNIQUE(user_id, permission_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_permissions_user_id'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT fk_user_permissions_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_permissions_permission_id'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT fk_user_permissions_permission_id 
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_permissions_granted_by'
  ) THEN
    ALTER TABLE user_permissions 
    ADD CONSTRAINT fk_user_permissions_granted_by 
    FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_permissions_table_action ON permissions(table_name, action);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_active ON user_permissions(user_id, is_active);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- Permisos iniciales del sistema (idempotente)
-- ===============================================
--
-- Inserta el set base de permisos de negocio. ON CONFLICT evita duplicados.
-- Puedes ampliar esta lista en futuras migraciones sin romper consistencia.

INSERT INTO permissions (table_name, action, description) VALUES
('permissions', 'view', 'Ver lista de permisos disponibles'),
('user_permissions', 'view', 'Ver asignaciones de permisos de usuarios'),
('user_permissions', 'create', 'Asignar permisos a usuarios'),
('user_permissions', 'edit', 'Modificar permisos de usuarios'),
('user_permissions', 'delete', 'Revocar permisos de usuarios'),
('employees', 'view', 'Ver información de empleados'),
('employees', 'create', 'Crear nuevos empleados'),
('employees', 'edit', 'Editar información de empleados'),
('employees', 'delete', 'Eliminar empleados'),
('employees', 'archive', 'Archivar empleados'),
('companies', 'view', 'Ver información de empresas'),
('companies', 'create', 'Crear nuevas empresas'),
('companies', 'edit', 'Editar información de empresas'),
('companies', 'delete', 'Eliminar empresas'),
('contracts', 'view', 'Ver contratos laborales'),
('contracts', 'create', 'Crear nuevos contratos'),
('contracts', 'edit', 'Editar contratos existentes'),
('contracts', 'delete', 'Eliminar contratos'),
('contracts', 'archive', 'Archivar contratos'),
('legal', 'view', 'Ver documentos legales'),
('legal', 'create', 'Crear documentos legales'),
('legal', 'edit', 'Editar documentos legales'),
('legal', 'delete', 'Eliminar documentos legales'),
('sst', 'view', 'Ver información de SST'),
('sst', 'create', 'Crear registros de SST'),
('sst', 'edit', 'Editar registros de SST'),
('sst', 'delete', 'Eliminar registros de SST'),
('news', 'view', 'Ver novedades del sistema'),
('news', 'create', 'Crear nuevas novedades'),
('news', 'edit', 'Editar novedades'),
('news', 'delete', 'Eliminar novedades'),
('dashboard', 'view', 'Ver dashboard principal'),
('reports', 'view', 'Ver reportes'),
('reports', 'create', 'Generar reportes'),
('reports', 'export', 'Exportar reportes')
ON CONFLICT (table_name, action) DO NOTHING;

-- ===============================================
-- Tabla companies con RLS
-- ===============================================
--
-- companies: entidad de cliente/empresa con contacto y estado.
-- Campos clave:
-- - created_by / updated_by: audit trail para saber quién crea/actualiza
-- - archived_at / archived_by: soft-delete con consistencia obligatoria (ambos o ninguno)
-- RLS: se define más abajo con políticas por acción basadas en permisos asignados.

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT NOT NULL UNIQUE,
  accounts_contact_name TEXT NOT NULL,
  accounts_contact_email TEXT NOT NULL,
  accounts_contact_phone TEXT NOT NULL,
  status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES auth.users(id),
  CONSTRAINT companies_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT companies_tax_id_not_empty CHECK (length(trim(tax_id)) > 0),
  CONSTRAINT companies_contact_name_not_empty CHECK (length(trim(accounts_contact_name)) > 0),
  CONSTRAINT companies_contact_email_format CHECK (accounts_contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT companies_archived_logic CHECK (
    (archived_at IS NULL AND archived_by IS NULL) OR 
    (archived_at IS NOT NULL AND archived_by IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_tax_id ON companies(tax_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_archived_at ON companies(archived_at) WHERE archived_at IS NULL;

CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
--
-- Trigger BEFORE UPDATE para mantener updated_at y asegurar updated_by
-- Si el cliente no envía updated_by explícito, lo forzamos a auth.uid()
BEGIN
  NEW.updated_at = now();
  IF NEW.updated_by IS NULL THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_companies_updated_at ON companies;
CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- Funciones helper y RPC (SECURITY DEFINER)
-- ===============================================
--
-- Nota sobre SECURITY DEFINER:
-- Estas funciones deben poder consultar permisos aunque RLS restrinja directamente
-- el acceso a las tablas base. Por eso se definen con SECURITY DEFINER y se otorga
-- EXECUTE a 'authenticated'. El control real lo imponen las políticas RLS de las
-- tablas de negocio (p. ej., companies) y la lógica de permisos.

CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, table_name_param TEXT, action_param TEXT)
RETURNS BOOLEAN AS $$
--
-- Descripción: verifica si user_uuid tiene un permiso activo (table_name, action)
-- Parámetros:
--   user_uuid: UUID del usuario
--   table_name_param: nombre lógico del módulo/tabla (ej: 'companies')
--   action_param: acción (view|create|edit|delete|...)
-- Retorna: boolean
-- Uso típico:
--   SELECT has_permission(auth.uid(), 'companies', 'view');
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
--
-- Descripción: considera super admin a quien tenga create y delete sobre user_permissions.
-- Esto evita crear un rol separado y se fundamenta en permisos del propio sistema.
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
--
-- Descripción: lista los permisos activos del usuario autenticado actual.
-- Útil para UI: gating de componentes/acciones en frontend.
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

-- Mantener la versión con tipos consistentes (sin is_banned) como última
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
--
-- Descripción: listado de usuarios (auth.users) con conteo de permisos activos.
-- Notas: castea email a TEXT explícitamente para evitar conflictos de tipos.
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
--
-- Descripción: permisos detallados de un usuario específico (para vistas de admin).
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
--
-- Descripción: asigna (o re-activa) un permiso a un usuario con auditoría básica.
-- Idempotente: ON CONFLICT reactiva y actualiza timestamps.
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
--
-- Descripción: marca un permiso como inactivo para el usuario (soft revoke).
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
--
-- Descripción: convierte a un usuario en super admin otorgando todos los permisos activos.
BEGIN
  INSERT INTO user_permissions (user_id, permission_id, granted_by)
  SELECT admin_user_id, p.id, admin_user_id
  FROM permissions p
  WHERE p.is_active = true
  ON CONFLICT (user_id, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- Políticas RLS (idempotentes)
-- ===============================================
--
-- Modelo de seguridad (RLS):
-- - permissions: sólo visibles para quienes tengan permissions.view o sean super admin
-- - user_permissions: usuarios ven los suyos; admins con permisos pueden ver/gestionar
-- - companies: acceso por acción basado en permisos asignados al usuario actual
--
-- Buenas prácticas:
-- - Las USING/WHETHER CHECK se basan en has_permission() que opera con SECURITY DEFINER
-- - Evitar recursión circular usando función en lugar de subconsultas repetidas

-- permissions
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

-- user_permissions
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
-- Alternativa sin funciones (por si se requiere diagnosticar recursión):
--   USING (
--     user_id = auth.uid() OR EXISTS (
--       SELECT 1 FROM user_permissions up2
--       JOIN permissions p2 ON up2.permission_id = p2.id
--       WHERE up2.user_id = auth.uid()
--         AND p2.table_name = 'user_permissions'
--         AND p2.action = 'view'
--         AND up2.is_active = true AND p2.is_active = true
--     )
--   )

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

-- companies
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
-- Nota: INSERT no requiere USING. WITH CHECK valida el derecho del registro nuevo.

CREATE POLICY "companies_update_policy" ON companies
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'companies', 'edit'))
  WITH CHECK (has_permission(auth.uid(), 'companies', 'edit'));

CREATE POLICY "companies_delete_policy" ON companies
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'companies', 'delete'));

-- ===============================================
-- GRANTs para rol authenticated
-- ===============================================
--
-- Importante: GRANTs habilitan operaciones a nivel SQL, pero RLS sigue aplicando
-- los filtros de fila. Es decir, tener GRANT SELECT no implica ver filas si RLS
-- no lo permite. Esto mantiene separación de preocupaciones y seguridad fuerte.

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
-- Verificación rápida post-migración (copiar/pegar en SQL Editor):
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('permissions','user_permissions','companies');
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('permissions','user_permissions','companies') ORDER BY tablename, policyname;
-- SELECT * FROM my_permissions();
-- SELECT has_permission(auth.uid(), 'companies', 'view');

-- ===============================================
-- FIN
-- ===============================================


