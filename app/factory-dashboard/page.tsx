'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Factory, 
  Package, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface DashboardStats {
  totalProductionOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalProduced: number;
  averageProductionTime: number;
  efficiencyRate: number;
}

interface ProductionOrder {
  productionorderid: string;
  productid: string;
  quantity: number;
  status: string;
  startdate: string;
  enddate?: string;
  product: {
    productname: string;
    unitprice: number;
  };
  purchaseorder?: {
    purchaseorderid: string;
    supplier: {
      suppliername: string;
    };
  };
}

interface ProductionMetrics {
  dailyOutput: number;
  weeklyOutput: number;
  monthlyOutput: number;
  qualityRate: number;
}

export default function FactoryDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProductionOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    totalProduced: 0,
    averageProductionTime: 0,
    efficiencyRate: 0
  });
  const [recentProduction, setRecentProduction] = useState<ProductionOrder[]>([]);
  const [metrics, setMetrics] = useState<ProductionMetrics>({
    dailyOutput: 0,
    weeklyOutput: 0,
    monthlyOutput: 0,
    qualityRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadStats(),
            loadRecentProduction(),
            loadMetrics()
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
      // Get production orders count
      const { count: totalCount } = await supabase
        .from('production')
        .select('*', { count: 'exact' });

      const { count: pendingCount } = await supabase
        .from('production')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      const { count: inProgressCount } = await supabase
        .from('production')
        .select('*', { count: 'exact' })
        .eq('status', 'in_progress');

      const { count: completedCount } = await supabase
        .from('production')
        .select('*', { count: 'exact' })
        .eq('status', 'completed');

      // Get total produced quantity
      const { data: completedProduction } = await supabase
        .from('production')
        .select('quantity')
        .eq('status', 'completed');

      const totalProduced = completedProduction?.reduce((sum, p) => sum + p.quantity, 0) || 0;

      setStats({
        totalProductionOrders: totalCount || 0,
        pendingOrders: pendingCount || 0,
        inProgressOrders: inProgressCount || 0,
        completedOrders: completedCount || 0,
        totalProduced,
        averageProductionTime: 2.5, // Mock data
        efficiencyRate: 95.5 // Mock data
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentProduction = async () => {
    try {
      const { data, error } = await supabase
        .from('production')
        .select(`
          *,
          product(productname, unitprice),
          purchaseorder(
            purchaseorderid,
            supplier(suppliername)
          )
        `)
        .order('startdate', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentProduction(data || []);
    } catch (error) {
      console.error('Error loading recent production:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Daily output
      const { data: dailyData } = await supabase
        .from('production')
        .select('quantity')
        .eq('status', 'completed')
        .gte('enddate', today.toISOString().split('T')[0]);

      // Weekly output
      const { data: weeklyData } = await supabase
        .from('production')
        .select('quantity')
        .eq('status', 'completed')
        .gte('enddate', weekAgo.toISOString());

      // Monthly output
      const { data: monthlyData } = await supabase
        .from('production')
        .select('quantity')
        .eq('status', 'completed')
        .gte('enddate', monthAgo.toISOString());

      setMetrics({
        dailyOutput: dailyData?.reduce((sum, p) => sum + p.quantity, 0) || 0,
        weeklyOutput: weeklyData?.reduce((sum, p) => sum + p.quantity, 0) || 0,
        monthlyOutput: monthlyData?.reduce((sum, p) => sum + p.quantity, 0) || 0,
        qualityRate: 98.2 // Mock data
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Settings className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Factory Dashboard</h1>
          <p className="text-gray-600">Overview of manufacturing operations and production metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Factory className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProductionOrders}</div>
              <p className="text-xs text-muted-foreground">production orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">awaiting start</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Play className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressOrders}</div>
              <p className="text-xs text-muted-foreground">manufacturing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produced</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProduced.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">units manufactured</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Production Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageProductionTime}h</div>
              <p className="text-xs text-muted-foreground">per order</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efficiency Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.efficiencyRate}%</div>
              <p className="text-xs text-muted-foreground">operational efficiency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.qualityRate}%</div>
              <p className="text-xs text-muted-foreground">quality control</p>
            </CardContent>
          </Card>
        </div>

        {/* Production Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{metrics.dailyOutput}</div>
              <p className="text-sm text-muted-foreground">units produced today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.weeklyOutput}</div>
              <p className="text-sm text-muted-foreground">units produced this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{metrics.monthlyOutput}</div>
              <p className="text-sm text-muted-foreground">units produced this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Production Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Production Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProduction.slice(0, 8).map((order) => (
                  <TableRow key={order.productionorderid}>
                    <TableCell className="font-mono">
                      #{order.productionorderid.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.product?.productname}</p>
                        <p className="text-sm text-gray-600">${order.product?.unitprice}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{order.quantity} units</TableCell>
                    <TableCell>{order.purchaseorder?.supplier?.suppliername || 'Direct'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.startdate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {recentProduction.length === 0 && (
              <div className="text-center py-8">
                <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No production orders</h3>
                <p className="text-gray-600">Production orders will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
