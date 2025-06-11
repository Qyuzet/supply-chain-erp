'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
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
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import { MapPin, Plus, Edit, Building, Package } from 'lucide-react';
import type { User } from '@/lib/auth';

interface Warehouse {
  warehouseid: string;
  warehousename: string;
  location: string;
}

interface InventoryByLocation {
  warehouseid: string;
  warehousename: string;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
}

export default function LocationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventoryByLocation, setInventoryByLocation] = useState<InventoryByLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    warehousename: '',
    location: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        if (userData) {
          await Promise.all([
            loadWarehouses(),
            loadInventoryByLocation()
          ]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load locations data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

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
      throw error;
    }
  };

  const loadInventoryByLocation = async () => {
    try {
      const { data: inventoryData, error } = await supabase
        .from('inventory')
        .select(`
          warehouseid,
          quantity,
          product:product(unitprice),
          warehouse:warehouses(warehousename)
        `);

      if (error) throw error;

      // Group inventory by warehouse
      const locationStats = inventoryData?.reduce((acc: any, item) => {
        const warehouseId = item.warehouseid;
        const warehouseName = item.warehouse?.warehousename || 'Unknown';
        
        if (!acc[warehouseId]) {
          acc[warehouseId] = {
            warehouseid: warehouseId,
            warehousename: warehouseName,
            totalItems: 0,
            totalValue: 0,
            lowStockItems: 0
          };
        }
        
        acc[warehouseId].totalItems += item.quantity;
        acc[warehouseId].totalValue += item.quantity * (item.product?.unitprice || 0);
        
        if (item.quantity < 10) {
          acc[warehouseId].lowStockItems += 1;
        }
        
        return acc;
      }, {});

      setInventoryByLocation(Object.values(locationStats || {}));
    } catch (error) {
      console.error('Error loading inventory by location:', error);
      throw error;
    }
  };

  const handleCreateWarehouse = async () => {
    if (!formData.warehousename.trim()) {
      toast({
        title: "Error",
        description: "Warehouse name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.location.trim()) {
      toast({
        title: "Error",
        description: "Location is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating warehouse with data:', {
        warehousename: formData.warehousename,
        location: formData.location
      });

      const { data, error } = await supabase
        .from('warehouses')
        .insert({
          warehousename: formData.warehousename,
          location: formData.location
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Warehouse created successfully:', data);

      toast({
        title: "Success",
        description: "Warehouse created successfully",
      });

      await loadWarehouses();
      setFormData({ warehousename: '', location: '' });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating warehouse:', error);
      toast({
        title: "Error",
        description: `Failed to create warehouse: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateWarehouse = async () => {
    if (!selectedWarehouse) return;

    try {
      const { error } = await supabase
        .from('warehouses')
        .update({
          warehousename: formData.warehousename,
          location: formData.location
        })
        .eq('warehouseid', selectedWarehouse.warehouseid);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Warehouse updated successfully",
      });

      await loadWarehouses();
      setIsEditing(false);
      setSelectedWarehouse(null);
    } catch (error) {
      console.error('Error updating warehouse:', error);
      toast({
        title: "Error",
        description: "Failed to update warehouse",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      warehousename: warehouse.warehousename,
      location: warehouse.location
    });
    setIsEditing(true);
  };



  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading locations...</div>
        </div>
      </DashboardLayout>
    );
  }

  const totalWarehouses = warehouses.length;
  const totalStock = inventoryByLocation.reduce((sum, inv) => sum + inv.totalItems, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['warehouses']}
          relatedTables={['inventory', 'shipments']}
          operations={['Create Warehouses', 'Track Inventory by Location', 'Monitor Stock']}
          description="Warehouse location management with inventory tracking"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Warehouse Locations</h1>
              <p className="text-gray-600">Manage warehouse locations and inventory</p>
            </div>
            <SqlTooltip
              page="Warehouse Locations"
              queries={[
                {
                  title: "Load Warehouses with Inventory Summary",
                  description: "Get warehouses with total inventory counts",
                  type: "SELECT",
                  sql: `SELECT
  w.*,
  COUNT(i.productid) as total_products,
  SUM(i.quantity) as total_inventory,
  COUNT(s.shipmentid) as total_shipments
FROM warehouses w
LEFT JOIN inventory i ON w.warehouseid = i.warehouseid
LEFT JOIN shipments s ON w.warehouseid = s.warehouseid
GROUP BY w.warehouseid
ORDER BY w.warehousename ASC;`
                },
                {
                  title: "Create Warehouse",
                  description: "Add new warehouse location",
                  type: "INSERT",
                  sql: `INSERT INTO warehouses (
  warehouseid,
  warehousename,
  location
) VALUES (
  gen_random_uuid(),
  $1, $2
);`
                },
                {
                  title: "Update Warehouse",
                  description: "Update warehouse information",
                  type: "UPDATE",
                  sql: `UPDATE warehouses
SET
  warehousename = $1,
  location = $2
WHERE warehouseid = $3;`
                },
                {
                  title: "Get Warehouse Inventory",
                  description: "Get detailed inventory for specific warehouse",
                  type: "SELECT",
                  sql: `SELECT
  i.*,
  p.productname,
  p.unitprice,
  s.suppliername
FROM inventory i
JOIN product p ON i.productid = p.productid
LEFT JOIN supplier s ON p.supplierid = s.supplierid
WHERE i.warehouseid = $1
ORDER BY p.productname ASC;`
                }
              ]}
            />
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Warehouse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Warehouse</DialogTitle>
                <DialogDescription>
                  Create a new warehouse location
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Warehouse Name</Label>
                  <Input
                    value={formData.warehousename}
                    onChange={(e) => setFormData({...formData, warehousename: e.target.value})}
                    placeholder="Enter warehouse name"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Enter location address"
                  />
                </div>

                <Button onClick={handleCreateWarehouse} className="w-full">
                  Create Warehouse
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWarehouses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">total items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${inventoryByLocation.reduce((sum, inv) => sum + inv.totalValue, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">inventory value</p>
            </CardContent>
          </Card>
        </div>

        {/* Warehouses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Locations</CardTitle>
            <CardDescription>All warehouse locations and their details</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => {
                  const inventoryInfo = inventoryByLocation.find(inv => inv.warehouseid === warehouse.warehouseid);
                  const currentStock = inventoryInfo?.totalItems || 0;

                  return (
                    <TableRow key={warehouse.warehouseid}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{warehouse.warehousename}</p>
                          <p className="text-sm text-gray-600">{warehouse.warehouseid.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{warehouse.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {currentStock.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(warehouse)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Inventory by Location */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Location</CardTitle>
            <CardDescription>Stock levels and value by warehouse</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Total Items</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Low Stock Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryByLocation.map((inventory) => (
                  <TableRow key={inventory.warehouseid}>
                    <TableCell className="font-medium">
                      {inventory.warehousename}
                    </TableCell>
                    <TableCell>
                      {inventory.totalItems.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      ${inventory.totalValue.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inventory.lowStockItems > 0 ? "destructive" : "secondary"}>
                        {inventory.lowStockItems}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Warehouse Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Warehouse</DialogTitle>
              <DialogDescription>
                Update warehouse information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Warehouse Name</Label>
                <Input
                  value={formData.warehousename}
                  onChange={(e) => setFormData({...formData, warehousename: e.target.value})}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <Button onClick={handleUpdateWarehouse} className="w-full">
                Update Warehouse
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
