'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { purchaseOrderOperations } from '@/lib/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import { 
  ShoppingCart, 
  Plus, 
  Package,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface PurchaseOrder {
  purchaseorderid: string;
  supplierid: string;
  orderdate: string;
  status: string;
  totalamount: number;
  supplier?: {
    suppliername: string;
  };
}

export default function PurchaseOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    supplierid: '',
    totalamount: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadPurchaseOrders(),
            loadSuppliers()
          ]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const data = await purchaseOrderOperations.getAllPurchaseOrders();
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase orders",
        variant: "destructive",
      });
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier')
        .select('supplierid, suppliername')
        .order('suppliername');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleCreatePurchaseOrder = async () => {
    if (!formData.supplierid || !formData.totalamount) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await purchaseOrderOperations.createPurchaseOrder(
        formData.supplierid,
        parseFloat(formData.totalamount)
      );

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      setFormData({ supplierid: '', totalamount: '' });
      setIsCreating(false);
      await loadPurchaseOrders();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (purchaseOrderId: string, newStatus: string) => {
    try {
      await purchaseOrderOperations.updatePurchaseOrderStatus(
        purchaseOrderId,
        newStatus,
        user?.id || '',
        `Status updated to ${newStatus}`
      );

      toast({
        title: "Success",
        description: "Purchase order status updated",
      });

      await loadPurchaseOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending');
  const completedOrders = purchaseOrders.filter(po => po.status === 'completed');
  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalamount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['purchaseorder']}
          relatedTables={['supplier', 'purchaseorderstatushistory']}
          operations={['Create Purchase Orders', 'Track Status', 'Manage Suppliers']}
          description="Purchase order workflow: Warehouse creates → Supplier approves → Supplier fulfills → Warehouse receives"
        />

        {/* Flow Guidance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Supply Chain Flow Guide</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>1. Warehouse</strong> creates Purchase Orders when inventory is low</p>
            <p><strong>2. Supplier</strong> reviews and approves/rejects Purchase Orders</p>
            <p><strong>3. Supplier</strong> creates Production Orders for Factory</p>
            <p><strong>4. Factory</strong> manufactures products and updates inventory</p>
            <p className="mt-2 font-medium">Current Role: {user?.role} - {
              user?.role === 'warehouse' ? 'You can create Purchase Orders' :
              user?.role === 'supplier' ? 'You can approve Purchase Orders and create Production Orders' :
              user?.role === 'factory' ? 'You can execute Production Orders' :
              user?.role === 'admin' ? 'You can manage all Purchase Orders' :
              'You can view Purchase Orders'
            }</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-gray-600">Manage supplier purchase orders and procurement</p>
            </div>
            <SqlTooltip
              page="Purchase Orders"
              queries={[
                {
                  title: "Load Purchase Orders with FIFO",
                  description: "Get purchase orders with supplier details using FIFO ordering",
                  type: "SELECT",
                  sql: `SELECT
  po.*,
  s.suppliername,
  s.contactinfo
FROM purchaseorder po
LEFT JOIN supplier s ON po.supplierid = s.supplierid
ORDER BY po.orderdate ASC; -- FIFO: First In, First Out`
                },
                {
                  title: "Create Purchase Order",
                  description: "Create new purchase order to supplier",
                  type: "INSERT",
                  sql: `INSERT INTO purchaseorder (
  purchaseorderid,
  supplierid,
  orderdate,
  expecteddeliverydate,
  totalamount,
  status
) VALUES (
  gen_random_uuid(),
  $1, NOW(), $2, $3, 'pending'
);`
                },
                {
                  title: "Update Purchase Order Status",
                  description: "Update PO status with history tracking",
                  type: "UPDATE",
                  sql: `UPDATE purchaseorder
SET status = $1
WHERE purchaseorderid = $2;

-- Insert status history
INSERT INTO purchaseorderstatushistory (
  purchaseorderid, oldstatus, newstatus,
  changedat, note
) VALUES (
  $2, $3, $1, NOW(), $4
);`
                }
              ]}
            />
          </div>

          {/* Only warehouse and admin can create POs */}
          {(user?.role === 'warehouse' || user?.role === 'admin') && (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Purchase Order
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Purchase Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Supplier *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.supplierid}
                    onChange={(e) => setFormData({...formData, supplierid: e.target.value})}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplierid} value={supplier.supplierid}>
                        {supplier.suppliername}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Total Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalamount}
                    onChange={(e) => setFormData({...formData, totalamount: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setFormData({ supplierid: '', totalamount: '' });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePurchaseOrder}>
                    Create Purchase Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          )}

          {/* Show message for non-authorized roles */}
          {user?.role && !['warehouse', 'admin'].includes(user.role) && (
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
              {user.role === 'supplier' ? 'You can approve/reject Purchase Orders' : 'View-only access'}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseOrders.length}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground">awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders.length}</div>
              <p className="text-xs text-muted-foreground">fulfilled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">procurement value</p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.purchaseorderid}>
                    <TableCell className="font-mono">
                      {po.purchaseorderid.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{po.supplier?.suppliername}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(po.orderdate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${po.totalamount.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(po.status)}>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {po.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(po.purchaseorderid, 'approved')}
                          >
                            Approve
                          </Button>
                        )}
                        {po.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(po.purchaseorderid, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {purchaseOrders.length === 0 && (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders found</h3>
                <p className="text-gray-600 mb-4">Create your first purchase order to get started</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Purchase Order
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
