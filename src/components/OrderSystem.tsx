import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShoppingCart, MapPin } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface CollectionPoint {
  id: string;
  name: string;
  location: string;
}

interface OrderSystemProps {
  cartItems: CartItem[];
  onOrderSuccess?: () => void;
}

const OrderSystem: React.FC<OrderSystemProps> = ({ cartItems, onOrderSuccess }) => {
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState<string>('');
  const [collectionPoints] = useState<CollectionPoint[]>([
    { id: '1', name: 'Grandstand Principal', location: 'Section A - Entrée principale' },
    { id: '2', name: 'Paddock VIP', location: 'Zone VIP - Près des stands' },
    { id: '3', name: 'Turn 1 Grandstand', location: 'Virage 1 - Tribune Est' },
    { id: '4', name: 'Finish Line', location: 'Ligne d\'arrivée - Tribune Ouest' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const { sendOrderConfirmation } = useNotifications();
  const { toast } = useToast();

  const translations = {
    fr: {
      title: 'Finaliser la Commande',
      description: 'Choisissez votre point de collecte et confirmez votre commande',
      cartSummary: 'Résumé de la commande',
      collectionPoint: 'Point de collecte',
      selectCollectionPoint: 'Sélectionnez un point de collecte',
      total: 'Total',
      placeOrder: 'Confirmer la commande',
      processing: 'Traitement...',
      orderSuccess: 'Commande confirmée !',
      orderSuccessDesc: 'Votre commande a été créée avec succès. Vous allez recevoir un email de confirmation.',
      loginRequired: 'Connexion requise',
      loginRequiredDesc: 'Vous devez être connecté pour passer une commande.',
      selectPointRequired: 'Point de collecte requis',
      selectPointRequiredDesc: 'Veuillez sélectionner un point de collecte.',
      emptyCart: 'Panier vide',
      emptyCartDesc: 'Ajoutez des articles à votre panier avant de finaliser.',
      orderError: 'Erreur lors de la commande'
    },
    en: {
      title: 'Complete Order',
      description: 'Choose your collection point and confirm your order',
      cartSummary: 'Order summary',
      collectionPoint: 'Collection point',
      selectCollectionPoint: 'Select a collection point',
      total: 'Total',
      placeOrder: 'Place order',
      processing: 'Processing...',
      orderSuccess: 'Order confirmed!',
      orderSuccessDesc: 'Your order has been created successfully. You will receive a confirmation email.',
      loginRequired: 'Login required',
      loginRequiredDesc: 'You must be logged in to place an order.',
      selectPointRequired: 'Collection point required',
      selectPointRequiredDesc: 'Please select a collection point.',
      emptyCart: 'Empty cart',
      emptyCartDesc: 'Add items to your cart before checking out.',
      orderError: 'Order error'
    }
  };

  const t = translations[language];

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (!user || !profile) {
      toast({
        title: t.loginRequired,
        description: t.loginRequiredDesc,
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCollectionPoint) {
      toast({
        title: t.selectPointRequired,
        description: t.selectPointRequiredDesc,
        variant: 'destructive',
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: t.emptyCart,
        description: t.emptyCartDesc,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          collection_point_id: selectedCollectionPoint,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Get collection point details
      const selectedPoint = collectionPoints.find(p => p.id === selectedCollectionPoint);
      
      // Prepare order confirmation data
      const orderConfirmationData = {
        orderId: orderData.id,
        userEmail: profile.email,
        userName: profile.name || profile.email,
        orderNumber: orderData.id.slice(-8).toUpperCase(),
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price
        })),
        totalAmount,
        collectionPoint: selectedPoint ? `${selectedPoint.name} - ${selectedPoint.location}` : 'Point de collecte',
        language
      };

      // Send order confirmation email
      await sendOrderConfirmation(orderConfirmationData);

      toast({
        title: t.orderSuccess,
        description: t.orderSuccessDesc,
      });

      // Call success callback
      onOrderSuccess?.();

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: t.orderError,
        description: 'Une erreur est survenue lors de la création de votre commande.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{t.emptyCartDesc}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t.cartSummary}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{item.category}</Badge>
                  <span>×{item.quantity}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
              </div>
            </div>
          ))}
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>{t.total}:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.collectionPoint} *</label>
            <Select value={selectedCollectionPoint} onValueChange={setSelectedCollectionPoint}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectCollectionPoint} />
              </SelectTrigger>
              <SelectContent>
                {collectionPoints.map((point) => (
                  <SelectItem key={point.id} value={point.id}>
                    <div>
                      <div className="font-medium">{point.name}</div>
                      <div className="text-sm text-muted-foreground">{point.location}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handlePlaceOrder} 
            disabled={isLoading || !selectedCollectionPoint}
            className="w-full"
            size="lg"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t.processing : t.placeOrder}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSystem;