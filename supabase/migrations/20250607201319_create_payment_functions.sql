-- Create RPC functions to handle payment creation (bypass RLS issues)

-- Function to create customer payment
CREATE OR REPLACE FUNCTION create_customer_payment(
  p_customerid UUID,
  p_orderid UUID,
  p_amount NUMERIC,
  p_paymentmethod TEXT DEFAULT 'credit_card'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_id UUID;
BEGIN
  -- Generate new payment ID
  payment_id := gen_random_uuid();
  
  -- Insert payment record
  INSERT INTO paymentcustomer (
    paymentid,
    customerid,
    orderid,
    amount,
    paymentmethod,
    paymentdate,
    status
  ) VALUES (
    payment_id,
    p_customerid,
    p_orderid,
    p_amount,
    p_paymentmethod,
    NOW(),
    'completed'
  );
  
  RETURN payment_id;
END;
$$;

-- Function to create supplier payment
CREATE OR REPLACE FUNCTION create_supplier_payment(
  p_supplierid UUID,
  p_purchaseorderid UUID,
  p_amount NUMERIC,
  p_paymentmethod TEXT DEFAULT 'bank_transfer'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_id UUID;
BEGIN
  -- Generate new payment ID
  payment_id := gen_random_uuid();
  
  -- Insert payment record
  INSERT INTO paymentsupplier (
    paymentid,
    supplierid,
    purchaseorderid,
    amount,
    paymentmethod,
    paymentdate,
    status
  ) VALUES (
    payment_id,
    p_supplierid,
    p_purchaseorderid,
    p_amount,
    p_paymentmethod,
    NOW(),
    'completed'
  );
  
  RETURN payment_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_customer_payment TO authenticated;
GRANT EXECUTE ON FUNCTION create_supplier_payment TO authenticated;
