import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Clock, CheckCircle, Package, Send } from 'lucide-react';
import { useMondayIntegration } from '@/hooks/useMondayIntegration';

interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  user_location_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string | null;
    email: string;
  } | null;
  user_locations: {
    location_name: string;
    address: string | null;
  } | null;
  order_items: {
    quantity: number;
    unit_price: number;
    items: {
      name: string;
    };
  }[];
}

const OrdersManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncingOrders, setSyncingOrders] = useState<Set<string>>(new Set());
  const { language } = useLanguage();
  const { toast } = useToast();
  const { updateItem } = useMondayIntegration();

  const translations = {
    fr: {
      title: 'Gestion des Commandes',
      description: 'Suivez et gérez toutes les commandes',
      orderNumber: 'N° Commande',
      customer: 'Client',
      items: 'Articles',
      total: 'Total',
      status: 'Statut',
      collectionPoint: 'Point de collecte',
      date: 'Date',
      filterAll: 'Toutes',
      pending: 'En attente',
      confirmed: 'Confirmée',
      ready: 'Prête',
      completed: 'Terminée',
      cancelled: 'Annulée',
      updateStatus: 'Mettre à jour le statut',
      statusUpdated: 'Statut mis à jour avec succès',
      error: 'Erreur',
      noOrders: 'Aucune commande trouvée',
      unknown: 'Inconnu',
      sendToMonday: 'Envoyer à Monday',
      syncing: 'Synchronisation...',
      syncSuccess: 'Commande synchronisée avec Monday',
      syncError: 'Erreur de synchronisation avec Monday'
    },
    en: {
      title: 'Orders Management',
      description: 'Track and manage all orders',
      orderNumber: 'Order #',
      customer: 'Customer',
      items: 'Items',
      total: 'Total',
      status: 'Status',
      collectionPoint: 'Collection Point',
      date: 'Date',
      filterAll: 'All',
      pending: 'Pending',
      confirmed: 'Confirmed',
      ready: 'Ready',
      completed: 'Completed',
      cancelled: 'Cancelled',
      updateStatus: 'Update Status',
      statusUpdated: 'Status updated successfully',
      error: 'Error',
      noOrders: 'No orders found',
      unknown: 'Unknown',
      sendToMonday: 'Send to Monday',
      syncing: 'Syncing...',
      syncSuccess: 'Order synced with Monday',
      syncError: 'Error syncing with Monday'
    }
  };

  const t = translations[language];

  const statusTranslations = {
    pending: t.pending,
    confirmed: t.confirmed,
    ready: t.ready,
    completed: t.completed,
    cancelled: t.cancelled
  };

  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle,
    ready: Package,
    completed: CheckCircle,
    cancelled: Clock
  };

  const statusColors = {
    pending: 'default',
    confirmed: 'secondary',
    ready: 'default',
    completed: 'default',
    cancelled: 'destructive'
  } as const;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user_locations (location_name, address),
          order_items (
            quantity,
            unit_price,
            items (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately for each order
      const ordersWithProfiles = await Promise.all(
        (data || []).map(async (order) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('user_id', order.user_id)
            .single();

          return {
            ...order,
            status: order.status as 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled',
            profiles: profileData || null
          };
        })
      );

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: t.error,
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncMondayStatus = async (orderId: string, newStatus: string) => {
    try {
      const config = localStorage.getItem('monday-orders-config');
      if (!config) return;

      const parsedConfig = JSON.parse(config);
      if (!parsedConfig.autoSync || !parsedConfig.boardId) return;

      const statusMapping = {
        pending: 'En attente',
        confirmed: 'Confirmée', 
        ready: 'Prête',
        completed: 'Terminée',
        cancelled: 'Annulée'
      };

      // Note: Dans un vrai scénario, on devrait stocker l'ID de l'item Monday
      // Pour l'instant, on log juste l'intention
      console.log(`Synchronisation Monday: Commande ${orderId} -> ${statusMapping[newStatus as keyof typeof statusMapping]}`);
      
    } catch (error) {
      console.error('Erreur synchronisation Monday:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Find the order to get user info
      const updatedOrder = orders.find(order => order.id === orderId);
      if (updatedOrder) {
        // Create notification based on status
        if (newStatus === 'ready') {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: updatedOrder.user_id,
              order_id: orderId,
              type: 'order_ready',
              title: language === 'fr' ? 'Commande prête' : 'Order ready',
              message: language === 'fr' 
                ? `Votre commande #${orderId.slice(-8)} est prête à être récupérée !`
                : `Your order #${orderId.slice(-8)} is ready for pickup!`
            });

          if (notifError) {
            console.error('Error creating notification:', notifError);
          }
        } else if (newStatus === 'completed') {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: updatedOrder.user_id,
              order_id: orderId,
              type: 'order_completed',
              title: language === 'fr' ? 'Commande terminée' : 'Order completed',
              message: language === 'fr' 
                ? `Votre commande #${orderId.slice(-8)} a été récupérée avec succès !`
                : `Your order #${orderId.slice(-8)} has been successfully picked up!`
            });

          if (notifError) {
            console.error('Error creating notification:', notifError);
          }
        }
      }

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));

      // Sync with Monday.com (async, non-blocking)
      syncMondayStatus(orderId, newStatus);

      toast({
        title: t.statusUpdated,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: t.error,
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const syncOrderToMonday = async (orderId: string) => {
    const config = localStorage.getItem('monday-orders-config');
    if (!config) {
      toast({
        title: t.error,
        description: 'Monday integration not configured',
        variant: 'destructive',
      });
      return;
    }

    const parsedConfig = JSON.parse(config);
    if (!parsedConfig.boardId) {
      toast({
        title: t.error,
        description: 'Monday board not selected',
        variant: 'destructive',
      });
      return;
    }

    setSyncingOrders(prev => new Set(prev).add(orderId));

    try {
      const { data, error } = await supabase.functions.invoke('sync-order-by-id', {
        body: { 
          orderId: orderId,
          boardId: parsedConfig.boardId
        }
      });

      if (error) {
        throw new Error(error.message || 'Error calling sync function');
      }

      if (!data.success) {
        throw new Error(data.error || 'Sync failed');
      }

      toast({
        title: t.syncSuccess,
        description: `Monday ID: ${data.mondayItemId}`,
      });

    } catch (error: any) {
      console.error('Error syncing order to Monday:', error);
      toast({
        title: t.syncError,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filterAll}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="confirmed">{t.confirmed}</SelectItem>
                <SelectItem value="ready">{t.ready}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
                <SelectItem value="cancelled">{t.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t.noOrders}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.orderNumber}</TableHead>
                    <TableHead>{t.customer}</TableHead>
                    <TableHead className="hidden md:table-cell">{t.items}</TableHead>
                    <TableHead>{t.total}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t.collectionPoint}</TableHead>
                    <TableHead className="hidden xl:table-cell">{t.date}</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const StatusIcon = statusIcons[order.status];
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.profiles?.name || t.unknown}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.profiles?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            {order.order_items.map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.quantity}x {item.items.name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${order.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[order.status]} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {statusTranslations[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {order.user_locations?.location_name || t.unknown}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">{t.pending}</SelectItem>
                                <SelectItem value="confirmed">{t.confirmed}</SelectItem>
                                <SelectItem value="ready">{t.ready}</SelectItem>
                                <SelectItem value="completed">{t.completed}</SelectItem>
                                <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncOrderToMonday(order.id)}
                              disabled={syncingOrders.has(order.id)}
                              className="flex items-center gap-1"
                            >
                              <Send className="h-3 w-3" />
                              {syncingOrders.has(order.id) ? t.syncing : t.sendToMonday}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersManager;