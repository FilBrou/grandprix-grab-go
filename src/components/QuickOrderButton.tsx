import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Check, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLastLocation } from '@/hooks/useLastLocation';
import { useEvent } from '@/contexts/EventContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface QuickOrderButtonProps {
  itemId: string;
  itemName: string;
  itemPrice: number;
  itemCategory: string;
  itemImage?: string;
  defaultQuantity?: number;
  className?: string;
}

const QuickOrderButton: React.FC<QuickOrderButtonProps> = ({
  itemId,
  itemName,
  itemPrice,
  itemCategory,
  itemImage,
  defaultQuantity = 1,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const { currentEvent } = useEvent();
  const { lastLocationId } = useLastLocation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const translations = {
    fr: {
      quickOrder: 'Commande rapide',
      confirmOrder: 'Confirmer la commande',
      processing: 'Traitement...',
      orderDetails: 'Détails de la commande',
      item: 'Article',
      quantity: 'Quantité',
      location: 'Lieu de retrait',
      total: 'Total',
      success: 'Commande confirmée !',
      successDesc: 'Votre commande rapide a été créée avec succès.',
      loginRequired: 'Connexion requise',
      loginRequiredDesc: 'Veuillez vous connecter pour utiliser la commande rapide.',
      noLocation: 'Aucun lieu enregistré',
      noLocationDesc: 'Veuillez passer une commande normale pour enregistrer un lieu.',
    },
    en: {
      quickOrder: 'Quick Order',
      confirmOrder: 'Confirm Order',
      processing: 'Processing...',
      orderDetails: 'Order Details',
      item: 'Item',
      quantity: 'Quantity',
      location: 'Pickup Location',
      total: 'Total',
      success: 'Order confirmed!',
      successDesc: 'Your quick order has been created successfully.',
      loginRequired: 'Login required',
      loginRequiredDesc: 'Please log in to use quick order.',
      noLocation: 'No saved location',
      noLocationDesc: 'Please place a regular order first to save a location.',
    },
  };

  const trans = translations[language] || translations.en;

  const handleQuickOrderClick = async () => {
    if (!user) {
      toast({
        title: trans.loginRequired,
        description: trans.loginRequiredDesc,
        variant: 'destructive',
      });
      return;
    }

    if (!lastLocationId) {
      toast({
        title: trans.noLocation,
        description: trans.noLocationDesc,
        variant: 'destructive',
      });
      return;
    }

    // Fetch location name
    const { data: location } = await supabase
      .from('user_locations')
      .select('location_name, address')
      .eq('id', lastLocationId)
      .single();

    if (location) {
      setLocationName(`${location.location_name}${location.address ? ' - ' + location.address : ''}`);
    }

    setIsOpen(true);
  };

  const handleConfirmQuickOrder = async () => {
    if (!user || !profile || !lastLocationId) return;

    setIsProcessing(true);
    try {
      const totalAmount = itemPrice * defaultQuantity;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          event_id: currentEvent!.id,
          total_amount: totalAmount,
          user_location_id: lastLocationId,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          item_id: itemId,
          quantity: defaultQuantity,
          unit_price: itemPrice,
        });

      if (itemError) {
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw itemError;
      }

      // Update stock
      const { error: stockError } = await (supabase as any).rpc('update_item_stock', {
        item_id: itemId,
        quantity_to_subtract: defaultQuantity,
      });

      if (stockError) throw stockError;

      toast({
        title: trans.success,
        description: trans.successDesc,
      });

      setIsOpen(false);
      navigate('/orders');
    } catch (error) {
      console.error('Quick order error:', error);
      toast({
        title: 'Error',
        description: 'Failed to place quick order',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`gap-2 ${className}`}
        onClick={handleQuickOrderClick}
      >
        <Zap className="h-4 w-4" />
        {trans.quickOrder}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {trans.quickOrder}
            </DialogTitle>
            <DialogDescription>{trans.orderDetails}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Item */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {itemImage && (
                  <img src={itemImage} alt={itemName} className="h-12 w-12 object-cover rounded" />
                )}
                <div>
                  <p className="font-semibold">{itemName}</p>
                  <Badge variant="secondary" className="mt-1">
                    {t(`category.${itemCategory}`)}
                  </Badge>
                </div>
              </div>
              <p className="font-semibold">${itemPrice.toFixed(2)}</p>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{trans.quantity}:</span>
              <span className="font-semibold">{defaultQuantity}</span>
            </div>

            {/* Location */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{trans.location}:</span>
              </div>
              <span className="text-sm text-right flex-1">{locationName}</span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-lg font-bold">{trans.total}:</span>
              <span className="text-lg font-bold text-primary">
                ${(itemPrice * defaultQuantity).toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            onClick={handleConfirmQuickOrder}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                {trans.processing}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {trans.confirmOrder}
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickOrderButton;
