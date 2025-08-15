-- Migration: Remove employees module permissions
-- Created: 2025-01-15
-- Description: Eliminates all permissions and user_permissions related to the employees module

-- 🗑️ Remove user_permissions assignments for employees module
-- This cleans up any existing permission assignments for employees
DELETE FROM user_permissions 
WHERE permission_id IN (
  SELECT id FROM permissions 
  WHERE table_name = 'employees'
);

-- 🗑️ Remove permissions for employees module
-- This removes the permission definitions themselves
DELETE FROM permissions 
WHERE table_name = 'employees';

-- ✅ Verification query (commented out for production)
-- Uncomment these lines to verify the cleanup worked correctly:

-- SELECT 'Remaining employees permissions:' as status;
-- SELECT COUNT(*) as remaining_permissions 
-- FROM permissions 
-- WHERE table_name = 'employees';

-- SELECT 'Remaining employees user_permissions:' as status;
-- SELECT COUNT(*) as remaining_user_permissions 
-- FROM user_permissions up
-- JOIN permissions p ON up.permission_id = p.id
-- WHERE p.table_name = 'employees';

-- 📝 Note: This migration safely removes all employees-related permissions
-- Users who had these permissions will lose access to the employees module
-- This is the intended behavior since the module is being completely removed
