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
  MapPin, 
  Plus, 
  Building,
  Package,
  BarChart3,
  Edit,
  Trash2,
  Archive
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface WarehouseLocation {
  locationid: string;
  warehouseid: string;
  locationname: string;
  locationtype: string;
  capacity: number;
  currentstock: number;
  status: string;
  description: string;
  warehouse: {
    warehousename: string;
    location: string;
  };
}

interface LocationForm {
  locationname: string;
  locationtype: string;
  capacity: string;
  description: string;
  warehouseid: string;
}

export default function WarehouseLocationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WarehouseLocation | null>(null);
  const [locationForm, setLocationForm] = useState<LocationForm>({
    locationname: '',
    locationtype: 'shelf',
    capacity: '',
    description: '',
    warehouseid: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData && userData.role === 'warehouse') {
          await Promise.all([
            loadLocations(),
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

  const loadLocations = async () => {
    try {
      // Mock data for warehouse locations
      const mockLocations: WarehouseLocation[] = [
        {
          locationid: '1',
          warehouseid: 'wh-001',
          locationname: 'A-01-001',
          locationtype: 'shelf',
          capacity: 100,
          currentstock: 75,
          status: 'active',
          description: 'Main storage shelf - Electronics',
          warehouse: {
            warehousename: 'Main Warehouse',
            location: 'New York'
          }
        },
        {
          locationid: '2',
          warehouseid: 'wh-001',
          locationname: 'B-02-015',
          locationtype: 'bin',
          capacity: 50,
          currentstock: 30,
          status: 'active',
          description: 'Small parts storage bin',
          warehouse: {
            warehousename: 'Main Warehouse',
            location: 'New York'
          }
        },
        {
          locationid: '3',
          warehouseid: 'wh-002',
          locationname: 'C-01-008',
          locationtype: 'rack',
          capacity: 200,
          currentstock: 150,
          status: 'active',
          description: 'Heavy equipment rack',
          warehouse: {
            warehousename: 'Distribution Center',
            location: 'California'
          }
        },
        {
          locationid: '4',
          warehouseid: 'wh-001',
          locationname: 'D-03-022',
          locationtype: 'floor',
          capacity: 500,
          currentstock: 0,
          status: 'maintenance',
          description: 'Floor storage area - Under maintenance',
          warehouse: {
            warehousename: 'Main Warehouse',
            location: 'New York'
          }
        }
      ];

      setLocations(mockLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast({
        title: "Error",
        description: "Failed to load warehouse locations",
        variant: "destructive",
      });
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

  const handleCreateLocation = async () => {
    if (!locationForm.locationname || !locationForm.warehouseid) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedWarehouse = warehouses.find(w => w.warehouseid === locationForm.warehouseid);
      
      const newLocation: WarehouseLocation = {
        locationid: crypto.randomUUID(),
        warehouseid: locationForm.warehouseid,
        locationname: locationForm.locationname,
        locationtype: locationForm.locationtype,
        capacity: parseInt(locationForm.capacity) || 0,
        currentstock: 0,
        status: 'active',
        description: locationForm.description,
        warehouse: {
          warehousename: selectedWarehouse?.warehousename || 'Unknown',
          location: selectedWarehouse?.location || 'Unknown'
        }
      };

      setLocations([...locations, newLocation]);

      toast({
        title: "Success",
        description: "Location created successfully",
      });

      setLocationForm({
        locationname: '',
        locationtype: 'shelf',
        capacity: '',
        description: '',
        warehouseid: ''
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating location:', error);
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800',
      full: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shelf': return <Package className="h-4 w-4" />;
      case 'rack': return <BarChart3 className="h-4 w-4" />;
      case 'bin': return <Archive className="h-4 w-4" />;
      case 'floor': return <Building className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getCapacityPercentage = (current: number, capacity: number) => {
    if (capacity === 0) return 0;
    return Math.round((current / capacity) * 100);
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
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only warehouse staff can access location management.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Warehouse Locations</h1>
            <p className="text-gray-600">Manage storage locations and capacity across warehouses</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Location Name *</Label>
                  <Input
                    value={locationForm.locationname}
                    onChange={(e) => setLocationForm({...locationForm, locationname: e.target.value})}
                    placeholder="e.g., A-01-001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Warehouse *</Label>
                    <Select value={locationForm.warehouseid} onValueChange={(value) => setLocationForm({...locationForm, warehouseid: value})}>
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
                  <div>
                    <Label>Location Type</Label>
                    <Select value={locationForm.locationtype} onValueChange={(value) => setLocationForm({...locationForm, locationtype: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shelf">Shelf</SelectItem>
                        <SelectItem value="rack">Rack</SelectItem>
                        <SelectItem value="bin">Bin</SelectItem>
                        <SelectItem value="floor">Floor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={locationForm.capacity}
                    onChange={(e) => setLocationForm({...locationForm, capacity: e.target.value})}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={locationForm.description}
                    onChange={(e) => setLocationForm({...locationForm, description: e.target.value})}
                    placeholder="Location description..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLocation}>
                    Create Location
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
              <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
              <MapPin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{locations.length}</div>
              <p className="text-xs text-muted-foreground">across all warehouses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {locations.filter(l => l.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {locations.reduce((sum, l) => sum + l.capacity, 0)}
              </div>
              <p className="text-xs text-muted-foreground">units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((locations.reduce((sum, l) => sum + l.currentstock, 0) / 
                  locations.reduce((sum, l) => sum + l.capacity, 0)) * 100) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">capacity used</p>
            </CardContent>
          </Card>
        </div>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.locationid}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{location.locationname}</p>
                        <p className="text-sm text-gray-600">{location.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{location.warehouse.warehousename}</p>
                        <p className="text-sm text-gray-600">{location.warehouse.location}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(location.locationtype)}
                        <span className="capitalize">{location.locationtype}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{location.capacity}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{location.currentstock}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${getCapacityPercentage(location.currentstock, location.capacity)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{getCapacityPercentage(location.currentstock, location.capacity)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(location.status)}>
                        {location.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {locations.length === 0 && (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
                <p className="text-gray-600">Create your first storage location to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
