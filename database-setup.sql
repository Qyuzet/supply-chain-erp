-- Supply Chain Management Platform Database Setup
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE users (
  userid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  fullname TEXT,
  role TEXT CHECK (role IN ('customer', 'supplier', 'warehouse', 'carrier', 'admin')) DEFAULT 'customer',
  createdat TIMESTAMP DEFAULT NOW(),
  isactive BOOLEAN DEFAULT TRUE
);

-- CUSTOMER & SUPPLIER PROFILE (1:1 with Users)
CREATE TABLE customers (
  customerid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userid UUID UNIQUE REFERENCES users(userid),
  customername TEXT,
  phone TEXT,
  address TEXT
);

CREATE TABLE supplier (
  supplierid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userid UUID UNIQUE REFERENCES users(userid),
  suppliername TEXT
);

-- PRODUCTS & INVENTORY
CREATE TABLE product (
  productid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  productname TEXT,
  description TEXT,
  unitprice NUMERIC,
  supplierid UUID REFERENCES supplier(supplierid)
);

CREATE TABLE warehouses (
  warehouseid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehousename TEXT,
  location TEXT
);

CREATE TABLE inventory (
  productid UUID REFERENCES product(productid),
  warehouseid UUID REFERENCES warehouses(warehouseid),
  quantity INT,
  PRIMARY KEY (productid, warehouseid)
);

CREATE TABLE inventorylog (
  logid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  productid UUID REFERENCES product(productid),
  warehouseid UUID REFERENCES warehouses(warehouseid),
  movementtype TEXT,
  quantity INT,
  referencetype TEXT,
  referenceid UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ORDER FLOW
CREATE TABLE "order" (
  orderid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customerid UUID REFERENCES customers(customerid),
  orderdate TIMESTAMP DEFAULT NOW(),
  expecteddeliverydate TIMESTAMP,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE orderdetail (
  orderid UUID REFERENCES "order"(orderid),
  productid UUID REFERENCES product(productid),
  quantity INT,
  shipmentid UUID,
  PRIMARY KEY (orderid, productid)
);

CREATE TABLE shippingcarrier (
  carrierid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carriername TEXT,
  contactinfo TEXT,
  websiteurl TEXT,
  servicelevel TEXT,
  coststructure TEXT,
  deliverytimeframe TEXT,
  servicearea TEXT
);

CREATE TABLE shipments (
  shipmentid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrierid UUID REFERENCES shippingcarrier(carrierid),
  orderid UUID REFERENCES "order"(orderid),
  warehouseid UUID REFERENCES warehouses(warehouseid),
  shipmentdate TIMESTAMP DEFAULT NOW(),
  trackingnumber TEXT,
  status TEXT DEFAULT 'pending'
);

-- PURCHASE & PRODUCTION
CREATE TABLE purchaseorder (
  purchaseorderid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplierid UUID REFERENCES supplier(supplierid),
  orderdate TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  totalamount NUMERIC
);

CREATE TABLE production (
  productionorderid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  productid UUID REFERENCES product(productid),
  purchaseorderid UUID REFERENCES purchaseorder(purchaseorderid),
  quantity INT,
  startdate TIMESTAMP,
  enddate TIMESTAMP,
  status TEXT DEFAULT 'pending'
);

-- PAYMENTS
CREATE TABLE paymentcustomer (
  paymentid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orderid UUID,
  customerid UUID REFERENCES customers(customerid),
  amount NUMERIC,
  paymentdate TIMESTAMP DEFAULT NOW(),
  paymentmethod TEXT,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE paymentsupplier (
  paymentid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchaseorderid UUID REFERENCES purchaseorder(purchaseorderid),
  supplierid UUID REFERENCES supplier(supplierid),
  amount NUMERIC,
  paymentdate TIMESTAMP DEFAULT NOW(),
  paymentmethod TEXT,
  status TEXT DEFAULT 'pending'
);

-- RETURNS
CREATE TABLE returns (
  returnid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orderid UUID REFERENCES "order"(orderid),
  productid UUID REFERENCES product(productid),
  returndate TIMESTAMP DEFAULT NOW(),
  returnreason TEXT,
  status TEXT DEFAULT 'requested'
);

-- STATUS HISTORY
CREATE TABLE orderstatushistory (
  historyid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orderid UUID REFERENCES "order"(orderid),
  oldstatus TEXT,
  newstatus TEXT,
  changedat TIMESTAMP DEFAULT NOW(),
  changedbyuserid UUID REFERENCES users(userid),
  note TEXT
);

CREATE TABLE purchaseorderstatushistory (
  historyid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchaseorderid UUID REFERENCES purchaseorder(purchaseorderid),
  oldstatus TEXT,
  newstatus TEXT,
  changedat TIMESTAMP DEFAULT NOW(),
  changedbyuserid UUID REFERENCES users(userid),
  note TEXT
);

CREATE TABLE returnstatushistory (
  historyid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  returnid UUID REFERENCES returns(returnid),
  oldstatus TEXT,
  newstatus TEXT,
  changedat TIMESTAMP DEFAULT NOW(),
  changedbyuserid UUID REFERENCES users(userid),
  note TEXT
);

CREATE TABLE productionstatuslog (
  historyid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  productionorderid UUID REFERENCES production(productionorderid),
  oldstatus TEXT,
  newstatus TEXT,
  changedat TIMESTAMP DEFAULT NOW(),
  changedbyuserid UUID REFERENCES users(userid),
  note TEXT
);

CREATE TABLE supplierperformance (
  performanceid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplierid UUID REFERENCES supplier(supplierid),
  purchaseorderid UUID REFERENCES purchaseorder(purchaseorderid),
  rating INT,
  deliverytime TEXT,
  qualityscore NUMERIC,
  evaluationdate TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE orderdetail ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchaseorder ENABLE ROW LEVEL SECURITY;
ALTER TABLE production ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymentcustomer ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymentsupplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (you can customize these)
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = userid::text);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = userid::text);

-- Insert sample data
INSERT INTO warehouses (warehousename, location) VALUES 
('New York Warehouse', 'New York, NY'),
('Los Angeles Warehouse', 'Los Angeles, CA'),
('Miami Warehouse', 'Miami, FL');

INSERT INTO shippingcarrier (carriername, contactinfo, servicelevel) VALUES 
('FedEx', 'contact@fedex.com', 'Express'),
('UPS', 'contact@ups.com', 'Ground'),
('DHL', 'contact@dhl.com', 'International');

-- Success message
SELECT 'Database setup completed successfully!' as message;
