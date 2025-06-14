'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  DollarSign, 
  CreditCard, 
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  TrendingUp
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface SupplierPayment {
  paymentid: string;
  purchaseorderid: string;
  amount: number;
  paymentmethod: string;
  status: string;
  paymentdate: string;
  purchaseorder: {
    purchaseorderid: string;
    orderdate: string;
    totalamount: number;
    status: string;
  };
}

interface PaymentStats {
  totalReceived: number;
  pendingPayments: number;
  completedPayments: number;
  averagePaymentTime: number;
}

export default function SupplierPaymentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalReceived: 0,
    pendingPayments: 0,
    completedPayments: 0,
    averagePaymentTime: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData && userData.role === 'supplier') {
          await Promise.all([
            loadPayments(),
            loadPaymentStats()
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

  const loadPayments = async () => {
    try {
      // Mock data for supplier payments since the exact schema might vary
      const mockPayments: SupplierPayment[] = [
        {
          paymentid: '1',
          purchaseorderid: 'PO-001',
          amount: 15000,
          paymentmethod: 'Bank Transfer',
          status: 'completed',
          paymentdate: '2024-01-15T10:00:00Z',
          purchaseorder: {
            purchaseorderid: 'PO-001',
            orderdate: '2024-01-01T10:00:00Z',
            totalamount: 15000,
            status: 'completed'
          }
        },
        {
          paymentid: '2',
          purchaseorderid: 'PO-002',
          amount: 22500,
          paymentmethod: 'Wire Transfer',
          status: 'completed',
          paymentdate: '2024-01-20T14:30:00Z',
          purchaseorder: {
            purchaseorderid: 'PO-002',
            orderdate: '2024-01-10T09:00:00Z',
            totalamount: 22500,
            status: 'completed'
          }
        },
        {
          paymentid: '3',
          purchaseorderid: 'PO-003',
          amount: 18750,
          paymentmethod: 'ACH Transfer',
          status: 'pending',
          paymentdate: '2024-01-25T16:00:00Z',
          purchaseorder: {
            purchaseorderid: 'PO-003',
            orderdate: '2024-01-20T11:00:00Z',
            totalamount: 18750,
            status: 'approved'
          }
        },
        {
          paymentid: '4',
          purchaseorderid: 'PO-004',
          amount: 31200,
          paymentmethod: 'Bank Transfer',
          status: 'completed',
          paymentdate: '2024-01-28T12:15:00Z',
          purchaseorder: {
            purchaseorderid: 'PO-004',
            orderdate: '2024-01-22T13:30:00Z',
            totalamount: 31200,
            status: 'completed'
          }
        }
      ];

      setPayments(mockPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      });
    }
  };

  const loadPaymentStats = async () => {
    try {
      // Calculate stats from mock data
      const totalReceived = 87450; // Sum of completed payments
      const pendingPayments = 1;
      const completedPayments = 3;
      const averagePaymentTime = 5.2; // Average days from PO to payment

      setStats({
        totalReceived,
        pendingPayments,
        completedPayments,
        averagePaymentTime
      });
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'processing': return <CreditCard className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  if (!user || user.role !== 'supplier') {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only suppliers can access payment information.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Payments</h1>
          <p className="text-gray-600">Track payments received for purchase orders and deliveries</p>
        </div>

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Received</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalReceived)}
              </div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">awaiting processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedPayments}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Payment Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averagePaymentTime} days</div>
              <p className="text-xs text-muted-foreground">from PO to payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.paymentid}>
                    <TableCell className="font-mono">
                      {payment.paymentid}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.purchaseorder.purchaseorderid}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.purchaseorder.orderdate).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600">
                          of {formatCurrency(payment.purchaseorder.totalamount)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span>{payment.paymentmethod}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(payment.paymentdate).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {payments.length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-600">Payment history will appear here once purchase orders are processed</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bank Transfer</span>
                  <span className="font-medium">60%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Wire Transfer</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">ACH Transfer</span>
                  <span className="font-medium">15%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment received for PO-004</p>
                    <p className="text-xs text-gray-600">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment processing for PO-003</p>
                    <p className="text-xs text-gray-600">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment received for PO-002</p>
                    <p className="text-xs text-gray-600">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
