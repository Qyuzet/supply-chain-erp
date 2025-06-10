'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  Eye,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface OrderWithDetails {
  orderid: string;
  orderdate: string;
  status: string;
  customers: {
    customername: string;
    address: string;
    phone: string;
  };
  orderdetail: Array<{
    productid: string;
    quantity: number;
    product: {
      productname: string;
      unitprice: number;
    };
  }>;
}

interface Carrier {
  carrierid: string;
  carriername: string;
  servicelevel?: string;
}

export default function WarehouseOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadOrders(),
            loadCarriers()
          ]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('Order')
        .select(`
          orderid,
          orderdate,
          status,
          customers(customername, address, phone),
          orderdetail(
            productid,
            quantity,
            product(productname, unitprice)
          )
        `)
        .in('status', ['pending', 'confirmed', 'shipped'])
        .order('orderdate', { ascending: true }); // FIFO: First In, First Out

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    }
  };

  const loadCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('shippingcarrier')
        .select('carrierid, carriername, servicelevel')
        .order('carriername');

      if (error) throw error;
      setCarriers(data || []);
    } catch (error) {
      console.error('Error loading carriers:', error);
    }
  };

  const checkInventoryAvailability = async (orderDetails: OrderWithDetails['orderdetail']) => {
    const availability = [];

    for (const detail of orderDetails) {
      try {
        const { data: inventory, error } = await supabase
          .from('inventory')
          .select('quantity, warehouses(warehousename)')
          .eq('productid', detail.productid);

        if (error) {
          console.error('Inventory check error:', error);
          throw error;
        }

        const totalAvailable = inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;

        availability.push({
          productid: detail.productid,
          productname: detail.product.productname,
          required: detail.quantity,
          available: totalAvailable,
          canFulfill: totalAvailable >= detail.quantity,
          warehouses: inventory || []
        });
      } catch (error) {
        console.error(`Error checking inventory for product ${detail.productid}:`, error);
        // If inventory check fails, assume can't fulfill
        availability.push({
          productid: detail.productid,
          productname: detail.product.productname,
          required: detail.quantity,
          available: 0,
          canFulfill: false,
          warehouses: []
        });
      }
    }

    return availability;
  };

  const confirmOrder = async (order: OrderWithDetails) => {
    console.log('Confirming order:', order.orderid);
    setProcessing(order.orderid);

    try {
      // Check inventory first
      console.log('Checking inventory availability...');
      const availability = await checkInventoryAvailability(order.orderdetail);
      console.log('Inventory availability:', availability);

      const canFulfillAll = availability.every(item => item.canFulfill);

      if (!canFulfillAll) {
        const insufficientItems = availability.filter(item => !item.canFulfill);
        console.log('Insufficient inventory:', insufficientItems);
        toast({
          title: "Insufficient Inventory",
          description: `Cannot fulfill: ${insufficientItems.map(item => item.productname).join(', ')}`,
          variant: "destructive",
        });
        setProcessing(null);
        return;
      }

      console.log('Updating order status to confirmed...');
      // Update order status
      const { data: updateResult, error: orderError } = await supabase
        .from('Order')
        .update({ status: 'confirmed' })
        .eq('orderid', order.orderid)
        .select();

      console.log('Order update result:', updateResult);

      if (orderError) {
        console.error('Error updating order status:', orderError);
        throw orderError;
      }

      if (!updateResult || updateResult.length === 0) {
        console.error('No order was updated - order may not exist');
        throw new Error('Order not found or could not be updated');
      }

      console.log('Logging status change...');
      // Log status change
      const { error: historyError } = await supabase
        .from('orderstatushistory')
        .insert({
          historyid: crypto.randomUUID(),
          orderid: order.orderid,
          oldstatus: 'pending',
          newstatus: 'confirmed',
          changedat: new Date().toISOString(),
          changedbyuserid: user?.id || null,
          note: 'Order confirmed by warehouse staff'
        });

      if (historyError) {
        console.error('Error logging status change:', historyError);
        // Don't throw here, order confirmation is more important
      }

      toast({
        title: "Order Confirmed",
        description: "Order is ready for carrier assignment",
      });

      console.log('Reloading orders...');
      await loadOrders();
      console.log('Order confirmation complete');
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: "Error",
        description: `Failed to confirm order: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const markReadyForPickup = async (order: OrderWithDetails) => {
    console.log('Marking order ready for pickup:', order.orderid);
    setProcessing(order.orderid);

    try {
      console.log('Checking for existing shipment...');
      // Check if shipment already exists (created during checkout)
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('shipmentid')
        .eq('orderid', order.orderid);

      if (shipmentError) {
        console.error('Error checking shipment:', shipmentError);
        throw shipmentError;
      }

      console.log('Shipment query result:', shipmentData);

      if (!shipmentData || shipmentData.length === 0) {
        console.log('No shipment found for order:', order.orderid);
        console.log('Creating shipment automatically...');

        // Auto-create shipment if it doesn't exist
        const { data: warehouseData, error: warehouseError } = await supabase
          .from('warehouses')
          .select('warehouseid')
          .limit(1);

        const { data: carrierData, error: carrierError } = await supabase
          .from('shippingcarrier')
          .select('carrierid')
          .limit(1);

        if (warehouseError || carrierError) {
          console.error('Error fetching warehouse/carrier:', { warehouseError, carrierError });
          throw warehouseError || carrierError;
        }

        if (warehouseData && warehouseData.length > 0 && carrierData && carrierData.length > 0) {
          const { error: createShipmentError } = await supabase
            .from('shipments')
            .insert({
              shipmentid: crypto.randomUUID(),
              carrierid: carrierData[0].carrierid,
              orderid: order.orderid,
              warehouseid: warehouseData[0].warehouseid,
              shipmentdate: new Date().toISOString(),
              trackingnumber: `TRK${Date.now()}`,
            });

          if (createShipmentError) {
            console.error('Error creating shipment:', createShipmentError);
            throw createShipmentError;
          }

          console.log('Shipment created successfully');
        } else {
          toast({
            title: "Error",
            description: "No warehouse or carrier available for shipment",
            variant: "destructive",
          });
          setProcessing(null);
          return;
        }
      }

      const existingShipment = shipmentData[0];
      console.log('Found/created shipment for order');
      console.log('Updating order status to shipped...');

      // Update order status to ready for pickup
      const { error: updateError } = await supabase
        .from('Order')
        .update({ status: 'shipped' })
        .eq('orderid', order.orderid);

      if (updateError) {
        console.error('Error updating order status:', updateError);
        throw updateError;
      }

      console.log('Logging status change...');
      // Log status change
      const { error: historyError } = await supabase
        .from('orderstatushistory')
        .insert({
          historyid: crypto.randomUUID(),
          orderid: order.orderid,
          oldstatus: 'confirmed',
          newstatus: 'shipped',
          changedat: new Date().toISOString(),
          changedbyuserid: user?.id || null,
          note: 'Order packed and ready for carrier pickup'
        });

      if (historyError) {
        console.error('Error logging status change:', historyError);
        // Don't throw here, status update is more important
      }

      toast({
        title: "Ready for Pickup",
        description: "Order is ready for carrier pickup",
      });

      console.log('Reloading orders...');
      await loadOrders();
      console.log('Mark ready for pickup complete');
    } catch (error) {
      console.error('Error marking ready for pickup:', error);
      toast({
        title: "Error",
        description: `Failed to mark order ready: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateOrderTotal = (orderDetails: OrderWithDetails['orderdetail']) => {
    return orderDetails.reduce((total, detail) => {
      return total + (detail.quantity * detail.product.unitprice);
    }, 0);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const shippedOrders = orders.filter(o => o.status === 'shipped');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['Order', 'orderdetail']}
          relatedTables={['inventory', 'product', 'shipments', 'shippingcarrier']}
          operations={['Process Orders', 'Check Inventory', 'Assign Carriers']}
          description="Warehouse order processing and fulfillment management"
        />

        {/* Warehouse Flow Guidance */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">Warehouse Order Processing</h3>
          <div className="text-sm text-purple-800 space-y-1">
            <p><strong>1. Customer Order:</strong> Orders arrive from customer checkout</p>
            <p><strong>2. Inventory Check:</strong> Verify stock availability for all items</p>
            <p><strong>3. Order Confirmation:</strong> Confirm orders with sufficient inventory</p>
            <p><strong>4. Carrier Assignment:</strong> Mark orders ready for carrier pickup</p>
            <p><strong>5. Low Stock Alert:</strong> Create Purchase Orders when inventory is low</p>
            <p className="mt-2 font-medium text-purple-900">
              Your Role: Process customer orders and manage inventory levels
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Warehouse Orders</h1>
              <p className="text-gray-600">Process incoming orders and assign carriers</p>
            </div>
            <SqlTooltip
              page="Warehouse Orders"
              queries={[
                {
                  title: "Load Orders with FIFO",
                  description: "Get orders with customer and product details using FIFO ordering",
                  type: "SELECT",
                  sql: `SELECT
  o.*,
  c.customername,
  c.email,
  od.quantity,
  p.productname,
  p.unitprice
FROM "Order" o
JOIN customers c ON o.customerid = c.customerid
JOIN orderdetail od ON o.orderid = od.orderid
JOIN product p ON od.productid = p.productid
WHERE o.status IN ('pending', 'confirmed', 'processing')
ORDER BY o.orderdate ASC; -- FIFO: First In, First Out`
                },
                {
                  title: "Update Order Status",
                  description: "Update order status with audit logging",
                  type: "UPDATE",
                  sql: `UPDATE "Order"
SET status = $1
WHERE orderid = $2;

-- Insert status history
INSERT INTO orderstatushistory (
  historyid, orderid, oldstatus, newstatus,
  changedat, changedbyuserid, note
) VALUES (
  gen_random_uuid(), $2, $3, $1,
  NOW(), $4, $5
);`
                },
                {
                  title: "Create Shipment",
                  description: "Create shipment record when assigning carrier",
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
  gen_random_uuid(),
  $1, $2, $3,
  NOW(),
  CONCAT('TRK', EXTRACT(EPOCH FROM NOW())),
  'shipped'
);`
                }
              ]}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('/inventory', '_blank')}
            >
              <Package className="h-4 w-4 mr-2" />
              Check Inventory
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/purchase-orders', '_blank')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Create Purchase Orders
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground">need processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedOrders.length}</div>
              <p className="text-xs text-muted-foreground">ready to pack</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shippedOrders.length}</div>
              <p className="text-xs text-muted-foreground">awaiting carrier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Carriers</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carriers.length}</div>
              <p className="text-xs text-muted-foreground">for assignment</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders to Process</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.orderid}>
                    <TableCell className="font-mono">
                      {order.orderid.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customers.customername}</p>
                        <p className="text-sm text-gray-600">{order.customers.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.orderdate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {order.orderdetail.length} items
                    </TableCell>
                    <TableCell>
                      ${calculateOrderTotal(order.orderdetail).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium">Customer Info</h4>
                                    <p className="text-sm">{selectedOrder.customers.customername}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.customers.phone}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.customers.address}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Order Info</h4>
                                    <p className="text-sm">Date: {new Date(selectedOrder.orderdate).toLocaleDateString()}</p>
                                    <p className="text-sm">Status: {selectedOrder.status}</p>
                                    <p className="text-sm">Total: ${calculateOrderTotal(selectedOrder.orderdetail).toFixed(2)}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Items</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedOrder.orderdetail.map((detail) => (
                                        <TableRow key={detail.productid}>
                                          <TableCell>{detail.product.productname}</TableCell>
                                          <TableCell>{detail.quantity}</TableCell>
                                          <TableCell>${detail.product.unitprice.toFixed(2)}</TableCell>
                                          <TableCell>${(detail.quantity * detail.product.unitprice).toFixed(2)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => confirmOrder(order)}
                            disabled={processing === order.orderid}
                          >
                            {processing === order.orderid ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Confirm
                          </Button>
                        )}

                        {order.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => markReadyForPickup(order)}
                            disabled={processing === order.orderid}
                          >
                            {processing === order.orderid ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <Package className="h-4 w-4 mr-1" />
                            )}
                            Ready for Pickup
                          </Button>
                        )}

                        {order.status === 'shipped' && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              <Truck className="h-3 w-3 mr-1" />
                              Awaiting Carrier Pickup
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {orders.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders to process</h3>
                <p className="text-gray-600">New orders will appear here when customers place them</p>
                <div className="mt-4 text-xs text-gray-500">
                  <p>Debug: User role = {user?.role}</p>
                  <p>Debug: Orders loaded = {orders.length}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
