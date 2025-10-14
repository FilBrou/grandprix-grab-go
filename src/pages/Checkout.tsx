import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderSystem from '@/components/OrderSystem';
import ExpressCheckout from '@/components/ExpressCheckout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Zap, Package } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { items, clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const isExpress = searchParams.get('express') === 'true';

  const handleOrderSuccess = () => {
    clearCart();
    navigate('/orders', { replace: true });
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('checkout.backToCart')}
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('checkout.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('checkout.subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Mobile: Show Express by default, Desktop: Tabs */}
          <div className="md:hidden">
            {isExpress ? (
              <ExpressCheckout />
            ) : (
              <OrderSystem
                cartItems={items.map(item => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  category: item.category
                }))}
                onOrderSuccess={handleOrderSuccess}
                expressMode={false}
              />
            )}
          </div>

          {/* Desktop: Tabs */}
          <div className="hidden md:block">
            <Tabs defaultValue={isExpress ? "express" : "standard"} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="express" className="gap-2">
                  <Zap className="h-4 w-4" />
                  {t('express.title')}
                </TabsTrigger>
                <TabsTrigger value="standard" className="gap-2">
                  <Package className="h-4 w-4" />
                  {t('express.standard')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="express">
                <ExpressCheckout />
              </TabsContent>
              
              <TabsContent value="standard">
                <OrderSystem
                  cartItems={items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    category: item.category
                  }))}
                  onOrderSuccess={handleOrderSuccess}
                  expressMode={false}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutPage;