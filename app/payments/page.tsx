'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { paymentOperations } from '@/lib/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import DatabaseIndicator from '@/components/DatabaseIndicator';
import SqlTooltip from '@/components/SqlTooltip';
import PageExplanation from '@/components/PageExplanation';
import { 
  DollarSign, 
  Plus, 
  CreditCard,
  Building,
  User,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { User } from '@/lib/auth';

interface CustomerPayment {
  paymentid: string;
  orderid: string;
  customerid: string;
  amount: number;
  paymentdate: string;
  paymentmethod: string;
  status: string;
  order?: {
    orderid: string;
    orderdate: string;
  };
}

interface SupplierPayment {
  paymentid: string;
  purchaseorderid: string;
  supplierid: string;
  amount: number;
  paymentdate: string;
  paymentmethod: string;
  status: string;
  purchaseorder?: {
    purchaseorderid: string;
    orderdate: string;
    totalamount: number;
  };
}

export default function PaymentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    orderid: '',
    customerid: '',
    amount: '',
    paymentmethod: 'credit_card'
  });
  const [supplierFormData, setSupplierFormData] = useState({
    purchaseorderid: '',
    supplierid: '',
    amount: '',
    paymentmethod: 'bank_transfer'
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData) {
          await Promise.all([
            loadCustomerPayments(),
            loadSupplierPayments(),
            loadOrders(),
            loadPurchaseOrders(),
            loadSuppliers(),
            loadCustomers()
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

  const loadCustomerPayments = async () => {
    try {
      console.log('Loading customer payments for user:', user?.role);

      let query = supabase
        .from('paymentcustomer')
        .select(`
          *,
          order:Order(orderid, orderdate),
          customers(customername)
        `)
        .order('paymentdate', { ascending: false });

      // If customer role, only show their own payments
      if (user?.role === 'customer') {
        const { data: customerData } = await supabase
          .from('customers')
          .select('customerid')
          .eq('userid', user.id)
          .single();

        if (customerData) {
          query = query.eq('customerid', customerData.customerid);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading customer payments:', error);
        throw error;
      }

      console.log('Customer payments loaded:', data?.length || 0);
      setCustomerPayments(data || []);
    } catch (error) {
      console.error('Error loading customer payments:', error);
      toast({
        title: "Error",
        description: "Failed to load customer payments",
        variant: "destructive",
      });
    }
  };

  const loadSupplierPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('paymentsupplier')
        .select(`
          *,
          purchaseorder(purchaseorderid, orderdate, totalamount)
        `)
        .order('paymentdate', { ascending: false });

      if (error) throw error;
      setSupplierPayments(data || []);
    } catch (error) {
      console.error('Error loading supplier payments:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('Order')
        .select('orderid, orderdate, customerid, customers(customername)')
        .eq('status', 'delivered')
        .order('orderdate', { ascending: true }); // FIFO: First In, First Out

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchaseorder')
        .select('purchaseorderid, orderdate, totalamount, supplierid, supplier(suppliername)')
        .eq('status', 'completed')
        .order('orderdate', { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
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

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('customerid, customername')
        .order('customername');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleCreateCustomerPayment = async () => {
    if (!customerFormData.orderid || !customerFormData.customerid || !customerFormData.amount) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await paymentOperations.createCustomerPayment(
        customerFormData.orderid,
        customerFormData.customerid,
        parseFloat(customerFormData.amount),
        customerFormData.paymentmethod
      );

      toast({
        title: "Success",
        description: "Customer payment recorded successfully",
      });

      setCustomerFormData({ orderid: '', customerid: '', amount: '', paymentmethod: 'credit_card' });
      setIsCreatingCustomer(false);
      await loadCustomerPayments();
    } catch (error) {
      console.error('Error creating customer payment:', error);
      toast({
        title: "Error",
        description: "Failed to record customer payment",
        variant: "destructive",
      });
    }
  };

  const handleCreateSupplierPayment = async () => {
    if (!supplierFormData.purchaseorderid || !supplierFormData.supplierid || !supplierFormData.amount) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating supplier payment...');

      // Try RPC function first
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_supplier_payment', {
        p_supplierid: supplierFormData.supplierid,
        p_purchaseorderid: supplierFormData.purchaseorderid,
        p_amount: parseFloat(supplierFormData.amount),
        p_paymentmethod: supplierFormData.paymentmethod
      });

      if (rpcError) {
        console.error('RPC supplier payment failed:', rpcError);
        // Fallback to direct insert
        await paymentOperations.createSupplierPayment(
          supplierFormData.purchaseorderid,
          supplierFormData.supplierid,
          parseFloat(supplierFormData.amount),
          supplierFormData.paymentmethod
        );
      } else {
        console.log('Supplier payment created via RPC:', rpcResult);
      }

      toast({
        title: "Success",
        description: "Supplier payment recorded successfully",
      });

      setSupplierFormData({ purchaseorderid: '', supplierid: '', amount: '', paymentmethod: 'bank_transfer' });
      setIsCreatingSupplier(false);
      await loadSupplierPayments();
    } catch (error) {
      console.error('Error creating supplier payment:', error);
      toast({
        title: "Error",
        description: "Failed to record supplier payment",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
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

  const totalCustomerPayments = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalSupplierPayments = supplierPayments.reduce((sum, p) => sum + p.amount, 0);
  const netCashFlow = totalCustomerPayments - totalSupplierPayments;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DatabaseIndicator
          primaryTables={['paymentcustomer', 'paymentsupplier']}
          relatedTables={['Order', 'purchaseorder', 'customers', 'supplier']}
          operations={['Record Payments', 'Track Cash Flow', 'Payment History']}
          description="Payment management system for customer and supplier transactions"
        />

        <PageExplanation
          title="Payment Management"
          description="Track your payment history and manage payment methods"
          steps={[
            {
              title: "View Payment History",
              description: "See all your payments organized by customer and supplier transactions",
              action: "Browse the Customer Payments and Supplier Payments tabs"
            },
            {
              title: "Check Payment Status",
              description: "Monitor payment statuses: pending, completed, failed, refunded",
              action: "Review status column in payment tables"
            },
            {
              title: "Track Order Payments",
              description: "See which payments correspond to specific orders",
              action: "Check Order ID column to match payments to orders"
            },
            {
              title: "Monitor Payment Methods",
              description: "View which payment methods were used for transactions",
              action: "Check Payment Method column"
            },
            {
              title: "Review Payment Amounts",
              description: "Track payment amounts and dates for financial records",
              action: "View Amount and Payment Date columns"
            }
          ]}
          tips={[
            "Customer payments are automatically created when you place orders",
            "Payment status updates in real-time as transactions process",
            "Failed payments may require retry or alternative payment method",
            "Refunded payments appear when returns are processed",
            "Keep track of payment methods for future reference"
          ]}
          relatedPages={[
            {
              name: "Orders",
              path: "/orders",
              description: "View orders associated with payments"
            },
            {
              name: "Returns",
              path: "/returns",
              description: "Track refunds for returned items"
            },
            {
              name: "Checkout",
              path: "/checkout",
              description: "Make new purchases and payments"
            }
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'customer' ? 'My Payments' : 'Payments'}
              </h1>
              <p className="text-gray-600">
                {user?.role === 'customer'
                  ? 'View your order payments and transaction history'
                  : 'Manage customer and supplier payment transactions'
                }
              </p>
            </div>
            <SqlTooltip
              page="Payments"
              queries={[
                {
                  title: "Load Customer Payments with FIFO",
                  description: "Get customer payments ordered by payment date",
                  type: "SELECT",
                  sql: `SELECT
  pc.*,
  o.orderid,
  o.orderdate,
  c.customername
FROM paymentcustomer pc
JOIN "Order" o ON pc.orderid = o.orderid
JOIN customers c ON pc.customerid = c.customerid
WHERE pc.customerid = $1
ORDER BY pc.paymentdate DESC; -- Latest first`
                },
                {
                  title: "Load Supplier Payments",
                  description: "Get supplier payments with purchase order details",
                  type: "SELECT",
                  sql: `SELECT
  ps.*,
  po.purchaseorderid,
  po.orderdate,
  po.totalamount
FROM paymentsupplier ps
JOIN purchaseorder po ON ps.purchaseorderid = po.purchaseorderid
ORDER BY ps.paymentdate DESC; -- Latest first`
                },
                {
                  title: "Create Customer Payment",
                  description: "Auto-generated during checkout process",
                  type: "INSERT",
                  sql: `INSERT INTO paymentcustomer (
  paymentid,
  customerid,
  orderid,
  amount,
  paymentmethod,
  paymentdate,
  status
) VALUES (
  gen_random_uuid(),
  $1, $2, $3, $4,
  NOW(), 'completed'
);`
                },
                {
                  title: "Create Supplier Payment",
                  description: "Record payment to supplier for purchase orders",
                  type: "INSERT",
                  sql: `INSERT INTO paymentsupplier (
  paymentid,
  supplierid,
  purchaseorderid,
  amount,
  paymentmethod,
  paymentdate,
  status
) VALUES (
  gen_random_uuid(),
  $1, $2, $3, $4,
  NOW(), 'completed'
);`
                }
              ]}
            />
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-1 gap-6 ${user?.role === 'customer' ? 'md:grid-cols-2' : 'md:grid-cols-4'}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user?.role === 'customer' ? 'Total Paid' : 'Customer Payments'}
              </CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalCustomerPayments.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'customer' ? 'total amount' : 'received'}
              </p>
            </CardContent>
          </Card>

          {/* Hide supplier-related stats for customers */}
          {user?.role !== 'customer' && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Supplier Payments</CardTitle>
                  <Building className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">${totalSupplierPayments.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">paid out</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                  <DollarSign className={`h-4 w-4 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${netCashFlow.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">net position</p>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.role === 'customer'
                  ? customerPayments.length
                  : customerPayments.length + supplierPayments.length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'customer' ? 'your payments' : 'all time'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        {user?.role === 'admin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Debug Info (Admin Only)</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>User Role: {user?.role}</p>
              <p>Customer Payments Loaded: {customerPayments.length}</p>
              <p>Supplier Payments Loaded: {supplierPayments.length}</p>
              <p>Note: Customer payments are auto-created during checkout</p>
            </div>
          </div>
        )}

        {/* Payment Tabs */}
        <Tabs defaultValue="customer" className="space-y-4">
          <TabsList>
            <TabsTrigger value="customer">
              {user?.role === 'customer' ? 'My Payments' : 'Customer Payments'}
            </TabsTrigger>
            {/* Only show supplier payments for non-customer roles */}
            {user?.role !== 'customer' && (
              <TabsTrigger value="supplier">Supplier Payments</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="customer" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {user?.role === 'customer' ? 'My Payments' : 'Customer Payments'}
                </CardTitle>
                {/* Only show manual payment creation for non-customer roles */}
                {user?.role !== 'customer' && (
                  <Dialog open={isCreatingCustomer} onOpenChange={setIsCreatingCustomer}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Customer Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Order *</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={customerFormData.orderid}
                          onChange={(e) => setCustomerFormData({...customerFormData, orderid: e.target.value})}
                        >
                          <option value="">Select Order</option>
                          {orders.map((order) => (
                            <option key={order.orderid} value={order.orderid}>
                              {order.orderid.slice(0, 8)}... - {order.customers?.customername} ({new Date(order.orderdate).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Customer *</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={customerFormData.customerid}
                          onChange={(e) => setCustomerFormData({...customerFormData, customerid: e.target.value})}
                        >
                          <option value="">Select Customer</option>
                          {customers.map((customer) => (
                            <option key={customer.customerid} value={customer.customerid}>
                              {customer.customername}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={customerFormData.amount}
                          onChange={(e) => setCustomerFormData({...customerFormData, amount: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Payment Method *</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={customerFormData.paymentmethod}
                          onChange={(e) => setCustomerFormData({...customerFormData, paymentmethod: e.target.value})}
                        >
                          <option value="credit_card">Credit Card</option>
                          <option value="debit_card">Debit Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setIsCreatingCustomer(false);
                          setCustomerFormData({ orderid: '', customerid: '', amount: '', paymentmethod: 'credit_card' });
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCustomerPayment}>
                          Record Payment
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerPayments.map((payment) => (
                      <TableRow key={payment.paymentid}>
                        <TableCell className="font-mono">
                          {payment.paymentid.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono">
                          {payment.orderid.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">${payment.amount.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            {payment.paymentmethod.replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.paymentdate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {customerPayments.length === 0 && (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {user?.role === 'customer' ? 'No payments found' : 'No customer payments found'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {user?.role === 'customer'
                        ? 'Your payments will appear here after placing orders'
                        : 'Record your first customer payment'
                      }
                    </p>
                    {user?.role !== 'customer' && (
                      <Button onClick={() => setIsCreatingCustomer(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supplier Payments Tab - Hidden for customers */}
          {user?.role !== 'customer' && (
            <TabsContent value="supplier" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Supplier Payments</CardTitle>
                <Dialog open={isCreatingSupplier} onOpenChange={setIsCreatingSupplier}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Supplier Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Purchase Order *</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={supplierFormData.purchaseorderid}
                          onChange={(e) => setSupplierFormData({...supplierFormData, purchaseorderid: e.target.value})}
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
                        <Label>Supplier *</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={supplierFormData.supplierid}
                          onChange={(e) => setSupplierFormData({...supplierFormData, supplierid: e.target.value})}
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
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={supplierFormData.amount}
                          onChange={(e) => setSupplierFormData({...supplierFormData, amount: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Payment Method *</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={supplierFormData.paymentmethod}
                          onChange={(e) => setSupplierFormData({...supplierFormData, paymentmethod: e.target.value})}
                        >
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="check">Check</option>
                          <option value="wire_transfer">Wire Transfer</option>
                          <option value="ach">ACH</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setIsCreatingSupplier(false);
                          setSupplierFormData({ purchaseorderid: '', supplierid: '', amount: '', paymentmethod: 'bank_transfer' });
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateSupplierPayment}>
                          Record Payment
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Purchase Order</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierPayments.map((payment) => (
                      <TableRow key={payment.paymentid}>
                        <TableCell className="font-mono">
                          {payment.paymentid.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono">
                          {payment.purchaseorderid.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-red-600">${payment.amount.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            {payment.paymentmethod.replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.paymentdate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {supplierPayments.length === 0 && (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No supplier payments found</h3>
                    <p className="text-gray-600 mb-4">Record your first supplier payment</p>
                    <Button onClick={() => setIsCreatingSupplier(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
