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
  Package, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Truck
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface Material {
  materialid: string;
  materialname: string;
  description: string;
  unitofmeasure: string;
  unitcost: number;
  currentstock: number;
  minimumstock: number;
  supplierid: string;
  supplier: {
    suppliername: string;
    contactinfo: string;
  };
}

interface MaterialRequest {
  requestid: string;
  materialid: string;
  quantity: number;
  requestdate: string;
  status: string;
  notes: string;
  material: {
    materialname: string;
    unitofmeasure: string;
  };
}

export default function MaterialsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false);
  const [isRequestingMaterial, setIsRequestingMaterial] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    materialname: '',
    description: '',
    unitofmeasure: '',
    unitcost: '',
    currentstock: '',
    minimumstock: '',
    supplierid: ''
  });
  const [requestForm, setRequestForm] = useState({
    materialid: '',
    quantity: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadMaterials(),
            loadMaterialRequests(),
            loadSuppliers()
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

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          supplier(suppliername, contactinfo)
        `)
        .order('materialname');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast({
        title: "Error",
        description: "Failed to load materials",
        variant: "destructive",
      });
    }
  };

  const loadMaterialRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('materialrequests')
        .select(`
          *,
          material:materials(materialname, unitofmeasure)
        `)
        .order('requestdate', { ascending: false });

      if (error) throw error;
      setMaterialRequests(data || []);
    } catch (error) {
      console.error('Error loading material requests:', error);
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

  const handleCreateMaterial = async () => {
    if (!materialForm.materialname || !materialForm.unitofmeasure || !materialForm.supplierid) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('materials')
        .insert({
          materialid: crypto.randomUUID(),
          materialname: materialForm.materialname,
          description: materialForm.description,
          unitofmeasure: materialForm.unitofmeasure,
          unitcost: parseFloat(materialForm.unitcost) || 0,
          currentstock: parseInt(materialForm.currentstock) || 0,
          minimumstock: parseInt(materialForm.minimumstock) || 0,
          supplierid: materialForm.supplierid
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Material created successfully",
      });

      setMaterialForm({
        materialname: '',
        description: '',
        unitofmeasure: '',
        unitcost: '',
        currentstock: '',
        minimumstock: '',
        supplierid: ''
      });
      setIsCreatingMaterial(false);
      await loadMaterials();
    } catch (error) {
      console.error('Error creating material:', error);
      toast({
        title: "Error",
        description: "Failed to create material",
        variant: "destructive",
      });
    }
  };

  const handleRequestMaterial = async () => {
    if (!requestForm.materialid || !requestForm.quantity) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('materialrequests')
        .insert({
          requestid: crypto.randomUUID(),
          materialid: requestForm.materialid,
          quantity: parseInt(requestForm.quantity),
          requestdate: new Date().toISOString(),
          status: 'pending',
          notes: requestForm.notes
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Material request submitted successfully",
      });

      setRequestForm({ materialid: '', quantity: '', notes: '' });
      setIsRequestingMaterial(false);
      await loadMaterialRequests();
    } catch (error) {
      console.error('Error requesting material:', error);
      toast({
        title: "Error",
        description: "Failed to submit material request",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (current <= minimum) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      ordered: 'bg-purple-100 text-purple-800',
      received: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
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

  const lowStockMaterials = materials.filter(m => m.currentstock <= m.minimumstock);
  const outOfStockMaterials = materials.filter(m => m.currentstock === 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Materials Management</h1>
            <p className="text-gray-600">Manage raw materials and production supplies</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isRequestingMaterial} onOpenChange={setIsRequestingMaterial}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Truck className="h-4 w-4 mr-2" />
                  Request Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Material</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Material</Label>
                    <Select value={requestForm.materialid} onValueChange={(value) => setRequestForm({...requestForm, materialid: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.materialid} value={material.materialid}>
                            {material.materialname} ({material.unitofmeasure})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={requestForm.quantity}
                      onChange={(e) => setRequestForm({...requestForm, quantity: e.target.value})}
                      placeholder="Enter quantity needed"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={requestForm.notes}
                      onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsRequestingMaterial(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRequestMaterial}>
                      Submit Request
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreatingMaterial} onOpenChange={setIsCreatingMaterial}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Material</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Material Name *</Label>
                      <Input
                        value={materialForm.materialname}
                        onChange={(e) => setMaterialForm({...materialForm, materialname: e.target.value})}
                        placeholder="Steel, Plastic, etc."
                      />
                    </div>
                    <div>
                      <Label>Unit of Measure *</Label>
                      <Input
                        value={materialForm.unitofmeasure}
                        onChange={(e) => setMaterialForm({...materialForm, unitofmeasure: e.target.value})}
                        placeholder="kg, pieces, meters"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={materialForm.description}
                      onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                      placeholder="Material description..."
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={materialForm.unitcost}
                        onChange={(e) => setMaterialForm({...materialForm, unitcost: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Current Stock</Label>
                      <Input
                        type="number"
                        value={materialForm.currentstock}
                        onChange={(e) => setMaterialForm({...materialForm, currentstock: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Minimum Stock</Label>
                      <Input
                        type="number"
                        value={materialForm.minimumstock}
                        onChange={(e) => setMaterialForm({...materialForm, minimumstock: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Supplier *</Label>
                    <Select value={materialForm.supplierid} onValueChange={(value) => setMaterialForm({...materialForm, supplierid: value})}>
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
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreatingMaterial(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMaterial}>
                      Add Material
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials.length}</div>
              <p className="text-xs text-muted-foreground">in inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockMaterials.length}</div>
              <p className="text-xs text-muted-foreground">need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outOfStockMaterials.length}</div>
              <p className="text-xs text-muted-foreground">urgent attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {materialRequests.filter(r => r.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Materials Table */}
        <Card>
          <CardHeader>
            <CardTitle>Materials Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Minimum Stock</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => {
                  const status = getStockStatus(material.currentstock, material.minimumstock);
                  return (
                    <TableRow key={material.materialid}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{material.materialname}</p>
                          <p className="text-sm text-gray-600">{material.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>{material.supplier?.suppliername}</TableCell>
                      <TableCell>
                        <span className="font-bold">{material.currentstock} {material.unitofmeasure}</span>
                      </TableCell>
                      <TableCell>{material.minimumstock} {material.unitofmeasure}</TableCell>
                      <TableCell>${material.unitcost.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {materials.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
                <p className="text-gray-600">Add materials to start managing inventory</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
