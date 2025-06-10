-- Fix payment RLS policies to match actual database schema

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can create own payments" ON paymentcustomer;
DROP POLICY IF EXISTS "Admins can create any payments" ON paymentcustomer;
DROP POLICY IF EXISTS "Customers can view own payments" ON paymentcustomer;
DROP POLICY IF EXISTS "Admins can view all customer payments" ON paymentcustomer;

-- Enable RLS
ALTER TABLE paymentcustomer ENABLE ROW LEVEL SECURITY;

-- Allow customers to insert their own payments (for checkout)
CREATE POLICY "Enable insert for customers" ON paymentcustomer
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c 
      WHERE c.customerid = paymentcustomer.customerid 
      AND c.userid = auth.uid()
    )
  );

-- Allow admins to insert any payments
CREATE POLICY "Enable insert for admins" ON paymentcustomer
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Allow customers to view their own payments
CREATE POLICY "Enable select for customers" ON paymentcustomer
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers c 
      WHERE c.customerid = paymentcustomer.customerid 
      AND c.userid = auth.uid()
    )
  );

-- Allow admins to view all payments
CREATE POLICY "Enable select for admins" ON paymentcustomer
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'admin')
  );

-- Allow warehouse to view payments (for order processing)
CREATE POLICY "Enable select for warehouse" ON paymentcustomer
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role = 'warehouse')
  );

-- Test policy by allowing all authenticated users temporarily (for debugging)
-- Uncomment this if still having issues:
-- CREATE POLICY "Temporary allow all" ON paymentcustomer FOR ALL USING (auth.uid() IS NOT NULL);
