-- Migración: Crear tabla companies con RLS
-- Descripción: Tabla para almacenar información de empresas clientes

-- Crear tabla companies
CREATE TABLE companies (
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
    
    -- Constraints
    CONSTRAINT companies_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT companies_tax_id_not_empty CHECK (length(trim(tax_id)) > 0),
    CONSTRAINT companies_contact_name_not_empty CHECK (length(trim(accounts_contact_name)) > 0),
    CONSTRAINT companies_contact_email_format CHECK (accounts_contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT companies_archived_logic CHECK (
        (archived_at IS NULL AND archived_by IS NULL) OR 
        (archived_at IS NOT NULL AND archived_by IS NOT NULL)
    )
);

-- Índices para mejorar performance
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_tax_id ON companies(tax_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_created_at ON companies(created_at);
CREATE INDEX idx_companies_archived_at ON companies(archived_at) WHERE archived_at IS NULL;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    -- Solo actualizar updated_by si no se proporcionó explícitamente o está NULL
    IF NEW.updated_by IS NULL THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Solo usuarios con permiso 'companies' y 'view'
CREATE POLICY "companies_select_policy" ON companies
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = auth.uid()
            AND p.table_name = 'companies'
            AND p.action = 'view'
            AND up.is_active = true
            AND p.is_active = true
        )
    );

-- Política para INSERT: Solo usuarios con permiso 'companies' y 'create'
CREATE POLICY "companies_insert_policy" ON companies
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = auth.uid()
            AND p.table_name = 'companies'
            AND p.action = 'create'
            AND up.is_active = true
            AND p.is_active = true
        )
        AND created_by = auth.uid()
    );

-- Política para UPDATE: Solo usuarios con permiso 'companies' y 'edit'
CREATE POLICY "companies_update_policy" ON companies
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = auth.uid()
            AND p.table_name = 'companies'
            AND p.action = 'edit'
            AND up.is_active = true
            AND p.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = auth.uid()
            AND p.table_name = 'companies'
            AND p.action = 'edit'
            AND up.is_active = true
            AND p.is_active = true
        )
    );

-- Política para DELETE: Solo usuarios con permiso 'companies' y 'delete'
CREATE POLICY "companies_delete_policy" ON companies
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = auth.uid()
            AND p.table_name = 'companies'
            AND p.action = 'delete'
            AND up.is_active = true
            AND p.is_active = true
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE companies IS 'Tabla para almacenar información de empresas clientes';
COMMENT ON COLUMN companies.id IS 'Identificador único de la empresa';
COMMENT ON COLUMN companies.name IS 'Nombre de la empresa cliente';
COMMENT ON COLUMN companies.tax_id IS 'NIT o identificación tributaria de la empresa';
COMMENT ON COLUMN companies.accounts_contact_name IS 'Nombre del contacto de cuentas por cobrar';
COMMENT ON COLUMN companies.accounts_contact_email IS 'Email del contacto de cuentas por cobrar';
COMMENT ON COLUMN companies.accounts_contact_phone IS 'Teléfono del contacto de cuentas por cobrar';
COMMENT ON COLUMN companies.status IS 'Estado de la empresa: true = activa, false = inactiva';
COMMENT ON COLUMN companies.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN companies.created_by IS 'Usuario que creó el registro';
COMMENT ON COLUMN companies.updated_at IS 'Fecha y hora de última actualización';
COMMENT ON COLUMN companies.updated_by IS 'Usuario que realizó la última actualización';
COMMENT ON COLUMN companies.archived_at IS 'Fecha y hora de archivado (soft delete)';
COMMENT ON COLUMN companies.archived_by IS 'Usuario que archivó el registro';
