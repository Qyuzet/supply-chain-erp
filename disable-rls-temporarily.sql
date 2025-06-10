-- Temporarily disable RLS on warehouses table to test
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;

-- Also disable on other tables that might be causing issues
ALTER TABLE shippingcarrier DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier DISABLE ROW LEVEL SECURITY;
