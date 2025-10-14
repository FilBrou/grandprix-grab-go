import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OrderItem {
  item_id: string;
  quantity: number;
  items: {
    id: string;
    name: string;
    price: number;
    category: string;
    image_url: string | null;
  };
}

interface FrequentItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  orderCount: number;
  totalQuantity: number;
  lastOrderDate: string;
}

export const useOrderHistory = () => {
  const [frequentItems, setFrequentItems] = useState<FrequentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFrequentItems();
    } else {
      setFrequentItems([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchFrequentItems = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch user's orders with items
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          order_items (
            item_id,
            quantity,
            items (
              id,
              name,
              price,
              category,
              image_url,
              available
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Aggregate item frequency
      const itemMap = new Map<string, FrequentItem>();

      orders?.forEach((order) => {
        order.order_items?.forEach((orderItem: any) => {
          const item = orderItem.items;
          if (!item || !item.available) return;

          const existing = itemMap.get(item.id);
          if (existing) {
            existing.orderCount += 1;
            existing.totalQuantity += orderItem.quantity;
            if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
              existing.lastOrderDate = order.created_at;
            }
          } else {
            itemMap.set(item.id, {
              id: item.id,
              name: item.name,
              price: item.price,
              category: item.category,
              image_url: item.image_url,
              orderCount: 1,
              totalQuantity: orderItem.quantity,
              lastOrderDate: order.created_at,
            });
          }
        });
      });

      // Sort by order frequency and recency
      const sortedItems = Array.from(itemMap.values())
        .sort((a, b) => {
          // Primary: order count
          if (b.orderCount !== a.orderCount) {
            return b.orderCount - a.orderCount;
          }
          // Secondary: recency
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        })
        .slice(0, 5); // Top 5 frequent items

      setFrequentItems(sortedItems);
    } catch (error) {
      console.error('Error fetching frequent items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    frequentItems,
    isLoading,
    refreshFrequentItems: fetchFrequentItems,
  };
};
