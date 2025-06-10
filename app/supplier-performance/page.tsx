'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { supplierPerformanceOperations } from '@/lib/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import { 
  TrendingUp, 
  Plus, 
  Star,
  Clock,
  Award,
  Building,
  BarChart3
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface SupplierPerformance {
  performanceid: string;
  supplierid: string;
  purchaseorderid: string;
  rating: number;
  deliverytime: string;
  qualityscore: number;
  evaluationdate: string;
  supplier?: {
    suppliername: string;
  };
  purchaseorder?: {
    purchaseorderid: string;
    orderdate: string;
    totalamount: number;
  };
}

export default function SupplierPerformancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [performances, setPerformances] = useState<SupplierPerformance[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    supplierid: '',
    purchaseorderid: '',
    rating: '',
    deliverytime: '',
    qualityscore: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadPerformances(),
            loadSuppliers(),
            loadPurchaseOrders()
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

  const loadPerformances = async () => {
    try {
      const data = await supplierPerformanceOperations.getAllPerformanceEvaluations();
      setPerformances(data || []);
    } catch (error) {
      console.error('Error loading performances:', error);
      toast({
        title: "Error",
        description: "Failed to load supplier performances",
        variant: "destructive",
      });
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

  const loadPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchaseorder')
        .select('purchaseorderid, orderdate, totalamount, supplierid, supplier(suppliername)')
        .eq('status', 'completed')
        .order('orderdate', { ascending: true }); // FIFO: First In, First Out

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  const handleCreateEvaluation = async () => {
    if (!formData.supplierid || !formData.purchaseorderid || !formData.rating || !formData.deliverytime || !formData.qualityscore) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await supplierPerformanceOperations.createPerformanceEvaluation(
        formData.supplierid,
        formData.purchaseorderid,
        parseInt(formData.rating),
        formData.deliverytime,
        parseFloat(formData.qualityscore)
      );

      toast({
        title: "Success",
        description: "Performance evaluation created successfully",
      });

      setFormData({ supplierid: '', purchaseorderid: '', rating: '', deliverytime: '', qualityscore: '' });
      setIsCreating(false);
      await loadPerformances();
    } catch (error) {
      console.error('Error creating evaluation:', error);
      toast({
        title: "Error",
        description: "Failed to create performance evaluation",
        variant: "destructive",
      });
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getSupplierStats = () => {
    const supplierStats = suppliers.map(supplier => {
      const supplierPerfs = performances.filter(p => p.supplierid === supplier.supplierid);
      const avgRating = supplierPerfs.length > 0 
        ? supplierPerfs.reduce((sum, p) => sum + p.rating, 0) / supplierPerfs.length 
        : 0;
      const avgQuality = supplierPerfs.length > 0 
        ? supplierPerfs.reduce((sum, p) => sum + p.qualityscore, 0) / supplierPerfs.length 
        : 0;
      
      return {
        ...supplier,
        avgRating: avgRating.toFixed(1),
        avgQuality: avgQuality.toFixed(1),
        evaluationCount: supplierPerfs.length
      };
    });

    return supplierStats.sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating));
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

  const avgRating = performances.length > 0 
    ? performances.reduce((sum, p) => sum + p.rating, 0) / performances.length 
    : 0;
  const avgQuality = performances.length > 0 
    ? performances.reduce((sum, p) => sum + p.qualityscore, 0) / performances.length 
    : 0;
  const topSuppliers = getSupplierStats().slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['supplierperformance']}
          relatedTables={['supplier', 'purchaseorder']}
          operations={['Evaluate Performance', 'Track Metrics', 'Supplier Rankings']}
          description="Supplier performance evaluation and tracking system with quality metrics"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supplier Performance</h1>
            <p className="text-gray-600">Evaluate and track supplier performance metrics</p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Evaluation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Performance Evaluation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Supplier *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.supplierid}
                    onChange={(e) => setFormData({...formData, supplierid: e.target.value})}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplierid} value={supplier.supplierid}>
                        {supplier.suppliername}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Purchase Order *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.purchaseorderid}
                    onChange={(e) => setFormData({...formData, purchaseorderid: e.target.value})}
                  >
                    <option value="">Select Purchase Order</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.purchaseorderid} value={po.purchaseorderid}>
                        PO-{po.purchaseorderid.slice(0, 8)} - {po.supplier?.suppliername} (${po.totalamount})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Rating (1-5) *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: e.target.value})}
                  >
                    <option value="">Select Rating</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>
                <div>
                  <Label>Delivery Time *</Label>
                  <Input
                    placeholder="e.g. 3 days, 1 week"
                    value={formData.deliverytime}
                    onChange={(e) => setFormData({...formData, deliverytime: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Quality Score (0-100) *</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="85"
                    value={formData.qualityscore}
                    onChange={(e) => setFormData({...formData, qualityscore: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setFormData({ supplierid: '', purchaseorderid: '', rating: '', deliverytime: '', qualityscore: '' });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvaluation}>
                    Create Evaluation
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
              <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performances.length}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
              <div className="flex items-center">
                {renderStars(Math.round(avgRating))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Quality</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgQuality.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">quality score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <Building className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">registered</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topSuppliers.map((supplier, index) => (
                <Card key={supplier.supplierid} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{supplier.suppliername}</h3>
                      {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rating:</span>
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${getRatingColor(parseFloat(supplier.avgRating))}`}>
                            {supplier.avgRating}
                          </span>
                          <div className="flex">
                            {renderStars(Math.round(parseFloat(supplier.avgRating)))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Quality:</span>
                        <Badge className={getQualityColor(parseFloat(supplier.avgQuality))}>
                          {supplier.avgQuality}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Evaluations:</span>
                        <span className="font-medium">{supplier.evaluationCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Evaluations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Delivery Time</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>Evaluation Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performances.map((performance) => (
                  <TableRow key={performance.performanceid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{performance.supplier?.suppliername}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{performance.purchaseorderid.slice(0, 8)}...</p>
                        <p className="text-sm text-gray-600">${performance.purchaseorder?.totalamount.toFixed(2)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getRatingColor(performance.rating)}`}>
                          {performance.rating}
                        </span>
                        <div className="flex">
                          {renderStars(performance.rating)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{performance.deliverytime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getQualityColor(performance.qualityscore)}>
                        {performance.qualityscore}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(performance.evaluationdate).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {performances.length === 0 && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No performance evaluations found</h3>
                <p className="text-gray-600 mb-4">Create your first supplier performance evaluation</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Evaluation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
