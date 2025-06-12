-- Add Purchase Order Details table to link POs with specific products
-- This creates the missing connection between Purchase Orders and Products

CREATE TABLE IF NOT EXISTS purchaseorderdetail (
  purchaseorderdetailid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaseorderid UUID REFERENCES purchaseorder(purchaseorderid) ON DELETE CASCADE,
  productid UUID REFERENCES product(productid),
  quantity INT NOT NULL CHECK (quantity > 0),
  unitprice NUMERIC NOT NULL CHECK (unitprice >= 0),
  subtotal NUMERIC GENERATED ALWAYS AS (quantity * unitprice) STORED,
  createdat TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchaseorderdetail_po ON purchaseorderdetail(purchaseorderid);
CREATE INDEX IF NOT EXISTS idx_purchaseorderdetail_product ON purchaseorderdetail(productid);

-- Update production table to link with purchase orders
ALTER TABLE production 
ADD COLUMN IF NOT EXISTS purchaseorderdetailid UUID REFERENCES purchaseorderdetail(purchaseorderdetailid);

-- Add index for production-PO relationship
CREATE INDEX IF NOT EXISTS idx_production_podetail ON production(purchaseorderdetailid);

-- Enable RLS
ALTER TABLE purchaseorderdetail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchaseorderdetail
CREATE POLICY "Users can view relevant purchase order details" ON purchaseorderdetail
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchaseorder po
      JOIN supplier s ON po.supplierid = s.supplierid
      WHERE po.purchaseorderid = purchaseorderdetail.purchaseorderid
      AND s.userid = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('warehouse', 'admin'))
  );

CREATE POLICY "Warehouse can create purchase order details" ON purchaseorderdetail
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('warehouse', 'admin'))
  );

CREATE POLICY "Warehouse can update purchase order details" ON purchaseorderdetail
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE userid = auth.uid() AND role IN ('warehouse', 'admin'))
  );

-- Add comment for documentation
COMMENT ON TABLE purchaseorderdetail IS 'Links purchase orders with specific products and quantities. Real-world flow: Warehouse creates detailed PO → Supplier approves → Factory produces exact items → Warehouse receives inventory.';

COMMENT ON COLUMN production.purchaseorderdetailid IS 'Links production to specific purchase order line items. Ensures factory produces exactly what warehouse ordered from supplier.';
