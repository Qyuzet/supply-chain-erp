-- Fix missing RLS policies for warehouses and other tables

-- Warehouses policies
CREATE POLICY "Admins and warehouse staff can manage warehouses" ON warehouses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse'))
  );

CREATE POLICY "Everyone can view warehouses" ON warehouses
  FOR SELECT USING (true);

-- Shipping carrier policies
CREATE POLICY "Admins and carriers can manage carriers" ON shippingcarrier
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'carrier'))
  );

CREATE POLICY "Everyone can view carriers" ON shippingcarrier
  FOR SELECT USING (true);

-- Warehouse staff table policies (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'warehousestaff') THEN
    EXECUTE 'CREATE POLICY "Warehouse staff can view own data" ON warehousestaff
      FOR SELECT USING (
        userid = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN (''admin'', ''warehouse''))
      )';
    
    EXECUTE 'CREATE POLICY "Admins can manage warehouse staff" ON warehousestaff
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = ''admin'')
      )';
  END IF;
END $$;

-- Allow users to insert their own profile data
CREATE POLICY "Users can insert own customer profile" ON customers
  FOR INSERT WITH CHECK (userid = auth.uid());

CREATE POLICY "Users can insert own supplier profile" ON supplier
  FOR INSERT WITH CHECK (userid = auth.uid());

-- Allow admins to insert any profile data
CREATE POLICY "Admins can insert any customer profile" ON customers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert any supplier profile" ON supplier
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Allow admins to insert users
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Allow admins to update any user
CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Inventory log policies
CREATE POLICY "Warehouse staff can manage inventory logs" ON inventorylog
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('warehouse', 'admin'))
  );

CREATE POLICY "Others can view inventory logs" ON inventorylog
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('customer', 'supplier', 'carrier'))
  );

-- Order detail policies
CREATE POLICY "Customers can view own order details" ON orderdetail
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "order" o
      JOIN customers c ON o.customerid = c.customerid
      WHERE o.orderid = orderdetail.orderid AND c.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse', 'carrier'))
  );

CREATE POLICY "Customers can insert own order details" ON orderdetail
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "order" o
      JOIN customers c ON o.customerid = c.customerid
      WHERE o.orderid = orderid AND c.userid = auth.uid()
    )
  );

-- Purchase order policies
CREATE POLICY "Admins can manage purchase orders" ON purchaseorder
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Production policies
CREATE POLICY "Suppliers and admins can manage production" ON production
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('supplier', 'admin'))
  );

-- Payment policies
CREATE POLICY "Customers can view own payments" ON paymentcustomer
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers c 
      WHERE c.customerid = paymentcustomer.customerid 
      AND c.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Suppliers can view own payments" ON paymentsupplier
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM supplier s 
      WHERE s.supplierid = paymentsupplier.supplierid 
      AND s.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Returns policies
CREATE POLICY "Customers can manage own returns" ON returns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "order" o
      JOIN customers c ON o.customerid = c.customerid
      WHERE o.orderid = returns.orderid AND c.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse'))
  );

-- Status history policies
CREATE POLICY "Users can view relevant status history" ON orderstatushistory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "order" o
      JOIN customers c ON o.customerid = c.customerid
      WHERE o.orderid = orderstatushistory.orderid AND c.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse', 'carrier'))
  );

CREATE POLICY "Users can view relevant purchase order history" ON purchaseorderstatushistory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchaseorder po
      JOIN supplier s ON po.supplierid = s.supplierid
      WHERE po.purchaseorderid = purchaseorderstatushistory.purchaseorderid AND s.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse'))
  );

CREATE POLICY "Users can view relevant return history" ON returnstatushistory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM returns r
      JOIN "order" o ON r.orderid = o.orderid
      JOIN customers c ON o.customerid = c.customerid
      WHERE r.returnid = returnstatushistory.returnid AND c.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse'))
  );

CREATE POLICY "Users can view relevant production history" ON productionstatuslog
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM production p
      JOIN purchaseorder po ON p.purchaseorderid = po.purchaseorderid
      JOIN supplier s ON po.supplierid = s.supplierid
      WHERE p.productionorderid = productionstatuslog.productionorderid AND s.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('admin', 'warehouse'))
  );

-- Supplier performance policies
CREATE POLICY "Suppliers can view own performance" ON supplierperformance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM supplier s 
      WHERE s.supplierid = supplierperformance.supplierid 
      AND s.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );
