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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your {user?.role} account today.
            </p>
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