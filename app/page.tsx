'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Package,
  Truck,
  BarChart3,
  Users,
  Shield,
  Database,
  CheckCircle,
  Building,
  ShoppingCart
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user just logged out first
        const justLoggedOutFlag = sessionStorage.getItem('justLoggedOut') === 'true';

        if (justLoggedOutFlag) {
          // User just logged out, show them the landing page
          setJustLoggedOut(true);
          sessionStorage.removeItem('justLoggedOut');
          setLoading(false);
          return;
        }

        // Check Supabase Auth session
        const user = await getCurrentUser();
        if (user) {
          // User has active session, redirect to dashboard
          console.log('User found on home page, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // No session, stay on landing page
        setLoading(false);
      } catch (error) {
        console.error('Auth check error on home page:', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const features = [
    {
      icon: ShoppingCart,
      title: "Order Management",
      description: "Complete order-to-delivery workflow with real-time tracking",
      tables: ["order", "orderdetail", "customers"]
    },
    {
      icon: Package,
      title: "Inventory Control",
      description: "Real-time stock management across multiple warehouses",
      tables: ["inventory", "product", "warehouses"]
    },
    {
      icon: Building,
      title: "Warehouse Management",
      description: "Manage warehouse locations and track capacity utilization",
      tables: ["warehouses", "shipments"]
    },
    {
      icon: Truck,
      title: "Shipping & Logistics",
      description: "Track deliveries and manage carrier relationships",
      tables: ["shipments", "shippingcarrier"]
    },
    {
      icon: Users,
      title: "User Management",
      description: "Role-based access control for customers, suppliers, and staff",
      tables: ["users", "customers", "supplier"]
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Business intelligence with comprehensive reporting",
      tables: ["All tables", "PDF export"]
    }
  ];

  const roles = [
    { name: "Customer", color: "bg-green-100 text-green-800", description: "Place orders and track deliveries" },
    { name: "Supplier", color: "bg-blue-100 text-blue-800", description: "Manage product catalog" },
    { name: "Warehouse", color: "bg-purple-100 text-purple-800", description: "Control inventory and stock" },
    { name: "Carrier", color: "bg-orange-100 text-orange-800", description: "Handle shipping and logistics" },
    { name: "Admin", color: "bg-red-100 text-red-800", description: "System administration" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <Database className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Supply Chain ERP
                </h1>
                <p className="text-sm text-gray-300">Next-Generation Enterprise Platform</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/auth')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            {justLoggedOut && (
              <div className="mb-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl backdrop-blur-sm">
                <p className="text-green-300 font-medium text-lg">
                  ✨ Successfully logged out. Thank you for using our platform!
                </p>
              </div>
            )}

            <div className="mb-8">
              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30 px-4 py-2 text-sm font-medium">
                Next-Generation ERP Platform
              </Badge>
            </div>

            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-8 leading-tight animate-gradient">
              Supply Chain
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent animate-float">
                Reimagined
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Transform your operations with our enterprise-grade ERP system.
              <br className="hidden md:block" />
              Streamline orders, inventory, warehouses, and logistics with unparalleled efficiency.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 backdrop-blur-sm font-medium">
                <Shield className="h-4 w-4 mr-2" />
                Enterprise Security
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 backdrop-blur-sm font-medium">
                <Database className="h-4 w-4 mr-2" />
                Real-time Analytics
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 backdrop-blur-sm font-medium">
                <CheckCircle className="h-4 w-4 mr-2" />
                Production Ready
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => router.push('/auth')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-10 py-4 rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 border-0 animate-glow"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white bg-transparent hover:bg-white hover:text-gray-900 text-lg px-10 py-4 rounded-2xl backdrop-blur-sm transition-all duration-300 font-medium"
              >
                Watch Demo
                <Package className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-400/30 px-4 py-2 mb-6">
              Powerful Features
            </Badge>
            <h3 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
              Everything You Need
            </h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built with cutting-edge technology and enterprise-grade architecture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-white group-hover:text-blue-300 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-6 text-gray-300 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {feature.tables.map((table, idx) => (
                      <Badge
                        key={idx}
                        className="bg-white/20 text-white border-white/30 text-xs hover:bg-white/30 transition-colors font-medium"
                      >
                        {table}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="relative py-32 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-300 border-green-400/30 px-4 py-2 mb-6">
              Role-Based Access Control
            </Badge>
            <h3 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
              Built for Every Team
            </h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tailored interfaces and permissions for different user roles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {roles.map((role, index) => (
              <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10 text-center hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-xl group">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <Badge className={`${role.color} mx-auto w-fit px-3 py-1 text-sm font-medium`}>
                    {role.name}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300 leading-relaxed">{role.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-300/10 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 mb-8">
              Ready to Transform Your Business?
            </Badge>

            <h3 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Transform Your
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Supply Chain Today
              </span>
            </h3>

            <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
              Join thousands of businesses using our next-generation ERP system
              to streamline operations and boost efficiency
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                onClick={() => router.push('/auth')}
                className="bg-white text-blue-600 hover:bg-gray-100 text-xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>

              <div className="flex items-center space-x-4 text-blue-100">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>30-Day Free Trial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Supply Chain ERP
                  </h4>
                  <p className="text-gray-400">Next-Generation Enterprise Platform</p>
                </div>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Revolutionizing supply chain management with AI-powered insights,
                real-time analytics, and enterprise-grade security.
              </p>
            </div>

            {/* Features */}
            <div>
              <h5 className="text-white font-semibold mb-4">Platform</h5>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Order Management</li>
                <li className="hover:text-white transition-colors cursor-pointer">Inventory Control</li>
                <li className="hover:text-white transition-colors cursor-pointer">Warehouse Management</li>
                <li className="hover:text-white transition-colors cursor-pointer">Analytics & Reports</li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h5 className="text-white font-semibold mb-4">Company</h5>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
                <li className="hover:text-white transition-colors cursor-pointer">Terms of Service</li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2024 Supply Chain ERP. Built with Next.js, Supabase, and modern web technologies.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                <Badge className="bg-white/20 text-white border-white/30 font-medium">
                  PostgreSQL Database
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 font-medium">
                  Real-time Updates
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 font-medium">
                  Enterprise Security
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
