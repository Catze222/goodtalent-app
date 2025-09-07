cd frontend
npm run dev



-- Solo usar si tienes problemas con dependencias:
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

supabase functions deploy extract-cedula-ocr