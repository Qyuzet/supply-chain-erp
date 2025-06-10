'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Phone
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface Shipment {
  shipmentid: string;
  orderid: string;
  shipmentdate: string;
  trackingnumber: string;
  order: {
    orderid: string;
    orderdate: string;
    status: string; // Use order status instead
    customers: {
      customername: string;
      address: string;
      phone: string;
    };
  };
  warehouses: {
    warehousename: string;
    location: string;
  };
}

export default function CarrierPage() {
  const [user, setUser] = useState<User | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await loadShipments();
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadShipments = async () => {
    try {
      // Get all shipments including orders ready for pickup (shipped status)
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          shipmentid,
          orderid,
          shipmentdate,
          trackingnumber,
          order:Order(
            orderid,
            orderdate,
            status,
            customers(customername, address, phone)
          ),
          warehouses(warehousename, location)
        `)
        .order('shipmentdate', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error('Error loading shipments:', error);
      toast({
        title: "Error",
        description: "Failed to load shipments",
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (shipment: Shipment, newStatus: string) => {
    setUpdating(shipment.shipmentid);

    try {
      // Update order status instead of shipment status
      const { error: orderError } = await supabase
        .from('Order')
        .update({ status: newStatus })
        .eq('orderid', shipment.orderid);

      if (orderError) throw orderError;

      // Log status change in orderstatushistory
      const { error: historyError } = await supabase
        .from('orderstatushistory')
        .insert({
          historyid: crypto.randomUUID(),
          orderid: shipment.orderid,
          oldstatus: shipment.order.status,
          newstatus: newStatus,
          changedat: new Date().toISOString(),
          changedbyuserid: user?.id || null,
          note: `Status updated by carrier`
        });

      if (historyError) throw historyError;

      toast({
        title: "Status Updated",
        description: `Order status updated to ${newStatus}`,
      });

      await loadShipments();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-green-100 text-green-800',      // Ready for pickup
      in_transit: 'bg-purple-100 text-purple-800', // In delivery
      delivered: 'bg-gray-100 text-gray-800',      // Completed
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <Package className="h-4 w-4" />;
      case 'shipped': return <Package className="h-4 w-4" />;     // Ready for pickup
      case 'in_transit': return <Truck className="h-4 w-4" />;    // In delivery
      case 'delivered': return <CheckCircle className="h-4 w-4" />; // Completed
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      shipped: 'in_transit',     // Warehouse ready → Carrier picks up
      in_transit: 'delivered',   // In transit → Delivered
      delivered: null,
      cancelled: null
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getNextStatusLabel = (currentStatus: string) => {
    const labels = {
      shipped: 'Pick Up & Start Delivery',
      in_transit: 'Mark as Delivered',
      delivered: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[currentStatus as keyof typeof labels];
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

  const readyForPickup = shipments.filter(s => s.order.status === 'shipped');
  const inTransitShipments = shipments.filter(s => s.order.status === 'in_transit');
  const completedShipments = shipments.filter(s => ['delivered', 'cancelled'].includes(s.order.status));
  const totalActiveShipments = readyForPickup.length + inTransitShipments.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['shipments']}
          relatedTables={['Order', 'customers', 'warehouses', 'shippingcarrier']}
          operations={['Track Shipments', 'Update Status', 'Manage Deliveries']}
          description="Carrier shipment management and delivery tracking"
        />

        {/* Carrier Flow Guidance */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-2">Carrier Workflow</h3>
          <div className="text-sm text-orange-800 space-y-1">
            <p><strong>1. Ready for Pickup:</strong> Warehouse marks orders as "shipped" (ready for pickup)</p>
            <p><strong>2. Pickup:</strong> Collect packages from warehouse - orders show as "shipped"</p>
            <p><strong>3. Delivery:</strong> Deliver to customer and mark as "delivered"</p>
            <p><strong>4. Tracking:</strong> Customers can track via tracking number</p>
            <p className="mt-2 font-medium text-orange-900">
              Your Role: Pick up "shipped" orders from warehouse and deliver to customers
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Carrier Dashboard</h1>
            <p className="text-gray-600">Manage pickups, deliveries, and shipment tracking</p>
          </div>
          <SqlTooltip
            page="Carrier"
            queries={[
              {
                title: "Load Shipments with FIFO",
                description: "Get shipments ordered by shipment date (First In, First Out)",
                type: "SELECT",
                sql: `SELECT
  s.*,
  o.orderdate,
  o.status as order_status,
  c.customername,
  w.warehousename,
  w.location
FROM shipments s
JOIN "Order" o ON s.orderid = o.orderid
JOIN customers c ON o.customerid = c.customerid
JOIN warehouses w ON s.warehouseid = w.warehouseid
WHERE s.carrierid = $1
ORDER BY s.shipmentdate ASC; -- FIFO ordering`
              },
              {
                title: "Update Shipment Status",
                description: "Update shipment status in 3-stage flow: shipped → in_transit → delivered",
                type: "UPDATE",
                sql: `UPDATE shipments
SET status = $1
WHERE shipmentid = $2
  AND carrierid = $3;

-- Status flow:
-- 'shipped' → 'in_transit' → 'delivered'`
              },
              {
                title: "Update Order Status",
                description: "Sync order status when shipment is delivered",
                type: "UPDATE",
                sql: `UPDATE "Order"
SET status = 'delivered'
WHERE orderid = (
  SELECT orderid
  FROM shipments
  WHERE shipmentid = $1
) AND status != 'delivered';`
              }
            ]}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readyForPickup.length}</div>
              <p className="text-xs text-muted-foreground">warehouse ready</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inTransitShipments.length}</div>
              <p className="text-xs text-muted-foreground">on delivery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActiveShipments}</div>
              <p className="text-xs text-muted-foreground">total active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedShipments.filter(s => 
                  new Date(s.shipmentdate).toDateString() === new Date().toDateString()
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shipments.length}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>
        </div>

        {/* Shipments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Pickup Location</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments
                  .filter(s => ['shipped', 'in_transit'].includes(s.order.status)) // Only show active shipments
                  .map((shipment) => (
                  <TableRow key={shipment.shipmentid}>
                    <TableCell className="font-mono">
                      {shipment.trackingnumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">#{shipment.order.orderid.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(shipment.order.orderdate).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shipment.order.customers.customername}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {shipment.order.customers.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{shipment.warehouses.warehousename}</p>
                          <p className="text-xs text-gray-600">{shipment.warehouses.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2 max-w-xs">
                        <Navigation className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{shipment.order.customers.address}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(shipment.order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(shipment.order.status)}
                          {shipment.order.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getNextStatus(shipment.order.status) && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(shipment, getNextStatus(shipment.order.status)!)}
                          disabled={updating === shipment.shipmentid}
                        >
                          {updating === shipment.shipmentid ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : null}
                          {getNextStatusLabel(shipment.order.status)}
                        </Button>
                      )}
                      {shipment.order.status === 'delivered' && (
                        <Badge variant="secondary">Completed</Badge>
                      )}
                      {shipment.order.status === 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(shipment, 'pending')}
                        >
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {shipments.length === 0 && (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments found</h3>
                <p className="text-gray-600">Shipments will appear here when orders are placed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
