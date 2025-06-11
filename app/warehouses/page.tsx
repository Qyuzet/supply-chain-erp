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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import { Building, Plus, Edit, MapPin, Package, Users, Trash2 } from 'lucide-react';
import type { User } from '@/lib/auth';

interface Warehouse {
  warehouseid: string;
  warehousename: string;
  location: string;
}

interface WarehouseStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  utilizationRate: number;
}

export default function WarehousesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStats, setWarehouseStats] = useState<Record<string, WarehouseStats>>({});
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

        if (userData?.role === 'admin') {
          await Promise.all([
            loadWarehouses(),
            loadWarehouseStats()
          ]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load warehouse data",
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

  const loadWarehouseStats = async () => {
    try {
      const { data: inventoryData, error } = await supabase
        .from('inventory')
        .select(`
          warehouseid,
          quantity,
          product:product(unitprice)
        `);

      if (error) throw error;

      // Calculate stats for each warehouse
      const stats: Record<string, WarehouseStats> = {};
      
      inventoryData?.forEach(item => {
        const warehouseId = item.warehouseid;
        if (!stats[warehouseId]) {
          stats[warehouseId] = {
            totalItems: 0,
            totalValue: 0,
            lowStockItems: 0,
            utilizationRate: 0
          };
        }
        
        stats[warehouseId].totalItems += item.quantity;
        stats[warehouseId].totalValue += item.quantity * (item.product?.unitprice || 0);
        
        if (item.quantity < 10) {
          stats[warehouseId].lowStockItems += 1;
        }
      });

      setWarehouseStats(stats);
    } catch (error) {
      console.error('Error loading warehouse stats:', error);
    }
  };

  const handleCreateWarehouse = async () => {
    if (!formData.warehousename || !formData.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating warehouse with data:', {
        warehousename: formData.warehousename,
        location: formData.location
      });

      // Check current user session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session user:', session?.user?.id);

      const { data, error } = await supabase
        .from('warehouses')
        .insert({
          warehousename: formData.warehousename,
          location: formData.location
        });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Warehouse created successfully:', data);

      toast({
        title: "Success",
        description: "Warehouse created successfully",
      });

      await loadWarehouses();
      resetForm();
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating warehouse:', error);
      toast({
        title: "Error",
        description: "Failed to create warehouse",
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
      resetForm();
    } catch (error) {
      console.error('Error updating warehouse:', error);
      toast({
        title: "Error",
        description: "Failed to update warehouse",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;

    try {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('warehouseid', warehouseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Warehouse deleted successfully",
      });

      await loadWarehouses();
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast({
        title: "Error",
        description: "Failed to delete warehouse",
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

  const resetForm = () => {
    setFormData({
      warehousename: '',
      location: ''
    });
  };



  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading warehouses...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to manage warehouses.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalWarehouses = warehouses.length;
  const totalStock = Object.values(warehouseStats).reduce((sum, stats) => sum + stats.totalItems, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['warehouses']}
          relatedTables={['inventory', 'shipments']}
          operations={['Create Warehouses', 'Manage Locations', 'Track Inventory']}
          description="Warehouse location management with inventory tracking"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
              <p className="text-gray-600">Manage warehouse locations and operations</p>
            </div>
            <SqlTooltip
              page="Warehouse Management"
              queries={[
                {
                  title: "Load Warehouses with Statistics",
                  description: "Get warehouses with inventory and operational statistics",
                  type: "SELECT",
                  sql: `SELECT
  w.*,
  COUNT(i.productid) as total_products,
  SUM(i.quantity) as total_inventory,
  COUNT(s.shipmentid) as total_shipments,
  SUM(i.quantity * p.unitprice) as total_value
FROM warehouses w
LEFT JOIN inventory i ON w.warehouseid = i.warehouseid
LEFT JOIN product p ON i.productid = p.productid
LEFT JOIN shipments s ON w.warehouseid = s.warehouseid
GROUP BY w.warehouseid
ORDER BY w.warehousename ASC;`
                },
                {
                  title: "Create Warehouse",
                  description: "Add new warehouse location to the system",
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
                  description: "Update warehouse information and location details",
                  type: "UPDATE",
                  sql: `UPDATE warehouses
SET
  warehousename = $1,
  location = $2
WHERE warehouseid = $3;`
                },
                {
                  title: "Delete Warehouse",
                  description: "Remove warehouse (with constraint checks)",
                  type: "DELETE",
                  sql: `DELETE FROM warehouses
WHERE warehouseid = $1
  AND NOT EXISTS (
    SELECT 1 FROM inventory
    WHERE warehouseid = $1 AND quantity > 0
  )
  AND NOT EXISTS (
    SELECT 1 FROM shipments
    WHERE warehouseid = $1 AND status != 'delivered'
  );`
                },
                {
                  title: "Warehouse Inventory Analysis",
                  description: "Analyze inventory levels and identify low stock items",
                  type: "SELECT",
                  sql: `SELECT
  w.warehousename,
  COUNT(i.productid) as total_products,
  SUM(i.quantity) as total_items,
  COUNT(CASE WHEN i.quantity < 10 THEN 1 END) as low_stock_items,
  SUM(i.quantity * p.unitprice) as total_value
FROM warehouses w
LEFT JOIN inventory i ON w.warehouseid = i.warehouseid
LEFT JOIN product p ON i.productid = p.productid
GROUP BY w.warehouseid, w.warehousename
ORDER BY total_value DESC;`
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Warehouse</DialogTitle>
                <DialogDescription>
                  Create a new warehouse location
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Warehouse Name *</Label>
                  <Input
                    value={formData.warehousename}
                    onChange={(e) => setFormData({...formData, warehousename: e.target.value})}
                    placeholder="Enter warehouse name"
                  />
                </div>
                <div>
                  <Label>Location *</Label>
                  <Textarea
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Enter full address"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWarehouse} className="flex-1">
                    Create Warehouse
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWarehouses}</div>
              <p className="text-xs text-muted-foreground">locations</p>
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
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(warehouseStats).reduce((sum, stats) => sum + stats.lowStockItems, 0)}
              </div>
              <p className="text-xs text-muted-foreground">items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Object.values(warehouseStats).reduce((sum, stats) => sum + stats.totalValue, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">inventory value</p>
            </CardContent>
          </Card>
        </div>

        {/* Warehouses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Warehouses</CardTitle>
            <CardDescription>Manage warehouse locations and their details</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => {
                  const stats = warehouseStats[warehouse.warehouseid] || {
                    totalItems: 0,
                    totalValue: 0,
                    lowStockItems: 0,
                    utilizationRate: 0
                  };
                  return (
                    <TableRow key={warehouse.warehouseid}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{warehouse.warehousename}</p>
                          <p className="text-sm text-gray-600">{warehouse.warehouseid.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2 max-w-xs">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{warehouse.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {stats.totalItems.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(warehouse)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWarehouse(warehouse.warehouseid)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Warehouse Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Warehouse</DialogTitle>
              <DialogDescription>
                Update warehouse information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Warehouse Name *</Label>
                <Input
                  value={formData.warehousename}
                  onChange={(e) => setFormData({...formData, warehousename: e.target.value})}
                />
              </div>
              <div>
                <Label>Location *</Label>
                <Textarea
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateWarehouse} className="flex-1">
                  Update Warehouse
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
