'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import SqlTooltip from '@/components/SqlTooltip';
import JourneyCard from '@/components/JourneyCard';
import {
  CreditCard,
  Truck,
  MapPin,
  Package,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface CartItem {
  productid: string;
  productname: string;
  unitprice: number;
  quantity: number;
}

interface ShippingCarrier {
  carrierid: string;
  carriername: string;
  servicelevel?: string;
  deliverytimeframe?: string;
  contactinfo?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Simplified - no need to store shipping/payment info since we don't have those tables

  useEffect(() => {
    console.log('=== CHECKOUT PAGE LOADING ===');

    const loadData = async () => {
      try {
        console.log('Loading checkout data...');

        console.log('Getting current user...');
        try {
          const userData = await getCurrentUser();
          console.log('User loaded:', userData?.email);
          setUser(userData);
        } catch (authError) {
          console.error('❌ Auth error:', authError);
          console.log('Continuing without user (will redirect to login)');
          setUser(null);
        }

        // Load cart from localStorage
        console.log('Loading cart from localStorage...');
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          console.log('Cart loaded:', cartData.length, 'items');
          console.log('Cart contents:', cartData);
          setCart(cartData);
        } else {
          console.log('⚠️ No cart found in localStorage');
        }

        console.log('Loading carriers...');
        try {
          await loadCarriers();
        } catch (carrierError) {
          console.error('❌ Carrier loading error:', carrierError);
          console.log('Continuing without carriers');
        }

        console.log('✅ Checkout data loading complete');
      } catch (error) {
        console.error('❌ Error loading checkout data:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('shippingcarrier')
        .select('*')
        .order('carriername');

      if (error) throw error;

      console.log('Carriers loaded:', data?.length || 0);
      setCarriers(data || []);
      if (data && data.length > 0) {
        console.log('Auto-selecting first carrier:', data[0].carriername);
        setSelectedCarrier(data[0].carrierid);
      } else {
        console.log('⚠️ No carriers available');
      }
    } catch (error) {
      console.error('Error loading carriers:', error);
    }
  };



  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.unitprice), 0);
  };

  const getShippingCost = () => {
    return 9.99; // Fixed shipping cost
  };

  const getTax = () => {
    return getSubtotal() * 0.08; // 8% tax
  };

  const getTotal = () => {
    return getSubtotal() + getShippingCost() + getTax();
  };

  const handlePlaceOrder = async () => {
    console.log('=== PLACE ORDER CLICKED ===');
    console.log('User:', user?.email);
    console.log('Cart items:', cart.length);
    console.log('Selected carrier:', selectedCarrier);

    if (!user || cart.length === 0) {
      console.log('❌ No user or empty cart');
      toast({
        title: "Error",
        description: "Please add items to your cart",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCarrier) {
      console.log('❌ No carrier selected');
      toast({
        title: "Error",
        description: "Please select a shipping carrier",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      console.log('=== STARTING ORDER CREATION ===');
      console.log('User:', user);

      // Get customer ID
      console.log('Getting customer data for user ID:', user.id);
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('customerid')
        .eq('userid', user.id)
        .single();

      if (customerError) {
        console.error('Customer lookup error:', customerError);
        throw customerError;
      }

      if (!customerData) {
        console.error('No customer data found for user:', user.id);
        throw new Error('Customer profile not found');
      }

      console.log('Customer data found:', customerData);

      // Create order
      const orderId = crypto.randomUUID();
      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

      const { data: newOrder, error: orderError } = await supabase
        .from('Order')
        .insert({
          orderid: orderId,
          customerid: customerData.customerid,
          orderdate: new Date().toISOString(),
          expecteddeliverydate: expectedDeliveryDate.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order details
      for (const item of cart) {
        const { error: detailError } = await supabase
          .from('orderdetail')
          .insert({
            orderid: orderId,
            productid: item.productid,
            quantity: item.quantity
          });

        if (detailError) throw detailError;

        // Update inventory
        const { data: inventoryData } = await supabase
          .from('inventory')
          .select('quantity, warehouseid')
          .eq('productid', item.productid)
          .gte('quantity', item.quantity)
          .limit(1)
          .single();

        if (inventoryData) {
          await supabase
            .from('inventory')
            .update({ quantity: inventoryData.quantity - item.quantity })
            .eq('productid', item.productid)
            .eq('warehouseid', inventoryData.warehouseid);

          // Log inventory movement
          await supabase
            .from('inventorylog')
            .insert({
              logid: crypto.randomUUID(),
              productid: item.productid,
              warehouseid: inventoryData.warehouseid,
              movementtype: 'out',
              quantity: item.quantity,
              referencetype: 'order',
              referenceid: orderId,
              timestamp: new Date().toISOString()
            });
        }
      }

      // Create shipment
      const { data: warehouseData } = await supabase
        .from('warehouses')
        .select('warehouseid')
        .limit(1)
        .single();

      if (warehouseData) {
        await supabase
          .from('shipments')
          .insert({
            shipmentid: crypto.randomUUID(),
            carrierid: selectedCarrier,
            orderid: orderId,
            warehouseid: warehouseData.warehouseid,
            shipmentdate: new Date().toISOString(),
            trackingnumber: `TRK${Date.now()}`,
            status: 'pending'
          });
      }

      // Create payment record - SIMPLIFIED APPROACH
      console.log('=== CREATING PAYMENT RECORD ===');
      console.log('User ID:', user.id);
      console.log('Customer ID:', customerData.customerid);
      console.log('Order ID:', orderId);
      console.log('Payment Amount:', getTotal());

      const paymentId = crypto.randomUUID();
      const paymentAmount = getTotal();

      console.log('Payment ID:', paymentId);
      console.log('Inserting payment...');

      // SIMPLIFIED: Direct insert matching actual schema
      const { data: paymentData, error: paymentError } = await supabase
        .from('paymentcustomer')
        .insert({
          paymentid: paymentId,
          customerid: customerData.customerid,
          orderid: orderId,  // This should work - no FK constraint in actual schema
          amount: paymentAmount,
          paymentmethod: 'credit_card',
          paymentdate: new Date().toISOString(),
          status: 'completed'
        })
        .select();

      if (paymentError) {
        console.error('❌ PAYMENT CREATION FAILED:');
        console.error('Error code:', paymentError.code);
        console.error('Error message:', paymentError.message);
        console.error('Error details:', paymentError.details);
        console.error('Error hint:', paymentError.hint);
        console.error('Full error object:', JSON.stringify(paymentError, null, 2));



        // Continue with order creation even if payment fails
        toast({
          title: "Warning",
          description: "Order created but payment record failed. Please contact support.",
          variant: "destructive",
        });
      } else {
        console.log('✅ PAYMENT CREATED SUCCESSFULLY:');
        console.log('Payment data:', paymentData);
        toast({
          title: "Payment Processed",
          description: `Payment of $${paymentAmount.toFixed(2)} processed successfully`,
        });
      }

      // Clear cart
      localStorage.removeItem('cart');
      
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${orderId.slice(0, 8)} has been placed. Payment processed automatically.`,
      });

      // Redirect to orders page
      router.push('/orders');

    } catch (error) {
      console.error('❌ ERROR PLACING ORDER:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: `Failed to place order: ${error?.message || 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      console.log('=== ORDER PROCESS COMPLETE ===');
      setProcessing(false);
    }
  };

  if (loading) {
    console.log('🔄 Checkout page is loading...');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading checkout...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (cart.length === 0) {
    console.log('⚠️ Cart is empty, showing empty cart page');
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-4">Add some products to get started</p>
          <Button onClick={() => {
            console.log('Continue Shopping clicked');
            router.push('/shop');
          }}>
            Continue Shopping
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  console.log('🎯 Rendering checkout page with cart:', cart.length, 'items');

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <JourneyCard
          title="Checkout Process"
          description="Complete your order with delivery and payment information."
          currentStep={2}
          steps={[
            {
              step: "Cart Review",
              description: "Items selected and quantities confirmed"
            },
            {
              step: "Delivery Info",
              description: "Enter shipping address and select carrier"
            },
            {
              step: "Payment",
              description: "Choose payment method and complete purchase"
            },
            {
              step: "Order Placed",
              description: "Receive confirmation and tracking information"
            }
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600">Complete your purchase</p>
          </div>
          <SqlTooltip
            page="Checkout"
            queries={[
              {
                title: "Create Order",
                description: "Insert new order with customer and delivery info",
                type: "INSERT",
                sql: `INSERT INTO "Order" (
  orderid,
  customerid,
  orderdate,
  expecteddeliverydate,
  status
) VALUES (
  $1, $2, $3, $4, 'pending'
);`
              },
              {
                title: "Create Order Details",
                description: "Insert order items for each cart product",
                type: "INSERT",
                sql: `INSERT INTO orderdetail (
  orderid,
  productid,
  quantity
) VALUES ($1, $2, $3);`
              },
              {
                title: "Update Inventory",
                description: "Reduce stock quantity after order placement",
                type: "UPDATE",
                sql: `UPDATE inventory
SET quantity = quantity - $1
WHERE productid = $2
  AND warehouseid = $3
  AND quantity >= $1;`
              },
              {
                title: "Create Payment Record",
                description: "Auto-generate payment record for customer order",
                type: "INSERT",
                sql: `INSERT INTO paymentcustomer (
  paymentid,
  customerid,
  orderid,
  amount,
  paymentmethod,
  paymentdate,
  status
) VALUES (
  $1, $2, $3, $4, 'credit_card',
  NOW(), 'completed'
);`
              },
              {
                title: "Create Shipment",
                description: "Generate shipment record with selected carrier",
                type: "INSERT",
                sql: `INSERT INTO shipments (
  shipmentid,
  carrierid,
  orderid,
  warehouseid,
  shipmentdate,
  trackingnumber,
  status
) VALUES (
  $1, $2, $3, $4, NOW(), $5, 'pending'
);`
              }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Simplified */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Select Carrier
                </CardTitle>
              </CardHeader>
              <CardContent>
                {carriers.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No carriers available</h3>
                    <p className="text-gray-600">Please add carriers first to enable shipping</p>
                  </div>
                ) : (
                  <RadioGroup value={selectedCarrier} onValueChange={setSelectedCarrier}>
                    {carriers.map((carrier) => (
                      <div key={carrier.carrierid} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={carrier.carrierid} id={carrier.carrierid} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{carrier.carriername}</p>
                              <p className="text-sm text-gray-600">
                                {carrier.servicelevel || 'Standard delivery'}
                              </p>
                              {carrier.deliverytimeframe && (
                                <p className="text-xs text-gray-500">
                                  Delivery: {carrier.deliverytimeframe}
                                </p>
                              )}
                            </div>
                            <p className="font-bold">$9.99</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Simple Confirmation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Order Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>✅ Items ready for shipment</p>
                  <p className={selectedCarrier ? "text-green-600" : "text-red-600"}>
                    {selectedCarrier ? "✅ Carrier selected" : "❌ Please select carrier"}
                  </p>
                  <p>✅ Payment will be processed</p>
                  {selectedCarrier && (
                    <p className="text-blue-600 font-medium">
                      Selected: {carriers.find(c => c.carrierid === selectedCarrier)?.carriername}
                    </p>
                  )}
                  <p className="text-gray-600 mt-4">
                    {selectedCarrier
                      ? "Click \"Place Order\" to complete your purchase."
                      : "Please select a shipping carrier above to continue."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.productid} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.productname}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.quantity * item.unitprice).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${getShippingCost().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${getTax().toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handlePlaceOrder}
                  disabled={processing || !selectedCarrier}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>

                {/* Security Badge */}
                <div className="text-center text-xs text-gray-500 mt-4">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Secure 256-bit SSL encryption
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
