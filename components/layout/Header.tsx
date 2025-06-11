'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut } from 'lucide-react';
import { signOut, getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import RoleSwitcher from '@/components/RoleSwitcher';
import type { User } from '@/lib/auth';

interface HeaderProps {
  user?: User | null;
}

export default function Header({ user: propUser }: HeaderProps) {
  const [user, setUser] = useState<User | null>(propUser || null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    } else {
      const loadUser = async () => {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Error loading user:', error);
        }
      };

      loadUser();
    }
  }, [propUser]);

  const handleSignOut = async () => {
    try {
      // Set flag to indicate user just logged out
      sessionStorage.setItem('justLoggedOut', 'true');

      // Import NextAuth signOut directly
      const { signOut: nextAuthSignOut } = await import('next-auth/react');

      // Sign out without redirect
      await nextAuthSignOut({
        redirect: false,
        callbackUrl: '/'
      });

      toast({
        title: "Success",
        description: "Signed out successfully",
      });

      // Force redirect to landing page
      window.location.href = '/';

    } catch (error: any) {
      // Remove the flag if logout failed
      sessionStorage.removeItem('justLoggedOut');
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-destructive/10 text-destructive',
      warehouse: 'bg-primary/10 text-primary',
      supplier: 'bg-emerald-500/10 text-emerald-700',
      carrier: 'bg-amber-500/10 text-amber-700',
      customer: 'bg-violet-500/10 text-violet-700',
      factory: 'bg-orange-500/10 text-orange-700',
    };
    return colors[role as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">
          {user?.role === 'customer' && 'Customer Portal'}
          {user?.role === 'supplier' && 'Supplier Dashboard'}
          {user?.role === 'warehouse' && 'Warehouse Management'}
          {user?.role === 'carrier' && 'Carrier Operations'}
          {user?.role === 'factory' && 'Factory Operations'}
          {user?.role === 'admin' && 'Admin Console'}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {user && <RoleSwitcher user={user} onRoleChange={() => window.location.reload()} />}

        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-xs text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={user?.fullName} />
                <AvatarFallback>{getInitials(user?.fullName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}