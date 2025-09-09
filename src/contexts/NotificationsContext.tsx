import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  order_id: string;
  type: 'order_confirmed' | 'order_ready' | 'order_completed';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendOrderConfirmation: (orderData: OrderConfirmationData) => Promise<boolean>;
  createNotification: (type: Notification['type'], orderId: string, title: string, message: string) => Promise<void>;
  isLoading: boolean;
}

interface OrderConfirmationData {
  orderId: string;
  userEmail: string;
  userName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  totalAmount: number;
  collectionPoint: string;
  language: 'en' | 'zh' | 'hi' | 'es' | 'fr';
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data || []).map(notification => ({
        ...notification,
        type: notification.type as 'order_confirmed' | 'order_ready' | 'order_completed'
      })));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const sendOrderConfirmation = async (orderData: OrderConfirmationData): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
        body: orderData
      });

      if (error) throw error;

      toast({
        title: orderData.language === 'fr' ? 'Email envoyé' : 'Email sent',
        description: orderData.language === 'fr' 
          ? 'Confirmation de commande envoyée par email'
          : 'Order confirmation sent by email',
      });

      // Refresh notifications to show the new one
      await fetchNotifications();

      return true;
    } catch (error) {
      console.error('Error sending order confirmation:', error);
      toast({
        title: orderData.language === 'fr' ? 'Erreur' : 'Error',
        description: orderData.language === 'fr' 
          ? 'Erreur lors de l\'envoi de l\'email'
          : 'Error sending email',
        variant: 'destructive',
      });
      return false;
    }
  };

  const createNotification = async (
    type: Notification['type'],
    orderId: string,
    title: string,
    message: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          order_id: orderId,
          type,
          title,
          message
        });

      if (error) throw error;

      // Refresh notifications
      await fetchNotifications();

      // Show toast notification
      toast({
        title,
        description: message,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New notification received:', payload);
            const newNotification = {
              ...payload.new,
              type: payload.new.type as 'order_confirmed' | 'order_ready' | 'order_completed'
            } as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show toast for new notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const value: NotificationsContextType = {
    notifications: notifications || [],
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendOrderConfirmation,
    createNotification,
    isLoading
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};