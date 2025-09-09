import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import OrderSystem from '@/components/OrderSystem';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const OrderDemo = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const { language } = useLanguage();

  const translations = {
    fr: {
      title: 'Commande - Grand Prix Montréal',
      description: 'Commandez vos produits pour le Grand Prix',
      addToCart: 'Ajouter au panier',
      removeFromCart: 'Retirer',
      cart: 'Panier',
      checkout: 'Commander',
      backToProducts: 'Retour aux produits',
      emptyCart: 'Panier vide',
      total: 'Total'
    },
    en: {
      title: 'Order - Montreal Grand Prix',
      description: 'Order your products for the Grand Prix',
      addToCart: 'Add to cart',
      removeFromCart: 'Remove',
      cart: 'Cart',
      checkout: 'Checkout',
      backToProducts: 'Back to products',
      emptyCart: 'Empty cart',
      total: 'Total'
    }
  };

  const t = translations[language];

  // Mock products for demo
  const products: Product[] = [
    {
      id: '1',
      name: 'Burger Grand Prix',
      description: language === 'fr' 
        ? 'Délicieux burger aux saveurs du Grand Prix'
        : 'Delicious Grand Prix flavored burger',
      price: 18.99,
      category: 'food'
    },
    {
      id: '2', 
      name: 'Poutine Racing',
      description: language === 'fr'
        ? 'Poutine classique avec une touche racing'
        : 'Classic poutine with a racing twist',
      price: 12.99,
      category: 'food'
    },
    {
      id: '3',
      name: 'Casquette GP Montréal 2024',
      description: language === 'fr'
        ? 'Casquette officielle du Grand Prix 2024'
        : 'Official 2024 Grand Prix cap',
      price: 34.99,
      category: 'merchandise'
    },
    {
      id: '4',
      name: 'Énergie Red Racing',
      description: language === 'fr'
        ? 'Boisson énergisante officielle'
        : 'Official energy drink',
      price: 6.99,
      category: 'drinks'
    }
  ];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const getCartItemQuantity = (productId: string) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleOrderSuccess = () => {
    setCart([]);
    setShowCheckout(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-muted-foreground">{t.description}</p>
        </div>

        {!showCheckout ? (
          <div className="space-y-8">
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                      
                      <div className="flex items-center gap-2">
                        {getCartItemQuantity(product.id) > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(product.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium min-w-[2rem] text-center">
                              {getCartItemQuantity(product.id)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(product)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={() => addToCart(product)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t.addToCart}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {t.cart} ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">×{item.quantity}</p>
                      </div>
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>{t.total}:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowCheckout(true)}
                    className="w-full"
                    size="lg"
                  >
                    {t.checkout}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={() => setShowCheckout(false)}
              className="mb-4"
            >
              ← {t.backToProducts}
            </Button>
            
            <OrderSystem
              cartItems={cart}
              onOrderSuccess={handleOrderSuccess}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrderDemo;