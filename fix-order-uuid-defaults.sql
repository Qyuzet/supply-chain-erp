-- Fix UUID default values for Order table and other tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix Order table UUID default
ALTER TABLE "Order" ALTER COLUMN orderid SET DEFAULT uuid_generate_v4();

-- Fix other tables that might have the same issue
ALTER TABLE users ALTER COLUMN userid SET DEFAULT uuid_generate_v4();
ALTER TABLE customers ALTER COLUMN customerid SET DEFAULT uuid_generate_v4();
ALTER TABLE supplier ALTER COLUMN supplierid SET DEFAULT uuid_generate_v4();
ALTER TABLE shippingcarrier ALTER COLUMN carrierid SET DEFAULT uuid_generate_v4();
ALTER TABLE product ALTER COLUMN productid SET DEFAULT uuid_generate_v4();
ALTER TABLE warehouses ALTER COLUMN warehouseid SET DEFAULT uuid_generate_v4();

-- Fix additional tables from your schema
ALTER TABLE inventorylog ALTER COLUMN logid SET DEFAULT uuid_generate_v4();
ALTER TABLE orderstatushistory ALTER COLUMN historyid SET DEFAULT uuid_generate_v4();
ALTER TABLE paymentcustomer ALTER COLUMN paymentid SET DEFAULT uuid_generate_v4();
ALTER TABLE paymentsupplier ALTER COLUMN paymentid SET DEFAULT uuid_generate_v4();
ALTER TABLE production ALTER COLUMN productionorderid SET DEFAULT uuid_generate_v4();
ALTER TABLE productionstatuslog ALTER COLUMN historyid SET DEFAULT uuid_generate_v4();
ALTER TABLE purchaseorder ALTER COLUMN purchaseorderid SET DEFAULT uuid_generate_v4();
ALTER TABLE purchaseorderstatushistory ALTER COLUMN historyid SET DEFAULT uuid_generate_v4();
ALTER TABLE returns ALTER COLUMN returnid SET DEFAULT uuid_generate_v4();
ALTER TABLE returnstatushistory ALTER COLUMN historyid SET DEFAULT uuid_generate_v4();
ALTER TABLE shipments ALTER COLUMN shipmentid SET DEFAULT uuid_generate_v4();
ALTER TABLE supplierperformance ALTER COLUMN performanceid SET DEFAULT uuid_generate_v4();

-- Check if the tables have the correct defaults now
SELECT 
    table_name, 
    column_name, 
    column_default 
FROM information_schema.columns 
WHERE table_name IN (
    'Order', 'users', 'customers', 'supplier', 'shippingcarrier', 'product', 
    'warehouses', 'inventorylog', 'orderstatushistory', 'paymentcustomer', 
    'paymentsupplier', 'production', 'productionstatuslog', 'purchaseorder', 
    'purchaseorderstatushistory', 'returns', 'returnstatushistory', 'shipments', 
    'supplierperformance'
)
    AND column_name LIKE '%id'
    AND table_schema = 'public'
ORDER BY table_name, column_name;
