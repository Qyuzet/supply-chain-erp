'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users,
  Download,
  Calendar,
  FileText
} from 'lucide-react';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import type { User } from '@/lib/auth';

interface ReportData {
  ordersByStatus: Array<{ name: string; value: number; color: string }>;
  ordersByMonth: Array<{ month: string; orders: number; revenue: number }>;
  topProducts: Array<{ productname: string; totalOrders: number; revenue: number }>;
  usersByRole: Array<{ role: string; count: number }>;
  inventoryStatus: Array<{ status: string; count: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    ordersByStatus: [],
    ordersByMonth: [],
    topProducts: [],
    usersByRole: [],
    inventoryStatus: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        if (userData) {
          await loadReportData();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load reports data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast, selectedPeriod]);

  const loadReportData = async () => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));

      // Load orders by status
      const { data: orders } = await supabase
        .from('Order')
        .select('status')
        .gte('orderdate', startDate.toISOString());

      const ordersByStatus = orders?.reduce((acc: any, order) => {
        const status = order.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(ordersByStatus || {}).map(([status, count], index) => ({
        name: status,
        value: count as number,
        color: COLORS[index % COLORS.length]
      }));

      // Load orders by month (last 6 months)
      const { data: monthlyOrders } = await supabase
        .from('Order')
        .select(`
          orderdate,
          orderdetail(
            quantity,
            product(unitprice)
          )
        `)
        .gte('orderdate', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

      const monthlyData = monthlyOrders?.reduce((acc: any, order) => {
        const month = new Date(order.orderdate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { orders: 0, revenue: 0 };
        }
        acc[month].orders += 1;
        
        // Calculate revenue
        const orderRevenue = order.orderdetail?.reduce((sum: number, detail: any) => {
          return sum + (detail.quantity * (detail.product?.unitprice || 0));
        }, 0) || 0;
        acc[month].revenue += orderRevenue;
        
        return acc;
      }, {});

      const ordersByMonth = Object.entries(monthlyData || {}).map(([month, data]: [string, any]) => ({
        month,
        orders: data.orders,
        revenue: data.revenue
      }));

      // Load top products
      const { data: productData } = await supabase
        .from('orderdetail')
        .select(`
          quantity,
          product(productname, unitprice),
          order!inner(orderdate)
        `)
        .gte('order.orderdate', startDate.toISOString());

      const productStats = productData?.reduce((acc: any, detail) => {
        const productName = detail.product?.productname || 'Unknown';
        if (!acc[productName]) {
          acc[productName] = { totalOrders: 0, revenue: 0 };
        }
        acc[productName].totalOrders += detail.quantity;
        acc[productName].revenue += detail.quantity * (detail.product?.unitprice || 0);
        return acc;
      }, {});

      const topProducts = Object.entries(productStats || {})
        .map(([productname, stats]: [string, any]) => ({
          productname,
          totalOrders: stats.totalOrders,
          revenue: stats.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Load users by role
      const { data: users } = await supabase
        .from('users')
        .select('role');

      const usersByRole = users?.reduce((acc: any, user) => {
        const role = user.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const roleData = Object.entries(usersByRole || {}).map(([role, count]) => ({
        role,
        count: count as number
      }));

      // Load inventory status
      const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity');

      const inventoryStatus = inventory?.reduce((acc: any, item) => {
        let status = 'Normal';
        if (item.quantity === 0) status = 'Out of Stock';
        else if (item.quantity < 10) status = 'Low Stock';
        else if (item.quantity > 100) status = 'Overstocked';
        
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const inventoryData = Object.entries(inventoryStatus || {}).map(([status, count]) => ({
        status,
        count: count as number
      }));

      setReportData({
        ordersByStatus: statusData,
        ordersByMonth,
        topProducts,
        usersByRole: roleData,
        inventoryStatus: inventoryData
      });

    } catch (error) {
      console.error('Error loading report data:', error);
      throw error;
    }
  };

  const exportReport = () => {
    // Create HTML content for PDF
    const totalRevenue = reportData.ordersByMonth.reduce((sum, month) => sum + month.revenue, 0);
    const totalOrders = reportData.ordersByMonth.reduce((sum, month) => sum + month.orders, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supply Chain Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
          .section { margin-bottom: 25px; page-break-inside: avoid; }
          .section h2 { color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-item { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
          .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Supply Chain Management Report</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Period:</strong> Last ${selectedPeriod} days</p>
        </div>

        <div class="section">
          <h2>Executive Summary</h2>
          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">$${totalRevenue.toFixed(2)}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${totalOrders}</div>
              <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">$${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}</div>
              <div class="stat-label">Avg Order Value</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${reportData.usersByRole.reduce((sum, role) => sum + role.count, 0)}</div>
              <div class="stat-label">Active Users</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Orders by Status</h2>
          <table>
            <thead>
              <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
            </thead>
            <tbody>
              ${reportData.ordersByStatus.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.value}</td>
                  <td>${((item.value / reportData.ordersByStatus.reduce((sum, s) => sum + s.value, 0)) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Monthly Performance</h2>
          <table>
            <thead>
              <tr><th>Month</th><th>Orders</th><th>Revenue</th><th>Avg Order Value</th></tr>
            </thead>
            <tbody>
              ${reportData.ordersByMonth.map(month => `
                <tr>
                  <td>${month.month}</td>
                  <td>${month.orders}</td>
                  <td>$${month.revenue.toFixed(2)}</td>
                  <td>$${month.orders > 0 ? (month.revenue / month.orders).toFixed(2) : '0.00'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Top Products</h2>
          <table>
            <thead>
              <tr><th>Product Name</th><th>Total Orders</th><th>Revenue</th><th>Avg Order Size</th></tr>
            </thead>
            <tbody>
              ${reportData.topProducts.map(product => `
                <tr>
                  <td>${product.productname}</td>
                  <td>${product.totalOrders}</td>
                  <td>$${product.revenue.toFixed(2)}</td>
                  <td>$${product.totalOrders > 0 ? (product.revenue / product.totalOrders).toFixed(2) : '0.00'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Users by Role</h2>
          <table>
            <thead>
              <tr><th>Role</th><th>Count</th><th>Percentage</th></tr>
            </thead>
            <tbody>
              ${reportData.usersByRole.map(role => `
                <tr>
                  <td>${role.role}</td>
                  <td>${role.count}</td>
                  <td>${((role.count / reportData.usersByRole.reduce((sum, r) => sum + r.count, 0)) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Inventory Status</h2>
          <table>
            <thead>
              <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
            </thead>
            <tbody>
              ${reportData.inventoryStatus.map(status => `
                <tr>
                  <td>${status.status}</td>
                  <td>${status.count}</td>
                  <td>${((status.count / reportData.inventoryStatus.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <p style="text-align: center; color: #666; font-size: 12px; margin-top: 40px;">
            Report generated by Supply Chain Management System on ${new Date().toLocaleString()}
          </p>
        </div>
      </body>
      </html>
    `;

    // Create a new window and print to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
      }, 500);

      toast({
        title: "Success",
        description: "Report opened for PDF download. Use your browser's print function to save as PDF.",
      });
    } else {
      // Fallback: create downloadable HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supply-chain-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Report downloaded as HTML. Open in browser and print to PDF.",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </DashboardLayout>
    );
  }

  const totalRevenue = reportData.ordersByMonth.reduce((sum, month) => sum + month.revenue, 0);
  const totalOrders = reportData.ordersByMonth.reduce((sum, month) => sum + month.orders, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['Order', 'orderdetail']}
          relatedTables={['users', 'product', 'inventory', 'customers']}
          operations={['Generate Reports', 'Export PDF', 'Analytics Dashboard', 'Performance Metrics']}
          description="Business intelligence and analytics with comprehensive reporting across all system data"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600">Business intelligence and performance metrics</p>
            </div>
            <SqlTooltip
              page="Reports & Analytics"
              queries={[
                {
                  title: "Orders by Status Analysis",
                  description: "Analyze order distribution across different statuses",
                  type: "SELECT",
                  sql: `SELECT
  status,
  COUNT(*) as order_count,
  (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "Order")) as percentage
FROM "Order"
WHERE orderdate >= NOW() - INTERVAL '30 days'
GROUP BY status
ORDER BY order_count DESC;`
                },
                {
                  title: "Monthly Revenue Analysis",
                  description: "Calculate monthly orders and revenue trends",
                  type: "SELECT",
                  sql: `SELECT
  DATE_TRUNC('month', o.orderdate) as month,
  COUNT(o.orderid) as total_orders,
  SUM(od.quantity * p.unitprice) as total_revenue,
  AVG(od.quantity * p.unitprice) as avg_order_value
FROM "Order" o
JOIN orderdetail od ON o.orderid = od.orderid
JOIN product p ON od.productid = p.productid
WHERE o.orderdate >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', o.orderdate)
ORDER BY month DESC;`
                },
                {
                  title: "Top Products by Revenue",
                  description: "Identify best-performing products by sales volume and revenue",
                  type: "SELECT",
                  sql: `SELECT
  p.productname,
  SUM(od.quantity) as total_quantity_sold,
  SUM(od.quantity * p.unitprice) as total_revenue,
  COUNT(DISTINCT o.orderid) as order_count,
  AVG(od.quantity * p.unitprice) as avg_order_value
FROM orderdetail od
JOIN product p ON od.productid = p.productid
JOIN "Order" o ON od.orderid = o.orderid
WHERE o.orderdate >= NOW() - INTERVAL '30 days'
GROUP BY p.productid, p.productname
ORDER BY total_revenue DESC
LIMIT 10;`
                },
                {
                  title: "User Distribution by Role",
                  description: "Analyze user base composition across different roles",
                  type: "SELECT",
                  sql: `SELECT
  role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN isactive = true THEN 1 END) as active_users,
  (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users)) as percentage
FROM users
GROUP BY role
ORDER BY user_count DESC;`
                },
                {
                  title: "Inventory Status Analysis",
                  description: "Categorize inventory levels and identify stock issues",
                  type: "SELECT",
                  sql: `SELECT
  CASE
    WHEN i.quantity = 0 THEN 'Out of Stock'
    WHEN i.quantity < 10 THEN 'Low Stock'
    WHEN i.quantity > 100 THEN 'Overstocked'
    ELSE 'Normal'
  END as stock_status,
  COUNT(*) as product_count,
  SUM(i.quantity) as total_quantity,
  AVG(i.quantity) as avg_quantity
FROM inventory i
JOIN product p ON i.productid = p.productid
GROUP BY stock_status
ORDER BY product_count DESC;`
                }
              ]}
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Last {selectedPeriod} days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">Last {selectedPeriod} days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Per order</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.usersByRole.reduce((sum, role) => sum + role.count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total users</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
              <CardDescription>Distribution of order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Orders and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.ordersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="orders" fill="#8884d8" name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg Order Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.productname}</TableCell>
                    <TableCell>{product.totalOrders}</TableCell>
                    <TableCell>${product.revenue.toFixed(2)}</TableCell>
                    <TableCell>
                      {product.totalOrders > 0 ? (product.revenue / product.totalOrders).toFixed(2) : '0.00'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Role */}
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>Distribution of user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.usersByRole}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inventory Status */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Stock level distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.inventoryStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
