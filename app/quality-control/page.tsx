'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import { 
  Shield, 
  Plus, 
  CheckCircle,
  AlertTriangle,
  X,
  Star,
  Package
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface QualityCheck {
  checkid: string;
  productionorderid: string;
  checkdate: string;
  qualityscore: number;
  passed: boolean;
  notes: string;
  checkedby: string;
  production?: {
    productionorderid: string;
    quantity: number;
    product?: {
      productname: string;
    };
  };
}

export default function QualityControlPage() {
  const [user, setUser] = useState<User | null>(null);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [completedProductions, setCompletedProductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    productionorderid: '',
    qualityscore: '',
    passed: true,
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
            loadQualityChecks(),
            loadCompletedProductions()
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

  const loadQualityChecks = async () => {
    try {
      // Since we don't have a quality check table, we'll simulate it using production data
      const { data, error } = await supabase
        .from('production')
        .select(`
          productionorderid,
          quantity,
          enddate,
          status,
          product(productname)
        `)
        .eq('status', 'completed')
        .order('enddate', { ascending: false });

      if (error) throw error;

      // Simulate quality checks with random data for demo
      const simulatedChecks = data?.map(production => ({
        checkid: crypto.randomUUID(),
        productionorderid: production.productionorderid,
        checkdate: production.enddate || new Date().toISOString(),
        qualityscore: Math.floor(Math.random() * 30) + 70, // 70-100
        passed: Math.random() > 0.1, // 90% pass rate
        notes: 'Quality inspection completed',
        checkedby: user?.id || '',
        production: production
      })) || [];

      setQualityChecks(simulatedChecks);
    } catch (error) {
      console.error('Error loading quality checks:', error);
    }
  };

  const loadCompletedProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('production')
        .select(`
          productionorderid,
          quantity,
          enddate,
          product(productname, unitprice)
        `)
        .eq('status', 'completed')
        .order('enddate', { ascending: false });

      if (error) throw error;
      setCompletedProductions(data || []);
    } catch (error) {
      console.error('Error loading completed productions:', error);
    }
  };

  const handleCreateQualityCheck = async () => {
    if (!formData.productionorderid || !formData.qualityscore) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real app, this would insert into a quality_checks table
      // For now, we'll just simulate the creation
      const newCheck = {
        checkid: crypto.randomUUID(),
        productionorderid: formData.productionorderid,
        checkdate: new Date().toISOString(),
        qualityscore: parseInt(formData.qualityscore),
        passed: formData.passed,
        notes: formData.notes,
        checkedby: user?.id || '',
        production: completedProductions.find(p => p.productionorderid === formData.productionorderid)
      };

      setQualityChecks(prev => [newCheck, ...prev]);

      toast({
        title: "Success",
        description: "Quality check recorded successfully",
      });

      setFormData({ productionorderid: '', qualityscore: '', passed: true, notes: '' });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating quality check:', error);
      toast({
        title: "Error",
        description: "Failed to record quality check",
        variant: "destructive",
      });
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPassedBadge = (passed: boolean) => {
    return passed 
      ? <Badge className="bg-green-100 text-green-800">Passed</Badge>
      : <Badge className="bg-red-100 text-red-800">Failed</Badge>;
  };

  const renderStars = (score: number) => {
    const stars = Math.round(score / 20); // Convert 0-100 to 0-5 stars
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
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

  const passedChecks = qualityChecks.filter(q => q.passed).length;
  const failedChecks = qualityChecks.filter(q => !q.passed).length;
  const avgQualityScore = qualityChecks.length > 0 
    ? qualityChecks.reduce((sum, q) => sum + q.qualityscore, 0) / qualityChecks.length 
    : 0;
  const passRate = qualityChecks.length > 0 ? (passedChecks / qualityChecks.length) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['production']}
          relatedTables={['product', 'productionstatuslog']}
          operations={['Quality Inspection', 'Score Tracking', 'Pass/Fail Analysis']}
          description="Quality control system for production inspection and quality assurance"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
            <p className="text-gray-600">Inspect production quality and maintain standards</p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Quality Check
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Quality Check</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Production Order *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.productionorderid}
                    onChange={(e) => setFormData({...formData, productionorderid: e.target.value})}
                  >
                    <option value="">Select Production Order</option>
                    {completedProductions.map((production) => (
                      <option key={production.productionorderid} value={production.productionorderid}>
                        {production.productionorderid.slice(0, 8)}... - {production.product?.productname} ({production.quantity} units)
                      </option>
                    ))}
                  </select>
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
                <div>
                  <Label>Status *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.passed.toString()}
                    onChange={(e) => setFormData({...formData, passed: e.target.value === 'true'})}
                  >
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Quality inspection notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreating(false);
                    setFormData({ productionorderid: '', qualityscore: '', passed: true, notes: '' });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateQualityCheck}>
                    Record Quality Check
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
              <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityChecks.length}</div>
              <p className="text-xs text-muted-foreground">completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{passRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{passedChecks} passed, {failedChecks} failed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgQualityScore.toFixed(1)}</div>
              <div className="flex items-center">
                {renderStars(avgQualityScore)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Inspections</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedChecks}</div>
              <p className="text-xs text-muted-foreground">require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quality Checks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Production Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualityChecks.map((check) => (
                  <TableRow key={check.checkid}>
                    <TableCell className="font-mono">
                      {check.productionorderid.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{check.production?.product?.productname}</p>
                          <p className="text-sm text-gray-600">{check.production?.quantity} units</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg ${getQualityColor(check.qualityscore)}`}>
                          {check.qualityscore}
                        </span>
                        <div className="flex">
                          {renderStars(check.qualityscore)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPassedBadge(check.passed)}
                    </TableCell>
                    <TableCell>
                      {new Date(check.checkdate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm truncate" title={check.notes}>
                          {check.notes || '-'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {qualityChecks.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quality checks found</h3>
                <p className="text-gray-600 mb-4">Start recording quality inspections for completed production orders</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Quality Check
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
