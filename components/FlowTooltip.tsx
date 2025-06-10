'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  HelpCircle, 
  ArrowRight, 
  ShoppingCart, 
  Package, 
  Truck, 
  Factory,
  Building,
  CheckCircle
} from 'lucide-react';

interface FlowTooltipProps {
  currentStep?: string;
  userRole?: string;
}

const supplyChainFlow = [
  {
    step: 1,
    title: "Customer Order",
    description: "Customer browses products and places order",
    icon: ShoppingCart,
    roles: ["customer"],
    status: "Customer shops and checks out",
    nextStep: "Order goes to warehouse for processing"
  },
  {
    step: 2,
    title: "Warehouse Processing",
    description: "Warehouse checks inventory and confirms order",
    icon: Package,
    roles: ["warehouse"],
    status: "Warehouse confirms order availability",
    nextStep: "If stock low, create Purchase Order to Supplier"
  },
  {
    step: 3,
    title: "Purchase Order",
    description: "Warehouse creates PO when inventory is low",
    icon: Building,
    roles: ["warehouse", "supplier"],
    status: "Supplier receives and approves Purchase Order",
    nextStep: "Supplier requests production from Factory"
  },
  {
    step: 4,
    title: "Production",
    description: "Factory manufactures products from approved PO",
    icon: Factory,
    roles: ["factory"],
    status: "Factory produces and updates inventory",
    nextStep: "Warehouse can now fulfill customer orders"
  },
  {
    step: 5,
    title: "Shipment",
    description: "Warehouse assigns carrier for delivery",
    icon: Truck,
    roles: ["warehouse", "carrier"],
    status: "Carrier picks up and delivers to customer",
    nextStep: "Customer receives order"
  },
  {
    step: 6,
    title: "Delivery Complete",
    description: "Customer receives order and can leave feedback",
    icon: CheckCircle,
    roles: ["customer", "carrier"],
    status: "Order completed successfully",
    nextStep: "Process complete - customer can return if needed"
  }
];

export default function FlowTooltip({ currentStep, userRole }: FlowTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCurrentStepInfo = () => {
    if (!currentStep) return null;
    return supplyChainFlow.find(step => 
      step.title.toLowerCase().includes(currentStep.toLowerCase()) ||
      step.description.toLowerCase().includes(currentStep.toLowerCase())
    );
  };

  const getUserRelevantSteps = () => {
    if (!userRole) return supplyChainFlow;
    return supplyChainFlow.filter(step => 
      step.roles.includes(userRole) || userRole === 'admin'
    );
  };

  const currentStepInfo = getCurrentStepInfo();
  const relevantSteps = getUserRelevantSteps();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          Supply Chain Flow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supply Chain Management Flow</DialogTitle>
          <DialogDescription>
            Complete workflow from customer order to delivery
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Step Highlight */}
          {currentStepInfo && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <currentStepInfo.icon className="w-5 h-5" />
                  Current Step: {currentStepInfo.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 mb-2">{currentStepInfo.description}</p>
                <p className="text-sm text-blue-700">
                  <strong>Next:</strong> {currentStepInfo.nextStep}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Role-specific View */}
          {userRole && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Your Role: {userRole}</h3>
              <p className="text-sm text-gray-600 mb-3">
                Steps relevant to your role are highlighted below
              </p>
            </div>
          )}

          {/* Complete Flow */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Complete Supply Chain Flow</h3>
            
            {supplyChainFlow.map((step, index) => {
              const isRelevant = !userRole || step.roles.includes(userRole) || userRole === 'admin';
              const isCurrent = currentStepInfo?.step === step.step;
              
              return (
                <div key={step.step} className="space-y-2">
                  <Card className={`${
                    isCurrent ? 'border-blue-500 bg-blue-50' : 
                    isRelevant ? 'border-green-200 bg-green-50' : 
                    'border-gray-200'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          isCurrent ? 'bg-blue-500 text-white' :
                          isRelevant ? 'bg-green-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          <step.icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{step.step}. {step.title}</h4>
                            <div className="flex gap-1">
                              {step.roles.map(role => (
                                <Badge 
                                  key={role} 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    role === userRole ? 'bg-blue-100 text-blue-800' : ''
                                  }`}
                                >
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                          <p className="text-sm font-medium text-gray-800">{step.status}</p>
                          
                          {step.nextStep && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              <ArrowRight className="w-3 h-3" />
                              <span>{step.nextStep}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {index < supplyChainFlow.length - 1 && (
                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions for {userRole || 'Your Role'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {userRole === 'customer' && (
                  <>
                    <p>• Browse products in /shop</p>
                    <p>• Track orders in /orders</p>
                    <p>• Manage returns in /returns</p>
                    <p>• View payments in /payments</p>
                  </>
                )}
                {userRole === 'warehouse' && (
                  <>
                    <p>• Process orders in /warehouse-orders</p>
                    <p>• Manage inventory in /inventory</p>
                    <p>• Create purchase orders when stock low</p>
                    <p>• Assign carriers for shipment</p>
                  </>
                )}
                {userRole === 'supplier' && (
                  <>
                    <p>• Manage products in /products</p>
                    <p>• Review purchase orders in /purchase-orders</p>
                    <p>• Request production in /production</p>
                    <p>• Track payments in /payments</p>
                  </>
                )}
                {userRole === 'factory' && (
                  <>
                    <p>• Manage production in /factory-production</p>
                    <p>• Monitor manufacturing in /manufacturing</p>
                    <p>• Quality control in /quality-control</p>
                    <p>• Update inventory when production complete</p>
                  </>
                )}
                {userRole === 'carrier' && (
                  <>
                    <p>• Manage shipments in /carrier</p>
                    <p>• Update delivery status</p>
                    <p>• Track delivery performance</p>
                    <p>• Coordinate with warehouses</p>
                  </>
                )}
                {userRole === 'admin' && (
                  <>
                    <p>• Manage all users in /admin</p>
                    <p>• Oversee all operations</p>
                    <p>• View system reports</p>
                    <p>• Monitor performance metrics</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
