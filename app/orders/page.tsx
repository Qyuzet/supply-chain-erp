'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { orderOperations } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Package,
  Truck,
  Eye,
  Plus,
  Minus,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import type { User } from '@/lib/auth';

interface OrderWithDetails {
  orderid: string;
  customerid: string;
  orderdate: string;
  expecteddeliverydate: string | null;
  status: string;
  orderdetail?: Array<{
    orderid: string;
    productid: string;
    quantity: number;
    shipmentid: string | null;
    product?: {
      productid: string;
      productname: string;
      description: string | null;
      unitprice: number;
    };
  }>;
  shipments?: Array<{
    shipmentid: string;
    trackingnumber: string | null;
    status: string;
    shipmentdate: string;
  }>;
}

interface Product {
  productid: string;
  productname: string;
  description: string | null;
  unitprice: number;
  supplier?: {
    suppliername: string;
  };
}

interface OrderItem {
  productid: string;
  productname: string;
  quantity: number;
  unitprice: number;
}

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Orders page useEffect triggered');

    const loadData = async () => {
      try {
        console.log('Starting to get current user...');
        const userData = await getCurrentUser();
        console.log('Current user data:', userData);
        setUser(userData);

        if (userData) {
          await Promise.all([
            loadOrders(userData),
            loadProducts()
          ]);
        } else {
          console.log('No user data found');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const loadOrders = async (userData: User) => {
    try {
      console.log('Loading orders for user:', userData);
      let ordersData;

      if (userData.role === 'customer') {
        console.log('User is customer, getting customer profile...');
        // Get customer ID first
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('customerid')
          .eq('userid', userData.id)
          .single();

        console.log('Customer data:', customerData);
        console.log('Customer error:', customerError);

        if (customerData) {
          console.log('Fetching orders for customer:', customerData.customerid);
          ordersData = await orderOperations.getCustomerOrders(customerData.customerid);
        } else {
          console.log('No customer profile found for user, showing all orders for now...');
          // For now, just show all orders if no customer profile
          // This is a temporary fix to see if orders display works
          ordersData = await orderOperations.getAllOrders();
        }
      } else if (userData.role === 'admin' || userData.role === 'warehouse') {
        console.log('User is admin/warehouse, getting all orders...');
        ordersData = await orderOperations.getAllOrders();
      } else {
        console.log('User role not recognized:', userData.role);
      }



      console.log('Final orders data received:', ordersData);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      throw error;
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product')
        .select(`
          productid,
          productname,
          description,
          unitprice,
          supplier:supplier(suppliername)
        `)
        .order('productname'); // Alphabetical for products is OK

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddToOrder = () => {
    if (!selectedProductId || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.productid === selectedProductId);
    if (!product) return;

    // Check if product already in order
    const existingItemIndex = orderItems.findIndex(item => item.productid === selectedProductId);

    if (existingItemIndex >= 0) {
      // Update quantity
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      setOrderItems([...orderItems, {
        productid: product.productid,
        productname: product.productname,
        quantity: quantity,
        unitprice: product.unitprice
      }]);
    }

    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveFromOrder = (productid: string) => {
    setOrderItems(orderItems.filter(item => item.productid !== productid));
  };

  const handleCreateOrder = async () => {
    if (!user || orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to your order",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get customer ID
      const { data: customerData } = await supabase
        .from('customers')
        .select('customerid')
        .eq('userid', user.id)
        .single();

      if (!customerData) {
        toast({
          title: "Error",
          description: "Customer profile not found. Please switch to customer role first.",
          variant: "destructive",
        });
        return;
      }

      const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitprice), 0);
      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7); // 7 days from now

      // Generate UUID for order (backup solution)
      const orderId = crypto.randomUUID();

      // Create order (using correct table name "Order")
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

      // Use the returned order data
      const orderData = newOrder;

      // Create order details (note: unitprice is stored in product table, not orderdetail)
      let primaryWarehouseId = null;

      for (const item of orderItems) {
        const { error: detailError } = await supabase
          .from('orderdetail')
          .insert({
            orderid: orderData.orderid,
            productid: item.productid,
            quantity: item.quantity
            // shipmentid will be null initially
          });

        if (detailError) throw detailError;

        // Update inventory (reduce stock)
        const { data: inventoryData } = await supabase
          .from('inventory')
          .select('quantity, warehouseid')
          .eq('productid', item.productid)
          .single();

        if (inventoryData && inventoryData.quantity >= item.quantity) {
          // Store the warehouse ID for shipment creation
          if (!primaryWarehouseId) {
            primaryWarehouseId = inventoryData.warehouseid;
          }

          await supabase
            .from('inventory')
            .update({ quantity: inventoryData.quantity - item.quantity })
            .eq('productid', item.productid)
            .eq('warehouseid', inventoryData.warehouseid);

          // Log inventory transaction (using correct schema columns)
          await supabase
            .from('inventorylog')
            .insert({
              logid: crypto.randomUUID(),
              productid: item.productid,
              warehouseid: inventoryData.warehouseid,
              movementtype: 'out',
              quantity: item.quantity,
              referencetype: 'order',
              referenceid: orderData.orderid,
              timestamp: new Date().toISOString()
            });
        }
      }

      // Auto-create shipment
      if (primaryWarehouseId) {
        // Get a default carrier
        const { data: carrierData } = await supabase
          .from('shippingcarrier')
          .select('carrierid')
          .limit(1)
          .single();

        if (carrierData) {
          await supabase
            .from('shipments')
            .insert({
              shipmentid: crypto.randomUUID(),
              carrierid: carrierData.carrierid,
              orderid: orderData.orderid,
              warehouseid: primaryWarehouseId,
              shipmentdate: new Date().toISOString(),
              trackingnumber: `TRK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
              status: 'pending'
            });
        }
      }

      toast({
        title: "Success",
        description: `Order created successfully! Order ID: ${orderData.orderid.slice(0, 8)}...`,
      });

      // Reset form and reload data
      setOrderItems([]);
      setIsCreating(false);
      await loadOrders(user);

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateOrderTotal = (orderDetails: OrderWithDetails['orderdetail']) => {
    return orderDetails.reduce((total, detail) => {
      const unitPrice = detail.product?.unitprice || 0;
      return total + (detail.quantity * unitPrice);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['Order', 'orderdetail']}
          relatedTables={['customers', 'product', 'inventory', 'shipments']}
          operations={['Track Order Status', 'View Order Details', 'Monitor Shipments']}
          description="Track your orders from placement to delivery. Orders displayed newest first for easy tracking. Status flow: pending → processing → shipped → delivered with real-time updates."
        />

        {/* Customer Order Flow Guidance */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Your Order Journey</h3>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>1. Shop:</strong> Browse products and add to cart</p>
            <p><strong>2. Checkout:</strong> Complete payment and place order</p>
            <p><strong>3. Processing:</strong> Warehouse confirms and prepares your order</p>
            <p><strong>4. Shipping:</strong> Carrier picks up and delivers your order</p>
            <p><strong>5. Delivered:</strong> Receive your products and leave feedback</p>
            <p className="mt-2 font-medium text-green-900">
              Track your orders below and manage returns if needed
            </p>
          </div>
        </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">
              {user?.role === 'customer' ? 'Your order history and tracking' : 'Manage all customer orders'}
            </p>
          </div>
          <SqlTooltip
            page="Orders"
            queries={[
              {
                title: "Load Customer Orders",
                description: "Get customer orders with product details, newest orders first",
                type: "SELECT",
                sql: `SELECT
  o.*,
  od.quantity,
  p.productname,
  p.unitprice,
  s.status as shipment_status,
  s.trackingnumber
FROM "Order" o
JOIN customers c ON o.customerid = c.customerid
JOIN orderdetail od ON o.orderid = od.orderid
JOIN product p ON od.productid = p.productid
LEFT JOIN shipments s ON o.orderid = s.orderid
WHERE c.userid = $1
ORDER BY o.orderdate DESC; -- Newest orders first for customer view`
              },
              {
                title: "Track Order Status",
                description: "Monitor order progression through status workflow",
                type: "SELECT",
                sql: `SELECT
  osh.*,
  u.email as changed_by
FROM orderstatushistory osh
LEFT JOIN users u ON osh.changedbyuserid = u.userid
WHERE osh.orderid = $1
ORDER BY osh.changedat ASC;

-- Status flow:
-- pending → confirmed → processing → shipped → in_transit → delivered`
              }
            ]}
          />
        </div>
        {user?.role === 'customer' && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Add products to your order
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Add Product Section */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Add Products</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Product</Label>
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.productid} value={product.productid}>
                              {product.productname} - ${product.unitprice.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddToOrder} className="w-full">
                        Add to Order
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {orderItems.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4">Order Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.productid}>
                            <TableCell>{item.productname}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unitprice.toFixed(2)}</TableCell>
                            <TableCell>${(item.quantity * item.unitprice).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFromOrder(item.productid)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 text-right">
                      <p className="text-lg font-bold">
                        Total: ${orderItems.reduce((sum, item) => sum + (item.quantity * item.unitprice), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setOrderItems([]);
                    setSelectedProductId('');
                    setQuantity(1);
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateOrder}
                    disabled={orderItems.length === 0}
                  >
                    Create Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Orders Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'shipped').length}
            </div>
            <p className="text-xs text-muted-foreground">Being delivered</p>
          </CardContent>
        </Card>
      </div>



      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            {user?.role === 'customer' ? 'Track your orders and shipments' : 'All customer orders in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.orderid}>
                  <TableCell className="font-medium">
                    {order.orderid.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {new Date(order.orderdate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.orderdetail?.length || 0} items</TableCell>
                  <TableCell>
                    ${calculateOrderTotal(order.orderdetail || []).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {order.shipments && Array.isArray(order.shipments) && order.shipments.length > 0 ? (
                      <span className="text-sm text-blue-600">
                        {order.shipments[0].trackingnumber || 'Assigned'}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Not shipped</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Order Details</DialogTitle>
                          <DialogDescription>
                            Order #{selectedOrder?.orderid.slice(0, 8)}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedOrder && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium">Order Information</h4>
                                <p className="text-sm text-gray-600">
                                  Date: {new Date(selectedOrder.orderdate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Status: <Badge className={getStatusColor(selectedOrder.status)}>
                                    {selectedOrder.status}
                                  </Badge>
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium">Shipping</h4>
                                {selectedOrder.shipments && Array.isArray(selectedOrder.shipments) && selectedOrder.shipments.length > 0 ? (
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      Tracking: {selectedOrder.shipments[0].trackingnumber || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Status: {selectedOrder.shipments[0].status}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">Not yet shipped</p>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Order Items</h4>
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
                                  {(selectedOrder.orderdetail || []).map((detail) => (
                                    <TableRow key={detail.productid}>
                                      <TableCell>
                                        {detail.product?.productname || `Product ID: ${detail.productid}`}
                                      </TableCell>
                                      <TableCell>{detail.quantity}</TableCell>
                                      <TableCell>
                                        ${detail.product?.unitprice?.toFixed(2) || '0.00'}
                                      </TableCell>
                                      <TableCell>
                                        ${((detail.quantity * (detail.product?.unitprice || 0)).toFixed(2))}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              <div className="mt-4 text-right">
                                <p className="text-lg font-bold">
                                  Total: ${calculateOrderTotal(selectedOrder.orderdetail || []).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
