-- Fix UUID default values for all tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix warehouses table
ALTER TABLE warehouses ALTER COLUMN warehouseid SET DEFAULT uuid_generate_v4();

-- Fix other tables that might have the same issue
ALTER TABLE users ALTER COLUMN userid SET DEFAULT uuid_generate_v4();
ALTER TABLE customers ALTER COLUMN customerid SET DEFAULT uuid_generate_v4();
ALTER TABLE supplier ALTER COLUMN supplierid SET DEFAULT uuid_generate_v4();
ALTER TABLE shippingcarrier ALTER COLUMN carrierid SET DEFAULT uuid_generate_v4();
ALTER TABLE product ALTER COLUMN productid SET DEFAULT uuid_generate_v4();

-- Check if the tables have the correct defaults now
SELECT 
    table_name, 
    column_name, 
    column_default 
FROM information_schema.columns 
WHERE table_name IN ('warehouses', 'users', 'customers', 'supplier', 'shippingcarrier', 'product')
    AND column_name LIKE '%id'
    AND table_schema = 'public'
ORDER BY table_name, column_name;
