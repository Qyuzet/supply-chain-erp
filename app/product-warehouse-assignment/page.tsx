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
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import { 
  Package, 
  Building, 
  Plus,
  Trash2,
  Edit,
  MapPin
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

interface Warehouse {
  warehouseid: string;
  warehousename: string;
  location: string;
}

interface ProductWarehouseAssignment {
  inventoryid: string;
  productid: string;
  warehouseid: string;
  quantity: number;
  product: Product;
  warehouses: Warehouse;
}

export default function ProductWarehouseAssignmentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<ProductWarehouseAssignment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [formData, setFormData] = useState({
    productid: '',
    warehouseid: '',
    initialQuantity: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData && (userData.role === 'admin' || userData.role === 'warehouse')) {
          await Promise.all([
            loadAssignments(),
            loadProducts(),
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

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          product (
            productid,
            productname,
            description,
            unitprice,
            supplier (suppliername)
          ),
          warehouses (
            warehouseid,
            warehousename,
            location
          )
        `)
        .order('quantity', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load product-warehouse assignments",
        variant: "destructive",
      });
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

  const loadWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('warehousename');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const handleAssignProduct = async () => {
    if (!formData.productid || !formData.warehouseid) {
      toast({
        title: "Error",
        description: "Please select both product and warehouse",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if assignment already exists - FIXED for composite key
      const { data: existing } = await supabase
        .from('inventory')
        .select('productid, warehouseid')
        .eq('productid', formData.productid)
        .eq('warehouseid', formData.warehouseid)
        .single();

      if (existing) {
        toast({
          title: "Error",
          description: "This product is already assigned to this warehouse",
          variant: "destructive",
        });
        return;
      }

      // Create new assignment
      const { error } = await supabase
        .from('inventory')
        .insert({
          productid: formData.productid,
          warehouseid: formData.warehouseid,
          quantity: formData.initialQuantity
        });

      if (error) throw error;

      // Log the assignment
      await supabase
        .from('inventorylog')
        .insert({
          logid: crypto.randomUUID(),
          productid: formData.productid,
          warehouseid: formData.warehouseid,
          movementtype: 'assignment',
          quantity: formData.initialQuantity,
          referencetype: 'product_assignment',
          referenceid: formData.productid,
          timestamp: new Date().toISOString()
        });

      toast({
        title: "Success",
        description: "Product assigned to warehouse successfully",
      });

      setFormData({ productid: '', warehouseid: '', initialQuantity: 0 });
      setIsAssigning(false);
      await loadAssignments();
    } catch (error) {
      console.error('Error assigning product:', error);
      toast({
        title: "Error",
        description: "Failed to assign product to warehouse",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssignment = async (productId: string, warehouseId: string) => {
    try {
      // FIXED: Use composite key for deletion
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('productid', productId)
        .eq('warehouseid', warehouseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product assignment removed successfully",
      });

      await loadAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove product assignment",
        variant: "destructive",
      });
    }
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

  if (!user || (user.role !== 'admin' && user.role !== 'warehouse')) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Only Admin and Warehouse staff can manage product-warehouse assignments.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['inventory']}
          relatedTables={['product', 'warehouses', 'inventorylog']}
          operations={['Assign Products', 'Manage Inventory', 'Track Assignments']}
          description="Product-warehouse assignment management. Control which products are stocked in which warehouses with initial quantities."
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Product-Warehouse Assignment</h1>
              <p className="text-muted-foreground">Manage which products are stocked in which warehouses</p>
            </div>
            <SqlTooltip
              page="Product-Warehouse Assignment"
              queries={[
                {
                  title: "Load Product-Warehouse Assignments",
                  description: "Get all product assignments with warehouse and supplier details",
                  type: "SELECT",
                  sql: `SELECT 
  i.*,
  p.productname,
  p.unitprice,
  s.suppliername,
  w.warehousename,
  w.location
FROM inventory i
JOIN product p ON i.productid = p.productid
JOIN supplier s ON p.supplierid = s.supplierid
JOIN warehouses w ON i.warehouseid = w.warehouseid
ORDER BY i.quantity ASC;`
                },
                {
                  title: "Assign Product to Warehouse",
                  description: "Create new product-warehouse assignment with initial stock",
                  type: "INSERT",
                  sql: `INSERT INTO inventory (
  inventoryid,
  productid,
  warehouseid,
  quantity
) VALUES (
  gen_random_uuid(),
  $1, $2, $3
);`
                },
                {
                  title: "Log Assignment Activity",
                  description: "Track product assignment changes in inventory log",
                  type: "INSERT",
                  sql: `INSERT INTO inventorylog (
  logid,
  productid,
  warehouseid,
  movementtype,
  quantity,
  referencetype,
  timestamp
) VALUES (
  gen_random_uuid(),
  $1, $2, 'assignment', $3, 'product_assignment', NOW()
);`
                }
              ]}
            />
          </div>
          
          <Dialog open={isAssigning} onOpenChange={setIsAssigning}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Product to Warehouse</DialogTitle>
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
                        {product.productname} - {product.supplier.suppliername} (${product.unitprice})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Warehouse *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.warehouseid}
                    onChange={(e) => setFormData({...formData, warehouseid: e.target.value})}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.warehouseid} value={warehouse.warehouseid}>
                        {warehouse.warehousename} - {warehouse.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Initial Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.initialQuantity}
                    onChange={(e) => setFormData({...formData, initialQuantity: parseInt(e.target.value) || 0})}
                    placeholder="Enter initial stock quantity"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAssigning(false);
                    setFormData({ productid: '', warehouseid: '', initialQuantity: 0 });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssignProduct}>
                    Assign Product
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product-Warehouse Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.inventoryid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{assignment.product.productname}</p>
                          <p className="text-sm text-muted-foreground">{assignment.product.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{assignment.product.supplier.suppliername}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{assignment.warehouses.warehousename}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{assignment.warehouses.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.quantity < 10 ? "destructive" : assignment.quantity < 50 ? "secondary" : "default"}>
                        {assignment.quantity} units
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${assignment.product.unitprice.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.inventoryid)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
