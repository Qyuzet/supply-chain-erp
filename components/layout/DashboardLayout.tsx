'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import { getCurrentUser } from '@/lib/auth';
import FlowTooltip from '@/components/FlowTooltip';
import { Toaster } from '@/components/ui/toaster';
import type { User } from '@/lib/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) {
          router.push('/auth');
          return;
        }
        setUser(userData);

        // Check if user is on appropriate page for their role
        const currentPath = window.location.pathname;
        console.log('🔍 DashboardLayout - Current path:', currentPath);
        console.log('🔍 DashboardLayout - User role:', userData.role);

        const roleDefaultPages = {
          customer: ['/shop', '/checkout', '/orders', '/returns', '/payments', '/dashboard'],
          supplier: ['/products', '/purchase-orders', '/factory-requests', '/production', '/payments', '/supplier-performance', '/dashboard'],
          warehouse: ['/warehouse-orders', '/inventory', '/product-warehouse-assignment', '/locations', '/purchase-orders', '/dashboard'],
          carrier: ['/carrier', '/dashboard'],
          factory: ['/factory-production', '/manufacturing', '/quality-control', '/dashboard'],
          admin: ['/admin', '/orders', '/products', '/inventory', '/product-warehouse-assignment', '/factory-requests', '/warehouses', '/purchase-orders', '/production', '/returns', '/payments', '/supplier-performance', '/carriers', '/carrier', '/reports', '/dashboard', '/shop', '/checkout']
        };

        const allowedPages = roleDefaultPages[userData.role] || ['/dashboard'];
        const isOnAllowedPage = allowedPages.some(page => currentPath.startsWith(page));

        console.log('🔍 DashboardLayout - Allowed pages:', allowedPages);
        console.log('🔍 DashboardLayout - Is on allowed page:', isOnAllowedPage);

        // If user is not on an allowed page, redirect to their default page
        if (!isOnAllowedPage && currentPath !== '/') {
          console.log('❌ DashboardLayout - User not on allowed page, redirecting...');

          // TEMPORARY: Disable redirect for checkout debugging
          if (currentPath === '/checkout') {
            console.log('🚫 DashboardLayout - Checkout redirect disabled for debugging');
            return;
          }

          const defaultPages = {
            customer: '/shop',
            supplier: '/products',
            warehouse: '/warehouse-orders',
            carrier: '/carrier',
            factory: '/factory-production',
            admin: '/admin'
          };

          const defaultPage = defaultPages[userData.role] || '/dashboard';
          console.log('🔄 DashboardLayout - Redirecting to:', defaultPage);

          setTimeout(() => {
            router.push(defaultPage);
          }, 100);
        } else {
          console.log('✅ DashboardLayout - User on allowed page, no redirect needed');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar userRole={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6 relative bg-muted/30">
          {children}
          {/* Flow Tooltip - Fixed position */}
          <div className="fixed bottom-6 right-6 z-50">
            <FlowTooltip userRole={user.role} />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}