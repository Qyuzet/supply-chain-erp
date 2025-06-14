'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Truck,
  Star,
  Target,
  BarChart3
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface PerformanceMetrics {
  onTimeDeliveryRate: number;
  averageDeliveryTime: number;
  customerSatisfaction: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageRating: number;
  totalDistance: number;
}

interface MonthlyPerformance {
  month: string;
  deliveries: number;
  onTimeRate: number;
  avgRating: number;
  distance: number;
}

export default function CarrierPerformancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    onTimeDeliveryRate: 0,
    averageDeliveryTime: 0,
    customerSatisfaction: 0,
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageRating: 0,
    totalDistance: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadPerformanceMetrics(),
            loadMonthlyPerformance()
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

  const loadPerformanceMetrics = async () => {
    try {
      // Mock performance data
      setMetrics({
        onTimeDeliveryRate: 96.5,
        averageDeliveryTime: 2.3,
        customerSatisfaction: 4.7,
        totalDeliveries: 1247,
        successfulDeliveries: 1203,
        failedDeliveries: 44,
        averageRating: 4.6,
        totalDistance: 15420
      });
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const loadMonthlyPerformance = async () => {
    try {
      // Mock monthly data
      const mockData: MonthlyPerformance[] = [
        { month: 'Jan 2024', deliveries: 98, onTimeRate: 94.2, avgRating: 4.5, distance: 1250 },
        { month: 'Feb 2024', deliveries: 112, onTimeRate: 96.4, avgRating: 4.6, distance: 1380 },
        { month: 'Mar 2024', deliveries: 125, onTimeRate: 97.1, avgRating: 4.7, distance: 1520 },
        { month: 'Apr 2024', deliveries: 134, onTimeRate: 95.8, avgRating: 4.6, distance: 1650 },
        { month: 'May 2024', deliveries: 142, onTimeRate: 98.2, avgRating: 4.8, distance: 1720 },
        { month: 'Jun 2024', deliveries: 156, onTimeRate: 96.9, avgRating: 4.7, distance: 1890 }
      ];
      
      setMonthlyData(mockData);
    } catch (error) {
      console.error('Error loading monthly performance:', error);
    }
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (value: number, threshold: number) => {
    if (value >= threshold) return 'bg-green-100 text-green-800';
    if (value >= threshold * 0.8) return 'bg-yellow-100 text-yellow-800';
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carrier Performance</h1>
          <p className="text-gray-600">Track delivery performance metrics and KPIs</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.onTimeDeliveryRate, 95)}`}>
                {metrics.onTimeDeliveryRate}%
              </div>
              <p className="text-xs text-muted-foreground">target: 95%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(3 - metrics.averageDeliveryTime, 0.5)}`}>
                {metrics.averageDeliveryTime} days
              </div>
              <p className="text-xs text-muted-foreground">target: &lt;3 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.averageRating, 4.5)}`}>
                {metrics.averageRating}/5.0
              </div>
              <p className="text-xs text-muted-foreground">target: 4.5+</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor((metrics.successfulDeliveries / metrics.totalDeliveries) * 100, 98)}`}>
                {((metrics.successfulDeliveries / metrics.totalDeliveries) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">target: 98%</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Deliveries</span>
                <span className="text-2xl font-bold">{metrics.totalDeliveries.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Successful Deliveries</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-green-600">{metrics.successfulDeliveries.toLocaleString()}</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Failed Deliveries</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-red-600">{metrics.failedDeliveries}</span>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Distance</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{metrics.totalDistance.toLocaleString()} km</span>
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">On-Time Performance</span>
                  <Badge className={getPerformanceBadge(metrics.onTimeDeliveryRate, 95)}>
                    {metrics.onTimeDeliveryRate >= 95 ? 'Excellent' : metrics.onTimeDeliveryRate >= 90 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${metrics.onTimeDeliveryRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <Badge className={getPerformanceBadge(metrics.customerSatisfaction, 4.5)}>
                    {metrics.customerSatisfaction >= 4.5 ? 'Excellent' : metrics.customerSatisfaction >= 4.0 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(metrics.customerSatisfaction / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Delivery Success Rate</span>
                  <Badge className={getPerformanceBadge((metrics.successfulDeliveries / metrics.totalDeliveries) * 100, 98)}>
                    {((metrics.successfulDeliveries / metrics.totalDeliveries) * 100) >= 98 ? 'Excellent' : 'Good'}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.successfulDeliveries / metrics.totalDeliveries) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead>On-Time Rate</TableHead>
                  <TableHead>Avg Rating</TableHead>
                  <TableHead>Distance (km)</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        {month.deliveries}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={getPerformanceColor(month.onTimeRate, 95)}>
                        {month.onTimeRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className={getPerformanceColor(month.avgRating, 4.5)}>
                          {month.avgRating}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        {month.distance.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPerformanceBadge(month.onTimeRate, 95)}>
                        {month.onTimeRate >= 95 ? 'Excellent' : month.onTimeRate >= 90 ? 'Good' : 'Poor'}
                      </Badge>
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
