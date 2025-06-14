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
import { useToast } from '@/components/ui/use-toast';
import { 
  Route, 
  Plus, 
  MapPin,
  Clock,
  Truck,
  Navigation,
  Calendar
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface DeliveryRoute {
  routeid: string;
  routename: string;
  startlocation: string;
  endlocation: string;
  estimatedduration: number;
  distance: number;
  status: string;
  createdate: string;
  shipments: Array<{
    shipmentid: string;
    trackingnumber: string;
    order: {
      customers: {
        customername: string;
        address: string;
      };
    };
  }>;
}

export default function RoutesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [routeForm, setRouteForm] = useState({
    routename: '',
    startlocation: '',
    endlocation: '',
    estimatedduration: '',
    distance: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await loadRoutes();
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadRoutes = async () => {
    try {
      // Mock data for routes since this table might not exist in the schema
      const mockRoutes: DeliveryRoute[] = [
        {
          routeid: '1',
          routename: 'Downtown Express',
          startlocation: 'Main Warehouse',
          endlocation: 'Downtown District',
          estimatedduration: 120,
          distance: 25.5,
          status: 'active',
          createdate: new Date().toISOString(),
          shipments: []
        },
        {
          routeid: '2',
          routename: 'Suburban Route A',
          startlocation: 'Main Warehouse',
          endlocation: 'Suburban Area A',
          estimatedduration: 180,
          distance: 45.2,
          status: 'active',
          createdate: new Date().toISOString(),
          shipments: []
        },
        {
          routeid: '3',
          routename: 'Industrial Zone',
          startlocation: 'Main Warehouse',
          endlocation: 'Industrial District',
          estimatedduration: 90,
          distance: 18.7,
          status: 'active',
          createdate: new Date().toISOString(),
          shipments: []
        }
      ];

      setRoutes(mockRoutes);
    } catch (error) {
      console.error('Error loading routes:', error);
      toast({
        title: "Error",
        description: "Failed to load routes",
        variant: "destructive",
      });
    }
  };

  const handleCreateRoute = async () => {
    if (!routeForm.routename || !routeForm.startlocation || !routeForm.endlocation) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mock creation since routes table might not exist
      const newRoute: DeliveryRoute = {
        routeid: crypto.randomUUID(),
        routename: routeForm.routename,
        startlocation: routeForm.startlocation,
        endlocation: routeForm.endlocation,
        estimatedduration: parseInt(routeForm.estimatedduration) || 120,
        distance: parseFloat(routeForm.distance) || 0,
        status: 'active',
        createdate: new Date().toISOString(),
        shipments: []
      };

      setRoutes([...routes, newRoute]);

      toast({
        title: "Success",
        description: "Route created successfully",
      });

      setRouteForm({
        routename: '',
        startlocation: '',
        endlocation: '',
        estimatedduration: '',
        distance: '',
        notes: ''
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating route:', error);
      toast({
        title: "Error",
        description: "Failed to create route",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Route Management</h1>
            <p className="text-gray-600">Plan and optimize delivery routes for efficient logistics</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Route</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Route Name *</Label>
                  <Input
                    value={routeForm.routename}
                    onChange={(e) => setRouteForm({...routeForm, routename: e.target.value})}
                    placeholder="e.g., Downtown Express"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Location *</Label>
                    <Input
                      value={routeForm.startlocation}
                      onChange={(e) => setRouteForm({...routeForm, startlocation: e.target.value})}
                      placeholder="Starting point"
                    />
                  </div>
                  <div>
                    <Label>End Location *</Label>
                    <Input
                      value={routeForm.endlocation}
                      onChange={(e) => setRouteForm({...routeForm, endlocation: e.target.value})}
                      placeholder="Destination"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estimated Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={routeForm.estimatedduration}
                      onChange={(e) => setRouteForm({...routeForm, estimatedduration: e.target.value})}
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <Label>Distance (km)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={routeForm.distance}
                      onChange={(e) => setRouteForm({...routeForm, distance: e.target.value})}
                      placeholder="25.5"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={routeForm.notes}
                    onChange={(e) => setRouteForm({...routeForm, notes: e.target.value})}
                    placeholder="Additional route information..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRoute}>
                    Create Route
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
              <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
              <Route className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{routes.length}</div>
              <p className="text-xs text-muted-foreground">delivery routes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
              <Navigation className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routes.filter(r => r.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">currently operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              <MapPin className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routes.reduce((sum, r) => sum + r.distance, 0).toFixed(1)} km
              </div>
              <p className="text-xs text-muted-foreground">all routes combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routes.length > 0 
                  ? Math.round(routes.reduce((sum, r) => sum + r.estimatedduration, 0) / routes.length)
                  : 0
                } min
              </div>
              <p className="text-xs text-muted-foreground">average route time</p>
            </CardContent>
          </Card>
        </div>

        {/* Routes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Start Location</TableHead>
                  <TableHead>End Location</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.routeid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{route.routename}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span>{route.startlocation}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span>{route.endlocation}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{route.distance} km</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{Math.round(route.estimatedduration / 60)}h {route.estimatedduration % 60}m</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(route.status)}>
                        {route.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(route.createdate).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {routes.length === 0 && (
              <div className="text-center py-8">
                <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
                <p className="text-gray-600">Create your first delivery route to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
