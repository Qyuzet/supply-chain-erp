'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  Factory,
  Building,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function FlowSummary() {
  const flowSteps = [
    {
      step: 1,
      title: "Customer Order",
      description: "Customer places order via /shop → checkout",
      status: "Order created (pending)",
      icon: ShoppingCart,
      color: "bg-green-100 text-green-800"
    },
    {
      step: 2,
      title: "Warehouse Processing", 
      description: "Warehouse checks inventory → confirms order",
      status: "Order confirmed",
      icon: Package,
      color: "bg-purple-100 text-purple-800"
    },
    {
      step: 3,
      title: "Low Stock Trigger",
      description: "If inventory low → Warehouse creates Purchase Order",
      status: "PO sent to Supplier",
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-800"
    },
    {
      step: 4,
      title: "Supplier Approval",
      description: "Supplier approves PO → requests Factory production",
      status: "Production requested",
      icon: Building,
      color: "bg-yellow-100 text-yellow-800"
    },
    {
      step: 5,
      title: "Factory Production",
      description: "Factory manufactures → updates inventory",
      status: "Inventory replenished",
      icon: Factory,
      color: "bg-orange-100 text-orange-800"
    },
    {
      step: 6,
      title: "Warehouse Fulfillment",
      description: "Warehouse marks order ready for pickup (shipped)",
      status: "Ready for carrier",
      icon: Package,
      color: "bg-purple-100 text-purple-800"
    },
    {
      step: 7,
      title: "Carrier Delivery",
      description: "Carrier picks up shipped orders → delivers",
      status: "Order delivered",
      icon: Truck,
      color: "bg-red-100 text-red-800"
    },
    {
      step: 8,
      title: "Order Complete",
      description: "Customer receives order → can leave feedback/returns",
      status: "Process complete",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          Complete Supply Chain Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flowSteps.map((step, index) => (
            <div key={step.step} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
                  {step.step}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon className="w-4 h-4 text-gray-600" />
                    <h4 className="font-medium">{step.title}</h4>
                    <Badge className={step.color}>
                      {step.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
              
              {index < flowSteps.length - 1 && (
                <div className="flex justify-center">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Key Points:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Warehouse</strong> creates Purchase Orders when inventory is low</li>
            <li>• <strong>Supplier</strong> approves POs and requests Factory production</li>
            <li>• <strong>Factory</strong> produces and auto-updates inventory</li>
            <li>• <strong>Warehouse</strong> marks orders "shipped" when ready for pickup</li>
            <li>• <strong>Carrier</strong> picks up "shipped" orders and delivers to customers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
