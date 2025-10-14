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
  image_url?: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isLoading: boolean;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Récupérer les items du localStorage au chargement
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart-items');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Sauvegarder les items dans localStorage chaque fois qu'ils changent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart-items', JSON.stringify(items));
    }
  }, [items]);

  // Check availability
  const checkAvailability = async (itemId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('available')
        .eq('id', itemId)
        .single();

      if (error || !data) return false;
      
      return data.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  const addToCart = async (newItem: Omit<CartItem, 'quantity'>, addQuantity: number = 1) => {
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
      const isAvailable = await checkAvailability(newItem.id);
      if (!isAvailable) {
        toast({
          title: "Produit indisponible",
          description: "Cet item n'est plus disponible",
          variant: "destructive",
        });
        return;
      }

      const existingItem = items.find(item => item.id === newItem.id);

      if (existingItem) {
        setItems(items.map(item => 
          item.id === newItem.id 
            ? { ...item, quantity: item.quantity + addQuantity }
            : item
        ));
      } else {
        setItems([...items, { ...newItem, quantity: addQuantity }]);
      }

      toast({
        title: "Ajouté au panier",
        description: `${addQuantity} x ${newItem.name} ajouté${addQuantity > 1 ? 's' : ''} à votre panier`,
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
      const isAvailable = await checkAvailability(itemId);
      if (!isAvailable) {
        toast({
          title: "Produit indisponible",
          description: "Ce produit n'est plus disponible",
          variant: "destructive",
        });
        removeFromCart(itemId);
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart-items');
    }
    toast({
      title: "Panier vidé",
      description: "Tous les items ont été supprimés du panier",
    });
  };

  // Real-time availability updates
  useEffect(() => {
    if (items.length === 0) return;

    const channel = supabase
      .channel('availability-updates')
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
                // If item is no longer available
                if (!updatedItem.available) {
                  toast({
                    title: "Produit indisponible",
                    description: `${item.name} n'est plus disponible et a été retiré de votre panier`,
                  });
                  return null;
                }
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