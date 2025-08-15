-- ===============================================
-- MIGRACIÓN CONTRACTS - GOOD Talent
-- Fecha: 2025-01-15
-- Descripción: Tabla de contratos laborales con sistema de permisos RLS
-- ===============================================

-- ===============================================
-- 1. TABLA CONTRACTS - Contratos laborales
-- ===============================================

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información personal del empleado
  primer_nombre TEXT NOT NULL,
  segundo_nombre TEXT,
  primer_apellido TEXT NOT NULL,
  segundo_apellido TEXT,
  tipo_identificacion TEXT NOT NULL CHECK (tipo_identificacion IN ('CC', 'CE', 'Pasaporte', 'PEP', 'Otro')),
  numero_identificacion TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero TEXT NOT NULL CHECK (genero IN ('M', 'F')),
  celular TEXT,
  email TEXT,
  
  -- Información del contrato
  empresa_interna TEXT NOT NULL CHECK (empresa_interna IN ('Good', 'CPS')),
  empresa_final_id UUID NOT NULL,
  ciudad_labora TEXT,
  cargo TEXT,
  numero_contrato_helisa TEXT NOT NULL UNIQUE,
  base_sena BOOLEAN DEFAULT false,
  fecha_ingreso DATE,
  tipo_contrato TEXT CHECK (tipo_contrato IN ('Indefinido', 'Fijo', 'Obra', 'Aprendizaje')),
  fecha_fin DATE,
  tipo_salario TEXT CHECK (tipo_salario IN ('Integral', 'Ordinario')),
  salario NUMERIC(14,2) CHECK (salario >= 0),
  auxilio_salarial NUMERIC(14,2) CHECK (auxilio_salarial >= 0),
  auxilio_salarial_concepto TEXT,
  auxilio_no_salarial NUMERIC(14,2) CHECK (auxilio_no_salarial >= 0),
  auxilio_no_salarial_concepto TEXT,
  
  -- Beneficiarios
  beneficiario_hijo INTEGER DEFAULT 0 CHECK (beneficiario_hijo >= 0),
  beneficiario_madre INTEGER DEFAULT 0 CHECK (beneficiario_madre IN (0, 1)),
  beneficiario_padre INTEGER DEFAULT 0 CHECK (beneficiario_padre IN (0, 1)),
  beneficiario_conyuge INTEGER DEFAULT 0 CHECK (beneficiario_conyuge IN (0, 1)),
  
  -- Onboarding y seguimiento
  fecha_solicitud DATE,
  fecha_radicado DATE,
  programacion_cita_examenes BOOLEAN DEFAULT false,
  examenes BOOLEAN DEFAULT false,
  solicitud_inscripcion_arl BOOLEAN DEFAULT false,
  inscripcion_arl BOOLEAN DEFAULT false,
  envio_contrato BOOLEAN DEFAULT false,
  recibido_contrato_firmado BOOLEAN DEFAULT false,
  solicitud_eps BOOLEAN DEFAULT false,
  confirmacion_eps BOOLEAN DEFAULT false,
  envio_inscripcion_caja BOOLEAN DEFAULT false,
  confirmacion_inscripcion_caja BOOLEAN DEFAULT false,
  dropbox TEXT,
  radicado_eps BOOLEAN DEFAULT false,
  radicado_ccf BOOLEAN DEFAULT false,
  observacion TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL,
  
  -- Constraints de validación
  CONSTRAINT contracts_primer_nombre_not_empty CHECK (length(trim(primer_nombre)) > 0),
  CONSTRAINT contracts_primer_apellido_not_empty CHECK (length(trim(primer_apellido)) > 0),
  CONSTRAINT contracts_numero_identificacion_not_empty CHECK (length(trim(numero_identificacion)) > 0),
  CONSTRAINT contracts_numero_contrato_helisa_not_empty CHECK (length(trim(numero_contrato_helisa)) > 0),
  CONSTRAINT contracts_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT contracts_dropbox_url_format CHECK (dropbox IS NULL OR dropbox ~* '^https?://'),
  CONSTRAINT contracts_fecha_fin_logic CHECK (
    (tipo_contrato = 'Indefinido' AND fecha_fin IS NULL) OR 
    (tipo_contrato != 'Indefinido' AND fecha_fin IS NOT NULL) OR
    tipo_contrato IS NULL
  )
);

-- Foreign Keys para contracts
DO $$
BEGIN
  -- FK a companies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_contracts_empresa_final_id'
  ) THEN
    ALTER TABLE contracts 
    ADD CONSTRAINT fk_contracts_empresa_final_id 
    FOREIGN KEY (empresa_final_id) REFERENCES companies(id);
  END IF;

  -- FK para created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_contracts_created_by'
  ) THEN
    ALTER TABLE contracts 
    ADD CONSTRAINT fk_contracts_created_by 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;

  -- FK para updated_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_contracts_updated_by'
  ) THEN
    ALTER TABLE contracts 
    ADD CONSTRAINT fk_contracts_updated_by 
    FOREIGN KEY (updated_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- ===============================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_contracts_numero_contrato_helisa ON contracts(numero_contrato_helisa);
CREATE INDEX IF NOT EXISTS idx_contracts_numero_identificacion ON contracts(numero_identificacion);
CREATE INDEX IF NOT EXISTS idx_contracts_empresa_final_id ON contracts(empresa_final_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_updated_by ON contracts(updated_by);
CREATE INDEX IF NOT EXISTS idx_contracts_fecha_ingreso ON contracts(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_contracts_tipo_contrato ON contracts(tipo_contrato);
CREATE INDEX IF NOT EXISTS idx_contracts_empresa_interna ON contracts(empresa_interna);

-- Índice compuesto para búsquedas de nombres
CREATE INDEX IF NOT EXISTS idx_contracts_nombres ON contracts(primer_nombre, primer_apellido);

-- ===============================================
-- 3. TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- ===============================================

-- Función específica para contracts (maneja updated_by)
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
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

-- Trigger para contracts
DROP TRIGGER IF EXISTS trigger_contracts_updated_at ON contracts;
CREATE TRIGGER trigger_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- ===============================================
-- 4. COMPUTED COLUMNS PARA CONTRACTS
-- ===============================================

-- Handle del creador (computed column)
CREATE OR REPLACE FUNCTION contracts_created_by_handle(c contracts)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN u.email IS NULL THEN NULL
    ELSE split_part(u.email::TEXT, '@', 1)
  END
  FROM auth.users u
  WHERE u.id = c.created_by
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Handle del editor (computed column)
CREATE OR REPLACE FUNCTION contracts_updated_by_handle(c contracts)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN u.email IS NULL THEN NULL
    ELSE split_part(u.email::TEXT, '@', 1)
  END
  FROM auth.users u
  WHERE u.id = c.updated_by
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función para obtener nombre completo
CREATE OR REPLACE FUNCTION contracts_full_name(c contracts)
RETURNS TEXT AS $$
  SELECT TRIM(
    CONCAT(
      c.primer_nombre, 
      CASE WHEN c.segundo_nombre IS NOT NULL AND c.segundo_nombre != '' THEN ' ' || c.segundo_nombre ELSE '' END,
      ' ', 
      c.primer_apellido,
      CASE WHEN c.segundo_apellido IS NOT NULL AND c.segundo_apellido != '' THEN ' ' || c.segundo_apellido ELSE '' END
    )
  )
$$ LANGUAGE sql STABLE;

-- Función para calcular progreso de onboarding (0-100)
CREATE OR REPLACE FUNCTION contracts_onboarding_progress(c contracts)
RETURNS INTEGER AS $$
  SELECT ROUND(
    (
      CASE WHEN c.programacion_cita_examenes THEN 1 ELSE 0 END +
      CASE WHEN c.examenes THEN 1 ELSE 0 END +
      CASE WHEN c.solicitud_inscripcion_arl THEN 1 ELSE 0 END +
      CASE WHEN c.inscripcion_arl THEN 1 ELSE 0 END +
      CASE WHEN c.envio_contrato THEN 1 ELSE 0 END +
      CASE WHEN c.recibido_contrato_firmado THEN 1 ELSE 0 END +
      CASE WHEN c.solicitud_eps THEN 1 ELSE 0 END +
      CASE WHEN c.confirmacion_eps THEN 1 ELSE 0 END +
      CASE WHEN c.envio_inscripcion_caja THEN 1 ELSE 0 END +
      CASE WHEN c.confirmacion_inscripcion_caja THEN 1 ELSE 0 END +
      CASE WHEN c.radicado_eps THEN 1 ELSE 0 END +
      CASE WHEN c.radicado_ccf THEN 1 ELSE 0 END
    ) * 100.0 / 12
  )::INTEGER
$$ LANGUAGE sql STABLE;

-- ===============================================
-- 5. HABILITACIÓN DE RLS
-- ===============================================

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- 6. POLÍTICAS RLS PARA CONTRACTS
-- ===============================================

-- Políticas para CONTRACTS (mismo patrón que companies)
DROP POLICY IF EXISTS "contracts_select_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_insert_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_update_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_delete_policy" ON contracts;

CREATE POLICY "contracts_select_policy" ON contracts
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'contracts', 'view'));

CREATE POLICY "contracts_insert_policy" ON contracts
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'contracts', 'create'));

CREATE POLICY "contracts_update_policy" ON contracts
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'contracts', 'edit'))
  WITH CHECK (has_permission(auth.uid(), 'contracts', 'edit'));

CREATE POLICY "contracts_delete_policy" ON contracts
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'contracts', 'delete'));

-- ===============================================
-- 7. GRANTS PARA ROL AUTHENTICATED
-- ===============================================

-- Grants para funciones
GRANT EXECUTE ON FUNCTION contracts_created_by_handle(contracts) TO authenticated;
GRANT EXECUTE ON FUNCTION contracts_updated_by_handle(contracts) TO authenticated;
GRANT EXECUTE ON FUNCTION contracts_full_name(contracts) TO authenticated;
GRANT EXECUTE ON FUNCTION contracts_onboarding_progress(contracts) TO authenticated;

-- Grants para tabla
GRANT SELECT, INSERT, UPDATE, DELETE ON contracts TO authenticated;

-- ===============================================
-- 8. COMENTARIOS PARA DOCUMENTACIÓN
-- ===============================================

COMMENT ON TABLE contracts IS 'Contratos laborales con información de empleados y seguimiento de onboarding';
COMMENT ON FUNCTION contracts_created_by_handle(contracts) IS 'Computed column: handle del creador del contrato';
COMMENT ON FUNCTION contracts_updated_by_handle(contracts) IS 'Computed column: handle del editor del contrato';
COMMENT ON FUNCTION contracts_full_name(contracts) IS 'Computed column: nombre completo del empleado';
COMMENT ON FUNCTION contracts_onboarding_progress(contracts) IS 'Computed column: progreso de onboarding (0-100)';

-- ===============================================
-- FIN DE MIGRACIÓN CONTRACTS
-- ===============================================
