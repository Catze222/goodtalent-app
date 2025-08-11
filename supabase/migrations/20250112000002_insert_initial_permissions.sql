-- ===============================================
-- MIGRACIÓN: Permisos Iniciales GOOD Talent
-- Fecha: 2025-01-12
-- Descripción: Inserta permisos básicos del sistema
-- ===============================================

-- Insertar permisos básicos del sistema (solo si no existen)
INSERT INTO permissions (table_name, action, description) VALUES
-- Permisos para gestión de permisos (sistema)
('permissions', 'view', 'Ver lista de permisos disponibles'),
('user_permissions', 'view', 'Ver asignaciones de permisos de usuarios'),
('user_permissions', 'create', 'Asignar permisos a usuarios'),
('user_permissions', 'edit', 'Modificar permisos de usuarios'),
('user_permissions', 'delete', 'Revocar permisos de usuarios'),

-- Permisos para módulo de empleados
('employees', 'view', 'Ver información de empleados'),
('employees', 'create', 'Crear nuevos empleados'),
('employees', 'edit', 'Editar información de empleados'),
('employees', 'delete', 'Eliminar empleados'),
('employees', 'archive', 'Archivar empleados'),

-- Permisos para módulo de empresas
('companies', 'view', 'Ver información de empresas'),
('companies', 'create', 'Crear nuevas empresas'),
('companies', 'edit', 'Editar información de empresas'),
('companies', 'delete', 'Eliminar empresas'),

-- Permisos para módulo de contratación
('contracts', 'view', 'Ver contratos laborales'),
('contracts', 'create', 'Crear nuevos contratos'),
('contracts', 'edit', 'Editar contratos existentes'),
('contracts', 'delete', 'Eliminar contratos'),
('contracts', 'archive', 'Archivar contratos'),

-- Permisos para módulo legal
('legal', 'view', 'Ver documentos legales'),
('legal', 'create', 'Crear documentos legales'),
('legal', 'edit', 'Editar documentos legales'),
('legal', 'delete', 'Eliminar documentos legales'),

-- Permisos para módulo SST (Seguridad y Salud en el Trabajo)
('sst', 'view', 'Ver información de SST'),
('sst', 'create', 'Crear registros de SST'),
('sst', 'edit', 'Editar registros de SST'),
('sst', 'delete', 'Eliminar registros de SST'),

-- Permisos para módulo de novedades
('news', 'view', 'Ver novedades del sistema'),
('news', 'create', 'Crear nuevas novedades'),
('news', 'edit', 'Editar novedades'),
('news', 'delete', 'Eliminar novedades'),

-- Permisos para dashboard y reportes
('dashboard', 'view', 'Ver dashboard principal'),
('reports', 'view', 'Ver reportes'),
('reports', 'create', 'Generar reportes'),
('reports', 'export', 'Exportar reportes')

ON CONFLICT (table_name, action) DO NOTHING;

-- ===============================================
-- FUNCIÓN HELPER PARA CREAR SUPER ADMIN
-- ===============================================

CREATE OR REPLACE FUNCTION create_super_admin(admin_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insertar todos los permisos para el usuario especificado
  INSERT INTO user_permissions (user_id, permission_id, granted_by)
  SELECT admin_user_id, p.id, admin_user_id
  FROM permissions p
  WHERE p.is_active = true
  ON CONFLICT (user_id, permission_id) DO NOTHING;
  
  RAISE NOTICE 'Super admin creado exitosamente para usuario: %', admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder ejecución de la función a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_super_admin(UUID) TO authenticated;

-- ===============================================
-- FUNCIÓN HELPER PARA VERIFICAR PERMISOS DEL USUARIO ACTUAL
-- ===============================================

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

-- Conceder ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION my_permissions() TO authenticated;

-- ===============================================
-- COMENTARIOS ADICIONALES
-- ===============================================

COMMENT ON FUNCTION create_super_admin(UUID) IS 'Función para crear un super administrador otorgando todos los permisos disponibles';
COMMENT ON FUNCTION my_permissions() IS 'Función que retorna todos los permisos activos del usuario actual';

-- ===============================================
-- FIN DE MIGRACIÓN
-- ===============================================
