-- ===============================================
-- SCRIPT: Insertar 30 Empresas de Prueba
-- Creadas por: 57ab508f-2787-4d8c-9518-5d454ead023e
-- Fecha: 2025-01-15
-- Datos realistas de empresas colombianas
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
-- Empresas de tecnología
(
    'InnovaTech Solutions SAS',
    '900123456-1',
    'María Fernanda Rodríguez',
    'mrodriguez@innovatech.com.co',
    '+57 301 234 5678',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Digital Workplace Colombia Ltda',
    '900234567-2',
    'Carlos Eduardo Martínez',
    'cmartinez@digitalworkplace.co',
    '+57 312 345 6789',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'CloudNet Servicios SAS',
    '900345678-3',
    'Ana Patricia Guerrero',
    'aguerrero@cloudnet.com.co',
    '+57 315 456 7890',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas manufactureras
(
    'Industrias MetalCorp SAS',
    '900456789-4',
    'Jorge Alejandro Pérez',
    'jperez@metalcorp.com.co',
    '+57 320 567 8901',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Textiles del Valle Ltda',
    '900567890-5',
    'Claudia Isabel Vargas',
    'cvargas@textilesvalle.co',
    '+57 318 678 9012',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Empaques y Plásticos Bogotá SAS',
    '900678901-6',
    'Roberto Carlos Jiménez',
    'rjimenez@empaquesplasticos.com',
    '+57 316 789 0123',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de servicios
(
    'Consultoría Empresarial Pro SAS',
    '900789012-7',
    'Diana Marcela Torres',
    'dtorres@consultoriapro.co',
    '+57 310 890 1234',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Servicios Contables Integrales Ltda',
    '900890123-8',
    'Fernando José Ramírez',
    'framirez@contablesintegrales.com',
    '+57 314 901 2345',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Marketing Digital Caribe SAS',
    '900901234-9',
    'Liliana Andrea Moreno',
    'lmoreno@marketingcaribe.co',
    '+57 317 012 3456',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de construcción
(
    'Constructora Andina SAS',
    '901012345-1',
    'Gustavo Adolfo Herrera',
    'gherrera@constructoraandina.com',
    '+57 313 123 4567',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Obras Civiles del Pacífico Ltda',
    '901123456-2',
    'Sandra Milena López',
    'slopez@obraspacifico.co',
    '+57 319 234 5678',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Ingeniería y Proyectos SAS',
    '901234567-3',
    'Mauricio Felipe Castro',
    'mcastro@ingenieriaproyectos.com',
    '+57 321 345 6789',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas comerciales
(
    'Distribuidora Nacional SAS',
    '901345678-4',
    'Patricia Elena Gómez',
    'pgomez@distribuidoranacional.co',
    '+57 322 456 7890',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Comercial Andino Ltda',
    '901456789-5',
    'Andrés Fernando Silva',
    'asilva@comercialandino.com',
    '+57 324 567 8901',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Importaciones Costa Rica SAS',
    '901567890-6',
    'Alejandra Beatriz Ruiz',
    'aruiz@importacionescr.co',
    '+57 325 678 9012',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de alimentos
(
    'Alimentos Naturales del Sur SAS',
    '901678901-7',
    'Ricardo Enrique Mendoza',
    'rmendoza@alimentossur.com',
    '+57 326 789 0123',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Productos Lácteos Valle Ltda',
    '901789012-8',
    'Carmen Rosa Velásquez',
    'cvelasquez@lacteosvalle.co',
    '+57 327 890 1234',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Procesadora de Frutas Tropicales SAS',
    '901890123-9',
    'Manuel Alberto Cardona',
    'mcardona@frutastropicales.com',
    '+57 328 901 2345',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de transporte
(
    'Transportes Rápidos Colombia SAS',
    '901901234-1',
    'Gloria Patricia Escobar',
    'gescobar@transportesrapidos.co',
    '+57 329 012 3456',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Logística Integral del Caribe Ltda',
    '902012345-2',
    'Héctor Mauricio Peña',
    'hpena@logisticacaribe.com',
    '+57 330 123 4567',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Cargas y Mudanzas Express SAS',
    '902123456-3',
    'Beatriz Elena Montoya',
    'bmontoya@cargasexpress.co',
    '+57 331 234 5678',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de salud
(
    'Centro Médico Especializado SAS',
    '902234567-4',
    'Dr. Carlos Andrés Muñoz',
    'cmunoz@centromedico.com',
    '+57 332 345 6789',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Laboratorio Clínico del Norte Ltda',
    '902345678-5',
    'Dra. Martha Lucía Ortiz',
    'mortiz@labclinico.co',
    '+57 333 456 7890',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Farmacia y Droguería Central SAS',
    '902456789-6',
    'Miguel Ángel Vargas',
    'mvargas@farmaciacentral.com',
    '+57 334 567 8901',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de educación
(
    'Instituto de Capacitación Técnica SAS',
    '902567890-7',
    'Profesora Luz Marina Acosta',
    'lacosta@institutotecnico.edu.co',
    '+57 335 678 9012',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Centro de Idiomas Internacional Ltda',
    '902678901-8',
    'John Alexander Smith',
    'jsmith@idiomas.edu.co',
    '+57 336 789 0123',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas de turismo
(
    'Agencia de Viajes Aventura SAS',
    '902789012-9',
    'Isabella María Restrepo',
    'irestrepo@viajesaventura.co',
    '+57 337 890 1234',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Hotel Boutique del Centro Ltda',
    '902890123-1',
    'Sebastián José Henao',
    'shenao@hotelboutique.com',
    '+57 338 901 2345',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),

-- Empresas mixtas con algunos estados inactivos
(
    'Reciclaje y Medio Ambiente SAS',
    '902901234-2',
    'Esperanza del Carmen Soto',
    'esoto@reciclaje.com.co',
    '+57 339 012 3456',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Empresa Temporal en Pausa Ltda',
    '903012345-3',
    'Temporal Contacto Pérez',
    'contacto@temporal.co',
    '+57 340 123 4567',
    false, -- Estado inactivo
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
),
(
    'Desarrollo Inmobiliario Premium SAS',
    '903123456-4',
    'Catalina Andrea Zapata',
    'czapata@inmobiliario.co',
    '+57 341 234 5678',
    true,
    '57ab508f-2787-4d8c-9518-5d454ead023e',
    '57ab508f-2787-4d8c-9518-5d454ead023e'
);

-- Verificar inserción exitosa
SELECT 
    'Empresas insertadas exitosamente' as status,
    COUNT(*) as total_empresas,
    COUNT(CASE WHEN status = true THEN 1 END) as empresas_activas,
    COUNT(CASE WHEN status = false THEN 1 END) as empresas_inactivas
FROM companies 
WHERE created_by = '57ab508f-2787-4d8c-9518-5d454ead023e';

-- Mostrar algunas empresas creadas
SELECT 
    name,
    tax_id,
    accounts_contact_name,
    accounts_contact_email,
    status,
    created_at
FROM companies 
WHERE created_by = '57ab508f-2787-4d8c-9518-5d454ead023e'
ORDER BY created_at DESC
LIMIT 5;

-- ===============================================
-- ✅ RESULTADO ESPERADO:
-- - 30 empresas insertadas
-- - 29 empresas activas, 1 inactiva
-- - Datos realistas de empresas colombianas
-- - Todas creadas por el usuario especificado
-- ===============================================
