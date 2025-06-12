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
  Factory
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
    { name: 'Returns', href: '/returns', icon: Package },
    { name: 'Payments', href: '/payments', icon: DollarSign },
  ],
  supplier: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
    { name: 'Factory Requests', href: '/factory-requests', icon: Factory },
    { name: 'Payments', href: '/payments', icon: DollarSign },
    { name: 'Performance', href: '/supplier-performance', icon: TrendingUp },
  ],
  warehouse: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Orders', href: '/warehouse-orders', icon: ShoppingCart },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Product Assignment', href: '/product-warehouse-assignment', icon: Package2 },
    { name: 'Locations', href: '/locations', icon: MapPin },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  ],
  carrier: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Shipments', href: '/carrier', icon: Truck },
  ],
  factory: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Production Orders', href: '/factory-production', icon: Package },
    { name: 'Manufacturing', href: '/manufacturing', icon: Package2 },
    { name: 'Quality Control', href: '/quality-control', icon: Shield },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Admin Panel', href: '/admin', icon: Shield },
    { name: 'Supply Chain Guide', href: '/supply-chain-guide', icon: Package },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Inventory', href: '/inventory', icon: Package2 },
    { name: 'Product Assignment', href: '/product-warehouse-assignment', icon: Package2 },
    { name: 'Warehouses', href: '/warehouses', icon: Building },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
    { name: 'Production', href: '/production', icon: Package },
    { name: 'Returns', href: '/returns', icon: Package },
    { name: 'Payments', href: '/payments', icon: DollarSign },
    { name: 'Performance', href: '/supplier-performance', icon: TrendingUp },
    { name: 'Carriers', href: '/carriers', icon: Truck },
    { name: 'Shipments', href: '/carrier', icon: Truck },
    { name: 'Reports', href: '/reports', icon: PieChart },
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