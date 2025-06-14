'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Truck,
  Factory,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    trend: 'up' | 'down';
  };
  orders: {
    total: number;
    growth: number;
    trend: 'up' | 'down';
  };
  customers: {
    total: number;
    growth: number;
    trend: 'up' | 'down';
  };
  products: {
    total: number;
    growth: number;
    trend: 'up' | 'down';
  };
}

interface TopPerformers {
  products: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  customers: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  suppliers: Array<{
    name: string;
    products: number;
    revenue: number;
  }>;
}

interface SystemHealth {
  orderProcessing: number;
  inventoryAccuracy: number;
  deliveryPerformance: number;
  systemUptime: number;
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: { total: 0, growth: 0, trend: 'up' },
    orders: { total: 0, growth: 0, trend: 'up' },
    customers: { total: 0, growth: 0, trend: 'up' },
    products: { total: 0, growth: 0, trend: 'up' }
  });
  const [topPerformers, setTopPerformers] = useState<TopPerformers>({
    products: [],
    customers: [],
    suppliers: []
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    orderProcessing: 0,
    inventoryAccuracy: 0,
    deliveryPerformance: 0,
    systemUptime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData && userData.role === 'admin') {
          await Promise.all([
            loadAnalytics(),
            loadTopPerformers(),
            loadSystemHealth()
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

  const loadAnalytics = async () => {
    try {
      // Mock analytics data
      setAnalytics({
        revenue: { total: 1247500, growth: 12.5, trend: 'up' },
        orders: { total: 3420, growth: 8.3, trend: 'up' },
        customers: { total: 1250, growth: 15.2, trend: 'up' },
        products: { total: 450, growth: 5.7, trend: 'up' }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadTopPerformers = async () => {
    try {
      // Mock top performers data
      setTopPerformers({
        products: [
          { name: 'Premium Widget A', sales: 1250, revenue: 125000 },
          { name: 'Standard Component B', sales: 980, revenue: 98000 },
          { name: 'Deluxe Assembly C', sales: 750, revenue: 112500 },
          { name: 'Basic Part D', sales: 650, revenue: 32500 },
          { name: 'Advanced Module E', sales: 420, revenue: 84000 }
        ],
        customers: [
          { name: 'TechCorp Industries', orders: 45, revenue: 450000 },
          { name: 'Global Manufacturing', orders: 38, revenue: 380000 },
          { name: 'Precision Systems', orders: 32, revenue: 320000 },
          { name: 'Innovation Labs', orders: 28, revenue: 280000 },
          { name: 'Future Dynamics', orders: 25, revenue: 250000 }
        ],
        suppliers: [
          { name: 'Quality Components Ltd', products: 125, revenue: 625000 },
          { name: 'Reliable Parts Co', products: 98, revenue: 490000 },
          { name: 'Premium Materials Inc', products: 87, revenue: 435000 },
          { name: 'Standard Supply Corp', products: 76, revenue: 380000 },
          { name: 'Advanced Tech Solutions', products: 65, revenue: 325000 }
        ]
      });
    } catch (error) {
      console.error('Error loading top performers:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      // Mock system health data
      setSystemHealth({
        orderProcessing: 96.5,
        inventoryAccuracy: 98.2,
        deliveryPerformance: 94.8,
        systemUptime: 99.9
      });
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getHealthColor = (value: number) => {
    if (value >= 95) return 'text-green-600';
    if (value >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (value: number) => {
    if (value >= 95) return 'bg-green-100 text-green-800';
    if (value >= 90) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access analytics.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive business intelligence and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.revenue.total)}</div>
              <div className="flex items-center text-xs">
                {analytics.revenue.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={analytics.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {analytics.revenue.growth}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.orders.total.toLocaleString()}</div>
              <div className="flex items-center text-xs">
                {analytics.orders.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={analytics.orders.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {analytics.orders.growth}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.customers.total.toLocaleString()}</div>
              <div className="flex items-center text-xs">
                {analytics.customers.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={analytics.customers.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {analytics.customers.growth}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.products.total}</div>
              <div className="flex items-center text-xs">
                {analytics.products.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={analytics.products.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {analytics.products.growth}% from last month
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getHealthColor(systemHealth.orderProcessing)}`}>
                  {systemHealth.orderProcessing}%
                </div>
                <p className="text-sm text-gray-600">Order Processing</p>
                <Badge className={getHealthBadge(systemHealth.orderProcessing)}>
                  {systemHealth.orderProcessing >= 95 ? 'Excellent' : systemHealth.orderProcessing >= 90 ? 'Good' : 'Poor'}
                </Badge>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getHealthColor(systemHealth.inventoryAccuracy)}`}>
                  {systemHealth.inventoryAccuracy}%
                </div>
                <p className="text-sm text-gray-600">Inventory Accuracy</p>
                <Badge className={getHealthBadge(systemHealth.inventoryAccuracy)}>
                  {systemHealth.inventoryAccuracy >= 95 ? 'Excellent' : systemHealth.inventoryAccuracy >= 90 ? 'Good' : 'Poor'}
                </Badge>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getHealthColor(systemHealth.deliveryPerformance)}`}>
                  {systemHealth.deliveryPerformance}%
                </div>
                <p className="text-sm text-gray-600">Delivery Performance</p>
                <Badge className={getHealthBadge(systemHealth.deliveryPerformance)}>
                  {systemHealth.deliveryPerformance >= 95 ? 'Excellent' : systemHealth.deliveryPerformance >= 90 ? 'Good' : 'Poor'}
                </Badge>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getHealthColor(systemHealth.systemUptime)}`}>
                  {systemHealth.systemUptime}%
                </div>
                <p className="text-sm text-gray-600">System Uptime</p>
                <Badge className={getHealthBadge(systemHealth.systemUptime)}>
                  {systemHealth.systemUptime >= 95 ? 'Excellent' : systemHealth.systemUptime >= 90 ? 'Good' : 'Poor'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sales}</TableCell>
                      <TableCell>{formatCurrency(product.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.customers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell>{formatCurrency(customer.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.suppliers.map((supplier, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.products}</TableCell>
                      <TableCell>{formatCurrency(supplier.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
