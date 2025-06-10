-- Fix RLS policies for warehouses and other tables
-- Run this in Supabase SQL Editor

-- First, let's add the missing RLS policies for warehouses
CREATE POLICY "Allow authenticated users to view warehouses" ON warehouses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert warehouses" ON warehouses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update warehouses" ON warehouses
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete warehouses" ON warehouses
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add policies for shippingcarrier
CREATE POLICY "Allow authenticated users to view carriers" ON shippingcarrier
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert carriers" ON shippingcarrier
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update carriers" ON shippingcarrier
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Add missing INSERT policies for existing tables
CREATE POLICY "Allow authenticated users to insert customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert suppliers" ON supplier
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add policies for users table
CREATE POLICY "Allow authenticated users to insert users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Alternative: If the above doesn't work, temporarily disable RLS
-- Uncomment these lines if needed:
-- ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE shippingcarrier DISABLE ROW LEVEL SECURITY;
