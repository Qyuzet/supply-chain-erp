-- Fix payment policies to allow customers to create payments during checkout

-- Allow customers to create their own payments
CREATE POLICY "Customers can create own payments" ON paymentcustomer
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c 
      WHERE c.customerid = customerid 
      AND c.userid = auth.uid()
    )
  );

-- Allow admins to create any payments
CREATE POLICY "Admins can create any payments" ON paymentcustomer
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Allow suppliers to create their own payments
CREATE POLICY "Suppliers can create own payments" ON paymentsupplier
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplier s 
      WHERE s.supplierid = supplierid 
      AND s.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Allow admins to view all payments
CREATE POLICY "Admins can view all customer payments" ON paymentcustomer
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view all supplier payments" ON paymentsupplier
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );
