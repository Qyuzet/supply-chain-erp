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
        console.log('🔍 DashboardLayout - Checking auth...');
        let userData = await getCurrentUser();

        // Check for test user if no Supabase user
        if (!userData && typeof window !== 'undefined') {
          const testUser = localStorage.getItem('test-user');
          if (testUser) {
            try {
              userData = JSON.parse(testUser);
              console.log('🧪 DashboardLayout - Using test user:', userData?.email);
            } catch (error) {
              console.error('Error parsing test user:', error);
              localStorage.removeItem('test-user');
            }
          }
        }

        if (!userData) {
          console.log('❌ DashboardLayout - No user found, redirecting to auth');
          router.push('/auth');
          return;
        }

        console.log('✅ DashboardLayout - User found:', userData.email, userData.role);
        setUser(userData);

        // Get current path
        const currentPath = window.location.pathname;
        console.log('🔍 DashboardLayout - Current path:', currentPath);

        // Skip redirect logic for auth-related paths
        if (currentPath.startsWith('/auth')) {
          console.log('🔍 DashboardLayout - On auth path, skipping redirect logic');
          return;
        }

        // Define allowed pages for each role
        const roleDefaultPages = {
          customer: ['/shop', '/checkout', '/orders', '/returns', '/payments', '/dashboard'],
          supplier: ['/products', '/purchase-orders', '/production-from-po', '/factory-requests', '/payments', '/supplier-payments', '/supplier-performance', '/supplier-dashboard', '/dashboard'],
          warehouse: ['/warehouse-orders', '/inventory', '/product-warehouse-assignment', '/warehouse-locations', '/warehouse-purchase-orders', '/purchase-orders-detailed', '/warehouse-dashboard', '/dashboard'],
          carrier: ['/carrier', '/carrier-dashboard', '/routes', '/carrier-performance', '/dashboard'],
          factory: ['/factory-production', '/factory-dashboard', '/materials', '/quality-control', '/factory-performance', '/dashboard'],
          admin: ['/admin', '/supply-chain-guide', '/orders', '/products', '/inventory', '/product-warehouse-assignment', '/factory-requests', '/production-from-po', '/purchase-orders-detailed', '/warehouses', '/purchase-orders', '/production', '/returns', '/payments', '/supplier-performance', '/carriers', '/carrier', '/reports', '/analytics', '/system-settings', '/dashboard', '/shop', '/checkout']
        };

        const allowedPages = roleDefaultPages[userData.role] || ['/dashboard'];
        const isOnAllowedPage = allowedPages.some(page => currentPath.startsWith(page));

        console.log('🔍 DashboardLayout - Allowed pages for', userData.role, ':', allowedPages);
        console.log('🔍 DashboardLayout - Is on allowed page:', isOnAllowedPage);

        // Only redirect if user is not on an allowed page and not on root
        if (!isOnAllowedPage && currentPath !== '/' && currentPath !== '/dashboard') {
          console.log('❌ DashboardLayout - User not on allowed page, redirecting...');

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

          // Use replace instead of push to avoid back button issues
          router.replace(defaultPage);
        } else {
          console.log('✅ DashboardLayout - User on allowed page, no redirect needed');
        }
      } catch (error) {
        console.error('❌ DashboardLayout - Auth check failed:', error);
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