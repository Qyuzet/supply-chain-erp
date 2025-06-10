'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { productionOperations } from '@/lib/database';
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
import { 
  Package, 
  Plus, 
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Factory
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface Production {
  productionorderid: string;
  productid: string;
  purchaseorderid: string;
  quantity: number;
  startdate: string;
  enddate?: string;
  status: string;
  product?: {
    productname: string;
    description: string;
  };
  purchaseorder?: {
    purchaseorderid: string;
    orderdate: string;
  };
}

export default function ProductionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [productions, setProductions] = useState<Production[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productid: '',
    purchaseorderid: '',
    quantity: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadProductions(),
            loadProducts(),
            loadPurchaseOrders()
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

  const loadProductions = async () => {
    try {
      const data = await productionOperations.getProductionOrders();
      setProductions(data || []);
    } catch (error) {
      console.error('Error loading productions:', error);
      toast({
        title: "Error",
        description: "Failed to load production orders",
        variant: "destructive",
      });
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product')
        .select('productid, productname, description')
        .order('productname');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchaseorder')
        .select('purchaseorderid, orderdate, status')
        .eq('status', 'approved')
        .order('orderdate', { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  const handleCreateProduction = async () => {
    if (!formData.productid || !formData.purchaseorderid || !formData.quantity) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await productionOperations.createProductionOrder(
        formData.productid,
        formData.purchaseorderid,
        parseInt(formData.quantity)
      );

      toast({
        title: "Success",
        description: "Production order created successfully",
      });

      setFormData({ productid: '', purchaseorderid: '', quantity: '' });
      setIsCreating(false);
      await loadProductions();
    } catch (error) {
      console.error('Error creating production order:', error);
      toast({
        title: "Error",
        description: "Failed to create production order",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (productionOrderId: string, newStatus: string) => {
    setUpdating(productionOrderId);
    
    try {
      await productionOperations.updateProductionStatus(
        productionOrderId,
        newStatus,
        user?.id || '',
        `Status updated to ${newStatus}`
      );

      // If completing production, update end date
      if (newStatus === 'completed') {
        await supabase
          .from('production')
          .update({ enddate: new Date().toISOString() })
          .eq('productionorderid', productionOrderId);
      }

      toast({
        title: "Success",
        description: "Production status updated",
      });

      await loadProductions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
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

  const pendingProductions = productions.filter(p => p.status === 'pending');
  const inProgressProductions = productions.filter(p => p.status === 'in_progress');
  const completedProductions = productions.filter(p => p.status === 'completed');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['production']}
          relatedTables={['product', 'purchaseorder', 'productionstatuslog']}
          operations={['Create Production Orders', 'Track Manufacturing', 'Update Status']}
          description="Production order management with status tracking and manufacturing workflow"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Orders</h1>
            <p className="text-gray-600">Manage manufacturing and production workflow</p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Production Order
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Production Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Product *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.productid}
                    onChange={(e) => setFormData({...formData, productid: e.target.value})}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.productid} value={product.productid}>
                        {product.productname}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Purchase Order *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.purchaseorderid}
                    onChange={(e) => setFormData({...formData, purchaseorderid: e.target.value})}
                  >
                    <option value="">Select Purchase Order</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.purchaseorderid} value={po.purchaseorderid}>
                        PO-{po.purchaseorderid.slice(0, 8)} ({new Date(po.orderdate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setFormData({ productid: '', purchaseorderid: '', quantity: '' });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProduction}>
                    Create Production Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Factory className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productions.length}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingProductions.length}</div>
              <p className="text-xs text-muted-foreground">awaiting start</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Play className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressProductions.length}</div>
              <p className="text-xs text-muted-foreground">manufacturing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedProductions.length}</div>
              <p className="text-xs text-muted-foreground">finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Production Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Production Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productions.map((production) => (
                  <TableRow key={production.productionorderid}>
                    <TableCell className="font-mono">
                      {production.productionorderid.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{production.product?.productname}</p>
                          <p className="text-sm text-gray-600">{production.product?.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{production.quantity}</span>
                    </TableCell>
                    <TableCell>
                      {new Date(production.startdate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {production.enddate ? new Date(production.enddate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(production.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(production.status)}
                          {production.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {production.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(production.productionorderid, 'in_progress')}
                            disabled={updating === production.productionorderid}
                          >
                            {updating === production.productionorderid ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <Play className="h-4 w-4 mr-1" />
                            )}
                            Start
                          </Button>
                        )}
                        {production.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(production.productionorderid, 'completed')}
                            disabled={updating === production.productionorderid}
                          >
                            {updating === production.productionorderid ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Complete
                          </Button>
                        )}
                        {production.status === 'completed' && (
                          <Badge variant="secondary">Finished</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {productions.length === 0 && (
              <div className="text-center py-8">
                <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No production orders found</h3>
                <p className="text-gray-600 mb-4">Create your first production order to start manufacturing</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Production Order
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
