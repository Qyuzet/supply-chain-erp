-- Temporary policy to allow all authenticated users to create payments
-- This is for debugging purposes only

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable insert for customers" ON paymentcustomer;
DROP POLICY IF EXISTS "Enable insert for admins" ON paymentcustomer;
DROP POLICY IF EXISTS "Enable select for customers" ON paymentcustomer;
DROP POLICY IF EXISTS "Enable select for admins" ON paymentcustomer;
DROP POLICY IF EXISTS "Enable select for warehouse" ON paymentcustomer;

-- Temporary allow all policy for debugging
CREATE POLICY "Temporary allow all payments" ON paymentcustomer 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Also ensure the table has RLS enabled
ALTER TABLE paymentcustomer ENABLE ROW LEVEL SECURITY;
