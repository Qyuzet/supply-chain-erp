-- Add 'in_transit' status to order status enum
-- This allows for better tracking of shipment progress

-- Update the order table status constraint to include 'in_transit'
ALTER TABLE "order" DROP CONSTRAINT IF EXISTS order_status_check;
ALTER TABLE "order" ADD CONSTRAINT order_status_check 
  CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'));

-- Update shipments table status constraint to include 'in_transit'  
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check;
ALTER TABLE shipments ADD CONSTRAINT shipments_status_check
  CHECK (status IN ('pending', 'shipped', 'in_transit', 'delivered', 'cancelled'));

-- Add comment explaining the status flow
COMMENT ON COLUMN "order".status IS 'Order status flow: pending → confirmed → processing → shipped → in_transit → delivered';
COMMENT ON COLUMN shipments.status IS 'Shipment status flow: pending → shipped → in_transit → delivered';
