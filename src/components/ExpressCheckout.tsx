import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLastLocation } from '@/hooks/useLastLocation';
import { useEvent } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, ChevronDown, Check, Loader2 } from 'lucide-react';

interface UserLocation {
  id: string;
  location_name: string;
  address: string | null;
}

const ExpressCheckout: React.FC = () => {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { items, totalAmount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { lastLocationId, saveLastLocation } = useLastLocation();
  const { currentEvent } = useEvent();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const translations = {
    fr: {
      expressCheckout: 'Paiement Express',
      yourItems: 'Vos articles',
      selectLocation: 'Sélectionner le lieu',
      changeLocation: 'Changer le lieu',
      placeOrder: 'Valider la commande',
      processing: 'Traitement...',
      total: 'Total',
      success: 'Commande confirmée !',
      successDesc: 'Votre commande a été créée avec succès.',
    },
    en: {
      expressCheckout: 'Express Checkout',
      yourItems: 'Your Items',
      selectLocation: 'Select Location',
      changeLocation: 'Change Location',
      placeOrder: 'Place Order',
      processing: 'Processing...',
      total: 'Total',
      success: 'Order confirmed!',
      successDesc: 'Your order has been created successfully.',
    },
  };

  const trans = translations[language] || translations.en;

  useEffect(() => {
    if (user) {
      fetchLocations();
    }
  }, [user]);

  useEffect(() => {
    if (lastLocationId && locations.length > 0) {
      const exists = locations.find((loc) => loc.id === lastLocationId);
      if (exists) {
        setSelectedLocation(lastLocationId);
      }
    }
  }, [lastLocationId, locations]);

  const fetchLocations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', user.id)
      .order('location_name', { ascending: true });

    if (!error && data) {
      setLocations(data);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !profile || !selectedLocation) return;

    setIsProcessing(true);
    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          event_id: currentEvent!.id,
          total_amount: totalAmount,
          user_location_id: selectedLocation,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw itemsError;
      }

      // Update stock
      for (const item of items) {
        const { error: stockError } = await (supabase as any).rpc('update_item_stock', {
          item_id: item.id,
          quantity_to_subtract: item.quantity,
        });

        if (stockError) throw stockError;
      }

      // Save last location
      saveLastLocation(selectedLocation);

      toast({
        title: trans.success,
        description: trans.successDesc,
      });

      clearCart();
      navigate('/orders', { replace: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (error) {
      console.error('Express checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedLocationData = locations.find((loc) => loc.id === selectedLocation);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Items Summary - Collapsible on mobile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
              {trans.yourItems}
            </div>
            <Badge variant="secondary">{items.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">×{item.quantity}</p>
              </div>
              <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Location Selector - Collapsible */}
      <Card>
        <Collapsible open={isLocationsOpen} onOpenChange={setIsLocationsOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="font-semibold text-base md:text-lg">
                    {selectedLocationData ? trans.changeLocation : trans.selectLocation}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isLocationsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            {selectedLocationData && !isLocationsOpen && (
              <div className="text-sm text-muted-foreground mt-2">
                {selectedLocationData.location_name}
                {selectedLocationData.address && ` - ${selectedLocationData.address}`}
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-2 pt-0">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => {
                    setSelectedLocation(location.id);
                    setIsLocationsOpen(false);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all min-h-[56px] ${
                    selectedLocation === location.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{location.location_name}</p>
                      {location.address && (
                        <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                      )}
                    </div>
                    {selectedLocation === location.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 left-0 right-0 z-10 bg-background border-t md:relative md:border-t-0">
        <div className="container mx-auto p-4 space-y-4">
          <div className="flex items-center justify-between text-lg md:text-xl font-bold">
            <span>{trans.total}:</span>
            <span className="text-primary">${totalAmount.toFixed(2)}</span>
          </div>

          <Button
            onClick={handlePlaceOrder}
            disabled={isProcessing || !selectedLocation || items.length === 0}
            className="w-full h-14 text-base md:text-lg font-semibold"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {trans.processing}
              </>
            ) : (
              trans.placeOrder
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpressCheckout;
