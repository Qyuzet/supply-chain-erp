-- Add factory role to users table role constraint
-- This migration adds 'factory' to the allowed roles in the users table

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with factory role included
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('customer', 'supplier', 'warehouse', 'carrier', 'factory', 'admin'));

-- Update any existing users if needed (optional)
-- UPDATE users SET role = 'factory' WHERE email = 'factory@example.com';
