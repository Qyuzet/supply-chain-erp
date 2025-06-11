'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { inventoryOperations, productOperations } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Edit,
  Plus,
  Minus
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import PageExplanation from '@/components/PageExplanation';
import type { User } from '@/lib/auth';

interface InventoryItem {
  productid: string;
  warehouseid: string;
  quantity: number;
  product: {
    productid: string;
    productname: string;
    description: string | null;
    unitprice: number;
  };
  warehouses: {
    warehouseid: string;
    warehousename: string;
    location: string | null;
  };
}

export default function InventoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out' | 'adjustment'>('adjustment');
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        if (userData) {
          await loadInventory();
          await loadLowStockItems();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load inventory data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const loadInventory = async () => {
    try {
      const data = await inventoryOperations.getWarehouseInventory();
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
      throw error;
    }
  };

  const loadLowStockItems = async () => {
    try {
      const data = await inventoryOperations.getLowStockItems(10);
      setLowStockItems(data || []);
    } catch (error) {
      console.error('Error loading low stock items:', error);
      throw error;
    }
  };

  const handleInventoryAdjustment = async () => {
    if (!selectedItem) return;

    // Allow 0 for "set exact quantity" but not for add/remove operations
    if (adjustmentQuantity === 0 && adjustmentType !== 'adjustment') {
      toast({
        title: "Error",
        description: "Please enter a quantity greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      let newQuantity = selectedItem.quantity;
      
      if (adjustmentType === 'in') {
        newQuantity += adjustmentQuantity;
      } else if (adjustmentType === 'out') {
        newQuantity -= adjustmentQuantity;
      } else {
        newQuantity = adjustmentQuantity;
      }

      // Validate the new quantity
      if (newQuantity < 0) {
        toast({
          title: "Error",
          description: "Quantity cannot be negative",
          variant: "destructive",
        });
        return;
      }

      if (adjustmentType === 'adjustment' && adjustmentQuantity < 0) {
        toast({
          title: "Error",
          description: "Exact quantity must be 0 or greater",
          variant: "destructive",
        });
        return;
      }

      // Update inventory in database
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('productid', selectedItem.productid)
        .eq('warehouseid', selectedItem.warehouseid);

      if (error) throw error;

      const changeDescription = adjustmentType === 'in'
        ? `Added ${adjustmentQuantity} units`
        : adjustmentType === 'out'
        ? `Removed ${adjustmentQuantity} units`
        : `Set quantity to ${adjustmentQuantity}`;

      toast({
        title: "Success",
        description: `Inventory updated successfully. ${changeDescription}. New quantity: ${newQuantity}`,
      });

      // Reload data
      await loadInventory();
      await loadLowStockItems();
      
      // Reset form
      setSelectedItem(null);
      setAdjustmentQuantity(1);
      setAdjustmentType('in');

    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (quantity < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    if (quantity < 50) return { label: 'Normal', color: 'bg-blue-100 text-blue-800' };
    return { label: 'High Stock', color: 'bg-green-100 text-green-800' };
  };

  const totalItems = inventory.length;
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const outOfStockItems = inventory.filter(item => item.quantity === 0).length;

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
          primaryTables={['inventory']}
          relatedTables={['product', 'warehouses']}
          operations={['Track Stock Levels', 'Adjust Quantities', 'Monitor Alerts']}
          description="Real-time inventory management with stock level monitoring"
        />

        <PageExplanation
          title="Inventory Management"
          description="Monitor and manage stock levels across all warehouse locations"
          steps={[
            {
              title: "Monitor Stock Levels",
              description: "View current inventory quantities for all products across warehouses",
              action: "Review the inventory table below"
            },
            {
              title: "Identify Low Stock",
              description: "Look for items with low quantities that need restocking",
              action: "Check for red 'Low Stock' badges"
            },
            {
              title: "Adjust Quantities",
              description: "Update inventory levels when stock arrives or is consumed",
              action: "Click 'Adjust Stock' button for any item"
            },
            {
              title: "Track by Warehouse",
              description: "See which warehouse locations have specific products",
              action: "View warehouse column in the table"
            },
            {
              title: "Monitor Alerts",
              description: "Keep track of items that need immediate attention",
              action: "Focus on items with quantity < 10"
            }
          ]}
          tips={[
            "Low stock items (< 10 units) are highlighted in red",
            "Inventory is automatically updated when orders are processed",
            "Each product can be stored in multiple warehouse locations",
            "Regular stock adjustments help maintain accurate levels",
            "Zero stock items prevent new orders from being placed"
          ]}
          relatedPages={[
            {
              name: "Warehouse Orders",
              path: "/warehouse-orders",
              description: "Process orders that affect inventory levels"
            },
            {
              name: "Locations",
              path: "/locations",
              description: "Manage warehouse locations and capacity"
            },
            {
              name: "Products",
              path: "/products",
              description: "View product catalog and details"
            }
          ]}
        />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Monitor and manage warehouse inventory levels</p>
          </div>
          <SqlTooltip
            page="Inventory"
            queries={[
              {
                title: "Load Inventory with Product Details",
                description: "Get inventory levels with product and warehouse information",
                type: "SELECT",
                sql: `SELECT
  i.*,
  p.productname,
  p.unitprice,
  w.warehousename,
  w.location,
  s.suppliername
FROM inventory i
JOIN product p ON i.productid = p.productid
JOIN warehouses w ON i.warehouseid = w.warehouseid
LEFT JOIN supplier s ON p.supplierid = s.supplierid
ORDER BY p.productname ASC;`
              },
              {
                title: "Update Inventory Quantity",
                description: "Update stock levels with movement logging",
                type: "UPDATE",
                sql: `UPDATE inventory
SET quantity = $1
WHERE productid = $2
  AND warehouseid = $3;

-- Log inventory movement
INSERT INTO inventorylog (
  logid, productid, warehouseid,
  movementtype, quantity,
  referencetype, referenceid,
  timestamp
) VALUES (
  gen_random_uuid(), $2, $3,
  $4, $5, $6, $7, NOW()
);`
              },
              {
                title: "Check Low Stock Items",
                description: "Find products with low inventory levels",
                type: "SELECT",
                sql: `SELECT
  i.*,
  p.productname,
  w.warehousename
FROM inventory i
JOIN product p ON i.productid = p.productid
JOIN warehouses w ON i.warehouseid = w.warehouseid
WHERE i.quantity < 10 -- Low stock threshold
ORDER BY i.quantity ASC;`
              }
            ]}
          />
        </div>
      </div>

      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Unique products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Units in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">Urgent attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Low Stock Alert</CardTitle>
            <CardDescription className="text-yellow-700">
              The following items need restocking:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.slice(0, 6).map((item) => (
                <div key={`${item.productid}-${item.warehouseid}`} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{item.product.productname}</p>
                    <p className="text-sm text-gray-600">{item.warehouses.warehousename}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {item.quantity} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>All products across warehouses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const status = getStockStatus(item.quantity);
                return (
                  <TableRow key={`${item.productid}-${item.warehouseid}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.product.productname}</p>
                        <p className="text-sm text-gray-600">{item.product.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.warehouses.warehousename}</p>
                        <p className="text-sm text-gray-600">{item.warehouses.location}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.quantity}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>${item.product.unitprice.toFixed(2)}</TableCell>
                    <TableCell>${(item.quantity * item.product.unitprice).toFixed(2)}</TableCell>
                    <TableCell>
                      <Dialog open={selectedItem?.productid === item.productid && selectedItem?.warehouseid === item.warehouseid} onOpenChange={(open) => !open && setSelectedItem(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setAdjustmentQuantity(adjustmentType === 'adjustment' ? item.quantity : 1);
                              setAdjustmentType('in'); // Default to adding stock
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adjust Inventory</DialogTitle>
                            <DialogDescription>
                              Update quantity for {selectedItem?.product.productname}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedItem && (
                            <div className="space-y-4">
                              <div>
                                <Label>Current Quantity</Label>
                                <p className="text-2xl font-bold">{selectedItem.quantity}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                                <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="in">Add Stock (+)</SelectItem>
                                    <SelectItem value="out">Remove Stock (-)</SelectItem>
                                    <SelectItem value="adjustment">Set Exact Quantity</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="quantity">
                                  {adjustmentType === 'adjustment' ? 'New Quantity' : 'Quantity Change'}
                                </Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  min={adjustmentType === 'adjustment' ? '0' : '1'}
                                  value={adjustmentQuantity}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    if (value >= 0) {
                                      setAdjustmentQuantity(value);
                                    }
                                  }}
                                  placeholder={adjustmentType === 'adjustment' ? 'Enter exact quantity' : 'Enter quantity to add/remove'}
                                />
                                {adjustmentType !== 'adjustment' && adjustmentQuantity > 0 && (
                                  <p className="text-sm text-gray-600">
                                    New quantity will be: {
                                      adjustmentType === 'in'
                                        ? selectedItem.quantity + adjustmentQuantity
                                        : Math.max(0, selectedItem.quantity - adjustmentQuantity)
                                    }
                                  </p>
                                )}
                              </div>

                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleInventoryAdjustment}>
                                  Update Inventory
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
