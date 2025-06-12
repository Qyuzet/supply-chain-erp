'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { purchaseOrderOperations, productionOperations } from '@/lib/database';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import { 
  Factory, 
  Package,
  ShoppingCart,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface PurchaseOrderDetail {
  purchaseorderdetailid: string;
  productid: string;
  quantity: number;
  unitprice: number;
  subtotal: number;
  product: {
    productname: string;
    description: string;
    unitprice: number;
  };
}

interface PurchaseOrder {
  purchaseorderid: string;
  supplierid: string;
  orderdate: string;
  status: string;
  totalamount: number;
  supplier: {
    suppliername: string;
  };
  purchaseorderdetail: PurchaseOrderDetail[];
}

interface ProductionOrder {
  productionorderid: string;
  productid: string;
  purchaseorderdetailid: string;
  quantity: number;
  status: string;
  startdate: string;
  enddate?: string;
}

export default function ProductionFromPOPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([]);
  const [existingProduction, setExistingProduction] = useState<ProductionOrder[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData && (userData.role === 'supplier' || userData.role === 'admin')) {
          await Promise.all([
            loadApprovedPurchaseOrders(),
            loadExistingProduction()
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

  const loadApprovedPurchaseOrders = async () => {
    try {
      // Get current user's supplier ID if they're a supplier
      let supplierId = null;
      if (user?.role === 'supplier') {
        const { data: supplierData } = await supabase
          .from('supplier')
          .select('supplierid')
          .eq('userid', user.userid)
          .single();
        
        supplierId = supplierData?.supplierid;
      }

      const data = await purchaseOrderOperations.getApprovedPurchaseOrdersForProduction(supplierId);
      setApprovedPOs(data || []);
    } catch (error) {
      console.error('Error loading approved purchase orders:', error);
    }
  };

  const loadExistingProduction = async () => {
    try {
      const { data, error } = await supabase
        .from('production')
        .select('*')
        .not('purchaseorderdetailid', 'is', null);

      if (error) throw error;
      setExistingProduction(data || []);
    } catch (error) {
      console.error('Error loading existing production:', error);
    }
  };

  const handleRequestProduction = async (purchaseOrderDetailId: string, productId: string, quantity: number) => {
    try {
      await productionOperations.createProductionOrderFromPO(purchaseOrderDetailId, productId, quantity);

      toast({
        title: "Success",
        description: "Production request sent to factory successfully",
      });

      await loadExistingProduction();
    } catch (error) {
      console.error('Error requesting production:', error);
      toast({
        title: "Error",
        description: "Failed to request production",
        variant: "destructive",
      });
    }
  };

  const isProductionRequested = (purchaseOrderDetailId: string) => {
    return existingProduction.some(prod => prod.purchaseorderdetailid === purchaseOrderDetailId);
  };

  const getProductionStatus = (purchaseOrderDetailId: string) => {
    const production = existingProduction.find(prod => prod.purchaseorderdetailid === purchaseOrderDetailId);
    return production?.status || null;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
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
          <p className="text-muted-foreground">Only Suppliers and Admin can request production from approved purchase orders.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['production', 'purchaseorderdetail']}
          relatedTables={['purchaseorder', 'product', 'supplier']}
          operations={['Request Production from POs', 'Link PO to Production', 'Track Manufacturing']}
          description="Production requests from approved purchase orders. Real-world flow: Warehouse creates detailed PO → Supplier approves → Supplier requests factory production for exact PO items → Factory manufactures → Warehouse receives inventory. Complete traceability from order to production."
        />

        {/* Complete Flow Visualization */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Complete Connected Workflow</h3>
          <div className="flex items-center justify-between text-sm text-green-800">
            <div className="text-center">
              <ShoppingCart className="h-8 w-8 text-green-600 mx-auto mb-1" />
              <p className="font-medium">Warehouse</p>
              <p>Creates detailed PO</p>
            </div>
            <ArrowRight className="h-5 w-5 text-green-600" />
            <div className="text-center">
              <Package className="h-8 w-8 text-green-600 mx-auto mb-1" />
              <p className="font-medium">Supplier</p>
              <p>Approves PO</p>
            </div>
            <ArrowRight className="h-5 w-5 text-green-600" />
            <div className="text-center">
              <Factory className="h-8 w-8 text-green-600 mx-auto mb-1" />
              <p className="font-medium">Supplier</p>
              <p>Requests Production</p>
            </div>
            <ArrowRight className="h-5 w-5 text-green-600" />
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-1" />
              <p className="font-medium">Factory</p>
              <p>Manufactures & Updates Inventory</p>
            </div>
          </div>
          <p className="mt-3 text-center text-green-900 font-medium">
            Now Purchase Orders and Production are completely connected with full traceability!
          </p>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Production from Purchase Orders</h1>
              <p className="text-muted-foreground">Request factory production for approved purchase order items</p>
            </div>
            <SqlTooltip
              page="Production from Purchase Orders - Connected Workflow"
              queries={[
                {
                  title: "Get Approved Purchase Orders for Production",
                  description: "Supplier views approved POs and requests factory production for specific items",
                  type: "SELECT",
                  sql: `-- Get approved POs with detailed product information
SELECT 
  po.*,
  s.suppliername,
  pod.purchaseorderdetailid,
  pod.productid,
  pod.quantity,
  pod.unitprice,
  p.productname,
  p.description
FROM purchaseorder po
JOIN supplier s ON po.supplierid = s.supplierid
JOIN purchaseorderdetail pod ON po.purchaseorderid = pod.purchaseorderid
JOIN product p ON pod.productid = p.productid
WHERE po.status = 'approved'
  AND s.userid = auth.uid() -- Supplier's own approved POs
ORDER BY po.orderdate ASC;`
                },
                {
                  title: "Create Production from Purchase Order Detail",
                  description: "Link production order to specific purchase order line item for complete traceability",
                  type: "INSERT",
                  sql: `-- Create production order linked to specific PO line item
INSERT INTO production (
  productionorderid,
  productid,
  purchaseorderdetailid,
  quantity,
  startdate,
  status
) VALUES (
  gen_random_uuid(),
  $1, -- productid from PO detail
  $2, -- purchaseorderdetailid for traceability
  $3, -- exact quantity from PO
  NOW(),
  'pending'
);

-- This creates complete traceability: Warehouse PO → Supplier approval → Factory production`
                },
                {
                  title: "Track Production Status by Purchase Order",
                  description: "Monitor production progress for each purchase order line item",
                  type: "SELECT",
                  sql: `-- Track production status for each PO line item
SELECT 
  po.purchaseorderid,
  pod.purchaseorderdetailid,
  p.productname,
  pod.quantity as ordered_quantity,
  pr.status as production_status,
  pr.startdate,
  pr.enddate
FROM purchaseorder po
JOIN purchaseorderdetail pod ON po.purchaseorderid = pod.purchaseorderid
JOIN product p ON pod.productid = p.productid
LEFT JOIN production pr ON pod.purchaseorderdetailid = pr.purchaseorderdetailid
WHERE po.status = 'approved'
ORDER BY po.orderdate ASC;`
                }
              ]}
            />
          </div>
        </div>

        {/* Approved Purchase Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Approved Purchase Orders Ready for Production</CardTitle>
          </CardHeader>
          <CardContent>
            {approvedPOs.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approved Purchase Orders</h3>
                <p className="text-gray-600">No approved purchase orders available for production requests.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {approvedPOs.map((po) => (
                  <div key={po.purchaseorderid} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">PO #{po.purchaseorderid.slice(0, 8)}...</h3>
                        <p className="text-sm text-muted-foreground">
                          From: {po.supplier.suppliername} | Date: {new Date(po.orderdate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Approved - Ready for Production
                      </Badge>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>Production Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {po.purchaseorderdetail.map((detail) => {
                          const productionRequested = isProductionRequested(detail.purchaseorderdetailid);
                          const productionStatus = getProductionStatus(detail.purchaseorderdetailid);

                          return (
                            <TableRow key={detail.purchaseorderdetailid}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{detail.product.productname}</p>
                                  <p className="text-sm text-muted-foreground">{detail.product.description}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{detail.quantity} units</span>
                              </TableCell>
                              <TableCell>
                                <span>${detail.unitprice.toFixed(2)}</span>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">${detail.subtotal.toFixed(2)}</span>
                              </TableCell>
                              <TableCell>
                                {productionRequested ? (
                                  <Badge className={getStatusColor(productionStatus!)}>
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(productionStatus!)}
                                      <span className="capitalize">{productionStatus!.replace('_', ' ')}</span>
                                    </div>
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    Not Requested
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {!productionRequested ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleRequestProduction(
                                      detail.purchaseorderdetailid,
                                      detail.productid,
                                      detail.quantity
                                    )}
                                  >
                                    <Factory className="h-4 w-4 mr-1" />
                                    Request Production
                                  </Button>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Production {productionStatus}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
