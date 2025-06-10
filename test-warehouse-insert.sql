-- Test warehouse insert directly
-- First check current user
SELECT auth.uid() as current_user_id;

-- Check if user exists and their role
SELECT userid, email, role FROM users WHERE userid = auth.uid();

-- Try to insert a warehouse
INSERT INTO warehouses (warehousename, location) 
VALUES ('Test Warehouse', 'Test Location');

-- Check if it was inserted
SELECT * FROM warehouses WHERE warehousename = 'Test Warehouse';
