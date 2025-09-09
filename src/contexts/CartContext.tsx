import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  stock: number;
  image_url?: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isLoading: boolean;
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Check stock availability
  const checkStock = async (itemId: string, requestedQuantity: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('stock, available')
        .eq('id', itemId)
        .single();

      if (error || !data) return false;
      
      return data.available && data.stock >= requestedQuantity;
    } catch (error) {
      console.error('Error checking stock:', error);
      return false;
    }
  };

  const addToCart = async (newItem: Omit<CartItem, 'quantity'>) => {
    if (!user) {
      toast({
        title: "Authentification requise",
        description: "Veuillez vous connecter pour ajouter des items au panier",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const existingItem = items.find(item => item.id === newItem.id);
      const requestedQuantity = existingItem ? existingItem.quantity + 1 : 1;

      const hasStock = await checkStock(newItem.id, requestedQuantity);
      if (!hasStock) {
        toast({
          title: "Stock insuffisant",
          description: "Cet item n'est plus disponible en quantité suffisante",
          variant: "destructive",
        });
        return;
      }

      if (existingItem) {
        setItems(items.map(item => 
          item.id === newItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setItems([...items, { ...newItem, quantity: 1 }]);
      }

      toast({
        title: "Ajouté au panier",
        description: `${newItem.name} a été ajouté à votre panier`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'item au panier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = (itemId: string) => {
    const removedItem = items.find(item => item.id === itemId);
    setItems(items.filter(item => item.id !== itemId));
    
    if (removedItem) {
      toast({
        title: "Supprimé du panier",
        description: `${removedItem.name} a été supprimé de votre panier`,
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setIsLoading(true);
    try {
      const hasStock = await checkStock(itemId, quantity);
      if (!hasStock) {
        toast({
          title: "Stock insuffisant",
          description: "Quantité demandée non disponible",
          variant: "destructive",
        });
        return;
      }

      setItems(items.map(item => 
        item.id === itemId 
          ? { ...item, quantity }
          : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la quantité",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Panier vidé",
      description: "Tous les items ont été supprimés du panier",
    });
  };

  // Real-time stock updates
  useEffect(() => {
    if (items.length === 0) return;

    const channel = supabase
      .channel('stock-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'items'
        },
        (payload) => {
          const updatedItem = payload.new as any;
          setItems(currentItems => 
            currentItems.map(item => {
              if (item.id === updatedItem.id) {
                // If item is no longer available or quantity exceeds stock
                if (!updatedItem.available || item.quantity > updatedItem.stock) {
                  toast({
                    title: "Stock mis à jour",
                    description: `${item.name} a été mis à jour dans votre panier`,
                  });
                  
                  // Remove if not available or adjust quantity
                  if (!updatedItem.available) {
                    return null;
                  } else {
                    return { ...item, quantity: Math.min(item.quantity, updatedItem.stock), stock: updatedItem.stock };
                  }
                }
                return { ...item, stock: updatedItem.stock };
              }
              return item;
            }).filter(Boolean) as CartItem[]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [items.length, toast]);

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      totalAmount,
      isLoading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};