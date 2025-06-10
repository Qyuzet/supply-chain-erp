'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { returnOperations } from '@/lib/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import { 
  Package, 
  Plus, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface Return {
  returnid: string;
  orderid: string;
  productid: string;
  returndate: string;
  returnreason: string;
  status: string;
  order?: {
    orderid: string;
    orderdate: string;
    customers?: {
      customername: string;
    };
  };
  product?: {
    productname: string;
    unitprice: number;
  };
}

export default function ReturnsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [returns, setReturns] = useState<Return[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    orderid: '',
    productid: '',
    returnreason: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadReturns(),
            loadOrders()
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

  const loadReturns = async () => {
    try {
      const data = await returnOperations.getAllReturns();
      setReturns(data || []);
    } catch (error) {
      console.error('Error loading returns:', error);
      toast({
        title: "Error",
        description: "Failed to load returns",
        variant: "destructive",
      });
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('Order')
        .select(`
          orderid,
          orderdate,
          customers(customername),
          orderdetail(
            productid,
            quantity,
            product(productname, unitprice)
          )
        `)
        .eq('status', 'delivered')
        .order('orderdate', { ascending: true }); // FIFO: First In, First Out

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleCreateReturn = async () => {
    if (!formData.orderid || !formData.productid || !formData.returnreason) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await returnOperations.createReturn(
        formData.orderid,
        formData.productid,
        formData.returnreason
      );

      toast({
        title: "Success",
        description: "Return request created successfully",
      });

      setFormData({ orderid: '', productid: '', returnreason: '' });
      setIsCreating(false);
      await loadReturns();
    } catch (error) {
      console.error('Error creating return:', error);
      toast({
        title: "Error",
        description: "Failed to create return request",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (returnId: string, newStatus: string) => {
    setUpdating(returnId);
    
    try {
      await returnOperations.updateReturnStatus(
        returnId,
        newStatus,
        user?.id || '',
        `Status updated to ${newStatus}`
      );

      toast({
        title: "Success",
        description: "Return status updated",
      });

      await loadReturns();
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
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <RotateCcw className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getProductsForOrder = (orderid: string) => {
    const order = orders.find(o => o.orderid === orderid);
    return order?.orderdetail || [];
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

  const pendingReturns = returns.filter(r => r.status === 'pending');
  const processingReturns = returns.filter(r => ['approved', 'processing'].includes(r.status));
  const completedReturns = returns.filter(r => r.status === 'completed');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['returns']}
          relatedTables={['Order', 'product', 'customers', 'returnstatushistory']}
          operations={['Create Return Requests', 'Process Returns', 'Track Status']}
          description="Return management system with status tracking and customer integration"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
            <p className="text-gray-600">Manage product returns and refund requests</p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Return Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Return Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Order *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.orderid}
                    onChange={(e) => setFormData({...formData, orderid: e.target.value, productid: ''})}
                  >
                    <option value="">Select Order</option>
                    {orders.map((order) => (
                      <option key={order.orderid} value={order.orderid}>
                        {order.orderid.slice(0, 8)}... - {order.customers?.customername} ({new Date(order.orderdate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Product *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.productid}
                    onChange={(e) => setFormData({...formData, productid: e.target.value})}
                    disabled={!formData.orderid}
                  >
                    <option value="">Select Product</option>
                    {getProductsForOrder(formData.orderid).map((detail: any) => (
                      <option key={detail.productid} value={detail.productid}>
                        {detail.product.productname} (Qty: {detail.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Return Reason *</Label>
                  <Textarea
                    placeholder="Please describe the reason for return..."
                    value={formData.returnreason}
                    onChange={(e) => setFormData({...formData, returnreason: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setFormData({ orderid: '', productid: '', returnreason: '' });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReturn}>
                    Create Return Request
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
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <RotateCcw className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{returns.length}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReturns.length}</div>
              <p className="text-xs text-muted-foreground">awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <RotateCcw className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processingReturns.length}</div>
              <p className="text-xs text-muted-foreground">in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedReturns.length}</div>
              <p className="text-xs text-muted-foreground">processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Return Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((returnItem) => (
                  <TableRow key={returnItem.returnid}>
                    <TableCell className="font-mono">
                      {returnItem.returnid.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{returnItem.order?.customers?.customername}</p>
                          <p className="text-sm text-gray-600 font-mono">
                            Order: {returnItem.orderid.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{returnItem.product?.productname}</p>
                        <p className="text-sm text-gray-600">${returnItem.product?.unitprice.toFixed(2)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm truncate" title={returnItem.returnreason}>
                          {returnItem.returnreason}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(returnItem.returndate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(returnItem.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(returnItem.status)}
                          {returnItem.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {returnItem.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateStatus(returnItem.returnid, 'approved')}
                              disabled={updating === returnItem.returnid}
                            >
                              {updating === returnItem.returnid ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(returnItem.returnid, 'rejected')}
                              disabled={updating === returnItem.returnid}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {returnItem.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(returnItem.returnid, 'processing')}
                            disabled={updating === returnItem.returnid}
                          >
                            {updating === returnItem.returnid ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <RotateCcw className="h-4 w-4 mr-1" />
                            )}
                            Process
                          </Button>
                        )}
                        {returnItem.status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(returnItem.returnid, 'completed')}
                            disabled={updating === returnItem.returnid}
                          >
                            {updating === returnItem.returnid ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Complete
                          </Button>
                        )}
                        {['completed', 'rejected'].includes(returnItem.status) && (
                          <Badge variant="secondary">
                            {returnItem.status === 'completed' ? 'Processed' : 'Rejected'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {returns.length === 0 && (
              <div className="text-center py-8">
                <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No returns found</h3>
                <p className="text-gray-600 mb-4">Create your first return request</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Return Request
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
