-- Simple RPC function to create payments without RLS issues

CREATE OR REPLACE FUNCTION create_payment_direct(
  p_paymentid UUID,
  p_customerid UUID,
  p_orderid UUID,
  p_amount NUMERIC,
  p_paymentmethod TEXT,
  p_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert payment record directly
  INSERT INTO paymentcustomer (
    paymentid,
    customerid,
    orderid,
    amount,
    paymentmethod,
    paymentdate,
    status
  ) VALUES (
    p_paymentid,
    p_customerid,
    p_orderid,
    p_amount,
    p_paymentmethod,
    NOW(),
    p_status
  );
  
  -- Return success result
  result := json_build_object(
    'success', true,
    'paymentid', p_paymentid,
    'message', 'Payment created successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_payment_direct TO authenticated;
GRANT EXECUTE ON FUNCTION create_payment_direct TO anon;
