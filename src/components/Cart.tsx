import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Cart: React.FC = () => {
  const { items, totalItems, totalAmount, removeFromCart, updateQuantity, clearCart, isLoading } = useCart();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('cart.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('cart.empty')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('cart.title')}
            <Badge variant="secondary" className="ml-2">
              {totalItems} {totalItems === 1 ? t('cart.item') : t('cart.items')}
            </Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCart}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t('cart.clearAll')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-16 w-16 object-cover rounded-md"
                  />
                ) : (
                  <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {t(`category.${item.category}`)}
                </p>
                <p className="font-semibold text-primary">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <span className="w-8 text-center font-semibold">
                  {item.quantity}
                </span>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={isLoading || item.quantity >= item.stock}
                  className="h-8 w-8"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-right">
                <p className="font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Stock: {item.stock}
                </p>
              </div>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>{t('cart.subtotal')}</span>
            <span className="text-primary">${totalAmount.toFixed(2)}</span>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/checkout'}
            className="w-full mt-4"
            size="lg"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t('cart.checkout')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Cart;