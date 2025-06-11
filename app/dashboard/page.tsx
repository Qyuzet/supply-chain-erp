'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  TrendingUp, 
  Users, 
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import SqlTooltip from '@/components/SqlTooltip';
import type { User } from '@/lib/auth';

interface DashboardStats {
  totalOrders?: number;
  pendingShipments?: number;
  activeProducts?: number;
  revenue?: number;
  lowStockItems?: number;
  completedDeliveries?: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        if (userData) {
          await loadStats(userData.role);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const loadStats = async (role: string) => {
    try {
      switch (role) {
        case 'customer':
          await loadCustomerStats();
          break;
        case 'supplier':
          await loadSupplierStats();
          break;
        case 'warehouse':
          await loadWarehouseStats();
          break;
        case 'carrier':
          await loadCarrierStats();
          break;
        case 'admin':
          await loadAdminStats();
          break;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadCustomerStats = async () => {
    try {
      // Get customer ID first
      const { data: customerData } = await supabase
        .from('customers')
        .select('customerid')
        .eq('userid', user?.id)
        .single();

      if (customerData) {
        // Get customer orders
        const { data: orders } = await supabase
          .from('Order')
          .select('*')
          .eq('customerid', customerData.customerid);

        // Get shipments for customer orders
        const { data: shipments } = await supabase
          .from('shipments')
          .select('*')
          .in('orderid', orders?.map(o => o.orderid) || []);

        setStats({
          totalOrders: orders?.length || 0,
          pendingShipments: shipments?.filter(s => s.status === 'pending' || s.status === 'in_transit').length || 0,
        });
      } else {
        // No customer profile found, set zero stats
        setStats({
          totalOrders: 0,
          pendingShipments: 0,
        });
      }
    } catch (error) {
      console.error('Error loading customer stats:', error);
      // Fallback to zero stats
      setStats({
        totalOrders: 0,
        pendingShipments: 0,
      });
    }
  };

  const loadSupplierStats = async () => {
    try {
      // Get supplier ID first
      const { data: supplierData } = await supabase
        .from('supplier')
        .select('supplierid')
        .eq('userid', user?.id)
        .single();

      if (supplierData) {
        // Get products for this supplier
        const { data: products } = await supabase
          .from('product')
          .select('*')
          .eq('supplierid', supplierData.supplierid);

        setStats({
          activeProducts: products?.length || 0,
        });
      } else {
        // No supplier profile found, set zero stats
        setStats({
          activeProducts: 0,
        });
      }
    } catch (error) {
      console.error('Error loading supplier stats:', error);
      // Fallback to zero stats
      setStats({
        totalOrders: 0,
        activeProducts: 0,
      });
    }
  };

  const loadWarehouseStats = async () => {
    try {
      // Get all inventory items
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*');

      // Get all shipments
      const { data: shipments } = await supabase
        .from('shipments')
        .select('*');

      // Get all orders
      const { data: orders } = await supabase
        .from('Order')
        .select('*');

      setStats({
        totalOrders: orders?.length || 0,
        pendingShipments: shipments?.filter(s => s.status === 'pending').length || 0,
        lowStockItems: inventory?.filter(i => i.quantity < 10).length || 0,
      });
    } catch (error) {
      console.error('Error loading warehouse stats:', error);
      // Fallback to zero stats
      setStats({
        totalOrders: 0,
        pendingShipments: 0,
        lowStockItems: 0,
      });
    }
  };

  const loadCarrierStats = async () => {
    try {
      // For now, just get all shipments since carrier table doesn't have userid
      const { data: shipments } = await supabase
        .from('shipments')
        .select('*');

      setStats({
        pendingShipments: shipments?.filter(s => s.status === 'pending' || s.status === 'in_transit').length || 0,
        completedDeliveries: shipments?.filter(s => s.status === 'delivered').length || 0,
      });
    } catch (error) {
      console.error('Error loading carrier stats:', error);
      // Fallback to zero stats
      setStats({
        pendingShipments: 0,
        completedDeliveries: 0,
      });
    }
  };

  const loadAdminStats = async () => {
    try {
      // Get all system data
      const [
        { data: orders },
        { data: products },
        { data: users },
        { data: inventory }
      ] = await Promise.all([
        supabase.from('Order').select('*'),
        supabase.from('product').select('*'),
        supabase.from('users').select('*'),
        supabase.from('inventory').select('*')
      ]);

      setStats({
        totalOrders: orders?.length || 0,
        totalUsers: users?.length || 0,
        totalProducts: products?.length || 0,
        activeUsers: users?.filter(u => u.isactive).length || 0,
        lowStockItems: inventory?.filter(i => i.quantity < 10).length || 0,
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
      // Fallback to zero stats
      setStats({
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        activeUsers: 0,
        lowStockItems: 0,
      });
    }
  };

  const getDashboardCards = () => {
    switch (user?.role) {
      case 'customer':
        return [
          {
            title: 'Total Orders',
            value: stats.totalOrders?.toString() || '0',
            icon: ShoppingCart,
            description: 'Orders placed',
            color: 'text-blue-600',
          },
          {
            title: 'Pending Shipments',
            value: stats.pendingShipments?.toString() || '0',
            icon: Truck,
            description: 'In transit',
            color: 'text-orange-600',
          },
        ];

      case 'supplier':
        return [
          {
            title: 'Active Products',
            value: stats.activeProducts?.toString() || '0',
            icon: Package,
            description: 'In catalog',
            color: 'text-blue-600',
          },
        ];

      case 'warehouse':
        return [
          {
            title: 'Inventory Items',
            value: stats.totalOrders?.toString() || '0',
            icon: Package,
            description: 'Total items',
            color: 'text-blue-600',
          },
          {
            title: 'Pending Shipments',
            value: stats.pendingShipments?.toString() || '0',
            icon: Truck,
            description: 'Ready to ship',
            color: 'text-orange-600',
          },
          {
            title: 'Low Stock Items',
            value: stats.lowStockItems?.toString() || '0',
            icon: AlertCircle,
            description: 'Need restocking',
            color: 'text-red-600',
          },
        ];

      case 'carrier':
        return [
          {
            title: 'Pending Deliveries',
            value: stats.pendingShipments?.toString() || '0',
            icon: Truck,
            description: 'Awaiting pickup',
            color: 'text-orange-600',
          },
          {
            title: 'Completed Deliveries',
            value: stats.completedDeliveries?.toString() || '0',
            icon: CheckCircle,
            description: 'This month',
            color: 'text-green-600',
          },
        ];

      case 'admin':
        return [
          {
            title: 'Total Orders',
            value: stats.totalOrders?.toString() || '0',
            icon: ShoppingCart,
            description: 'All time',
            color: 'text-blue-600',
          },
          {
            title: 'Active Products',
            value: stats.activeProducts?.toString() || '0',
            icon: Package,
            description: 'In system',
            color: 'text-green-600',
          },
          {
            title: 'Low Stock Alerts',
            value: stats.lowStockItems?.toString() || '0',
            icon: AlertCircle,
            description: 'Need attention',
            color: 'text-red-600',
          },
        ];

      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const dashboardCards = getDashboardCards();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.fullName}!
              </h1>
              <p className="text-gray-600">
                Here's what's happening with your {user?.role} account today.
              </p>
            </div>
            <SqlTooltip
              page={`${user?.role?.charAt(0).toUpperCase()}${user?.role?.slice(1)} Dashboard`}
              queries={[
                ...(user?.role === 'customer' ? [
                  {
                    title: "Load Customer Orders",
                    description: "Get customer's order history and statistics",
                    type: "SELECT" as const,
                    sql: `-- Get customer profile
SELECT customerid FROM customers
WHERE userid = $1;

-- Get customer orders
SELECT * FROM "Order"
WHERE customerid = $1
ORDER BY orderdate DESC;`
                  },
                  {
                    title: "Load Customer Shipments",
                    description: "Get shipment status for customer orders",
                    type: "SELECT" as const,
                    sql: `SELECT s.*
FROM shipments s
JOIN "Order" o ON s.orderid = o.orderid
WHERE o.customerid = $1
  AND s.status IN ('pending', 'in_transit')
ORDER BY s.shipmentdate DESC;`
                  }
                ] : []),
                ...(user?.role === 'supplier' ? [
                  {
                    title: "Load Supplier Products",
                    description: "Get supplier's product catalog statistics",
                    type: "SELECT" as const,
                    sql: `-- Get supplier profile
SELECT supplierid FROM supplier
WHERE userid = $1;

-- Get supplier products
SELECT * FROM product
WHERE supplierid = $1
ORDER BY productname;`
                  },
                  {
                    title: "Supplier Performance Metrics",
                    description: "Calculate supplier performance statistics",
                    type: "SELECT" as const,
                    sql: `SELECT
  COUNT(po.purchaseorderid) as total_orders,
  AVG(sp.overallrating) as avg_rating
FROM supplier s
LEFT JOIN purchaseorder po ON s.supplierid = po.supplierid
LEFT JOIN supplierperformance sp ON s.supplierid = sp.supplierid
WHERE s.userid = $1;`
                  }
                ] : []),
                ...(user?.role === 'warehouse' ? [
                  {
                    title: "Load Warehouse Statistics",
                    description: "Get comprehensive warehouse operational metrics",
                    type: "SELECT" as const,
                    sql: `-- Get all orders
SELECT COUNT(*) as total_orders FROM "Order";

-- Get pending shipments
SELECT COUNT(*) as pending_shipments
FROM shipments WHERE status = 'pending';

-- Get low stock items
SELECT COUNT(*) as low_stock_items
FROM inventory WHERE quantity < 10;`
                  },
                  {
                    title: "Inventory Analysis",
                    description: "Analyze inventory levels across all warehouses",
                    type: "SELECT" as const,
                    sql: `SELECT
  w.warehousename,
  COUNT(i.productid) as total_products,
  SUM(i.quantity) as total_quantity,
  COUNT(CASE WHEN i.quantity < 10 THEN 1 END) as low_stock_count
FROM warehouses w
LEFT JOIN inventory i ON w.warehouseid = i.warehouseid
GROUP BY w.warehouseid, w.warehousename;`
                  }
                ] : []),
                ...(user?.role === 'carrier' ? [
                  {
                    title: "Load Carrier Shipments",
                    description: "Get shipment statistics for carrier operations",
                    type: "SELECT" as const,
                    sql: `-- Get pending and in-transit shipments
SELECT COUNT(*) as pending_shipments
FROM shipments
WHERE status IN ('pending', 'in_transit');

-- Get completed deliveries
SELECT COUNT(*) as completed_deliveries
FROM shipments
WHERE status = 'delivered';`
                  },
                  {
                    title: "Delivery Performance",
                    description: "Calculate carrier delivery performance metrics",
                    type: "SELECT" as const,
                    sql: `SELECT
  sc.carriername,
  COUNT(s.shipmentid) as total_shipments,
  COUNT(CASE WHEN s.status = 'delivered' THEN 1 END) as completed,
  (COUNT(CASE WHEN s.status = 'delivered' THEN 1 END) * 100.0 / COUNT(s.shipmentid)) as completion_rate
FROM shippingcarrier sc
LEFT JOIN shipments s ON sc.carrierid = s.carrierid
GROUP BY sc.carrierid, sc.carriername;`
                  }
                ] : []),
                ...(user?.role === 'admin' ? [
                  {
                    title: "System Overview Statistics",
                    description: "Get comprehensive system-wide statistics",
                    type: "SELECT" as const,
                    sql: `-- Multiple queries for admin dashboard
SELECT COUNT(*) as total_orders FROM "Order";
SELECT COUNT(*) as total_products FROM product;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as active_users FROM users WHERE isactive = true;
SELECT COUNT(*) as low_stock_items FROM inventory WHERE quantity < 10;`
                  },
                  {
                    title: "User Distribution Analysis",
                    description: "Analyze user base across different roles",
                    type: "SELECT" as const,
                    sql: `SELECT
  role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN isactive = true THEN 1 END) as active_count,
  (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users)) as percentage
FROM users
GROUP BY role
ORDER BY user_count DESC;`
                  }
                ] : [])
              ]}
            />
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">System initialized</p>
                  <p className="text-xs text-gray-500">Welcome to the supply chain platform</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user?.role === 'customer' && (
                <>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Place New Order</span>
                  </button>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Track Shipment</span>
                  </button>
                </>
              )}
              {user?.role === 'warehouse' && (
                <>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Update Inventory</span>
                  </button>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Process Shipment</span>
                  </button>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">User Management</span>
                  </button>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">System Reports</span>
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
}