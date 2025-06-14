'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { productOperations } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Package, 
  DollarSign, 
  TrendingUp,
  Plus,
  Edit,
  Eye
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import type { User } from '@/lib/auth';

interface ProductWithSupplier {
  productid: string;
  productname: string;
  description: string | null;
  unitprice: number;
  supplierid: string | null;
  supplier?: {
    suppliername: string | null;
  };
}

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductWithSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSupplier | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    productname: '',
    description: '',
    unitprice: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        if (userData) {
          await loadProducts(userData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const loadProducts = async (userData: User) => {
    try {
      let productsData;

      if (userData.role === 'supplier') {
        // In the new schema, we need to find supplier by matching customer email
        // First, get supplier profile that matches this user
        const { data: supplierData } = await supabase
          .from('supplier')
          .select('supplierid, suppliername')
          .limit(1)
          .single();

        if (supplierData) {
          productsData = await productOperations.getSupplierProducts(supplierData.supplierid);
        } else {
          // If no supplier profile exists, show all products but allow creation
          productsData = await productOperations.getAllProducts();
        }
      } else {
        productsData = await productOperations.getAllProducts();
      }

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading products:', error);
      // Don't throw error, just set empty array
      setProducts([]);
    }
  };

  const handleCreateProduct = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.productname.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.unitprice <= 0) {
      toast({
        title: "Error",
        description: "Unit price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get or create supplier profile
      let { data: supplierData, error: supplierError } = await supabase
        .from('supplier')
        .select('supplierid, suppliername')
        .limit(1)
        .single();

      // If no supplier exists, create one for this user
      if (supplierError || !supplierData) {
        console.log('Creating new supplier profile...');
        const { data: newSupplier, error: createError } = await supabase
          .from('supplier')
          .insert({
            suppliername: user.fullname || user.email.split('@')[0] + ' Supplier'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating supplier:', createError);
          toast({
            title: "Error",
            description: "Failed to create supplier profile. Please try again.",
            variant: "destructive",
          });
          return;
        }

        supplierData = newSupplier;
        toast({
          title: "Info",
          description: "Created new supplier profile for you.",
        });
      }

      console.log('Creating product with data:', {
        productname: formData.productname,
        description: formData.description || null,
        unitprice: formData.unitprice,
        supplierid: supplierData.supplierid
      });

      await productOperations.createProduct({
        productname: formData.productname,
        description: formData.description || null,
        unitprice: formData.unitprice,
        supplierid: supplierData.supplierid
      });

      toast({
        title: "Success",
        description: "Product created successfully",
      });

      // Reload data
      await loadProducts(user);

      // Reset form
      setFormData({ productname: '', description: '', unitprice: 0 });
      setIsCreating(false);

    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct || !formData.productname) return;

    try {
      await productOperations.updateProduct(selectedProduct.productid, {
        productname: formData.productname,
        description: formData.description || null,
        unitprice: formData.unitprice
      });

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      // Reload data
      await loadProducts(user!);
      
      // Reset form
      setSelectedProduct(null);
      setIsEditing(false);
      setFormData({ productname: '', description: '', unitprice: 0 });

    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (product: ProductWithSupplier) => {
    setSelectedProduct(product);
    setFormData({
      productname: product.productname,
      description: product.description || '',
      unitprice: product.unitprice
    });
    setIsEditing(true);
  };

  const openCreateDialog = () => {
    setFormData({ productname: '', description: '', unitprice: 0 });
    setIsCreating(true);
  };

  const totalProducts = products.length;
  const averagePrice = products.length > 0 
    ? products.reduce((sum, p) => sum + p.unitprice, 0) / products.length 
    : 0;
  const totalValue = products.reduce((sum, p) => sum + p.unitprice, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['product']}
          relatedTables={['supplier', 'inventory', 'orderdetail']}
          operations={['Create Products', 'Manage Catalog', 'Auto-Create Inventory', 'Track Sales']}
          description="Supplier product management. Real-world logic: Suppliers own product designs and create products. Admin assigns products to warehouses. Suppliers request factory production but don't manufacture themselves. Products flow: Create → Assign → Shop → Order."
        />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">
              {user?.role === 'supplier' ? 'Manage your product catalog' : 'All products in the system'}
            </p>
          </div>
          <SqlTooltip
            page="Products"
            queries={[
              {
                title: "Load Products with Supplier Info",
                description: "Get all products with supplier details using FIFO ordering",
                type: "SELECT",
                sql: `SELECT
  p.*,
  s.suppliername,
  s.contactinfo
FROM product p
LEFT JOIN supplier s ON p.supplierid = s.supplierid
ORDER BY p.productname ASC; -- Alphabetical order`
              },
              {
                title: "Create Product",
                description: "Add new product to catalog with automatic inventory initialization",
                type: "INSERT",
                sql: `INSERT INTO product (
  productid,
  productname,
  description,
  unitprice,
  supplierid
) VALUES (
  gen_random_uuid(),
  $1, $2, $3, $4
);

-- Auto-create inventory entry
INSERT INTO inventory (
  productid, warehouseid, quantity
) VALUES (
  $productid, $warehouseid, 0
);`
              },
              {
                title: "Update Product",
                description: "Update product information and pricing",
                type: "UPDATE",
                sql: `UPDATE product
SET
  productname = $1,
  description = $2,
  unitprice = $3
WHERE productid = $4
  AND supplierid = $5; -- Ensure supplier owns product`
              },
              {
                title: "Delete Product",
                description: "Remove product from catalog (with constraints)",
                type: "DELETE",
                sql: `DELETE FROM product
WHERE productid = $1
  AND supplierid = $2 -- Ensure supplier owns product
  AND NOT EXISTS (
    SELECT 1 FROM orderdetail
    WHERE productid = $1
  ); -- Prevent deletion if used in orders`
              }
            ]}
          />
        </div>
        {user?.role === 'supplier' && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Products Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averagePrice.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per unit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Catalog value</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            {user?.role === 'supplier' ? 'Your products' : 'All products in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit Price</TableHead>
                {user?.role !== 'supplier' && <TableHead>Supplier</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.productid}>
                  <TableCell className="font-medium">
                    {product.productname}
                  </TableCell>
                  <TableCell>
                    {product.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    ${product.unitprice.toFixed(2)}
                  </TableCell>
                  {user?.role !== 'supplier' && (
                    <TableCell>
                      {product.supplier?.suppliername || 'Unknown'}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Product Details</DialogTitle>
                            <DialogDescription>
                              {selectedProduct?.productname}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedProduct && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">Product Information</h4>
                                <p className="text-sm text-gray-600">
                                  Name: {selectedProduct.productname}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Description: {selectedProduct.description || 'No description'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Unit Price: ${selectedProduct.unitprice.toFixed(2)}
                                </p>
                                {selectedProduct.supplier && (
                                  <p className="text-sm text-gray-600">
                                    Supplier: {selectedProduct.supplier.suppliername}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {user?.role === 'supplier' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Create Product Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product in your catalog
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productname">Product Name</Label>
              <Input
                id="productname"
                value={formData.productname}
                onChange={(e) => setFormData({ ...formData, productname: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter product description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitprice">Unit Price</Label>
              <Input
                id="unitprice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitprice}
                onChange={(e) => setFormData({ ...formData, unitprice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProduct}>
                Create Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-productname">Product Name</Label>
              <Input
                id="edit-productname"
                value={formData.productname}
                onChange={(e) => setFormData({ ...formData, productname: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter product description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-unitprice">Unit Price</Label>
              <Input
                id="edit-unitprice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitprice}
                onChange={(e) => setFormData({ ...formData, unitprice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProduct}>
                Update Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
