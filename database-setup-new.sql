-- =====================================================
-- NEW SUPABASE DATABASE SETUP SCRIPT
-- =====================================================
-- Run this in your Supabase SQL Editor to set up the database
-- for your supply chain management application

-- 1. ENABLE UUID EXTENSION (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ADD DEFAULT VALUES AND CONSTRAINTS
-- Update customers table to have proper defaults
ALTER TABLE customers 
  ALTER COLUMN customerid SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN createdat SET DEFAULT NOW(),
  ALTER COLUMN isactive SET DEFAULT true;

-- Add check constraints for roles
ALTER TABLE customers 
  ADD CONSTRAINT customers_role_check 
  CHECK (role IN ('customer', 'supplier', 'warehouse', 'carrier', 'factory', 'admin'));

-- Add check constraints for order status
ALTER TABLE orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (orderstatus IN ('pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'));

-- Add check constraints for shipment status
ALTER TABLE shipments 
  ADD CONSTRAINT shipments_status_check 
  CHECK (shipmentstatus IN ('pending', 'picked_up', 'in_transit', 'delivered', 'failed'));

-- Add check constraints for production status
ALTER TABLE production 
  ADD CONSTRAINT production_status_check 
  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Add check constraints for purchase order status
ALTER TABLE purchaseorder 
  ADD CONSTRAINT purchaseorder_status_check 
  CHECK (status IN ('pending', 'sent', 'confirmed', 'approved', 'in_production', 'shipped', 'received', 'cancelled'));

-- Add check constraints for return status
ALTER TABLE returns 
  ADD CONSTRAINT returns_status_check 
  CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'processed'));

-- Add check constraints for payment status
ALTER TABLE paymentcustomer 
  ADD CONSTRAINT paymentcustomer_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

ALTER TABLE paymentsupplier 
  ADD CONSTRAINT paymentsupplier_status_check 
  CHECK (status IN ('pending', 'completed', 'failed'));

-- Add check constraints for inventory movement types
ALTER TABLE inventorylog 
  ADD CONSTRAINT inventorylog_movementtype_check 
  CHECK (movementtype IN ('in', 'out', 'transfer', 'adjustment', 'production', 'return'));

-- 3. ADD DEFAULT VALUES FOR OTHER TABLES
ALTER TABLE product 
  ALTER COLUMN productid SET DEFAULT uuid_generate_v4();

ALTER TABLE warehouses 
  ALTER COLUMN warehouseid SET DEFAULT uuid_generate_v4();

ALTER TABLE shippingcarrier 
  ALTER COLUMN carrierid SET DEFAULT uuid_generate_v4();

ALTER TABLE supplier 
  ALTER COLUMN supplierid SET DEFAULT uuid_generate_v4();

-- Add default timestamps
ALTER TABLE orders 
  ALTER COLUMN orderdate SET DEFAULT NOW();

ALTER TABLE purchaseorder 
  ALTER COLUMN orderdate SET DEFAULT NOW();

ALTER TABLE returns 
  ALTER COLUMN returndate SET DEFAULT NOW();

ALTER TABLE shipments 
  ALTER COLUMN shipmentdate SET DEFAULT NOW();

ALTER TABLE production 
  ALTER COLUMN startdate SET DEFAULT NOW();

ALTER TABLE paymentcustomer 
  ALTER COLUMN paymentdate SET DEFAULT NOW();

ALTER TABLE paymentsupplier 
  ALTER COLUMN paymentdate SET DEFAULT NOW();

ALTER TABLE inventorylog 
  ALTER COLUMN timestamp SET DEFAULT NOW();

ALTER TABLE goodsreceipt 
  ALTER COLUMN receivedat SET DEFAULT NOW();

-- Add default UUIDs for history tables
ALTER TABLE orderstatushistory 
  ALTER COLUMN historyid SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN changedat SET DEFAULT NOW();

ALTER TABLE purchaseorderstatushistory 
  ALTER COLUMN historyid SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN changedat SET DEFAULT NOW();

ALTER TABLE returnstatushistory 
  ALTER COLUMN historyid SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN changedat SET DEFAULT NOW();

ALTER TABLE productionstatuslog 
  ALTER COLUMN historyid SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN changedat SET DEFAULT NOW();

-- Add default UUIDs for other tables
ALTER TABLE inventorylog 
  ALTER COLUMN logid SET DEFAULT uuid_generate_v4();

ALTER TABLE goodsreceipt 
  ALTER COLUMN receiptid SET DEFAULT uuid_generate_v4();

ALTER TABLE supplierperformance 
  ALTER COLUMN performanceid SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN evaluationdate SET DEFAULT NOW();

-- 4. INSERT SAMPLE DATA
-- Insert sample warehouses
INSERT INTO warehouses (warehousename, location) VALUES 
  ('Main Warehouse', 'New York, NY'),
  ('West Coast Distribution', 'Los Angeles, CA'),
  ('East Coast Hub', 'Miami, FL')
ON CONFLICT DO NOTHING;

-- Insert sample shipping carriers
INSERT INTO shippingcarrier (carriername, contactinfo, servicelevel, deliverytimeframe) VALUES
  ('FedEx', 'support@fedex.com', 'Express', '1-2 days'),
  ('UPS', 'support@ups.com', 'Ground', '3-5 days'),
  ('DHL', 'support@dhl.com', 'International', '5-10 days')
ON CONFLICT DO NOTHING;

-- Insert sample admin user (fixed column names based on actual schema)
INSERT INTO customers (
  email,
  passwordhash,
  role,
  customername,
  phone,
  address
) VALUES (
  'admin@example.com',
  'temp-password-hash',
  'admin',
  'System Administrator',
  '+1-555-0000',
  'System Address'
) ON CONFLICT (email) DO NOTHING;

-- 5. CREATE INDEXES FOR PERFORMANCE
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
