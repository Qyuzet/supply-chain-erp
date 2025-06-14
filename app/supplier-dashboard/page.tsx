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
  DollarSign, 
  TrendingUp,
  Factory,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface DashboardStats {
  totalProducts: number;
  activePurchaseOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  productionOrders: number;
  averageRating: number;
}

interface RecentActivity {
  id: string;
  type: 'purchase_order' | 'payment' | 'production' | 'product';
  title: string;
  description: string;
  date: string;
  status: string;
}

export default function SupplierDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activePurchaseOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    productionOrders: 0,
    averageRating: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadStats(userData),
            loadRecentActivity(userData)
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

  const loadStats = async (userData: User) => {
    try {
      // Get supplier profile
      const { data: supplierData } = await supabase
        .from('supplier')
        .select('supplierid')
        .limit(1)
        .single();

      if (!supplierData) return;

      // Get products count
      const { count: productsCount } = await supabase
        .from('product')
        .select('*', { count: 'exact' })
        .eq('supplierid', supplierData.supplierid);

      // Get active purchase orders
      const { count: poCount } = await supabase
        .from('purchaseorder')
        .select('*', { count: 'exact' })
        .eq('supplierid', supplierData.supplierid)
        .in('status', ['pending', 'confirmed', 'in_production']);

      // Get total revenue from completed payments
      const { data: paymentsData } = await supabase
        .from('paymentsupplier')
        .select('amount')
        .eq('supplierid', supplierData.supplierid)
        .eq('status', 'completed');

      const totalRevenue = paymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Get pending payments
      const { count: pendingPaymentsCount } = await supabase
        .from('paymentsupplier')
        .select('*', { count: 'exact' })
        .eq('supplierid', supplierData.supplierid)
        .eq('status', 'pending');

      // Get production orders
      const { count: productionCount } = await supabase
        .from('production')
        .select('*', { count: 'exact' })
        .eq('product.supplierid', supplierData.supplierid);

      // Get average rating
      const { data: performanceData } = await supabase
        .from('supplierperformance')
        .select('rating')
        .eq('supplierid', supplierData.supplierid);

      const averageRating = performanceData?.length 
        ? performanceData.reduce((sum, p) => sum + p.rating, 0) / performanceData.length 
        : 0;

      setStats({
        totalProducts: productsCount || 0,
        activePurchaseOrders: poCount || 0,
        totalRevenue,
        pendingPayments: pendingPaymentsCount || 0,
        productionOrders: productionCount || 0,
        averageRating
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async (userData: User) => {
    try {
      const activities: RecentActivity[] = [];

      // Get recent purchase orders
      const { data: recentPOs } = await supabase
        .from('purchaseorder')
        .select('purchaseorderid, orderdate, status, totalamount')
        .order('orderdate', { ascending: false })
        .limit(5);

      recentPOs?.forEach(po => {
        activities.push({
          id: po.purchaseorderid,
          type: 'purchase_order',
          title: `Purchase Order #${po.purchaseorderid.slice(0, 8)}`,
          description: `$${po.totalamount} - ${po.status}`,
          date: po.orderdate,
          status: po.status
        });
      });

      // Get recent payments
      const { data: recentPayments } = await supabase
        .from('paymentsupplier')
        .select('paymentid, paymentdate, amount, status')
        .order('paymentdate', { ascending: false })
        .limit(3);

      recentPayments?.forEach(payment => {
        activities.push({
          id: payment.paymentid,
          type: 'payment',
          title: `Payment Received`,
          description: `$${payment.amount} - ${payment.status}`,
          date: payment.paymentdate,
          status: payment.status
        });
      });

      // Sort by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'purchase_order': return <ShoppingCart className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'production': return <Factory className="h-4 w-4" />;
      case 'product': return <Package className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      in_production: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600">Overview of your supplier operations and performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">products in catalog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePurchaseOrders}</div>
              <p className="text-xs text-muted-foreground">purchase orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Production Orders</CardTitle>
              <Factory className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productionOrders}</div>
              <p className="text-xs text-muted-foreground">in production</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
              <p className="text-xs text-muted-foreground">performance rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.type)}
                        {activity.title}
                      </div>
                    </TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {recentActivity.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                <p className="text-gray-600">Your recent supplier activities will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
