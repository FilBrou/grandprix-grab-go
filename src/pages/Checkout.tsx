import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderSystem from '@/components/OrderSystem';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { items, clearCart } = useCart();

  const handleOrderSuccess = () => {
    clearCart();
    navigate('/order-history');
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
          <OrderSystem
            cartItems={items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              category: item.category
            }))}
            onOrderSuccess={handleOrderSuccess}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutPage;