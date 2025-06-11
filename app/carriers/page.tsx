'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2,
  Package
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface Carrier {
  carrierid: string;
  carriername: string;
  contactinfo?: string;
  websiteurl?: string;
  servicelevel?: string;
  coststructure?: string;
  deliverytimeframe?: string;
  servicearea?: string;
}

export default function CarriersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [formData, setFormData] = useState({
    carriername: '',
    contactinfo: '',
    websiteurl: '',
    servicelevel: '',
    deliverytimeframe: '',
    servicearea: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await loadCarriers();
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('shippingcarrier')
        .select('*')
        .order('carriername');

      if (error) throw error;
      setCarriers(data || []);
    } catch (error) {
      console.error('Error loading carriers:', error);
      toast({
        title: "Error",
        description: "Failed to load carriers",
        variant: "destructive",
      });
    }
  };

  const handleCreateCarrier = async () => {
    if (!formData.carriername.trim()) {
      toast({
        title: "Error",
        description: "Please enter carrier name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('shippingcarrier')
        .insert({
          carrierid: crypto.randomUUID(),
          carriername: formData.carriername.trim(),
          contactinfo: formData.contactinfo.trim() || null,
          websiteurl: formData.websiteurl.trim() || null,
          servicelevel: formData.servicelevel.trim() || null,
          deliverytimeframe: formData.deliverytimeframe.trim() || null,
          servicearea: formData.servicearea.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Carrier created successfully",
      });

      setFormData({
        carriername: '',
        contactinfo: '',
        websiteurl: '',
        servicelevel: '',
        deliverytimeframe: '',
        servicearea: ''
      });
      setIsCreating(false);
      await loadCarriers();
    } catch (error) {
      console.error('Error creating carrier:', error);
      toast({
        title: "Error",
        description: "Failed to create carrier",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCarrier = async () => {
    if (!selectedCarrier || !formData.carriername.trim()) {
      toast({
        title: "Error",
        description: "Please enter carrier name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('shippingcarrier')
        .update({
          carriername: formData.carriername.trim()
        })
        .eq('carrierid', selectedCarrier.carrierid);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Carrier updated successfully",
      });

      setFormData({ carriername: '' });
      setIsEditing(false);
      setSelectedCarrier(null);
      await loadCarriers();
    } catch (error) {
      console.error('Error updating carrier:', error);
      toast({
        title: "Error",
        description: "Failed to update carrier",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCarrier = async (carrier: Carrier) => {
    if (!confirm(`Are you sure you want to delete ${carrier.carriername}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('shippingcarrier')
        .delete()
        .eq('carrierid', carrier.carrierid);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Carrier deleted successfully",
      });

      await loadCarriers();
    } catch (error) {
      console.error('Error deleting carrier:', error);
      toast({
        title: "Error",
        description: "Failed to delete carrier",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setFormData({
      carriername: carrier.carriername
    });
    setIsEditing(true);
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
        <DatabaseIndicator
          primaryTables={['shippingcarrier']}
          relatedTables={['shipments']}
          operations={['Add Carriers', 'Manage Carriers', 'Assign to Shipments']}
          description="Manage shipping carriers for order delivery"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shipping Carriers</h1>
              <p className="text-gray-600">Manage carriers for order delivery</p>
            </div>
            <SqlTooltip
              page="Carriers Management"
              queries={[
                {
                  title: "Load Carriers with Shipment Stats",
                  description: "Get carriers with delivery performance metrics",
                  type: "SELECT",
                  sql: `SELECT
  sc.*,
  COUNT(s.shipmentid) as total_shipments,
  COUNT(CASE WHEN s.status = 'delivered' THEN 1 END) as completed_deliveries,
  COUNT(CASE WHEN s.status = 'in_transit' THEN 1 END) as in_transit_shipments
FROM shippingcarrier sc
LEFT JOIN shipments s ON sc.carrierid = s.carrierid
GROUP BY sc.carrierid
ORDER BY sc.carriername ASC;`
                },
                {
                  title: "Create Carrier",
                  description: "Add new shipping carrier to system",
                  type: "INSERT",
                  sql: `INSERT INTO shippingcarrier (
  carrierid,
  carriername,
  contactinfo,
  serviceareas
) VALUES (
  gen_random_uuid(),
  $1, $2, $3
);`
                },
                {
                  title: "Update Carrier",
                  description: "Update carrier information and service areas",
                  type: "UPDATE",
                  sql: `UPDATE shippingcarrier
SET
  carriername = $1,
  contactinfo = $2,
  serviceareas = $3
WHERE carrierid = $4;`
                },
                {
                  title: "Get Carrier Performance",
                  description: "Analyze carrier delivery performance",
                  type: "SELECT",
                  sql: `SELECT
  sc.carriername,
  COUNT(s.shipmentid) as total_shipments,
  AVG(EXTRACT(DAYS FROM (s.shipmentdate - o.orderdate))) as avg_delivery_days,
  COUNT(CASE WHEN s.status = 'delivered' THEN 1 END) * 100.0 / COUNT(s.shipmentid) as delivery_rate
FROM shippingcarrier sc
LEFT JOIN shipments s ON sc.carrierid = s.carrierid
LEFT JOIN "Order" o ON s.orderid = o.orderid
WHERE s.shipmentdate IS NOT NULL
GROUP BY sc.carrierid, sc.carriername
ORDER BY delivery_rate DESC;`
                }
              ]}
            />
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Carrier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Carrier</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Carrier Name *</Label>
                    <Input
                      placeholder="e.g. FedEx, UPS, DHL"
                      value={formData.carriername}
                      onChange={(e) => setFormData({...formData, carriername: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Service Level</Label>
                    <Input
                      placeholder="e.g. Express, Ground, Standard"
                      value={formData.servicelevel}
                      onChange={(e) => setFormData({...formData, servicelevel: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Info</Label>
                    <Input
                      placeholder="Phone or email"
                      value={formData.contactinfo}
                      onChange={(e) => setFormData({...formData, contactinfo: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Website URL</Label>
                    <Input
                      placeholder="https://..."
                      value={formData.websiteurl}
                      onChange={(e) => setFormData({...formData, websiteurl: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Delivery Timeframe</Label>
                    <Input
                      placeholder="e.g. 1-3 business days"
                      value={formData.deliverytimeframe}
                      onChange={(e) => setFormData({...formData, deliverytimeframe: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Service Area</Label>
                    <Input
                      placeholder="e.g. Nationwide, Regional"
                      value={formData.servicearea}
                      onChange={(e) => setFormData({...formData, servicearea: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setFormData({
                      carriername: '',
                      contactinfo: '',
                      websiteurl: '',
                      servicelevel: '',
                      deliverytimeframe: '',
                      servicearea: ''
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCarrier}>
                    Create Carrier
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Carriers</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carriers.length}</div>
              <p className="text-xs text-muted-foreground">available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">in transit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deliveries Today</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Carriers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Carriers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier Name</TableHead>
                  <TableHead>Service Level</TableHead>
                  <TableHead>Delivery Time</TableHead>
                  <TableHead>Service Area</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carriers.map((carrier) => (
                  <TableRow key={carrier.carrierid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{carrier.carriername}</p>
                          {carrier.websiteurl && (
                            <a href={carrier.websiteurl} target="_blank" rel="noopener noreferrer"
                               className="text-xs text-blue-600 hover:underline">
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{carrier.servicelevel || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{carrier.deliverytimeframe || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{carrier.servicearea || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{carrier.contactinfo || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(carrier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCarrier(carrier)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {carriers.length === 0 && (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No carriers found</h3>
                <p className="text-gray-600 mb-4">Add carriers to enable order shipping</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Carrier
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Carrier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Carrier Name</Label>
                <Input
                  value={formData.carriername}
                  onChange={(e) => setFormData({...formData, carriername: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setSelectedCarrier(null);
                  setFormData({ carriername: '' });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCarrier}>
                  Update Carrier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
