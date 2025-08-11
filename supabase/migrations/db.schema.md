# 📊 Schema de Base de Datos - GOOD Talent

## 🎯 Tablas del Sistema de Permisos

### 1. `permissions` – Catálogo de Permisos

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | UUID (PK) | Identificador único del permiso | `abc-123-def-456` |
| `table_name` | TEXT | Nombre de la tabla/módulo | `contracts`, `employees` |
| `action` | TEXT | Acción permitida | `view`, `create`, `edit`, `delete` |
| `description` | TEXT | Descripción legible del permiso | `"Ver contratos laborales"` |
| `is_active` | BOOLEAN | Si el permiso está activo | `true`, `false` |
| `created_at` | TIMESTAMP | Fecha de creación | `2025-01-12 10:30:00` |
| `updated_at` | TIMESTAMP | Fecha de última actualización | `2025-01-12 15:45:00` |

**Restricciones:**
- `UNIQUE(table_name, action)` - No duplicados
- `table_name` y `action` son obligatorios

**Propósito:** Define todos los permisos disponibles en el sistema. Es como un catálogo.

---

### 2. `user_permissions` – Asignación de Permisos a Usuarios

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | UUID (PK) | Identificador único de la asignación | `xyz-789-abc-123` |
| `user_id` | UUID (FK) | Usuario al que se asigna el permiso | `user-123-456` |
| `permission_id` | UUID (FK) | Permiso que se asigna | `perm-abc-123` |
| `granted_at` | TIMESTAMP | Cuándo se otorgó el permiso | `2025-01-12 14:20:00` |
| `granted_by` | UUID (FK) | Quién otorgó el permiso | `admin-789-123` |
| `is_active` | BOOLEAN | Si el permiso está activo | `true`, `false` |
| `created_at` | TIMESTAMP | Fecha de creación | `2025-01-12 14:20:00` |
| `updated_at` | TIMESTAMP | Fecha de última actualización | `2025-01-12 16:00:00` |

**Relaciones:**
- `user_id` → `auth.users(id)` ON DELETE CASCADE
- `permission_id` → `permissions(id)` ON DELETE CASCADE  
- `granted_by` → `auth.users(id)` ON DELETE SET NULL

**Restricciones:**
- `UNIQUE(user_id, permission_id)` - Un permiso por usuario
- `user_id` y `permission_id` son obligatorios

**Propósito:** Conecta usuarios específicos con permisos específicos. Define quién puede hacer qué.

---

## 🔐 Seguridad y RLS (Row Level Security)

### Políticas Implementadas:

**Tabla `permissions`:**
- **Ver:** Solo usuarios con permiso `permissions.view` o super admins
- **Crear/Editar/Eliminar:** Solo super admins

**Tabla `user_permissions`:**
- **Ver:** Usuarios con permiso `user_permissions.view`, super admins, o sus propios permisos
- **Crear:** Usuarios con permiso `user_permissions.create` o super admins
- **Editar:** Usuarios con permiso `user_permissions.edit` o super admins
- **Eliminar:** Usuarios con permiso `user_permissions.delete` o super admins

### Funciones Helper:

- `has_permission(user_id, table_name, action)` - Verifica si un usuario tiene un permiso específico
- `is_super_admin(user_id)` - Verifica si un usuario es super administrador
- `my_permissions()` - Lista los permisos del usuario actual
- `create_super_admin(user_id)` - Otorga todos los permisos a un usuario
- `get_users_with_permissions()` - Obtiene todos los usuarios con conteo de permisos
- `get_user_permissions(user_id)` - Obtiene todos los permisos de un usuario específico
- `assign_permission_to_user(user_id, permission_id, assigned_by)` - Asigna un permiso a un usuario
- `revoke_permission_from_user(user_id, permission_id)` - Revoca un permiso de un usuario

---

## 📋 Permisos Predefinidos del Sistema

### Módulos y Acciones Disponibles:

| Módulo | Acciones Disponibles | Descripción |
|--------|---------------------|-------------|
| `permissions` | `view` | Ver catálogo de permisos |
| `user_permissions` | `view`, `create`, `edit`, `delete` | Gestionar asignaciones de permisos |
| `employees` | `view`, `create`, `edit`, `delete`, `archive` | Gestión de empleados |
| `companies` | `view`, `create`, `edit`, `delete` | Gestión de empresas |
| `contracts` | `view`, `create`, `edit`, `delete`, `archive` | Gestión de contratos |
| `legal` | `view`, `create`, `edit`, `delete` | Documentos legales |
| `sst` | `view`, `create`, `edit`, `delete` | Seguridad y Salud en el Trabajo |
| `news` | `view`, `create`, `edit`, `delete` | Novedades del sistema |
| `dashboard` | `view` | Acceso al dashboard |
| `reports` | `view`, `create`, `export` | Reportes y exportaciones |

---

## 🚀 Ejemplo Práctico

### Crear un Super Administrador:
```sql
-- Opción 1: Usar función helper
SELECT create_super_admin('tu-user-id-aqui');

-- Opción 2: Manual
INSERT INTO user_permissions (user_id, permission_id, granted_by)
SELECT 'tu-user-id', id, 'tu-user-id' FROM permissions WHERE is_active = true;
```

### Asignar permisos específicos a un usuario:
```sql
-- Dar permiso para ver y crear empleados
INSERT INTO user_permissions (user_id, permission_id, granted_by) VALUES
('usuario-123', (SELECT id FROM permissions WHERE table_name='employees' AND action='view'), 'admin-456'),
('usuario-123', (SELECT id FROM permissions WHERE table_name='employees' AND action='create'), 'admin-456');
```

### Verificar permisos de un usuario:
```sql
-- Ver mis propios permisos
SELECT * FROM my_permissions();

-- Verificar si un usuario tiene un permiso específico
SELECT has_permission('usuario-123', 'employees', 'view');
```

---

## 🎯 Flujo de Trabajo

1. **Instalación:** Ejecutar migraciones para crear tablas y permisos base
2. **Primer Super Admin:** Crear usando `create_super_admin(user_id)`
3. **Gestión:** Super admins pueden asignar permisos específicos a otros usuarios
4. **Verificación:** El sistema verifica permisos automáticamente vía RLS
5. **Auditoría:** Cada asignación queda registrada con fecha y quien la otorgó

---

*Última actualización: 2025-01-12*
*Sistema de permisos GOOD Talent v1.0*
