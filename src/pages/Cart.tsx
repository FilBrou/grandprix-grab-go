import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au catalogue
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('cart.title')}
          </h1>
          <p className="text-muted-foreground">
            Gérez vos items sélectionnés pour le Grand Prix de Montréal
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Cart />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CartPage;