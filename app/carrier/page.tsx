'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import JourneyCard from '@/components/JourneyCard';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Phone,
  Plus
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface Shipment {
  shipmentid: string;
  orderid: string;
  shipmentdate: string;
  trackingnumber: string;
  carrierid: string;
  shipmentstatus: string;
  orders: {
    orderid: string;
    orderdate: string;
    orderstatus: string;
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
  shippingcarrier: {
    carrierid: string;
    carriername: string;
    servicelevel: string;
  };
}

interface CarrierProfile {
  carrierid: string;
  carriername: string;
  servicelevel: string;
  contactinfo: string;
}

export default function CarrierPage() {
  const [user, setUser] = useState<User | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [carriers, setCarriers] = useState<CarrierProfile[]>([]);
  const [currentCarrier, setCurrentCarrier] = useState<CarrierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isSettingCarrier, setIsSettingCarrier] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadCarriers(),
            loadShipments()
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

  // Reload shipments when carrier changes
  useEffect(() => {
    if (currentCarrier) {
      loadShipments();
    }
  }, [currentCarrier]);

  const loadCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('shippingcarrier')
        .select('*')
        .order('carriername');

      if (error) throw error;
      setCarriers(data || []);

      // Check if user has a carrier profile
      const userCarrier = data?.find(c => c.userid === user?.id);
      if (userCarrier) {
        setCurrentCarrier(userCarrier);
      }
    } catch (error) {
      console.error('Error loading carriers:', error);
    }
  };

  const loadShipments = async () => {
    try {
      // FIXED: Load ALL shipments with proper joins
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          shipmentid,
          orderid,
          shipmentdate,
          trackingnumber,
          carrierid,
          shipmentstatus,
          orders!shipments_orderid_fkey(
            orderid,
            orderdate,
            orderstatus,
            customers!orders_customerid_fkey(customername, address, phone)
          ),
          warehouses!shipments_warehouseid_fkey(warehousename, location),
          shippingcarrier!shipments_carrierid_fkey(carrierid, carriername, servicelevel)
        `)
        .order('shipmentdate', { ascending: false });

      if (error) throw error;
      console.log('🚛 All shipments loaded:', data);
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

  const switchCarrier = async (carrierId: string) => {
    const carrier = carriers.find(c => c.carrierid === carrierId);
    if (carrier) {
      setCurrentCarrier(carrier);
      await loadShipments(); // Reload shipments for new carrier
      toast({
        title: "Carrier Switched",
        description: `Now operating as ${carrier.carriername}`,
      });
    }
  };

  const createCarrierProfile = async (carrierName: string, serviceLevel: string, contactInfo: string) => {
    try {
      const { data, error } = await supabase
        .from('shippingcarrier')
        .insert({
          userid: user?.id,
          carriername: carrierName,
          servicelevel: serviceLevel,
          contactinfo: contactInfo
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Carrier profile created successfully",
      });

      await loadCarriers();
      setCurrentCarrier(data);
      setIsSettingCarrier(false);
    } catch (error) {
      console.error('Error creating carrier profile:', error);
      toast({
        title: "Error",
        description: "Failed to create carrier profile",
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (shipment: Shipment, newStatus: string) => {
    // FIXED: Check if current carrier is assigned to this shipment
    if (!currentCarrier) {
      toast({
        title: "Error",
        description: "Please select a carrier identity first",
        variant: "destructive",
      });
      return;
    }

    if (shipment.carrierid !== currentCarrier.carrierid) {
      toast({
        title: "Access Denied",
        description: "You can only modify shipments assigned to your carrier",
        variant: "destructive",
      });
      return;
    }

    setUpdating(shipment.shipmentid);

    try {
      console.log(`🚛 Carrier ${currentCarrier.carriername} updating order ${shipment.orderid} from ${shipment.orders?.orderstatus} to ${newStatus}`);

      // Update order status instead of shipment status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ orderstatus: newStatus })
        .eq('orderid', shipment.orderid);

      if (orderError) throw orderError;

      // Log status change in orderstatushistory
      const { error: historyError } = await supabase
        .from('orderstatushistory')
        .insert({
          historyid: crypto.randomUUID(),
          orderid: shipment.orderid,
          oldstatus: shipment.orders?.orderstatus || 'unknown',
          newstatus: newStatus,
          changedat: new Date().toISOString(),
          changedbyuserid: user?.id || null,
          note: `Status updated by carrier ${currentCarrier.carriername}`
        });

      if (historyError) throw historyError;

      toast({
        title: "Status Updated",
        description: `Order status updated to ${newStatus} by ${currentCarrier.carriername}`,
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
      ready_for_pickup: 'bg-orange-100 text-orange-800', // FIXED: Ready for pickup
      shipped: 'bg-green-100 text-green-800',            // Picked up by carrier
      in_transit: 'bg-purple-100 text-purple-800',       // In delivery
      delivered: 'bg-gray-100 text-gray-800',            // Completed
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
      ready_for_pickup: 'shipped',   // FIXED: Warehouse ready → Carrier picks up
      shipped: 'in_transit',         // Picked up → In transit
      in_transit: 'delivered',       // In transit → Delivered
      delivered: null,
      cancelled: null
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getNextStatusLabel = (currentStatus: string) => {
    const labels = {
      ready_for_pickup: 'Pick Up Package',      // FIXED: Pick up from warehouse
      shipped: 'Start Delivery',               // Start transit
      in_transit: 'Mark as Delivered',         // Complete delivery
      delivered: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[currentStatus as keyof typeof labels] || 'Update Status';
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

  // FIXED: Use correct data structure and status names
  const readyForPickup = shipments.filter(s => s.orders?.orderstatus === 'ready_for_pickup');
  const inTransitShipments = shipments.filter(s => s.orders?.orderstatus === 'in_transit');
  const shippedShipments = shipments.filter(s => s.orders?.orderstatus === 'shipped');
  const completedShipments = shipments.filter(s => ['delivered', 'cancelled'].includes(s.orders?.orderstatus || ''));
  const totalActiveShipments = readyForPickup.length + inTransitShipments.length + shippedShipments.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['shipments']}
          relatedTables={['Order', 'customers', 'warehouses', 'shippingcarrier']}
          operations={['Track Shipments', 'Update Status', 'Manage Deliveries']}
          description="Carrier shipment management and delivery tracking"
        />

        <JourneyCard
          title="Delivery Workflow"
          description="3-stage carrier delivery process from pickup to completion."
          currentStep={0}
          steps={[
            {
              step: "Ready for Pickup",
              description: "Orders prepared by warehouse, waiting for collection"
            },
            {
              step: "In Transit",
              description: "Orders picked up and being delivered to customers"
            },
            {
              step: "Delivered",
              description: "Orders successfully delivered to customers"
            }
          ]}
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

        {/* Carrier Selection */}
        {!currentCarrier && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">Select Your Carrier Identity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-orange-800">
                  Choose which carrier you're operating as, or create a new carrier profile.
                </p>
                <div className="flex flex-wrap gap-2">
                  {carriers.map((carrier) => (
                    <Button
                      key={carrier.carrierid}
                      variant="outline"
                      onClick={() => switchCarrier(carrier.carrierid)}
                      className="border-orange-300 hover:bg-orange-100"
                    >
                      {carrier.carriername} ({carrier.servicelevel})
                    </Button>
                  ))}
                  <Button
                    onClick={() => setIsSettingCarrier(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Carrier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Carrier Dashboard
              {currentCarrier && (
                <span className="text-lg font-normal text-orange-600 ml-2">
                  - {currentCarrier.carriername}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {currentCarrier
                ? `Managing shipments for ${currentCarrier.carriername}`
                : 'Select a carrier identity to manage shipments'
              }
            </p>
          </div>
          {currentCarrier && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentCarrier(null)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Switch Carrier
              </Button>
            </div>
          )}
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
                  .filter(s => ['ready_for_pickup', 'shipped', 'in_transit'].includes(s.orders?.orderstatus || '')) // Show all active shipments
                  .map((shipment) => {
                    const isAssignedToCurrentCarrier = currentCarrier && shipment.carrierid === currentCarrier.carrierid;
                    return (
                  <TableRow key={shipment.shipmentid}>
                    <TableCell className="font-mono">
                      {shipment.trackingnumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">#{shipment.orders?.orderid?.slice(0, 8) || 'N/A'}</p>
                        <p className="text-sm text-gray-600">
                          {shipment.orders?.orderdate ? new Date(shipment.orders.orderdate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shipment.orders?.customers?.customername || 'N/A'}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {shipment.orders?.customers?.phone || 'N/A'}
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
                        <p className="text-sm">{shipment.orders?.customers?.address || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(shipment.orders?.orderstatus || 'unknown')}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(shipment.orders?.orderstatus || 'unknown')}
                          {shipment.orders?.orderstatus || 'Unknown'}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Show carrier assignment info */}
                        <div className="text-xs text-gray-500">
                          {shipment.shippingcarrier?.carriername || 'Unassigned'}
                        </div>

                        {/* Action buttons - only enabled for assigned carrier */}
                        {getNextStatus(shipment.orders?.orderstatus || 'unknown') && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(shipment, getNextStatus(shipment.orders?.orderstatus || 'unknown')!)}
                            disabled={updating === shipment.shipmentid || !isAssignedToCurrentCarrier}
                            variant={isAssignedToCurrentCarrier ? "default" : "outline"}
                            className={!isAssignedToCurrentCarrier ? "opacity-50" : ""}
                          >
                            {updating === shipment.shipmentid ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : null}
                            {getNextStatusLabel(shipment.orders?.orderstatus || 'unknown')}
                            {!isAssignedToCurrentCarrier && " (Not Assigned)"}
                          </Button>
                        )}

                        {shipment.orders?.orderstatus === 'delivered' && (
                          <Badge variant="secondary">Completed</Badge>
                        )}

                        {shipment.orders?.orderstatus === 'cancelled' && isAssignedToCurrentCarrier && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(shipment, 'pending')}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                    );
                  })}
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

        {/* Create Carrier Dialog */}
        <Dialog open={isSettingCarrier} onOpenChange={setIsSettingCarrier}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Carrier Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Carrier Name</Label>
                <Input
                  placeholder="e.g., JNE Express, DHL, FedEx"
                  id="carrierName"
                />
              </div>
              <div>
                <Label>Service Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="overnight">Overnight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact Info</Label>
                <Input
                  placeholder="Phone or email"
                  id="contactInfo"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsSettingCarrier(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  const carrierName = (document.getElementById('carrierName') as HTMLInputElement)?.value;
                  const serviceLevel = 'standard'; // Default for now
                  const contactInfo = (document.getElementById('contactInfo') as HTMLInputElement)?.value;

                  if (carrierName && contactInfo) {
                    createCarrierProfile(carrierName, serviceLevel, contactInfo);
                  }
                }}>
                  Create Carrier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
