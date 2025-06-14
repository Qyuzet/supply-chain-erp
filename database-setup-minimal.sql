-- =====================================================
-- MINIMAL SUPABASE DATABASE SETUP SCRIPT
-- =====================================================
-- Run this in your Supabase SQL Editor

-- 1. ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ADD UNIQUE CONSTRAINT ON EMAIL
ALTER TABLE customers ADD CONSTRAINT customers_email_unique UNIQUE (email);

-- 3. ADD DEFAULT VALUES
ALTER TABLE customers ALTER COLUMN customerid SET DEFAULT uuid_generate_v4();
ALTER TABLE product ALTER COLUMN productid SET DEFAULT uuid_generate_v4();
ALTER TABLE warehouses ALTER COLUMN warehouseid SET DEFAULT uuid_generate_v4();
ALTER TABLE shippingcarrier ALTER COLUMN carrierid SET DEFAULT uuid_generate_v4();
ALTER TABLE supplier ALTER COLUMN supplierid SET DEFAULT uuid_generate_v4();

-- 4. INSERT BASIC SAMPLE DATA
-- Sample warehouses
INSERT INTO warehouses (warehousename, location) VALUES 
  ('Main Warehouse', 'New York, NY'),
  ('West Coast Distribution', 'Los Angeles, CA'),
  ('East Coast Hub', 'Miami, FL');

-- Sample shipping carriers
INSERT INTO shippingcarrier (carriername, contactinfo, servicelevel, deliverytimeframe) VALUES
  ('FedEx', 'support@fedex.com', 'Express', '1-2 days'),
  ('UPS', 'support@ups.com', 'Ground', '3-5 days'),
  ('DHL', 'support@dhl.com', 'International', '5-10 days');

-- Sample admin user
INSERT INTO customers (
  email, 
  role, 
  customername,
  phone,
  address
) VALUES (
  'admin@example.com',
  'admin',
  'System Administrator',
  '+1-555-0000',
  'System Address'
);

-- Success message
SELECT 'Minimal database setup completed!' as message;
