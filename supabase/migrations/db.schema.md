# 📊 Schema de Base de Datos - GOOD Talent
## Estado: CONSOLIDADO v2.0
*Última actualización: 2025-01-15*

## 🎯 Tablas del Sistema de Permisos

### 1. `permissions` – Catálogo de Permisos

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | UUID (PK) | Identificador único del permiso | `abc-123-def-456` |
| `table_name` | TEXT | Nombre de la tabla/módulo | `contracts`, `companies` |
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
- **Ver:** Usuarios pueden ver sus propios permisos, o usuarios con permiso `user_permissions.view`
- **Crear:** Usuarios con permiso `user_permissions.create` 
- **Editar:** Usuarios con permiso `user_permissions.edit`
- **Eliminar:** Usuarios con permiso `user_permissions.delete`
- **IMPORTANTE:** RLS está HABILITADO y las políticas usan consultas directas sin recursión

### Funciones Helper:

- `has_permission(user_id, table_name, action)` - Verifica si un usuario tiene un permiso específico
- `is_super_admin(user_id)` - Verifica si un usuario es super administrador
- `my_permissions()` - Lista los permisos del usuario actual
- `create_super_admin(user_id)` - Otorga todos los permisos a un usuario
- `get_users_with_permissions()` - Obtiene todos los usuarios con conteo de permisos, `is_active` (confirmado y no baneado) y `is_banned`
- `get_user_permissions(user_id)` - Obtiene todos los permisos de un usuario específico
- `assign_permission_to_user(user_id, permission_id, assigned_by)` - Asigna un permiso a un usuario
- `revoke_permission_from_user(user_id, permission_id)` - Revoca un permiso de un usuario
- `get_user_handle(user_id)` - Obtiene la parte local del email (antes de @) de un usuario
- `companies_created_by_handle(company)` - Computed column: handle del creador de empresa
- `companies_updated_by_handle(company)` - Computed column: handle del editor de empresa

---

## 📋 Permisos Predefinidos del Sistema

### Módulos y Acciones Disponibles:

| Módulo | Acciones Disponibles | Descripción |
|--------|---------------------|-------------|
| `permissions` | `view` | Ver catálogo de permisos |
| `user_permissions` | `view`, `create`, `edit`, `delete` | Gestionar asignaciones de permisos |

| `companies` | `view`, `create`, `edit`, `delete` | Gestión de empresas |
| `contracts` | `view`, `create`, `edit`, `delete`, `archive` | Gestión de contratos |
| `legal` | `view`, `create`, `edit`, `delete` | Documentos legales |
| `sst` | `view`, `create`, `edit`, `delete` | Seguridad y Salud en el Trabajo |
| `news` | `view`, `create`, `edit`, `delete` | Novedades del sistema |
| `dashboard` | `view` | Acceso al dashboard |
| `reports` | `view`, `create`, `export` | Reportes y exportaciones |

**NOTA:** El módulo `employees` fue removido del sistema. Todos los permisos relacionados con empleados han sido eliminados.

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
-- Dar permiso para ver y crear empresas
INSERT INTO user_permissions (user_id, permission_id, granted_by) VALUES
('usuario-123', (SELECT id FROM permissions WHERE table_name='companies' AND action='view'), 'admin-456'),
('usuario-123', (SELECT id FROM permissions WHERE table_name='companies' AND action='create'), 'admin-456');
```

### Verificar permisos de un usuario:
```sql
-- Ver mis propios permisos
SELECT * FROM my_permissions();

-- Verificar si un usuario tiene un permiso específico
SELECT has_permission('usuario-123', 'companies', 'view');
```

---

## 🎯 Flujo de Trabajo

1. **Instalación:** Ejecutar migraciones para crear tablas y permisos base
2. **Primer Super Admin:** Crear usando `create_super_admin(user_id)`
3. **Gestión:** Super admins pueden asignar permisos específicos a otros usuarios
4. **Verificación:** El sistema verifica permisos automáticamente vía RLS
5. **Auditoría:** Cada asignación queda registrada con fecha y quien la otorgó

---

## 🏢 Tabla de Empresas

### 3. `companies` – Empresas Clientes

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | UUID (PK) | Identificador único | `550e8400-e29b-41d4-a716-446655440000` |
| `name` | TEXT | Nombre de la empresa cliente | `Good Temporal` |
| `tax_id` | TEXT | NIT o identificación tributaria | `900123456` |
| `accounts_contact_name` | TEXT | Nombre del contacto de cuentas por cobrar | `María Pérez` |
| `accounts_contact_email` | TEXT | Email del contacto de cuentas por cobrar | `mperez@good.com` |
| `accounts_contact_phone` | TEXT | Teléfono del contacto de cuentas por cobrar | `+57 300 123 4567` |
| `status` | BOOLEAN | Estado: true = activa, false = inactiva | `true` |
| `created_at` | TIMESTAMPTZ | Fecha de creación del registro | `2025-01-14 10:00:00` |
| `created_by` | UUID (FK) | Usuario que creó el registro | `user-uuid` |
| `updated_at` | TIMESTAMPTZ | Fecha de última edición | `2025-01-14 14:30:00` |
| `updated_by` | UUID (FK) | Usuario que realizó la última edición | `user-uuid` |
| `archived_at` | TIMESTAMPTZ | Fecha de archivado (soft delete) | `NULL` |
| `archived_by` | UUID (FK) | Usuario que archivó el registro | `NULL` |

**Relaciones:**
- `created_by` → `auth.users(id)`
- `updated_by` → `auth.users(id)` 
- `archived_by` → `auth.users(id)`

**Restricciones:**
- `UNIQUE(tax_id)` - NIT único por empresa
- Validación de email en `accounts_contact_email`
- Lógica de archivado: si `archived_at` no es NULL, `archived_by` debe tener valor

**Índices:**
- `idx_companies_name` - Búsqueda por nombre
- `idx_companies_tax_id` - Búsqueda por NIT
- `idx_companies_status` - Filtro por estado
- `idx_companies_archived_at` - Empresas no archivadas

**Seguridad RLS:**
- **Ver:** Usuarios con permiso `companies.view`
- **Crear:** Usuarios con permiso `companies.create`
- **Editar:** Usuarios con permiso `companies.edit`
- **Eliminar:** Usuarios con permiso `companies.delete`
- **NOTA:** Las políticas usan la función `has_permission()` con SECURITY DEFINER

**Triggers:**
- `trigger_companies_updated_at` - Actualiza automáticamente `updated_at` y `updated_by`

---

## 📋 Tabla de Contratos

### 4. `contracts` – Contratos Laborales

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | UUID (PK) | Identificador único | `550e8400-e29b-41d4-a716-446655440001` |
| `primer_nombre` | TEXT | Primer nombre del empleado | `Juan` |
| `segundo_nombre` | TEXT | Segundo nombre (opcional) | `Carlos` |
| `primer_apellido` | TEXT | Primer apellido del empleado | `Pérez` |
| `segundo_apellido` | TEXT | Segundo apellido (opcional) | `González` |
| `tipo_identificacion` | TEXT | Tipo de documento (CC, CE, Pasaporte, PEP, Otro) | `CC` |
| `numero_identificacion` | TEXT | Número de identificación | `1234567890` |
| `fecha_expedicion_documento` | DATE | Fecha de expedición del documento | `2010-03-15` |
| `fecha_nacimiento` | DATE | Fecha de nacimiento | `1990-05-15` |
| `genero` | TEXT | Género (M, F) | `M` |
| `celular` | TEXT | Número de celular | `+57 300 123 4567` |
| `email` | TEXT | Correo electrónico | `juan.perez@email.com` |
| `empresa_interna` | TEXT | Empresa interna (Good, CPS) | `Good` |
| `empresa_final_id` | UUID (FK) | Empresa cliente final | `company-uuid` |
| `ciudad_labora` | TEXT | Ciudad donde labora | `Bogotá` |
| `cargo` | TEXT | Cargo del empleado | `Desarrollador` |
| `numero_contrato_helisa` | TEXT | Número de contrato único en Helisa | `CONT-2025-001` |
| `base_sena` | BOOLEAN | Aporta al SENA | `true` |
| `fecha_ingreso` | DATE | Fecha de ingreso | `2025-01-15` |
| `tipo_contrato` | TEXT | Tipo (Indefinido, Fijo, Obra, Aprendizaje) | `Indefinido` |
| `fecha_fin` | DATE | Fecha de terminación | `2025-12-31` |
| `tipo_salario` | TEXT | Tipo (Integral, Ordinario) | `Ordinario` |
| `salario` | NUMERIC(14,2) | Salario base | `3500000.00` |
| `auxilio_salarial` | NUMERIC(14,2) | Auxilio salarial | `150000.00` |
| `auxilio_salarial_concepto` | TEXT | Concepto del auxilio salarial | `Transporte` |
| `auxilio_no_salarial` | NUMERIC(14,2) | Auxilio no salarial | `100000.00` |
| `auxilio_no_salarial_concepto` | TEXT | Concepto del auxilio no salarial | `Alimentación` |
| `beneficiario_hijo` | INTEGER | Número de hijos beneficiarios | `2` |
| `beneficiario_madre` | INTEGER | Madre beneficiaria (0/1) | `1` |
| `beneficiario_padre` | INTEGER | Padre beneficiario (0/1) | `0` |
| `beneficiario_conyuge` | INTEGER | Cónyuge beneficiario (0/1) | `1` |
| `fecha_solicitud` | DATE | Fecha de solicitud | `2025-01-10` |
| `fecha_radicado` | DATE | Fecha de radicado | `2025-01-12` |
| `programacion_cita_examenes` | BOOLEAN | Programación de exámenes | `true` |
| `examenes` | BOOLEAN | Exámenes realizados | `false` |
| `solicitud_inscripcion_arl` | BOOLEAN | Solicitud inscripción ARL | `true` |
| `inscripcion_arl` | BOOLEAN | Inscripción ARL confirmada | `false` |
| `envio_contrato` | BOOLEAN | Contrato enviado | `true` |
| `recibido_contrato_firmado` | BOOLEAN | Contrato firmado recibido | `false` |
| `solicitud_eps` | BOOLEAN | Solicitud EPS | `true` |
| `confirmacion_eps` | BOOLEAN | EPS confirmada | `false` |
| `envio_inscripcion_caja` | BOOLEAN | Envío a caja | `false` |
| `confirmacion_inscripcion_caja` | BOOLEAN | Caja confirmada | `false` |
| `dropbox` | TEXT | URL de soporte en Dropbox | `https://dropbox.com/folder/contract-001` |
| `radicado_eps` | BOOLEAN | Radicado EPS | `false` |
| `radicado_ccf` | BOOLEAN | Radicado CCF | `false` |
| `observacion` | TEXT | Observaciones adicionales | `Pendiente documentos` |
| `status_aprobacion` | TEXT | Estado de aprobación (borrador, aprobado) | `borrador` |
| `approved_at` | TIMESTAMPTZ | Fecha de aprobación | `2025-01-15 16:30:00` |
| `approved_by` | UUID (FK) | Usuario que aprobó el contrato | `user-uuid` |
| `created_at` | TIMESTAMPTZ | Fecha de creación | `2025-01-15 10:00:00` |
| `created_by` | UUID (FK) | Usuario que creó el registro | `user-uuid` |
| `updated_at` | TIMESTAMPTZ | Fecha de última edición | `2025-01-15 14:30:00` |
| `updated_by` | UUID (FK) | Usuario que realizó la última edición | `user-uuid` |

**Relaciones:**
- `empresa_final_id` → `companies(id)`
- `created_by` → `auth.users(id)`
- `updated_by` → `auth.users(id)`
- `approved_by` → `auth.users(id)`

**Restricciones:**
- `UNIQUE(numero_contrato_helisa)` - Número de contrato único
- Validación de email y URL de Dropbox
- Lógica de fecha_fin: obligatoria excepto para contratos indefinidos
- Beneficiarios: madre, padre, cónyuge solo pueden ser 0 o 1
- Estado de aprobación: solo puede ser 'borrador' o 'aprobado'
- Lógica de aprobación: una vez aprobado no se puede editar ni eliminar

**Índices:**
- `idx_contracts_numero_contrato_helisa` - Búsqueda por número de contrato
- `idx_contracts_numero_identificacion` - Búsqueda por identificación
- `idx_contracts_empresa_final_id` - Filtro por empresa
- `idx_contracts_nombres` - Búsqueda por nombres
- `idx_contracts_fecha_ingreso` - Filtro por fecha de ingreso

**Seguridad RLS:**
- **Ver:** Usuarios con permiso `contracts.view`
- **Crear:** Usuarios con permiso `contracts.create`
- **Editar:** Usuarios con permiso `contracts.edit`
- **Eliminar:** Usuarios con permiso `contracts.delete`

**Computed Columns:**
- `contracts_created_by_handle(contract)` - Handle del creador
- `contracts_updated_by_handle(contract)` - Handle del editor
- `contracts_full_name(contract)` - Nombre completo del empleado
- `contracts_onboarding_progress(contract)` - Progreso de onboarding (0-100)
- `get_contract_full_status(contract)` - Estado completo con flags de permisos

**Funciones del Sistema de Estados:**
- `calculate_contract_status_vigencia(fecha_fin)` - Calcula si está activo/terminado
- `approve_contract(contract_id, user_id)` - Función segura para aprobar contratos

**Triggers:**
- `trigger_contracts_updated_at` - Actualiza automáticamente `updated_at` y `updated_by`

---

## 📋 MIGRACIÓN CONSOLIDADA

La migración consolidada `00000000000000_initial_schema_consolidated.sql` contiene:

✅ **Estado completo del sistema (v2.0)**
- Todas las tablas: `permissions`, `user_permissions`, `companies`
- Todas las funciones helper con SECURITY DEFINER
- Políticas RLS completas y optimizadas
- Permisos iniciales (sin módulo employees)
- Computed columns para handles de usuario
- Índices optimizados para rendimiento
- Triggers de auditoría automática

✅ **Listo para producción**
- Idempotente: ejecutable múltiples veces sin problemas
- Comentado completamente
- Verificaciones incluidas
- GRANTs configurados correctamente

---

*Sistema de permisos GOOD Talent v2.0 - Migración Consolidada*
