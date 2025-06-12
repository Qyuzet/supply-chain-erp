'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  ArrowRight,
  Package,
  Building,
  Factory,
  Truck,
  DollarSign,
  ShoppingCart,
  Users,
  CheckCircle
} from 'lucide-react';

export default function SupplyChainGuidePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Real-World Supply Chain Guide</h1>
          <p className="text-muted-foreground">Understanding how our system matches real-world supply chain operations</p>
        </div>

        {/* Complete Flow Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Complete Supply Chain Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-lg mb-2">
                  <Package className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <h3 className="font-semibold text-blue-900">1. Supplier</h3>
                <p className="text-sm text-blue-700">Creates Products</p>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-400 mx-auto mt-8" />
              <div className="text-center">
                <div className="bg-purple-100 p-4 rounded-lg mb-2">
                  <Building className="h-8 w-8 text-purple-600 mx-auto" />
                </div>
                <h3 className="font-semibold text-purple-900">2. Warehouse</h3>
                <p className="text-sm text-purple-700">Creates Purchase Orders</p>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-400 mx-auto mt-8" />
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-lg mb-2">
                  <Factory className="h-8 w-8 text-green-600 mx-auto" />
                </div>
                <h3 className="font-semibold text-green-900">3. Factory</h3>
                <p className="text-sm text-green-700">Manufactures Products</p>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-400 mx-auto mt-8" />
              <div className="text-center">
                <div className="bg-orange-100 p-4 rounded-lg mb-2">
                  <Truck className="h-8 w-8 text-orange-600 mx-auto" />
                </div>
                <h3 className="font-semibold text-orange-900">4. Carrier</h3>
                <p className="text-sm text-orange-700">Delivers to Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Responsibilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Supplier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Package className="h-5 w-5" />
                Supplier Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Create & manage products
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Approve/reject purchase orders
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Request factory production
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Receive payments from warehouse
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Track performance metrics
                </Badge>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Real Logic:</strong> Suppliers own product designs and decide when to manufacture. They don't manufacture themselves - they request production from factories.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Building className="h-5 w-5" />
                Warehouse Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Assign products to warehouses
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Create purchase orders to suppliers
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Manage inventory levels
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Process customer orders
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Pay suppliers for goods
                </Badge>
              </div>
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Real Logic:</strong> Warehouses manage inventory and create purchase orders when stock is low. They pay suppliers after receiving goods.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Factory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Factory className="h-5 w-5" />
                Factory Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Receive production requests
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Manufacture products
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Update production status
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Auto-update warehouse inventory
                </Badge>
                <Badge variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Quality control & tracking
                </Badge>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Real Logic:</strong> Factories receive production requests from suppliers and manufacture products. Completed production automatically updates warehouse inventory.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Order Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchase Order Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Building className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">1. Warehouse Creates Purchase Order</h4>
                  <p className="text-sm text-muted-foreground">When inventory is low, warehouse creates PO to supplier</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">2. Supplier Approves/Rejects</h4>
                  <p className="text-sm text-muted-foreground">Supplier reviews PO and decides to approve or reject</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-full">
                  <Factory className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">3. Supplier Requests Production</h4>
                  <p className="text-sm text-muted-foreground">Supplier requests factory to manufacture products</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-orange-100 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">4. Warehouse Pays Supplier</h4>
                  <p className="text-sm text-muted-foreground">After receiving goods, warehouse pays supplier</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-900">Customer Payments</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>Customer places order</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>Payment automatically created</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Order processed by warehouse</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-blue-900">Supplier Payments</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span>Warehouse receives goods from supplier</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span>Warehouse creates payment to supplier</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Supplier receives payment</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Differences */}
        <Card>
          <CardHeader>
            <CardTitle>Key Real-World Logic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-red-900">❌ What Suppliers DON'T Do</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  <li>• Don't manufacture products themselves</li>
                  <li>• Don't manage production orders directly</li>
                  <li>• Don't control warehouse inventory</li>
                  <li>• Don't process customer orders</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-green-900">✅ What Suppliers DO</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• Own product designs and specifications</li>
                  <li>• Decide when to request production</li>
                  <li>• Approve/reject purchase orders</li>
                  <li>• Receive payments for fulfilled orders</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
