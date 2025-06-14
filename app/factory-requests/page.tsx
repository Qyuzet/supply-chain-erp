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
  Factory, 
  Package, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
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

interface ProductionRequest {
  productionorderid: string;
  productid: string;
  quantity: number;
  startdate: string;
  enddate?: string;
  status: string;
  product: Product;
}

export default function FactoryRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ProductionRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    productid: '',
    quantity: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData && (userData.role === 'supplier' || userData.role === 'admin')) {
          await Promise.all([
            loadRequests(),
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

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('production')
        .select(`
          *,
          product (
            productid,
            productname,
            description,
            unitprice,
            supplier (suppliername)
          )
        `)
        .order('startdate', { ascending: true });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading production requests:', error);
      toast({
        title: "Error",
        description: "Failed to load production requests",
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

  const handleCreateRequest = async () => {
    if (!formData.productid || formData.quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a product and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('production')
        .insert({
          productionorderid: crypto.randomUUID(),
          productid: formData.productid,
          quantity: formData.quantity,
          startdate: new Date().toISOString(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Production request sent to factory successfully",
      });

      setFormData({ productid: '', quantity: 0 });
      setIsCreating(false);
      await loadRequests();
    } catch (error) {
      console.error('Error creating production request:', error);
      toast({
        title: "Error",
        description: "Failed to create production request",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  if (!user || !['supplier', 'admin'].includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-muted-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Only Suppliers and Admin can request factory production. Suppliers own the products and decide when to manufacture them.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['production']}
          relatedTables={['product', 'supplier']}
          operations={['Request Production', 'Track Orders', 'Manage Factory Workflow']}
          description="Factory production request system. Suppliers request production of their products from factories. Real-world logic: Suppliers own products and decide manufacturing."
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Factory Production Requests</h1>
              <p className="text-muted-foreground">Request products to be manufactured by factories</p>
            </div>
            <SqlTooltip
              page="Factory Production Requests - Supplier Interface"
              queries={[
                {
                  title: "Load Supplier's Production Requests",
                  description: "Real-world logic: Only Suppliers request production because they own product designs and decide manufacturing schedules",
                  type: "SELECT",
                  sql: `-- Suppliers request production from factories (they own the products)
SELECT
  pr.*,
  p.productname,
  p.description,
  p.unitprice,
  s.suppliername
FROM production pr
JOIN product p ON pr.productid = p.productid
JOIN supplier s ON p.supplierid = s.supplierid
WHERE s.userid = auth.uid() -- Only supplier's own products
ORDER BY pr.startdate ASC;

-- Real flow: Supplier owns product → Requests factory production → Factory manufactures → Warehouse receives inventory`
                },
                {
                  title: "Supplier Requests Factory Production",
                  description: "Supplier requests their products to be manufactured by factory (they don't manufacture themselves)",
                  type: "INSERT",
                  sql: `-- Supplier requests factory to manufacture their products
INSERT INTO production (
  productionorderid,
  productid,
  quantity,
  startdate,
  status
) VALUES (
  gen_random_uuid(),
  $1, $2, NOW(), 'pending'
);

-- Real logic: Suppliers own product designs but don't manufacture
-- They request factories to produce their products when needed`
                },
                {
                  title: "Factory Completes Production",
                  description: "Factory updates status and automatically increases warehouse inventory",
                  type: "UPDATE",
                  sql: `-- Factory completes production and updates warehouse inventory
UPDATE production
SET
  status = 'completed',
  enddate = NOW()
WHERE productionorderid = $1;

-- Auto-update warehouse inventory (smart warehouse selection)
UPDATE inventory
SET quantity = quantity + $2
WHERE productid = $3
  AND warehouseid = (
    SELECT warehouseid FROM inventory
    WHERE productid = $3
    ORDER BY quantity ASC
    LIMIT 1
  );`
                }
              ]}
            />
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Production
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Factory Production</DialogTitle>
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
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    placeholder="Enter quantity to produce"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setFormData({ productid: '', quantity: 0 });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRequest}>
                    Send Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Production Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Production Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>

                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.productionorderid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{request.product.productname}</p>
                          <p className="text-sm text-muted-foreground">${request.product.unitprice}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{request.product.supplier.suppliername}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{request.quantity} units</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {request.requestedby}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{new Date(request.startdate).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          <span className="capitalize">{request.status.replace('_', ' ')}</span>
                        </div>
                      </Badge>
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
