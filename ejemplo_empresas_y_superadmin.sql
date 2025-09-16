-- ===============================================
-- SCRIPT DE EJEMPLO: 20 EMPRESAS + SUPER ADMIN
-- Ejecutar DESPUÉS de las migraciones consolidadas
-- ===============================================

-- ===============================================
-- 1. VERIFICAR CONFIGURACIÓN DEL SISTEMA
-- ===============================================

-- Verificar que tu usuario ya es super admin
SELECT 
  'Tu usuario es super admin: ' || is_super_admin('57ab508f-2787-4d8c-9518-5d454ead023e') as status;

-- Verificar que tienes todos los permisos
SELECT 
  COUNT(*) as total_permisos_disponibles
FROM my_permissions();

-- Mostrar algunos permisos importantes
SELECT 
  table_name,
  action,
  description
FROM my_permissions()
WHERE table_name IN ('companies', 'contracts', 'tablas_auxiliares')
ORDER BY table_name, action;

-- ===============================================
-- 1.1. VERIFICAR DATOS INICIALES
-- ===============================================

-- Verificar que los datos iniciales existen
SELECT 
  (SELECT COUNT(*) FROM ciudades) as ciudades,
  (SELECT COUNT(*) FROM arls) as arls,
  (SELECT COUNT(*) FROM eps) as eps,
  (SELECT COUNT(*) FROM lineas_negocio) as lineas_negocio,
  (SELECT COUNT(*) FROM permissions) as permisos;

-- ===============================================
-- 2. INSERTAR 20 EMPRESAS DE EJEMPLO
-- ===============================================

INSERT INTO companies (
  name,
  tax_id,
  accounts_contact_name,
  accounts_contact_email,
  accounts_contact_phone,
  status,
  created_by,
  updated_by
) VALUES
-- Empresas Tecnológicas
(
  'TechSolutions Colombia SAS',
  '900123456-1',
  'Ana María Rodríguez',
  'ana.rodriguez@techsolutions.co',
  '+57 310 456 7890',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Innovación Digital Ltda',
  '900234567-2',
  'Carlos Mendoza',
  'carlos.mendoza@innovaciondigital.com',
  '+57 320 567 8901',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'DataMind Technologies SAS',
  '900345678-3',
  'Lucia Fernández',
  'lucia.fernandez@datamind.co',
  '+57 315 678 9012',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de Construcción
(
  'Constructora Bogotá Norte SAS',
  '900456789-4',
  'Miguel Torres',
  'miguel.torres@constructorabogota.com',
  '+57 312 789 0123',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Obras y Proyectos del Valle Ltda',
  '900567890-5',
  'Patricia Ruiz',
  'patricia.ruiz@obrasvalle.co',
  '+57 318 890 1234',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Infraestructura Antioquia SAS',
  '900678901-6',
  'Roberto Silva',
  'roberto.silva@infraantioquia.com',
  '+57 314 901 2345',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de Manufactura
(
  'Textiles Medellín SAS',
  '900789012-7',
  'Sandra López',
  'sandra.lopez@textilesmedellin.co',
  '+57 311 012 3456',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Manufacturas del Caribe Ltda',
  '900890123-8',
  'Jorge Ramírez',
  'jorge.ramirez@manufacaribe.com',
  '+57 317 123 4567',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Industria Metalmecánica SAS',
  '900901234-9',
  'Diana Castro',
  'diana.castro@metalmecanica.co',
  '+57 313 234 5678',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de Servicios
(
  'Consultoría Empresarial Pro SAS',
  '901012345-0',
  'Fernando Morales',
  'fernando.morales@consultoriapro.com',
  '+57 319 345 6789',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Servicios Logísticos Nacionales Ltda',
  '901123456-1',
  'Carmen Vargas',
  'carmen.vargas@logisticanacional.co',
  '+57 316 456 7890',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Transporte y Distribución SAS',
  '901234567-2',
  'Andrés Herrera',
  'andres.herrera@transporte.com',
  '+57 312 567 8901',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de Alimentos
(
  'Alimentos del Pacífico SAS',
  '901345678-3',
  'Gloria Jiménez',
  'gloria.jimenez@alimentospacifico.co',
  '+57 318 678 9012',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Procesadora de Carnes Premium Ltda',
  '901456789-4',
  'Héctor Peña',
  'hector.pena@carnespremium.com',
  '+57 314 789 0123',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Bebidas Naturales Colombia SAS',
  '901567890-5',
  'Isabel Medina',
  'isabel.medina@bebidasnaturales.co',
  '+57 311 890 1234',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de Salud
(
  'Clínica Especializada del Norte SAS',
  '901678901-6',
  'Dr. Ricardo Quintero',
  'ricardo.quintero@clinicadelnorte.co',
  '+57 317 901 2345',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Laboratorio Clínico Integral Ltda',
  '901789012-7',
  'Dra. Martha Ospina',
  'martha.ospina@laboratoriointegral.com',
  '+57 313 012 3456',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de Educación
(
  'Instituto de Capacitación Profesional SAS',
  '901890123-8',
  'Profesora Elena García',
  'elena.garcia@capacitacionprofesional.co',
  '+57 319 123 4567',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de Retail
(
  'Comercializadora Nacional SAS',
  '901901234-9',
  'Alejandro Vega',
  'alejandro.vega@comercializadoranacional.com',
  '+57 315 234 5678',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
  'Distribuciones Mayoristas del Sur Ltda',
  '902012345-0',
  'Claudia Restrepo',
  'claudia.restrepo@mayoristassur.co',
  '+57 316 345 6789',
  true,
  '57ab508f-2787-4d8c-9518-5d454ead023e',
  '57ab508f-2787-4d8c-9518-5d454ead023e'
);

-- ===============================================
-- 3. VERIFICAR INSERCIÓN DE EMPRESAS
-- ===============================================

SELECT 
  COUNT(*) as total_empresas_insertadas,
  COUNT(CASE WHEN status = true THEN 1 END) as empresas_activas,
  COUNT(CASE WHEN status = false THEN 1 END) as empresas_inactivas
FROM companies;

-- Mostrar algunas empresas insertadas
SELECT 
  name,
  tax_id,
  accounts_contact_name,
  status,
  created_at
FROM companies
ORDER BY created_at DESC
LIMIT 10;

-- ===============================================
-- 4. ASIGNAR LÍNEAS DE NEGOCIO A ALGUNAS EMPRESAS
-- ===============================================

-- Obtener IDs de algunas empresas y líneas de negocio para hacer asignaciones de ejemplo
DO $$
DECLARE
  empresa_tech_id UUID;
  empresa_construccion_id UUID;
  empresa_alimentos_id UUID;
  linea_legal_id UUID;
  linea_payroll_id UUID;
  linea_sst_id UUID;
  linea_contratacion_id UUID;
BEGIN
  -- Obtener IDs de empresas
  SELECT id INTO empresa_tech_id FROM companies WHERE name = 'TechSolutions Colombia SAS';
  SELECT id INTO empresa_construccion_id FROM companies WHERE name = 'Constructora Bogotá Norte SAS';
  SELECT id INTO empresa_alimentos_id FROM companies WHERE name = 'Alimentos del Pacífico SAS';
  
  -- Obtener IDs de líneas de negocio
  SELECT id INTO linea_legal_id FROM lineas_negocio WHERE nombre = 'Legal Laboral';
  SELECT id INTO linea_payroll_id FROM lineas_negocio WHERE nombre = 'Payroll';
  SELECT id INTO linea_sst_id FROM lineas_negocio WHERE nombre = 'Riesgos Laborales';
  SELECT id INTO linea_contratacion_id FROM lineas_negocio WHERE nombre = 'Contratación y Administración de Personal';
  
  -- Asignar líneas a empresas usando la función segura
  IF empresa_tech_id IS NOT NULL AND linea_legal_id IS NOT NULL THEN
    PERFORM assign_business_lines_to_company(
      empresa_tech_id,
      ARRAY[linea_legal_id, linea_payroll_id, linea_contratacion_id],
      '57ab508f-2787-4d8c-9518-5d454ead023e'::UUID
    );
  END IF;
  
  IF empresa_construccion_id IS NOT NULL AND linea_sst_id IS NOT NULL THEN
    PERFORM assign_business_lines_to_company(
      empresa_construccion_id,
      ARRAY[linea_legal_id, linea_sst_id, linea_payroll_id],
      '57ab508f-2787-4d8c-9518-5d454ead023e'::UUID
    );
  END IF;
  
  IF empresa_alimentos_id IS NOT NULL AND linea_legal_id IS NOT NULL THEN
    PERFORM assign_business_lines_to_company(
      empresa_alimentos_id,
      ARRAY[linea_legal_id, linea_payroll_id],
      '57ab508f-2787-4d8c-9518-5d454ead023e'::UUID
    );
  END IF;
  
  RAISE NOTICE 'Líneas de negocio asignadas exitosamente a empresas de ejemplo';
END $$;

-- ===============================================
-- 5. VERIFICACIONES FINALES
-- ===============================================

-- Verificar tu estado de super admin
SELECT 
  'Tu usuario es super admin: ' || is_super_admin('57ab508f-2787-4d8c-9518-5d454ead023e') as status;

-- Contar permisos que tienes
SELECT 
  COUNT(*) as total_permisos_asignados
FROM my_permissions();

-- Verificar que las empresas se crearon correctamente
SELECT 
  'Total empresas creadas: ' || COUNT(*) as resultado
FROM companies;

-- Verificar asignaciones de líneas de negocio
SELECT 
  c.name as empresa,
  ln.nombre as linea_negocio,
  eln.fecha_asignacion
FROM empresa_lineas_negocio eln
JOIN companies c ON eln.empresa_id = c.id
JOIN lineas_negocio ln ON eln.linea_negocio_id = ln.id
WHERE eln.es_activa = true
ORDER BY c.name, ln.nombre;

-- ===============================================
-- MENSAJE FINAL
-- ===============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Super admin creado: 57ab508f-2787-4d8c-9518-5d454ead023e';
  RAISE NOTICE '✅ 20 empresas de ejemplo insertadas';
  RAISE NOTICE '✅ Líneas de negocio asignadas a empresas ejemplo';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Tu sistema GOOD Talent está listo para usar!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Próximos pasos:';
  RAISE NOTICE '   1. Verificar en tu frontend que puedes ver las empresas';
  RAISE NOTICE '   2. Crear algunos contratos de prueba';
  RAISE NOTICE '   3. Probar el sistema de permisos';
  RAISE NOTICE '';
END $$;
