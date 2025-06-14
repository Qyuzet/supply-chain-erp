'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { 
  ShoppingCart, 
  Plus, 
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  Calendar
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface WarehousePurchaseOrder {
  purchaseorderid: string;
  warehouseid: string;
  supplierid: string;
  orderdate: string;
  expecteddelivery: string;
  status: string;
  totalamount: number;
  notes: string;
  supplier: {
    suppliername: string;
    contactemail: string;
  };
  warehouse: {
    warehousename: string;
    location: string;
  };
  items: Array<{
    productname: string;
    quantity: number;
    unitprice: number;
  }>;
}

interface POForm {
  supplierid: string;
  warehouseid: string;
  expecteddelivery: string;
  notes: string;
  items: Array<{
    productname: string;
    quantity: string;
    unitprice: string;
  }>;
}

export default function WarehousePurchaseOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<WarehousePurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPO, setSelectedPO] = useState<WarehousePurchaseOrder | null>(null);
  const [poForm, setPOForm] = useState<POForm>({
    supplierid: '',
    warehouseid: '',
    expecteddelivery: '',
    notes: '',
    items: [{ productname: '', quantity: '', unitprice: '' }]
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData && userData.role === 'warehouse') {
          await Promise.all([
            loadPurchaseOrders(),
            loadSuppliers(),
            loadWarehouses()
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
      // Mock data for warehouse purchase orders
      const mockPOs: WarehousePurchaseOrder[] = [
        {
          purchaseorderid: 'WPO-001',
          warehouseid: 'wh-001',
          supplierid: 'sup-001',
          orderdate: '2024-01-15T10:00:00Z',
          expecteddelivery: '2024-01-25T10:00:00Z',
          status: 'pending',
          totalamount: 15000,
          notes: 'Urgent restocking for electronics section',
          supplier: {
            suppliername: 'TechSupply Co.',
            contactemail: 'orders@techsupply.com'
          },
          warehouse: {
            warehousename: 'Main Warehouse',
            location: 'New York'
          },
          items: [
            { productname: 'Laptop Computers', quantity: 20, unitprice: 500 },
            { productname: 'Wireless Mice', quantity: 100, unitprice: 25 },
            { productname: 'USB Cables', quantity: 200, unitprice: 10 }
          ]
        },
        {
          purchaseorderid: 'WPO-002',
          warehouseid: 'wh-002',
          supplierid: 'sup-002',
          orderdate: '2024-01-20T14:30:00Z',
          expecteddelivery: '2024-01-30T14:30:00Z',
          status: 'approved',
          totalamount: 22500,
          notes: 'Monthly inventory replenishment',
          supplier: {
            suppliername: 'Industrial Parts Ltd',
            contactemail: 'sales@industrialparts.com'
          },
          warehouse: {
            warehousename: 'Distribution Center',
            location: 'California'
          },
          items: [
            { productname: 'Steel Components', quantity: 50, unitprice: 300 },
            { productname: 'Fasteners Set', quantity: 500, unitprice: 15 }
          ]
        },
        {
          purchaseorderid: 'WPO-003',
          warehouseid: 'wh-001',
          supplierid: 'sup-003',
          orderdate: '2024-01-22T09:15:00Z',
          expecteddelivery: '2024-02-01T09:15:00Z',
          status: 'delivered',
          totalamount: 8750,
          notes: 'Office supplies and consumables',
          supplier: {
            suppliername: 'Office Solutions Inc',
            contactemail: 'procurement@officesolutions.com'
          },
          warehouse: {
            warehousename: 'Main Warehouse',
            location: 'New York'
          },
          items: [
            { productname: 'Paper Supplies', quantity: 100, unitprice: 25 },
            { productname: 'Printer Cartridges', quantity: 50, unitprice: 125 }
          ]
        }
      ];

      setPurchaseOrders(mockPOs);
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
      // Mock supplier data
      const mockSuppliers = [
        { supplierid: 'sup-001', suppliername: 'TechSupply Co.', contactemail: 'orders@techsupply.com' },
        { supplierid: 'sup-002', suppliername: 'Industrial Parts Ltd', contactemail: 'sales@industrialparts.com' },
        { supplierid: 'sup-003', suppliername: 'Office Solutions Inc', contactemail: 'procurement@officesolutions.com' }
      ];

      setSuppliers(mockSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadWarehouses = async () => {
    try {
      // Mock warehouse data
      const mockWarehouses = [
        { warehouseid: 'wh-001', warehousename: 'Main Warehouse', location: 'New York' },
        { warehouseid: 'wh-002', warehousename: 'Distribution Center', location: 'California' },
        { warehouseid: 'wh-003', warehousename: 'Regional Hub', location: 'Texas' }
      ];

      setWarehouses(mockWarehouses);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const handleCreatePO = async () => {
    if (!poForm.supplierid || !poForm.warehouseid || poForm.items.length === 0) {
      toast({
        title: "Error",
        description: "Please fill all required fields and add at least one item",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedSupplier = suppliers.find(s => s.supplierid === poForm.supplierid);
      const selectedWarehouse = warehouses.find(w => w.warehouseid === poForm.warehouseid);
      
      const items = poForm.items.map(item => ({
        productname: item.productname,
        quantity: parseInt(item.quantity) || 0,
        unitprice: parseFloat(item.unitprice) || 0
      }));

      const totalamount = items.reduce((sum, item) => sum + (item.quantity * item.unitprice), 0);

      const newPO: WarehousePurchaseOrder = {
        purchaseorderid: `WPO-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
        warehouseid: poForm.warehouseid,
        supplierid: poForm.supplierid,
        orderdate: new Date().toISOString(),
        expecteddelivery: poForm.expecteddelivery,
        status: 'pending',
        totalamount,
        notes: poForm.notes,
        supplier: {
          suppliername: selectedSupplier?.suppliername || 'Unknown',
          contactemail: selectedSupplier?.contactemail || 'Unknown'
        },
        warehouse: {
          warehousename: selectedWarehouse?.warehousename || 'Unknown',
          location: selectedWarehouse?.location || 'Unknown'
        },
        items
      };

      setPurchaseOrders([newPO, ...purchaseOrders]);

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      setPOForm({
        supplierid: '',
        warehouseid: '',
        expecteddelivery: '',
        notes: '',
        items: [{ productname: '', quantity: '', unitprice: '' }]
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const addItem = () => {
    setPOForm({
      ...poForm,
      items: [...poForm.items, { productname: '', quantity: '', unitprice: '' }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = poForm.items.filter((_, i) => i !== index);
    setPOForm({ ...poForm, items: newItems });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...poForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setPOForm({ ...poForm, items: newItems });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'delivered': return <Truck className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  if (!user || user.role !== 'warehouse') {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only warehouse staff can access purchase orders.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warehouse Purchase Orders</h1>
            <p className="text-gray-600">Manage purchase orders for warehouse inventory replenishment</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Purchase Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Supplier *</Label>
                    <Select value={poForm.supplierid} onValueChange={(value) => setPOForm({...poForm, supplierid: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.supplierid} value={supplier.supplierid}>
                            {supplier.suppliername}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Warehouse *</Label>
                    <Select value={poForm.warehouseid} onValueChange={(value) => setPOForm({...poForm, warehouseid: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.warehouseid} value={warehouse.warehouseid}>
                            {warehouse.warehousename}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Expected Delivery Date</Label>
                  <Input
                    type="date"
                    value={poForm.expecteddelivery}
                    onChange={(e) => setPOForm({...poForm, expecteddelivery: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={poForm.notes}
                    onChange={(e) => setPOForm({...poForm, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
                
                {/* Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  {poForm.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                      <Input
                        placeholder="Product name"
                        value={item.productname}
                        onChange={(e) => updateItem(index, 'productname', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit price"
                        value={item.unitprice}
                        onChange={(e) => updateItem(index, 'unitprice', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={poForm.items.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePO}>
                    Create Purchase Order
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
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseOrders.length}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchaseOrders.filter(po => po.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(purchaseOrders.reduce((sum, po) => sum + po.totalamount, 0))}
              </div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchaseOrders.filter(po => po.status === 'delivered').length}
              </div>
              <p className="text-xs text-muted-foreground">completed orders</p>
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
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.purchaseorderid}>
                    <TableCell className="font-mono">
                      {po.purchaseorderid}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{po.supplier.suppliername}</p>
                        <p className="text-sm text-gray-600">{po.supplier.contactemail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{po.warehouse.warehousename}</p>
                        <p className="text-sm text-gray-600">{po.warehouse.location}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(po.orderdate).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span>{new Date(po.expecteddelivery).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatCurrency(po.totalamount)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(po.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(po.status)}
                          {po.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPO(po)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
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
                <p className="text-gray-600">Create your first purchase order to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchase Order Details Dialog */}
        {selectedPO && (
          <Dialog open={!!selectedPO} onOpenChange={() => setSelectedPO(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Purchase Order Details - {selectedPO.purchaseorderid}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Supplier</Label>
                    <p className="font-medium">{selectedPO.supplier.suppliername}</p>
                    <p className="text-sm text-gray-600">{selectedPO.supplier.contactemail}</p>
                  </div>
                  <div>
                    <Label>Warehouse</Label>
                    <p className="font-medium">{selectedPO.warehouse.warehousename}</p>
                    <p className="text-sm text-gray-600">{selectedPO.warehouse.location}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Order Date</Label>
                    <p>{new Date(selectedPO.orderdate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Expected Delivery</Label>
                    <p>{new Date(selectedPO.expecteddelivery).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <Label>Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productname}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitprice)}</TableCell>
                          <TableCell>{formatCurrency(item.quantity * item.unitprice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="text-2xl font-bold">{formatCurrency(selectedPO.totalamount)}</p>
                </div>
                {selectedPO.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p>{selectedPO.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
