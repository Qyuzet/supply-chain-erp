-- Cleanup unused tables and fields
-- Run this in Supabase SQL Editor to clean up the database

-- WARNING: This will permanently delete tables and data
-- Make sure you have a backup if needed

-- Drop unused tables (these are empty and not used in the application)
DROP TABLE IF EXISTS supplierperformance CASCADE;
DROP TABLE IF EXISTS returnstatushistory CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS purchaseorderstatushistory CASCADE;
DROP TABLE IF EXISTS purchaseorder CASCADE;
DROP TABLE IF EXISTS productionstatuslog CASCADE;
DROP TABLE IF EXISTS production CASCADE;
DROP TABLE IF EXISTS paymentsupplier CASCADE;
DROP TABLE IF EXISTS paymentcustomer CASCADE;

-- Remove unused column from orderdetail table
-- The shipmentid column is never used (always NULL)
ALTER TABLE orderdetail DROP COLUMN IF EXISTS shipmentid;

-- Verify cleanup
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Show remaining table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'orderdetail'
ORDER BY table_name, ordinal_position;
