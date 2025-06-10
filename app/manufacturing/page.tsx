'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import { 
  Factory, 
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
  BarChart3,
  Activity
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface ProductionStats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalProduced: number;
  productionRate: number;
}

interface ProductionTrend {
  date: string;
  completed: number;
  produced: number;
}

export default function ManufacturingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProductionStats>({
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    totalProduced: 0,
    productionRate: 0
  });
  const [recentProductions, setRecentProductions] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadProductionStats(),
            loadRecentProductions(),
            loadTopProducts()
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

  const loadProductionStats = async () => {
    try {
      const { data: productions, error } = await supabase
        .from('production')
        .select('status, quantity, startdate, enddate');

      if (error) throw error;

      const totalOrders = productions?.length || 0;
      const pendingOrders = productions?.filter(p => p.status === 'pending').length || 0;
      const inProgressOrders = productions?.filter(p => p.status === 'in_progress').length || 0;
      const completedOrders = productions?.filter(p => p.status === 'completed').length || 0;
      const totalProduced = productions?.filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.quantity, 0) || 0;

      // Calculate production rate (completed orders / total orders * 100)
      const productionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      setStats({
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        totalProduced,
        productionRate
      });
    } catch (error) {
      console.error('Error loading production stats:', error);
    }
  };

  const loadRecentProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('production')
        .select(`
          productionorderid,
          quantity,
          status,
          startdate,
          enddate,
          product(productname, unitprice),
          purchaseorder(
            supplier(suppliername)
          )
        `)
        .order('startdate', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentProductions(data || []);
    } catch (error) {
      console.error('Error loading recent productions:', error);
    }
  };

  const loadTopProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('production')
        .select(`
          productid,
          quantity,
          status,
          product(productname, unitprice)
        `)
        .eq('status', 'completed');

      if (error) throw error;

      // Group by product and sum quantities
      const productMap = new Map();
      data?.forEach(production => {
        const productId = production.productid;
        if (productMap.has(productId)) {
          productMap.get(productId).totalProduced += production.quantity;
          productMap.get(productId).orderCount += 1;
        } else {
          productMap.set(productId, {
            productid: productId,
            productname: production.product?.productname,
            unitprice: production.product?.unitprice,
            totalProduced: production.quantity,
            orderCount: 1
          });
        }
      });

      // Convert to array and sort by total produced
      const topProductsArray = Array.from(productMap.values())
        .sort((a, b) => b.totalProduced - a.totalProduced)
        .slice(0, 5);

      setTopProducts(topProductsArray);
    } catch (error) {
      console.error('Error loading top products:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
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
        <DatabaseIndicator
          primaryTables={['production']}
          relatedTables={['product', 'purchaseorder', 'supplier', 'inventory']}
          operations={['Production Analytics', 'Manufacturing Metrics', 'Performance Tracking']}
          description="Manufacturing dashboard with production analytics and performance metrics"
        />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manufacturing Dashboard</h1>
          <p className="text-gray-600">Monitor production performance and manufacturing metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Factory className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">production orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressOrders}</div>
              <p className="text-xs text-muted-foreground">currently manufacturing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">finished orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produced</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProduced}</div>
              <p className="text-xs text-muted-foreground">units manufactured</p>
            </CardContent>
          </Card>
        </div>

        {/* Production Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Production Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-muted-foreground">{stats.productionRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.productionRate} className="w-full" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgressOrders}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Productions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Production Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProductions.map((production) => (
                  <div key={production.productionorderid} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                        {getStatusIcon(production.status)}
                      </div>
                      <div>
                        <p className="font-medium">{production.product?.productname}</p>
                        <p className="text-sm text-gray-600">
                          {production.quantity} units • {production.purchaseorder?.supplier?.suppliername}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(production.status)}>
                      {production.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {recentProductions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Factory className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent production orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Manufactured Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.productid} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.productname}</p>
                        <p className="text-sm text-gray-600">
                          {product.orderCount} orders • ${product.unitprice}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{product.totalProduced}</div>
                      <div className="text-xs text-gray-600">units produced</div>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No production data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
