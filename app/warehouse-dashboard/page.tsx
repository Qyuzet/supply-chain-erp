'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  totalProducts: number;
  lowStockItems: number;
  totalLocations: number;
  averageProcessingTime: number;
}

interface RecentOrder {
  orderid: string;
  orderdate: string;
  orderstatus: string;
  customers: {
    customername: string;
  };
  orderdetail: Array<{
    quantity: number;
    product: {
      productname: string;
    };
  }>;
}

interface LowStockAlert {
  productid: string;
  productname: string;
  currentstock: number;
  minimumstock: number;
  warehousename: string;
}

export default function WarehouseDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    totalLocations: 0,
    averageProcessingTime: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadStats(),
            loadRecentOrders(),
            loadLowStockAlerts()
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
      // Get orders count
      const { count: totalOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });

      const { count: pendingOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('orderstatus', 'pending');

      const { count: shippedOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('orderstatus', 'shipped');

      // Get inventory stats
      const { count: totalProductsCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact' });

      const { count: lowStockCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact' })
        .lt('quantity', 10); // Consider items with less than 10 as low stock

      // Get warehouse locations count
      const { count: locationsCount } = await supabase
        .from('warehouses')
        .select('*', { count: 'exact' });

      setStats({
        totalOrders: totalOrdersCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        shippedOrders: shippedOrdersCount || 0,
        totalProducts: totalProductsCount || 0,
        lowStockItems: lowStockCount || 0,
        totalLocations: locationsCount || 0,
        averageProcessingTime: 2.5 // Mock data for now
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          orderid,
          orderdate,
          orderstatus,
          customers(customername),
          orderdetail(
            quantity,
            product(productname)
          )
        `)
        .order('orderdate', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  const loadLowStockAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          productid,
          quantity,
          product(productname),
          warehouses(warehousename)
        `)
        .lt('quantity', 10)
        .order('quantity', { ascending: true })
        .limit(5);

      if (error) throw error;
      
      const alerts = data?.map(item => ({
        productid: item.productid,
        productname: item.product?.productname || 'Unknown',
        currentstock: item.quantity,
        minimumstock: 10,
        warehousename: item.warehouses?.warehousename || 'Unknown'
      })) || [];

      setLowStockAlerts(alerts);
    } catch (error) {
      console.error('Error loading low stock alerts:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Dashboard</h1>
          <p className="text-gray-600">Overview of warehouse operations and inventory management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">need processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">inventory items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warehouse Locations</CardTitle>
              <MapPin className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLocations}</div>
              <p className="text-xs text-muted-foreground">active locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipped Orders</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shippedOrders}</div>
              <p className="text-xs text-muted-foreground">out for delivery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageProcessingTime}h</div>
              <p className="text-xs text-muted-foreground">order to ship</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efficiency Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground">order accuracy</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.slice(0, 5).map((order) => (
                    <TableRow key={order.orderid}>
                      <TableCell className="font-mono">
                        #{order.orderid.slice(0, 8)}
                      </TableCell>
                      <TableCell>{order.customers?.customername}</TableCell>
                      <TableCell>
                        {order.orderdetail?.reduce((sum, detail) => sum + detail.quantity, 0)} items
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.orderstatus)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.orderstatus)}
                            {order.orderstatus}
                          </div>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {recentOrders.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent orders</h3>
                  <p className="text-gray-600">Recent orders will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockAlerts.map((alert) => (
                    <TableRow key={alert.productid}>
                      <TableCell className="font-medium">{alert.productname}</TableCell>
                      <TableCell>
                        <span className="text-red-600 font-bold">{alert.currentstock}</span>
                      </TableCell>
                      <TableCell>{alert.minimumstock}</TableCell>
                      <TableCell>{alert.warehousename}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {lowStockAlerts.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All stock levels good</h3>
                  <p className="text-gray-600">No low stock alerts at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
