'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { purchaseOrderOperations } from '@/lib/database';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import { 
  ShoppingCart, 
  Plus, 
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  Trash2,
  Factory
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface Product {
  productid: string;
  productname: string;
  description: string;
  unitprice: number;
  supplier: {
    suppliername: string;
  };
}

interface Supplier {
  supplierid: string;
  suppliername: string;
}

interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface PurchaseOrder {
  purchaseorderid: string;
  supplierid: string;
  orderdate: string;
  status: string;
  totalamount: number;
  supplier?: {
    suppliername: string;
  };
  purchaseorderdetail?: Array<{
    purchaseorderdetailid: string;
    productid: string;
    quantity: number;
    unitprice: number;
    subtotal: number;
    product: {
      productname: string;
      description: string;
    };
  }>;
}

export default function DetailedPurchaseOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadPurchaseOrders(),
            loadSuppliers(),
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

  const loadPurchaseOrders = async () => {
    try {
      const data = await purchaseOrderOperations.getAllPurchaseOrders();
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
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

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product')
        .select(`
          *,
          supplier (suppliername)
        `)
        .order('productname');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addProductToOrder = () => {
    if (!selectedProduct || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter valid quantity",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.productid === selectedProduct);
    if (!product) return;

    const existingItem = orderItems.find(item => item.productId === selectedProduct);
    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.productId === selectedProduct 
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
          : item
      ));
    } else {
      const newItem: PurchaseOrderItem = {
        productId: product.productid,
        productName: product.productname,
        quantity,
        unitPrice: product.unitprice,
        subtotal: quantity * product.unitprice
      };
      setOrderItems([...orderItems, newItem]);
    }

    setSelectedProduct('');
    setQuantity(1);
  };

  const removeProductFromOrder = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCreatePurchaseOrder = async () => {
    if (!selectedSupplier || orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select a supplier and add at least one product",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderData = orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      await purchaseOrderOperations.createPurchaseOrderWithDetails(selectedSupplier, orderData);

      toast({
        title: "Success",
        description: "Detailed purchase order created successfully",
      });

      // Reset form
      setSelectedSupplier('');
      setOrderItems([]);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !['warehouse', 'admin'].includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Only Warehouse staff and Admin can create detailed purchase orders.</p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredProducts = selectedSupplier 
    ? products.filter(p => p.supplier && p.supplier.suppliername === suppliers.find(s => s.supplierid === selectedSupplier)?.suppliername)
    : products;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['purchaseorder', 'purchaseorderdetail']}
          relatedTables={['supplier', 'product', 'production']}
          operations={['Create Detailed POs', 'Link Products', 'Connect to Production']}
          description="Comprehensive Purchase Order system. Real-world flow: Warehouse creates detailed PO with specific products → Supplier approves → Supplier requests factory production for exact items → Factory manufactures → Warehouse receives inventory. Complete product-level tracking."
        />

        {/* Real-World Flow Guidance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Complete Real-World Purchase Order Flow</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>1. Warehouse</strong> creates detailed Purchase Order with specific products and quantities</p>
            <p><strong>2. Supplier</strong> reviews and approves/rejects the detailed PO</p>
            <p><strong>3. Supplier</strong> requests Factory to produce the exact products from approved PO</p>
            <p><strong>4. Factory</strong> manufactures products → automatically updates warehouse inventory</p>
            <p><strong>5. Warehouse</strong> pays Supplier for delivered goods</p>
            <p className="mt-2 font-medium text-blue-900">
              This creates complete traceability: Warehouse need → Supplier approval → Factory production → Inventory fulfillment
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detailed Purchase Orders</h1>
              <p className="text-gray-600">Create comprehensive purchase orders with specific products</p>
            </div>
            <SqlTooltip
              page="Detailed Purchase Orders - Complete Workflow"
              queries={[
                {
                  title: "Create Purchase Order with Product Details",
                  description: "Real-world PO: Warehouse specifies exact products and quantities needed from supplier",
                  type: "INSERT",
                  sql: `-- Step 1: Create purchase order header
INSERT INTO purchaseorder (
  purchaseorderid, supplierid, orderdate, status, totalamount
) VALUES (
  gen_random_uuid(), $1, NOW(), 'pending', $2
);

-- Step 2: Add detailed line items for each product
INSERT INTO purchaseorderdetail (
  purchaseorderid, productid, quantity, unitprice
) VALUES 
  ($3, $4, $5, $6),
  ($3, $7, $8, $9);

-- This creates complete traceability from warehouse need to supplier fulfillment`
                },
                {
                  title: "Link Production to Purchase Order Details",
                  description: "Factory produces exact items from approved purchase orders",
                  type: "INSERT",
                  sql: `-- Supplier requests factory production for approved PO items
INSERT INTO production (
  productionorderid, productid, purchaseorderdetailid, 
  quantity, startdate, status
) 
SELECT 
  gen_random_uuid(),
  pod.productid,
  pod.purchaseorderdetailid,
  pod.quantity,
  NOW(),
  'pending'
FROM purchaseorderdetail pod
JOIN purchaseorder po ON pod.purchaseorderid = po.purchaseorderid
WHERE po.status = 'approved' AND po.purchaseorderid = $1;

-- Factory produces exactly what warehouse ordered from supplier`
                }
              ]}
            />
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Detailed PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create Detailed Purchase Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Supplier Selection */}
                <div>
                  <Label>Supplier *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplierid} value={supplier.supplierid}>
                        {supplier.suppliername}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Addition */}
                {selectedSupplier && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold mb-3">Add Products to Order</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Product</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {filteredProducts.map((product) => (
                            <option key={product.productid} value={product.productid}>
                              {product.productname} - ${product.unitprice}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={addProductToOrder} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Product
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {orderItems.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Order Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeProductFromOrder(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 text-right">
                      <p className="text-lg font-bold">Total: ${getTotalAmount().toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setSelectedSupplier('');
                    setOrderItems([]);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePurchaseOrder} disabled={orderItems.length === 0}>
                    Create Purchase Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                  <TableHead>Total Amount</TableHead>
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
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {po.status === 'approved' && (
                          <Button size="sm">
                            <Factory className="h-4 w-4 mr-1" />
                            Request Production
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
