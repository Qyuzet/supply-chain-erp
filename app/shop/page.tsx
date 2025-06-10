'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import SqlTooltip from '@/components/SqlTooltip';
import {
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Search,
  Filter,
  Heart,
  Truck,
  Shield,
  Package
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
  inventory: Array<{
    quantity: number;
    warehouses: {
      warehousename: string;
      location: string;
    };
  }>;
}

interface CartItem {
  productid: string;
  productname: string;
  unitprice: number;
  quantity: number;
  maxStock: number;
}

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        await loadProducts();

        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product')
        .select(`
          productid,
          productname,
          description,
          unitprice,
          supplier:supplier(suppliername),
          inventory(
            quantity,
            warehouses(warehousename, location)
          )
        `)
        .order('productname');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const getTotalStock = (product: Product) => {
    return product.inventory?.reduce((total, inv) => total + inv.quantity, 0) || 0;
  };

  const addToCart = (product: Product) => {
    const maxStock = getTotalStock(product);
    if (maxStock === 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently unavailable",
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(item => item.productid === product.productid);
    
    if (existingItem) {
      if (existingItem.quantity >= maxStock) {
        toast({
          title: "Stock Limit",
          description: "Cannot add more items than available stock",
          variant: "destructive",
        });
        return;
      }
      
      setCart(cart.map(item => 
        item.productid === product.productid 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productid: product.productid,
        productname: product.productname,
        unitprice: product.unitprice,
        quantity: 1,
        maxStock
      }]);
    }

    toast({
      title: "Added to Cart",
      description: `${product.productname} added to your cart`,
    });
  };

  const updateCartQuantity = (productid: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.productid !== productid));
      return;
    }

    setCart(cart.map(item => 
      item.productid === productid 
        ? { ...item, quantity: Math.min(newQuantity, item.maxStock) }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.unitprice), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const proceedToCheckout = () => {
    console.log('=== PROCEED TO CHECKOUT CLICKED ===');
    console.log('Cart items:', cart.length);
    console.log('Cart contents:', cart);

    if (cart.length === 0) {
      console.log('❌ Cart is empty');
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save cart to localStorage and navigate to checkout
      console.log('Saving cart to localStorage...');
      localStorage.setItem('cart', JSON.stringify(cart));
      console.log('Cart saved successfully');

      console.log('Navigating to /checkout...');
      router.push('/checkout');
      console.log('Navigation initiated');
    } catch (error) {
      console.error('❌ Error in proceedToCheckout:', error);
      toast({
        title: "Error",
        description: "Failed to proceed to checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
              <p className="text-gray-600">Browse and purchase products</p>
            </div>
            <SqlTooltip
              page="Shop"
              queries={[
                {
                  title: "Load Products with Inventory",
                  description: "Fetch all products with supplier info and inventory levels",
                  type: "SELECT",
                  sql: `SELECT
  p.productid,
  p.productname,
  p.description,
  p.unitprice,
  s.suppliername,
  i.quantity,
  w.warehousename,
  w.location
FROM product p
LEFT JOIN supplier s ON p.supplierid = s.supplierid
LEFT JOIN inventory i ON p.productid = i.productid
LEFT JOIN warehouses w ON i.warehouseid = w.warehouseid
ORDER BY p.productname;`
                },
                {
                  title: "Save Cart to LocalStorage",
                  description: "Store cart data in browser for checkout process",
                  type: "INSERT",
                  sql: `-- JavaScript LocalStorage operation
localStorage.setItem('cart', JSON.stringify(cartData));

-- Cart structure:
{
  productid: string,
  productname: string,
  unitprice: number,
  quantity: number,
  maxStock: number
}`
                }
              ]}
            />
          </div>
          
          {/* Cart Summary */}
          <div className="flex items-center gap-4">
            <Dialog open={cartOpen} onOpenChange={setCartOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="relative">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart ({getCartItemCount()})
                  {getCartItemCount() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {getCartItemCount()}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Shopping Cart</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.productid} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.productname}</p>
                              <p className="text-xs text-gray-600">${item.unitprice.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartQuantity(item.productid, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartQuantity(item.productid, item.quantity + 1)}
                                disabled={item.quantity >= item.maxStock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-medium text-sm w-16 text-right">
                              ${(item.quantity * item.unitprice).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>${getCartTotal().toFixed(2)}</span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={proceedToCheckout}
                        >
                          Proceed to Checkout
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {getCartTotal() > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-bold text-lg">${getCartTotal().toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck className="h-4 w-4 text-blue-600" />
            Free shipping over $100
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4 text-green-600" />
            Auto payment processing
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="h-4 w-4 text-purple-600" />
            Fast delivery
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const totalStock = getTotalStock(product);
            const cartItem = cart.find(item => item.productid === product.productid);
            
            return (
              <Card key={product.productid} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{product.productname}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                    </div>
                    
                    {/* Supplier */}
                    <p className="text-xs text-gray-500">by {product.supplier?.suppliername}</p>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        ${product.unitprice.toFixed(2)}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Stock Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className={totalStock > 0 ? "text-green-600" : "text-red-600"}>
                        {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                      </span>
                      {totalStock > 0 && totalStock <= 10 && (
                        <Badge variant="destructive" className="text-xs">Low stock</Badge>
                      )}
                    </div>
                    
                    {/* Add to Cart */}
                    {cartItem ? (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateCartQuantity(product.productid, cartItem.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="flex-1 text-center font-medium">{cartItem.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateCartQuantity(product.productid, cartItem.quantity + 1)}
                          disabled={cartItem.quantity >= totalStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => addToCart(product)}
                        disabled={totalStock === 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
