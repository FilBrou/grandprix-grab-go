import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMondayIntegration } from '@/hooks/useMondayIntegration';
import { Loader2, ShoppingCart, MapPin } from 'lucide-react';
import CollectionPointSelector from './CollectionPointSelector';

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
  latitude: number | null;
  longitude: number | null;
  type: 'entrepot' | 'sous_entrepot' | 'point_de_livraison';
  created_at: string;
}

interface OrderSystemProps {
  cartItems: CartItem[];
  onOrderSuccess?: () => void;
}

const OrderSystem: React.FC<OrderSystemProps> = ({ cartItems, onOrderSuccess }) => {
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState<string>('');
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const { sendOrderConfirmation } = useNotifications();
  const { toast } = useToast();
  const { createItem } = useMondayIntegration();

  const translations = {
    fr: {
      title: 'Finaliser la Commande',
      description: 'Choisissez votre point de collecte et confirmez votre commande',
      cartSummary: 'Résumé de la commande',
      collectionPoint: 'Point de collecte',
      selectCollectionPoint: 'Sélectionnez un point de collecte',
      total: 'Total',
      placeOrder: 'Valider la commande',
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
      placeOrder: 'Validate order',
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

  useEffect(() => {
    fetchCollectionPoints();
  }, []);

  const fetchCollectionPoints = async () => {
    try {
      setIsLoadingPoints(true);
      const { data, error } = await supabase
        .from('collection_points')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setCollectionPoints((data || []).map(point => ({
        ...point,
        type: point.type as 'entrepot' | 'sous_entrepot' | 'point_de_livraison'
      })));
    } catch (error) {
      console.error('Error fetching collection points:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les points de collecte',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPoints(false);
    }
  };

  const createMondayOrderItem = async (order: any, collectionPoint: CollectionPoint) => {
    try {
      const config = localStorage.getItem('monday-orders-config');
      if (!config) return;

      const parsedConfig = JSON.parse(config);
      if (!parsedConfig.autoSync || !parsedConfig.boardId) return;

      const orderNumber = `Commande #${order.id.slice(-8)}`;
      const clientInfo = `${user?.email}`;
      const itemsList = cartItems.map(item => 
        `${item.quantity}x ${item.name} ($${item.price})`
      ).join(', ');

      await createItem(parsedConfig.boardId, orderNumber, {
        text_mkvx37km: clientInfo,
        color_mkvxwgh5: 'En attente',
        numeric_mkvxa8vr: totalAmount.toString(),
        text_mkvx47hv: `${collectionPoint.name} - ${collectionPoint.location}`,
        long_text_mkvxr408: itemsList,
        date_mkvxze2g: new Date().toISOString().split('T')[0],
        email_mkvxnk9v: user?.email,
        text_mkvxqz78: order.id // ID complet pour référence
      });

      console.log('Commande synchronisée avec Monday:', orderNumber);
    } catch (error) {
      console.error('Erreur synchronisation Monday:', error);
      // On ne fait pas échouer la commande si Monday échoue
    }
  };

  const handlePlaceOrder = async () => {
    // Prevent multiple clicks
    if (isLoading) return;
    
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
    console.log('Starting order creation for user:', user.id, 'with items:', cartItems.length);

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

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log('Order created successfully:', orderData.id);

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      console.log('Inserting order items:', orderItems.length);
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // If order items fail, clean up the order
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw itemsError;
      }

      console.log('Order items created successfully');

      // Update stock for each item
      console.log('Updating stock for items...');
      for (const item of cartItems) {
        const { error: stockError } = await (supabase as any).rpc('update_item_stock', {
          item_id: item.id,
          quantity_to_subtract: item.quantity
        });

        if (stockError) {
          console.error('Error updating stock for item:', item.id, stockError);
          throw stockError;
        }
      }

      console.log('Stock updated successfully');

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
      console.log('Sending order confirmation email...');
      await sendOrderConfirmation(orderConfirmationData);

      // Synchronize with Monday.com (async, non-blocking)
      if (selectedPoint) {
        createMondayOrderItem(orderData, selectedPoint);
      }

      console.log('Order process completed successfully for order:', orderData.id);
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

      {/* Collection Point Selection */}
      <CollectionPointSelector
        selectedPointId={selectedCollectionPoint}
        onSelectPoint={setSelectedCollectionPoint}
      />

      {/* Order Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handlePlaceOrder} 
            disabled={isLoading || !selectedCollectionPoint || cartItems.length === 0}
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