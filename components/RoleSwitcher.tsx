'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Settings, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/auth';
import type { UserRole } from '@/lib/supabase';

interface RoleSwitcherProps {
  user: User;
  onRoleChange?: () => void;
}

const roles = [
  { value: 'customer', label: 'Customer', color: 'bg-green-100 text-green-800' },
  { value: 'supplier', label: 'Supplier', color: 'bg-blue-100 text-blue-800' },
  { value: 'warehouse', label: 'Warehouse', color: 'bg-purple-100 text-purple-800' },
  { value: 'carrier', label: 'Carrier', color: 'bg-orange-100 text-orange-800' },
  { value: 'factory', label: 'Factory', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800' },
];

const createRoleProfile = async (userId: string, role: UserRole, email: string, name: string) => {
  try {
    switch (role) {
      case 'customer':
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('customerid')
          .eq('userid', userId)
          .single();

        if (!existingCustomer) {
          const { error } = await supabase
            .from('customers')
            .insert({
              userid: userId,
              customername: name || 'Customer User',
              phone: '+1 (555) 000-0000',
              address: '123 Main St, City, State 12345'
            });
          if (error) console.error('Error creating customer profile:', error);
        }
        break;

      case 'supplier':
        const { data: existingSupplier } = await supabase
          .from('supplier')
          .select('supplierid')
          .eq('userid', userId)
          .single();

        if (!existingSupplier) {
          const { error } = await supabase
            .from('supplier')
            .insert({
              userid: userId,
              suppliername: name || 'Supplier Company'
            });
          if (error) console.error('Error creating supplier profile:', error);
        }
        break;

      case 'warehouse':
        const { data: existingWarehouse } = await supabase
          .from('warehousestaff')
          .select('staffid')
          .eq('userid', userId)
          .single();

        if (!existingWarehouse) {
          // Get a default warehouse or create one
          let { data: warehouse } = await supabase
            .from('warehouses')
            .select('warehouseid')
            .limit(1)
            .single();

          if (!warehouse) {
            // Create a default warehouse
            // First create the warehouse
            const { error: warehouseError } = await supabase
              .from('warehouses')
              .insert({
                warehousename: 'Main Warehouse',
                location: '789 Storage Blvd, City, State 12345'
              });

            if (warehouseError) throw warehouseError;

            // Then get the warehouse back
            const { data: newWarehouse, error: selectError } = await supabase
              .from('warehouses')
              .select('warehouseid')
              .eq('warehousename', 'Main Warehouse')
              .single();

            if (selectError) {
              console.error('Error selecting warehouse:', selectError);
              return;
            }
            warehouse = newWarehouse;
          }

          const { error } = await supabase
            .from('warehousestaff')
            .insert({
              userid: userId,
              warehouseid: warehouse.warehouseid,
              staffname: name || 'Warehouse Staff'
            });
          if (error) console.error('Error creating warehouse staff profile:', error);
        }
        break;

      case 'carrier':
        const { data: existingCarrier } = await supabase
          .from('shippingcarrier')
          .select('carrierid')
          .eq('userid', userId)
          .single();

        if (!existingCarrier) {
          const { error } = await supabase
            .from('shippingcarrier')
            .insert({
              userid: userId,
              carriername: name || 'Shipping Carrier'
            });
          if (error) console.error('Error creating carrier profile:', error);
        }
        break;

      case 'factory':
        // Factory doesn't need a separate profile table
        // Factory workers use the main users table
        break;

      case 'admin':
        // Admin doesn't need a separate profile
        break;
    }
  } catch (error) {
    console.error('Error creating role profile:', error);
  }
};

export default function RoleSwitcher({ user, onRoleChange }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      // Update user role in database
      const { error: userError } = await supabase
        .from('users')
        .update({ role: selectedRole })
        .eq('userid', user.id);

      if (userError) throw userError;

      // Create role-specific profile if needed
      await createRoleProfile(user.id, selectedRole, user.email, user.fullName || user.email);

      toast({
        title: "Role Changed Successfully",
        description: `Switched to ${selectedRole} role. Redirecting to ${selectedRole} interface...`,
      });

      // Redirect to appropriate default page for the role
      const defaultPages = {
        customer: '/shop',
        supplier: '/products',
        warehouse: '/warehouse-orders',
        carrier: '/carrier',
        factory: '/factory-production',
        admin: '/admin'
      } as const;

      const defaultPage = defaultPages[selectedRole] || '/dashboard';

      if (onRoleChange) {
        onRoleChange();
      }

      setIsOpen(false);

      // Force page refresh and navigate to ensure clean state
      setTimeout(() => {
        window.location.href = defaultPage;
      }, 500);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentRoleInfo = () => {
    return roles.find(r => r.value === user.role) || roles[0];
  };

  const currentRole = getCurrentRoleInfo();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCheck className="w-4 h-4" />
          <Badge className={currentRole.color}>
            {currentRole.label}
          </Badge>
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Switch Role</DialogTitle>
          <DialogDescription>
            Change your role to test different parts of the system. This is for development/testing purposes only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Current Role:</p>
            <Badge className={currentRole.color}>
              {currentRole.label}
            </Badge>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Switch to:</p>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={role.color}>
                        {role.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Role Switch Guide:</strong> Each role will redirect to its main interface:
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• <strong>Customer:</strong> Shop & browse products</li>
              <li>• <strong>Supplier:</strong> Manage product catalog</li>
              <li>• <strong>Warehouse:</strong> Process orders & inventory</li>
              <li>• <strong>Carrier:</strong> Manage shipments & deliveries</li>
              <li>• <strong>Factory:</strong> Production & manufacturing</li>
              <li>• <strong>Admin:</strong> System administration</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRoleChange}
              disabled={isUpdating || selectedRole === user.role}
              className="flex-1"
            >
              {isUpdating ? 'Updating...' : 'Switch Role'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
