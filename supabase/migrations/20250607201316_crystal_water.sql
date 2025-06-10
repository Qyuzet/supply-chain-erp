/*
  # Supply Chain Management Platform Database Schema

  1. Core Tables
    - `users` - User authentication and role management
    - `customers` - Customer profile data
    - `supplier` - Supplier profile data  
    - `product` - Product catalog
    - `warehouses` - Warehouse locations
    - `inventory` - Current inventory levels
    - `shippingcarrier` - Shipping carrier information

  2. Order Management
    - `order` - Customer orders
    - `orderdetail` - Order line items
    - `shipments` - Shipment tracking
    - `purchaseorder` - Purchase orders to suppliers
    - `production` - Production orders

  3. Financial
    - `paymentcustomer` - Customer payments
    - `paymentsupplier` - Supplier payments
    - `returns` - Return requests

  4. Logging & History
    - `inventorylog` - Inventory movement tracking
    - `orderstatushistory` - Order status changes
    - `purchaseorderstatushistory` - PO status changes
    - `returnstatushistory` - Return status changes
    - `productionstatuslog` - Production status changes
    - `supplierperformance` - Supplier performance metrics

  5. Security
    - Enable RLS on all tables
    - Role-based access policies (customer, supplier, warehouse, carrier, admin)
*/

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS supplierperformance CASCADE;
DROP TABLE IF EXISTS productionstatuslog CASCADE;
DROP TABLE IF EXISTS returnstatushistory CASCADE;
DROP TABLE IF EXISTS purchaseorderstatushistory CASCADE;
DROP TABLE IF EXISTS orderstatushistory CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS paymentsupplier CASCADE;
DROP TABLE IF EXISTS paymentcustomer CASCADE;
DROP TABLE IF EXISTS production CASCADE;
DROP TABLE IF EXISTS purchaseorder CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS orderdetail CASCADE;
DROP TABLE IF EXISTS "order" CASCADE;
DROP TABLE IF EXISTS inventorylog CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS shippingcarrier CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS TABLE
CREATE TABLE users (
  userid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  passwordhash TEXT,
  fullname TEXT,
  role TEXT CHECK (role IN ('customer', 'supplier', 'warehouse', 'carrier', 'admin')) DEFAULT 'customer',
  createdat TIMESTAMP DEFAULT NOW(),
  isactive BOOLEAN DEFAULT TRUE
);

-- CUSTOMER & SUPPLIER PROFILES
CREATE TABLE customers (
  customerid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID UNIQUE REFERENCES users(userid) ON DELETE CASCADE,
  customername TEXT,
  phone TEXT,
  address TEXT
);

CREATE TABLE supplier (
  supplierid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID UNIQUE REFERENCES users(userid) ON DELETE CASCADE,
  suppliername TEXT
);

-- WAREHOUSES & CARRIERS
CREATE TABLE warehouses (
  warehouseid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehousename TEXT NOT NULL,
  location TEXT
);

CREATE TABLE shippingcarrier (
  carrierid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carriername TEXT NOT NULL,
  contactinfo TEXT,
  websiteurl TEXT,
  servicelevel TEXT,
  coststructure TEXT,
  deliverytimeframe TEXT,
  servicearea TEXT
);

-- PRODUCTS & INVENTORY
CREATE TABLE product (
  productid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  productname TEXT NOT NULL,
  description TEXT,
  unitprice NUMERIC DEFAULT 0,
  supplierid UUID REFERENCES supplier(supplierid)
);

CREATE TABLE inventory (
  productid UUID REFERENCES product(productid) ON DELETE CASCADE,
  warehouseid UUID REFERENCES warehouses(warehouseid) ON DELETE CASCADE,
  quantity INT DEFAULT 0,
  PRIMARY KEY (productid, warehouseid)
);

CREATE TABLE inventorylog (
  logid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  productid UUID REFERENCES product(productid),
  warehouseid UUID REFERENCES warehouses(warehouseid),
  movementtype TEXT CHECK (movementtype IN ('in', 'out', 'transfer', 'adjustment')),
  quantity INT NOT NULL,
  referencetype TEXT,
  referenceid UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ORDER MANAGEMENT
CREATE TABLE "order" (
  orderid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customerid UUID REFERENCES customers(customerid),
  orderdate TIMESTAMP DEFAULT NOW(),
  expecteddeliverydate TIMESTAMP,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending'
);

CREATE TABLE orderdetail (
  orderid UUID REFERENCES "order"(orderid) ON DELETE CASCADE,
  productid UUID REFERENCES product(productid),
  quantity INT NOT NULL,
  shipmentid UUID REFERENCES shipments(shipmentid),
  PRIMARY KEY (orderid, productid)
);

CREATE TABLE shipments (
  shipmentid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrierid UUID REFERENCES shippingcarrier(carrierid),
  orderid UUID REFERENCES "order"(orderid),
  warehouseid UUID REFERENCES warehouses(warehouseid),
  shipmentdate TIMESTAMP DEFAULT NOW(),
  trackingnumber TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'failed')) DEFAULT 'pending'
);

-- PURCHASE & PRODUCTION
CREATE TABLE purchaseorder (
  purchaseorderid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplierid UUID REFERENCES supplier(supplierid),
  orderdate TIMESTAMP DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'sent', 'confirmed', 'in_production', 'shipped', 'received', 'cancelled')) DEFAULT 'pending',
  totalamount NUMERIC DEFAULT 0
);

CREATE TABLE production (
  productionorderid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  productid UUID REFERENCES product(productid),
  purchaseorderid UUID REFERENCES purchaseorder(purchaseorderid),
  quantity INT NOT NULL,
  startdate TIMESTAMP,
  enddate TIMESTAMP,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending'
);

-- PAYMENTS
CREATE TABLE paymentcustomer (
  paymentid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orderid UUID REFERENCES "order"(orderid),
  customerid UUID REFERENCES customers(customerid),
  amount NUMERIC NOT NULL,
  paymentdate TIMESTAMP DEFAULT NOW(),
  paymentmethod TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending'
);

CREATE TABLE paymentsupplier (
  paymentid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaseorderid UUID REFERENCES purchaseorder(purchaseorderid),
  supplierid UUID REFERENCES supplier(supplierid),
  amount NUMERIC NOT NULL,
  paymentdate TIMESTAMP DEFAULT NOW(),
  paymentmethod TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending'
);

-- RETURNS
CREATE TABLE returns (
  returnid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orderid UUID REFERENCES "order"(orderid),
  productid UUID REFERENCES product(productid),
  returndate TIMESTAMP DEFAULT NOW(),
  returnreason TEXT,
  status TEXT CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'processed')) DEFAULT 'requested'
);

-- STATUS HISTORY TABLES
CREATE TABLE orderstatushistory (
  historyid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orderid UUID REFERENCES "order"(orderid) ON DELETE CASCADE,
  oldstatus TEXT,
  newstatus TEXT,
  changedat TIMESTAMP DEFAULT NOW(),
  changedbyuserid UUID REFERENCES users(userid),
  note TEXT
);

CREATE TABLE purchaseorderstatushistory (
  historyid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaseorderid UUID REFERENCES purchaseorder(purchaseorderid) ON DELETE CASCADE,
  oldstatus TEXT,
  newstatus TEXT,
  changedat TIMESTAMP DEFAULT NOW(),
  changedbyuserid UUID REFERENCES users(userid),
  note TEXT
);

CREATE TABLE returnstatushistory (
  historyid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  returnid UUID REFERENCES returns(returnid) ON DELETE CASCADE,
  oldstatus TEXT,
  newstatus TEXT,
  changedat TIMESTAMP DEFAULT NOW(),
  changedbyuserid UUID REFERENCES users(userid),
  note TEXT
);

CREATE TABLE productionstatuslog (
  historyid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  productionorderid UUID REFERENCES production(productionorderid) ON DELETE CASCADE,
  oldstatus TEXT,
  newstatus TEXT,
  changedat TIMESTAMP DEFAULT NOW(),
  changedbyuserid UUID REFERENCES users(userid),
  note TEXT
);

CREATE TABLE supplierperformance (
  performanceid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplierid UUID REFERENCES supplier(supplierid),
  purchaseorderid UUID REFERENCES purchaseorder(purchaseorderid),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  deliverytime TEXT,
  qualityscore NUMERIC CHECK (qualityscore BETWEEN 0 AND 100),
  evaluationdate TIMESTAMP DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippingcarrier ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventorylog ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE orderdetail ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchaseorder ENABLE ROW LEVEL SECURITY;
ALTER TABLE production ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymentcustomer ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymentsupplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE orderstatushistory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchaseorderstatushistory ENABLE ROW LEVEL SECURITY;
ALTER TABLE returnstatushistory ENABLE ROW LEVEL SECURITY;
ALTER TABLE productionstatuslog ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplierperformance ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = userid);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE userid = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = userid);

-- Customers policies
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (
    userid = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse'))
  );

CREATE POLICY "Customers can update own data" ON customers
  FOR UPDATE USING (userid = auth.uid());

-- Suppliers policies  
CREATE POLICY "Suppliers can view own data" ON supplier
  FOR SELECT USING (
    userid = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse'))
  );

CREATE POLICY "Suppliers can update own data" ON supplier
  FOR UPDATE USING (userid = auth.uid());

-- Products policies
CREATE POLICY "Everyone can view products" ON product
  FOR SELECT USING (true);

CREATE POLICY "Suppliers can manage own products" ON product
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM supplier s 
      WHERE s.supplierid = product.supplierid 
      AND s.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Orders policies
CREATE POLICY "Customers can view own orders" ON "order"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers c 
      WHERE c.customerid = "order".customerid 
      AND c.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse', 'carrier'))
  );

CREATE POLICY "Customers can create orders" ON "order"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c 
      WHERE c.customerid = customerid 
      AND c.userid = auth.uid()
    )
  );

-- Inventory policies
CREATE POLICY "Warehouse staff can manage inventory" ON inventory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('warehouse', 'admin'))
  );

CREATE POLICY "Others can view inventory" ON inventory
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('customer', 'supplier', 'carrier'))
  );

-- Purchase orders policies
CREATE POLICY "Suppliers can view own purchase orders" ON purchaseorder
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM supplier s 
      WHERE s.supplierid = purchaseorder.supplierid 
      AND s.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse'))
  );

-- Shipments policies
CREATE POLICY "Carriers can view assigned shipments" ON shipments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('carrier', 'admin', 'warehouse')) OR
    EXISTS (
      SELECT 1 FROM "order" o
      JOIN customers c ON o.customerid = c.customerid
      WHERE o.orderid = shipments.orderid AND c.userid = auth.uid()
    )
  );

-- Insert sample data
INSERT INTO warehouses (warehousename, location) VALUES 
  ('Main Warehouse', 'New York, NY'),
  ('West Coast Distribution', 'Los Angeles, CA'),
  ('East Coast Hub', 'Miami, FL');

INSERT INTO shippingcarrier (carriername, contactinfo, servicelevel, deliverytimeframe) VALUES
  ('FedEx', 'support@fedex.com', 'Express', '1-2 days'),
  ('UPS', 'support@ups.com', 'Ground', '3-5 days'),
  ('DHL', 'support@dhl.com', 'International', '5-10 days');