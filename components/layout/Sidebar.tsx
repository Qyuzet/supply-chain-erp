'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package,
  ShoppingCart,
  Truck,
  ChevronLeft,
  ChevronRight,
  Home,
  Package2,
  MapPin,
  Shield,
  PieChart,
  Building,
  DollarSign,
  TrendingUp,
  Factory,
  RotateCcw,
  Settings,
  BarChart3,
  Route,
  Wrench
} from 'lucide-react';
import type { UserRole } from '@/lib/supabase';

interface SidebarProps {
  userRole: UserRole;
}

const roleNavigation = {
  customer: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Shop', href: '/shop', icon: Package },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Returns', href: '/returns', icon: RotateCcw },
    { name: 'Payments', href: '/payments', icon: DollarSign },
  ],
  supplier: [
    { name: 'Dashboard', href: '/supplier-dashboard', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
    { name: 'Production from POs', href: '/production-from-po', icon: Factory },
    { name: 'Factory Requests', href: '/factory-requests', icon: Factory },
    { name: 'Payments', href: '/supplier-payments', icon: DollarSign },
    { name: 'Performance', href: '/supplier-performance', icon: TrendingUp },
  ],
  warehouse: [
    { name: 'Dashboard', href: '/warehouse-dashboard', icon: Home },
    { name: 'Orders', href: '/warehouse-orders', icon: ShoppingCart },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Product Assignment', href: '/product-warehouse-assignment', icon: Package2 },
    { name: 'Locations', href: '/warehouse-locations', icon: MapPin },
    { name: 'Purchase Orders', href: '/warehouse-purchase-orders', icon: ShoppingCart },
    { name: 'Detailed Purchase Orders', href: '/purchase-orders-detailed', icon: BarChart3 },
  ],
  carrier: [
    { name: 'Dashboard', href: '/carrier-dashboard', icon: Home },
    { name: 'Shipments', href: '/carrier', icon: Truck },
    { name: 'Routes', href: '/routes', icon: Route },
    { name: 'Performance', href: '/carrier-performance', icon: TrendingUp },
  ],
  factory: [
    { name: 'Dashboard', href: '/factory-dashboard', icon: Home },
    { name: 'Production Orders', href: '/factory-production', icon: Factory },
    { name: 'Materials', href: '/materials', icon: Package2 },
    { name: 'Quality Control', href: '/quality-control', icon: Shield },
    { name: 'Performance', href: '/factory-performance', icon: TrendingUp },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin', icon: Shield },
    { name: 'System Settings', href: '/system-settings', icon: Settings },
    { name: 'Reports', href: '/reports', icon: PieChart },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Supply Chain Guide', href: '/supply-chain-guide', icon: Wrench },
  ],
};

export default function Sidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  
  const navigation = roleNavigation[userRole] || [];

  return (
    <div className={cn(
      "flex flex-col bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold text-foreground">SupplyChain</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}