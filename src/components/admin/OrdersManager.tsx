import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Clock, CheckCircle, Package } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  collection_point_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string | null;
    email: string;
  } | null;
  collection_points: {
    name: string;
    location: string;
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
  const { language } = useLanguage();
  const { toast } = useToast();

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
      unknown: 'Inconnu'
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
      unknown: 'Unknown'
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
          profiles (name, email),
          collection_points (name, location),
          order_items (
            quantity,
            unit_price,
            items (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));

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
                          {order.collection_points?.name || t.unknown}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
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