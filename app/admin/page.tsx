'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { createSampleData } from '@/lib/sample-data';
import { testNewSchema } from '@/test-new-schema';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
import { 
  Users, 
  Database, 
  Settings, 
  Shield, 
  Plus,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import type { User } from '@/lib/auth';

interface SystemUser {
  customerid: string; // Updated field name
  email: string;
  customername: string; // This is the main name field
  role: string;
  isactive: boolean;
  createdat: string;
}

interface SystemStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalShipments: number;
  activeUsers: number;
  pendingOrders: number;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalShipments: 0,
    activeUsers: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    customername: '', // Changed from fullname to customername
    role: 'customer'
  });
  const [isTestingSchema, setIsTestingSchema] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        if (userData?.role === 'admin') {
          await Promise.all([
            loadUsers(),
            loadSystemStats()
          ]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load admin data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers') // Updated table name
        .select('*')
        .order('createdat', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  };

  const loadSystemStats = async () => {
    try {
      const [
        { data: users },
        { data: orders },
        { data: products },
        { data: shipments }
      ] = await Promise.all([
        supabase.from('customers').select('*'), // Updated table name
        supabase.from('orders').select('*'), // Updated table name
        supabase.from('product').select('*'),
        supabase.from('shipments').select('*')
      ]);

      setStats({
        totalUsers: users?.length || 0,
        totalOrders: orders?.length || 0,
        totalProducts: products?.length || 0,
        totalShipments: shipments?.length || 0,
        activeUsers: users?.filter(u => u.isactive).length || 0,
        pendingOrders: orders?.filter(o => o.orderstatus === 'pending').length || 0 // Updated field name
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    if (!userForm.customername.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating user with data:', {
        email: userForm.email,
        customername: userForm.customername,
        role: userForm.role,
        isactive: true
      });

      // Create user directly in customers table (unified user management)
      const { data: newUser, error: insertError } = await supabase
        .from('customers')
        .insert({
          email: userForm.email,
          customername: userForm.customername,
          role: userForm.role,
          phone: '+1 (555) 000-0000',
          address: '123 Main St, City, State 12345',
          isactive: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('User created successfully:', newUser);

      // Create role-specific profile if needed
      if (userForm.role === 'supplier') {
        await supabase
          .from('supplier')
          .insert({
            userid: newUser.customerid,
            suppliername: userForm.customername
          });
      } else if (userForm.role === 'carrier') {
        await supabase
          .from('shippingcarrier')
          .insert({
            userid: newUser.customerid,
            carriername: userForm.customername
          });
      } else if (userForm.role === 'warehouse') {
        await supabase
          .from('warehouses')
          .insert({
            userid: newUser.customerid,
            warehousename: `${userForm.customername} Warehouse`,
            location: 'Default Location'
          });
      }

      toast({
        title: "Success",
        description: "User created successfully with role profile",
      });

      await loadUsers();
      setUserForm({ email: '', customername: '', role: 'customer' });
      setIsCreatingUser(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('customers') // Updated table name
        .update({
          customername: userForm.customername,
          role: userForm.role,
          isactive: selectedUser.isactive
        })
        .eq('customerid', selectedUser.customerid); // Updated field name

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      await loadUsers();
      setIsEditingUser(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('customers') // Updated table name
        .update({ isactive: !currentStatus })
        .eq('customerid', userId); // Updated field name

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      await loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleCreateSampleData = async () => {
    try {
      const result = await createSampleData();

      if (result?.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        await loadSystemStats();
      } else {
        throw new Error(result?.message || 'Failed to create sample data');
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast({
        title: "Error",
        description: "Failed to create sample data",
        variant: "destructive",
      });
    }
  };

  const handleTestSchema = async () => {
    setIsTestingSchema(true);
    try {
      const results = await testNewSchema();
      setTestResults(results);

      const passedTests = Object.values(results).filter(v => v === true).length;
      const totalTests = 7; // Total number of tests

      toast({
        title: passedTests === totalTests ? "All Tests Passed!" : "Some Tests Failed",
        description: `${passedTests}/${totalTests} tests passed. Check console for details.`,
        variant: passedTests === totalTests ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error testing schema:', error);
      toast({
        title: "Test Error",
        description: "Failed to run schema tests",
        variant: "destructive",
      });
    } finally {
      setIsTestingSchema(false);
    }
  };

  const openEditDialog = (user: SystemUser) => {
    setSelectedUser(user);
    setUserForm({
      email: user.email,
      customername: user.customername,
      role: user.role
    });
    setIsEditingUser(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supplier': return 'bg-blue-100 text-blue-800';
      case 'warehouse': return 'bg-purple-100 text-purple-800';
      case 'carrier': return 'bg-orange-100 text-orange-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading admin panel...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['customers']}
          relatedTables={['supplier', 'warehouses', 'shippingcarrier', 'orders', 'product']}
          operations={['Create Users', 'Manage Roles', 'System Stats', 'Generate Sample Data']}
          description="System administration with unified user management in customers table and role-based profile creation"
        />


        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">System administration and user management</p>
            </div>
            <SqlTooltip
              page="Admin"
              queries={[
                {
                  title: "Load All Users",
                  description: "Get all system users with role information",
                  type: "SELECT",
                  sql: `SELECT
  u.*,
  CASE
    WHEN u.role = 'customer' THEN c.customername
    WHEN u.role = 'supplier' THEN s.suppliername
    ELSE u.fullname
  END as display_name
FROM users u
LEFT JOIN customers c ON u.userid = c.userid
LEFT JOIN supplier s ON u.userid = s.supplierid
ORDER BY u.createdat DESC;`
                },
                {
                  title: "Create User with Role Profile",
                  description: "Create user and associated role-specific profile",
                  type: "INSERT",
                  sql: `-- Create user
INSERT INTO users (
  userid, email, fullname, role, isactive
) VALUES (
  gen_random_uuid(), $1, $2, $3, true
);

-- Create role profile (example for customer)
INSERT INTO customers (
  userid, customername, phone, address
) VALUES (
  $userid, $2, '+1 (555) 000-0000',
  '123 Main St, City, State 12345'
);`
                },
                {
                  title: "System Statistics",
                  description: "Get comprehensive system statistics",
                  type: "SELECT",
                  sql: `-- Multiple queries for stats
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_orders FROM "Order";
SELECT COUNT(*) as total_products FROM product;
SELECT COUNT(*) as total_shipments FROM shipments;
SELECT COUNT(*) as active_users FROM users WHERE isactive = true;
SELECT COUNT(*) as pending_orders FROM "Order" WHERE status = 'pending';`
                },
                {
                  title: "Update User Status",
                  description: "Activate or deactivate user accounts",
                  type: "UPDATE",
                  sql: `UPDATE users
SET isactive = $1
WHERE userid = $2;`
                }
              ]}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateSampleData} variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Create Sample Data
            </Button>
            <Button
              onClick={handleTestSchema}
              variant="outline"
              disabled={isTestingSchema}
            >
              {isTestingSchema ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              {isTestingSchema ? 'Testing...' : 'Test Schema'}
            </Button>
            <Dialog open={isCreatingUser} onOpenChange={setIsCreatingUser}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      value={userForm.customername}
                      onChange={(e) => setUserForm({...userForm, customername: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={userForm.role}
                      onValueChange={(value) => setUserForm({...userForm, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="carrier">Carrier</SelectItem>
                        <SelectItem value="factory">Factory</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateUser} className="w-full">
                    Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShipments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage all system users and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.customerid}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.customername}</p>
                        <p className="text-sm text-gray-600">{user.customerid.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.isactive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user.isactive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdat).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.customerid, user.isactive)}
                        >
                          {user.isactive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={userForm.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={userForm.customername}
                  onChange={(e) => setUserForm({...userForm, customername: e.target.value})}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value) => setUserForm({...userForm, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="carrier">Carrier</SelectItem>
                    <SelectItem value="factory">Factory</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateUser} className="w-full">
                Update User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
