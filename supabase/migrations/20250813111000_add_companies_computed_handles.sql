-- ===============================================
-- MIGRACIÓN: Computed columns para companies (handles de creador/editor)
-- Fecha: 2025-08-13
-- Descripción: expone created_by_handle y updated_by_handle como columnas calculadas
--   para ser consumidas desde PostgREST (select) sin múltiples llamadas.
-- ===============================================

-- Created by handle (parte local del email antes de @)
CREATE OR REPLACE FUNCTION companies_created_by_handle(c companies)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN u.email IS NULL THEN NULL
    ELSE split_part(u.email::TEXT, '@', 1)
  END
  FROM auth.users u
  WHERE u.id = c.created_by
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Updated by handle (parte local del email antes de @)
CREATE OR REPLACE FUNCTION companies_updated_by_handle(c companies)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN u.email IS NULL THEN NULL
    ELSE split_part(u.email::TEXT, '@', 1)
  END
  FROM auth.users u
  WHERE u.id = c.updated_by
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION companies_created_by_handle(companies) TO authenticated;
GRANT EXECUTE ON FUNCTION companies_updated_by_handle(companies) TO authenticated;

COMMENT ON FUNCTION companies_created_by_handle(companies) IS 'Computed column: handle del creador (email antes de @)';
COMMENT ON FUNCTION companies_updated_by_handle(companies) IS 'Computed column: handle del editor (email antes de @)';

-- ===============================================
-- FIN
-- ===============================================


