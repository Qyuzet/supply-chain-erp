-- =====================================================
-- SIMPLE SUPABASE DATABASE SETUP SCRIPT
-- =====================================================
-- Run this in your Supabase SQL Editor to set up the database
-- for your supply chain management application

-- 1. ENABLE UUID EXTENSION (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ADD DEFAULT VALUES AND CONSTRAINTS
-- Update customers table to have proper defaults
ALTER TABLE customers 
  ALTER COLUMN customerid SET DEFAULT uuid_generate_v4();

-- Only add createdat and isactive defaults if columns exist
DO $$ 
BEGIN
    -- Check if createdat column exists and add default
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'customers' AND column_name = 'createdat') THEN
        ALTER TABLE customers ALTER COLUMN createdat SET DEFAULT NOW();
    END IF;
    
    -- Check if isactive column exists and add default
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'customers' AND column_name = 'isactive') THEN
        ALTER TABLE customers ALTER COLUMN isactive SET DEFAULT true;
    END IF;
END $$;

-- Add unique constraint on email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_email_unique'
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_email_unique UNIQUE (email);
    END IF;
END $$;

-- 3. ADD DEFAULT VALUES FOR OTHER TABLES
ALTER TABLE product 
  ALTER COLUMN productid SET DEFAULT uuid_generate_v4();

ALTER TABLE warehouses 
  ALTER COLUMN warehouseid SET DEFAULT uuid_generate_v4();

ALTER TABLE shippingcarrier 
  ALTER COLUMN carrierid SET DEFAULT uuid_generate_v4();

ALTER TABLE supplier 
  ALTER COLUMN supplierid SET DEFAULT uuid_generate_v4();

-- Add default timestamps where columns exist
DO $$ 
BEGIN
    -- Orders table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'orderdate') THEN
        ALTER TABLE orders ALTER COLUMN orderdate SET DEFAULT NOW();
    END IF;
    
    -- Purchase order table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'purchaseorder' AND column_name = 'orderdate') THEN
        ALTER TABLE purchaseorder ALTER COLUMN orderdate SET DEFAULT NOW();
    END IF;
    
    -- Returns table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'returns' AND column_name = 'returndate') THEN
        ALTER TABLE returns ALTER COLUMN returndate SET DEFAULT NOW();
    END IF;
    
    -- Shipments table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'shipments' AND column_name = 'shipmentdate') THEN
        ALTER TABLE shipments ALTER COLUMN shipmentdate SET DEFAULT NOW();
    END IF;
    
    -- Production table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'production' AND column_name = 'startdate') THEN
        ALTER TABLE production ALTER COLUMN startdate SET DEFAULT NOW();
    END IF;
END $$;

-- 4. INSERT SAMPLE DATA (only if doesn't exist)
-- Insert sample warehouses
INSERT INTO warehouses (warehousename, location) 
SELECT 'Main Warehouse', 'New York, NY'
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE warehousename = 'Main Warehouse');

INSERT INTO warehouses (warehousename, location) 
SELECT 'West Coast Distribution', 'Los Angeles, CA'
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE warehousename = 'West Coast Distribution');

INSERT INTO warehouses (warehousename, location) 
SELECT 'East Coast Hub', 'Miami, FL'
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE warehousename = 'East Coast Hub');

-- Insert sample shipping carriers
INSERT INTO shippingcarrier (carriername, contactinfo, servicelevel, deliverytimeframe) 
SELECT 'FedEx', 'support@fedex.com', 'Express', '1-2 days'
WHERE NOT EXISTS (SELECT 1 FROM shippingcarrier WHERE carriername = 'FedEx');

INSERT INTO shippingcarrier (carriername, contactinfo, servicelevel, deliverytimeframe) 
SELECT 'UPS', 'support@ups.com', 'Ground', '3-5 days'
WHERE NOT EXISTS (SELECT 1 FROM shippingcarrier WHERE carriername = 'UPS');

INSERT INTO shippingcarrier (carriername, contactinfo, servicelevel, deliverytimeframe) 
SELECT 'DHL', 'support@dhl.com', 'International', '5-10 days'
WHERE NOT EXISTS (SELECT 1 FROM shippingcarrier WHERE carriername = 'DHL');

-- Insert sample admin user
INSERT INTO customers (
  email, 
  role, 
  customername,
  phone,
  address
) 
SELECT 
  'admin@example.com',
  'admin',
  'System Administrator',
  '+1-555-0000',
  'System Address'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email = 'admin@example.com');

-- 5. CREATE INDEXES FOR PERFORMANCE (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_role ON customers(role);
CREATE INDEX IF NOT EXISTS idx_orders_customerid ON orders(customerid);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(orderstatus);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(orderdate);
CREATE INDEX IF NOT EXISTS idx_inventory_productid ON inventory(productid);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouseid ON inventory(warehouseid);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(shipmentstatus);
CREATE INDEX IF NOT EXISTS idx_shipments_orderid ON shipments(orderid);
CREATE INDEX IF NOT EXISTS idx_purchaseorder_supplierid ON purchaseorder(supplierid);
CREATE INDEX IF NOT EXISTS idx_purchaseorder_status ON purchaseorder(status);
CREATE INDEX IF NOT EXISTS idx_production_status ON production(status);

-- Success message
SELECT 'Database setup completed successfully!' as message;
