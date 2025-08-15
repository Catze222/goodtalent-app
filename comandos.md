cd frontend
npm run dev

# Para trabajar con Supabase
cd supabase
npx supabase db push  # Aplicar migraciones (incluye nueva tabla contracts)
npx supabase functions deploy

# MÓDULO DE CONTRATOS - PRIMERA VEZ
# 1. Ejecutar migración para crear tabla contracts
npx supabase db push

# 2. Asignar permisos de contratos a usuarios
# En Supabase Dashboard o vía SQL:
# - contracts.view
# - contracts.create  
# - contracts.edit
# - contracts.delete

# Después de hacer cambios en tu código...

# Ver qué cambió
git status

# Agregar cambios
git add .

# Hacer commit
git commit -m "Agregué nueva funcionalidad de login"

# Subir a GitHub
git push

-- Solo usar si tienes problemas con dependencias:
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- Luego ejecutar: 00000000000000_initial_schema_consolidated.sql