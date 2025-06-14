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
  Factory,
  Target,
  BarChart3,
  Zap,
  Award
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface FactoryMetrics {
  productionEfficiency: number;
  qualityRate: number;
  onTimeDelivery: number;
  totalProduced: number;
  defectRate: number;
  averageProductionTime: number;
  capacityUtilization: number;
  costPerUnit: number;
}

interface ProductionData {
  month: string;
  produced: number;
  efficiency: number;
  qualityRate: number;
  onTime: number;
}

export default function FactoryPerformancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<FactoryMetrics>({
    productionEfficiency: 0,
    qualityRate: 0,
    onTimeDelivery: 0,
    totalProduced: 0,
    defectRate: 0,
    averageProductionTime: 0,
    capacityUtilization: 0,
    costPerUnit: 0
  });
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadFactoryMetrics(),
            loadProductionData()
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

  const loadFactoryMetrics = async () => {
    try {
      // Mock factory performance data
      setMetrics({
        productionEfficiency: 94.2,
        qualityRate: 98.7,
        onTimeDelivery: 96.1,
        totalProduced: 15420,
        defectRate: 1.3,
        averageProductionTime: 4.2,
        capacityUtilization: 87.5,
        costPerUnit: 12.45
      });
    } catch (error) {
      console.error('Error loading factory metrics:', error);
    }
  };

  const loadProductionData = async () => {
    try {
      // Mock production data
      const mockData: ProductionData[] = [
        { month: 'Jan 2024', produced: 1250, efficiency: 92.1, qualityRate: 97.8, onTime: 94.2 },
        { month: 'Feb 2024', produced: 1380, efficiency: 93.4, qualityRate: 98.1, onTime: 95.6 },
        { month: 'Mar 2024', produced: 1520, efficiency: 94.7, qualityRate: 98.5, onTime: 96.8 },
        { month: 'Apr 2024', produced: 1650, efficiency: 93.8, qualityRate: 98.2, onTime: 95.1 },
        { month: 'May 2024', produced: 1720, efficiency: 95.2, qualityRate: 99.1, onTime: 97.3 },
        { month: 'Jun 2024', produced: 1890, efficiency: 94.9, qualityRate: 98.9, onTime: 96.7 }
      ];
      
      setProductionData(mockData);
    } catch (error) {
      console.error('Error loading production data:', error);
    }
  };

  const getPerformanceColor = (value: number, threshold: number, reverse = false) => {
    if (reverse) {
      if (value <= threshold) return 'text-green-600';
      if (value <= threshold * 1.5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= threshold) return 'text-green-600';
      if (value >= threshold * 0.8) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getPerformanceBadge = (value: number, threshold: number, reverse = false) => {
    if (reverse) {
      if (value <= threshold) return 'bg-green-100 text-green-800';
      if (value <= threshold * 1.5) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    } else {
      if (value >= threshold) return 'bg-green-100 text-green-800';
      if (value >= threshold * 0.8) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Factory Performance</h1>
          <p className="text-gray-600">Monitor production efficiency and quality metrics</p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Production Efficiency</CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.productionEfficiency, 90)}`}>
                {metrics.productionEfficiency}%
              </div>
              <p className="text-xs text-muted-foreground">target: 90%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.qualityRate, 95)}`}>
                {metrics.qualityRate}%
              </div>
              <p className="text-xs text-muted-foreground">target: 95%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.onTimeDelivery, 95)}`}>
                {metrics.onTimeDelivery}%
              </div>
              <p className="text-xs text-muted-foreground">target: 95%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Defect Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.defectRate, 2, true)}`}>
                {metrics.defectRate}%
              </div>
              <p className="text-xs text-muted-foreground">target: &lt;2%</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produced</CardTitle>
              <Factory className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalProduced.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">units this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Production Time</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(5 - metrics.averageProductionTime, 0.5)}`}>
                {metrics.averageProductionTime}h
              </div>
              <p className="text-xs text-muted-foreground">per unit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.capacityUtilization, 80)}`}>
                {metrics.capacityUtilization}%
              </div>
              <p className="text-xs text-muted-foreground">of total capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Per Unit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.costPerUnit}</div>
              <p className="text-xs text-muted-foreground">average cost</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Production Efficiency</span>
                  <Badge className={getPerformanceBadge(metrics.productionEfficiency, 90)}>
                    {metrics.productionEfficiency >= 90 ? 'Excellent' : metrics.productionEfficiency >= 80 ? 'Good' : 'Poor'}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${metrics.productionEfficiency}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Quality Rate</span>
                  <Badge className={getPerformanceBadge(metrics.qualityRate, 95)}>
                    {metrics.qualityRate >= 95 ? 'Excellent' : metrics.qualityRate >= 90 ? 'Good' : 'Poor'}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${metrics.qualityRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Capacity Utilization</span>
                  <Badge className={getPerformanceBadge(metrics.capacityUtilization, 80)}>
                    {metrics.capacityUtilization >= 80 ? 'Optimal' : metrics.capacityUtilization >= 60 ? 'Good' : 'Low'}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${metrics.capacityUtilization}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Quality Rate</span>
                <span className="text-2xl font-bold text-green-600">{metrics.qualityRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Defect Rate</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-semibold ${getPerformanceColor(metrics.defectRate, 2, true)}`}>
                    {metrics.defectRate}%
                  </span>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Units Produced</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{metrics.totalProduced.toLocaleString()}</span>
                  <Factory className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Cost per Unit</span>
                <span className="text-lg font-semibold">${metrics.costPerUnit}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Production Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Production Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Units Produced</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Quality Rate</TableHead>
                  <TableHead>On-Time Delivery</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionData.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-purple-600" />
                        {month.produced.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={getPerformanceColor(month.efficiency, 90)}>
                        {month.efficiency}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-500" />
                        <span className={getPerformanceColor(month.qualityRate, 95)}>
                          {month.qualityRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className={getPerformanceColor(month.onTime, 95)}>
                          {month.onTime}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPerformanceBadge(month.efficiency, 90)}>
                        {month.efficiency >= 90 ? 'Excellent' : month.efficiency >= 80 ? 'Good' : 'Poor'}
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
