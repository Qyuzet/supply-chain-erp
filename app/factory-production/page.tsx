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
  Factory, 
  Plus, 
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  Settings
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface ProductionOrder {
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
    unitprice: number;
  };
  purchaseorder?: {
    purchaseorderid: string;
    orderdate: string;
    totalamount: number;
    supplier?: {
      suppliername: string;
    };
  };
}

export default function FactoryProductionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    purchaseorderid: '',
    productid: '',
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
            loadProductionOrders(),
            loadPurchaseOrders(),
            loadProducts()
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

  const loadProductionOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('production')
        .select(`
          *,
          product(productname, description, unitprice),
          purchaseorder(
            purchaseorderid,
            orderdate,
            totalamount,
            supplier(suppliername)
          )
        `)
        .order('startdate', { ascending: false });

      if (error) throw error;
      setProductionOrders(data || []);
    } catch (error) {
      console.error('Error loading production orders:', error);
      toast({
        title: "Error",
        description: "Failed to load production orders",
        variant: "destructive",
      });
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchaseorder')
        .select(`
          purchaseorderid,
          orderdate,
          totalamount,
          supplier(suppliername)
        `)
        .eq('status', 'approved')
        .order('orderdate', { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product')
        .select('productid, productname, description, unitprice')
        .order('productname');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleCreateProduction = async () => {
    if (!formData.purchaseorderid || !formData.productid || !formData.quantity) {
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

      setFormData({ purchaseorderid: '', productid: '', quantity: '' });
      setIsCreating(false);
      await loadProductionOrders();
    } catch (error) {
      console.error('Error creating production order:', error);
      toast({
        title: "Error",
        description: "Failed to create production order",
        variant: "destructive",
      });
    }
  };

  const updateProductionStatus = async (productionOrderId: string, newStatus: string) => {
    setUpdating(productionOrderId);
    
    try {
      await productionOperations.updateProductionStatus(
        productionOrderId,
        newStatus,
        user?.id || '',
        `Production status updated to ${newStatus} by factory`
      );

      // If completing production, update end date and add to inventory
      if (newStatus === 'completed') {
        const production = productionOrders.find(p => p.productionorderid === productionOrderId);
        if (production) {
          // Update end date
          await supabase
            .from('production')
            .update({ enddate: new Date().toISOString() })
            .eq('productionorderid', productionOrderId);

          // Add produced items to inventory (assuming first warehouse)
          const { data: warehouse } = await supabase
            .from('warehouses')
            .select('warehouseid')
            .limit(1)
            .single();

          if (warehouse) {
            // Check if inventory record exists
            const { data: existingInventory } = await supabase
              .from('inventory')
              .select('quantity')
              .eq('productid', production.productid)
              .eq('warehouseid', warehouse.warehouseid)
              .single();

            if (existingInventory) {
              // Update existing inventory
              await supabase
                .from('inventory')
                .update({ 
                  quantity: existingInventory.quantity + production.quantity 
                })
                .eq('productid', production.productid)
                .eq('warehouseid', warehouse.warehouseid);
            } else {
              // Create new inventory record
              await supabase
                .from('inventory')
                .insert({
                  productid: production.productid,
                  warehouseid: warehouse.warehouseid,
                  quantity: production.quantity
                });
            }

            // Log inventory movement
            await supabase
              .from('inventorylog')
              .insert({
                logid: crypto.randomUUID(),
                productid: production.productid,
                warehouseid: warehouse.warehouseid,
                movementtype: 'in',
                quantity: production.quantity,
                referencetype: 'production',
                referenceid: productionOrderId,
                timestamp: new Date().toISOString()
              });
          }
        }
      }

      toast({
        title: "Success",
        description: "Production status updated successfully",
      });

      await loadProductionOrders();
    } catch (error) {
      console.error('Error updating production status:', error);
      toast({
        title: "Error",
        description: "Failed to update production status",
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
      case 'in_progress': return <Settings className="h-4 w-4 animate-spin" />;
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

  const pendingOrders = productionOrders.filter(p => p.status === 'pending');
  const inProgressOrders = productionOrders.filter(p => p.status === 'in_progress');
  const completedOrders = productionOrders.filter(p => p.status === 'completed');
  const totalProduced = completedOrders.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['production']}
          relatedTables={['purchaseorder', 'product', 'inventory', 'productionstatuslog']}
          operations={['Create Production Orders', 'Manage Manufacturing', 'Update Inventory']}
          description="Factory production management with inventory integration and status tracking"
        />

        {/* Production Flow Guidance */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Production Workflow</h3>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>Step 1:</strong> Supplier approves Purchase Orders from Warehouse</p>
            <p><strong>Step 2:</strong> Factory creates Production Orders from approved Purchase Orders</p>
            <p><strong>Step 3:</strong> Factory starts manufacturing (pending → in_progress → completed)</p>
            <p><strong>Step 4:</strong> Completed production automatically updates warehouse inventory</p>
            <p className="mt-2 font-medium text-green-900">
              As Factory: You receive production requests from suppliers and manufacture products to fulfill orders
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Factory Production</h1>
            <p className="text-gray-600">Manage manufacturing orders and production workflow</p>
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
                <DialogTitle>Create Production Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                        PO-{po.purchaseorderid.slice(0, 8)} - {po.supplier?.suppliername} (${po.totalamount})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Product to Manufacture *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.productid}
                    onChange={(e) => setFormData({...formData, productid: e.target.value})}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.productid} value={product.productid}>
                        {product.productname} - ${product.unitprice}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Quantity to Produce *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setFormData({ purchaseorderid: '', productid: '', quantity: '' });
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
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground">awaiting production</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Production</CardTitle>
              <Settings className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressOrders.length}</div>
              <p className="text-xs text-muted-foreground">manufacturing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders.length}</div>
              <p className="text-xs text-muted-foreground">finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produced</CardTitle>
              <Factory className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProduced}</div>
              <p className="text-xs text-muted-foreground">units manufactured</p>
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
                  <TableHead>Production ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionOrders.map((production) => (
                  <TableRow key={production.productionorderid}>
                    <TableCell className="font-mono">
                      {production.productionorderid.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{production.product?.productname}</p>
                          <p className="text-sm text-gray-600">${production.product?.unitprice}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{production.purchaseorder?.supplier?.suppliername}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{production.quantity} units</span>
                    </TableCell>
                    <TableCell>
                      {new Date(production.startdate).toLocaleDateString()}
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
                            onClick={() => updateProductionStatus(production.productionorderid, 'in_progress')}
                            disabled={updating === production.productionorderid}
                          >
                            {updating === production.productionorderid ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <Play className="h-4 w-4 mr-1" />
                            )}
                            Start Production
                          </Button>
                        )}
                        {production.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateProductionStatus(production.productionorderid, 'completed')}
                            disabled={updating === production.productionorderid}
                          >
                            {updating === production.productionorderid ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Complete Production
                          </Button>
                        )}
                        {production.status === 'completed' && (
                          <Badge variant="secondary">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {productionOrders.length === 0 && (
              <div className="text-center py-8">
                <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No production orders found</h3>
                <p className="text-gray-600 mb-4">Create production orders from approved purchase orders</p>
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
