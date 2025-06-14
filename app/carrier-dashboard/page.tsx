'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Route,
  Navigation
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface DashboardStats {
  totalShipments: number;
  pendingPickups: number;
  inTransit: number;
  delivered: number;
  totalDistance: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}

interface RecentShipment {
  shipmentid: string;
  orderid: string;
  shipmentdate: string;
  trackingnumber: string;
  order: {
    orderstatus: string;
    customers: {
      customername: string;
      address: string;
    }[];
  }[];
  warehouses: {
    warehousename: string;
    location: string;
  }[];
}

export default function CarrierDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    pendingPickups: 0,
    inTransit: 0,
    delivered: 0,
    totalDistance: 0,
    averageDeliveryTime: 0,
    onTimeDeliveryRate: 0
  });
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadStats(),
            loadRecentShipments()
          ]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadStats = async () => {
    try {
      // Get shipments count
      const { count: totalCount } = await supabase
        .from('shipments')
        .select('*', { count: 'exact' });

      const { count: pendingCount } = await supabase
        .from('shipments')
        .select('*', { count: 'exact' })
        .eq('order.orderstatus', 'shipped');

      const { count: inTransitCount } = await supabase
        .from('shipments')
        .select('*', { count: 'exact' })
        .eq('order.orderstatus', 'in_transit');

      const { count: deliveredCount } = await supabase
        .from('shipments')
        .select('*', { count: 'exact' })
        .eq('order.orderstatus', 'delivered');

      setStats({
        totalShipments: totalCount || 0,
        pendingPickups: pendingCount || 0,
        inTransit: inTransitCount || 0,
        delivered: deliveredCount || 0,
        totalDistance: 1250, // Mock data
        averageDeliveryTime: 2.3, // Mock data
        onTimeDeliveryRate: 96.5 // Mock data
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          shipmentid,
          orderid,
          shipmentdate,
          trackingnumber,
          order:orders(
            orderstatus,
            customers(customername, address)
          ),
          warehouses(warehousename, location)
        `)
        .order('shipmentdate', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentShipments(data || []);
    } catch (error) {
      console.error('Error loading recent shipments:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      shipped: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'shipped': return <Package className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carrier Dashboard</h1>
          <p className="text-gray-600">Overview of delivery operations and logistics performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShipments}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Pickups</CardTitle>
              <Package className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPickups}</div>
              <p className="text-xs text-muted-foreground">ready for pickup</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Navigation className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inTransit}</div>
              <p className="text-xs text-muted-foreground">on the way</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delivered}</div>
              <p className="text-xs text-muted-foreground">completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              <Route className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDistance.toLocaleString()} km</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageDeliveryTime} days</div>
              <p className="text-xs text-muted-foreground">door to door</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onTimeDeliveryRate}%</div>
              <p className="text-xs text-muted-foreground">delivery performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Level</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Premium</div>
              <p className="text-xs text-muted-foreground">service tier</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Shipments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentShipments.slice(0, 8).map((shipment) => (
                  <TableRow key={shipment.shipmentid}>
                    <TableCell className="font-mono">
                      {shipment.trackingnumber || `#${shipment.shipmentid.slice(0, 8)}`}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shipment.order?.[0]?.customers?.[0]?.customername}</p>
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {shipment.order?.[0]?.customers?.[0]?.address}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{shipment.warehouses?.[0]?.warehousename}</p>
                          <p className="text-sm text-gray-600">{shipment.warehouses?.[0]?.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm truncate max-w-xs">
                          {shipment.order?.[0]?.customers?.[0]?.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(shipment.order?.[0]?.orderstatus || 'unknown')}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(shipment.order?.[0]?.orderstatus || 'unknown')}
                          {shipment.order?.[0]?.orderstatus || 'Unknown'}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(shipment.shipmentdate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {recentShipments.length === 0 && (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments found</h3>
                <p className="text-gray-600">Recent shipments will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
