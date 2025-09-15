import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Package, Calendar, MapPin, ArrowUpDown } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { format } from 'date-fns';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  collection_point_id: string | null;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    items: {
      name: string;
      image_url: string | null;
    };
  }>;
  collection_points: {
    name: string;
    location: string;
  } | null;
}

const OrderHistory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total_amount,
            status,
            collection_point_id,
            order_items (
              quantity,
              unit_price,
              items (
                name,
                image_url
              )
            ),
            collection_points (
              name,
              location
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: sortOrder === 'asc' });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, sortOrder]);

  useEffect(() => {
    let filtered = [...orders];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter]);

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      ready: 'outline',
      completed: 'default',
      cancelled: 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{t('orders.history')}</h1>
          </div>

          {filteredOrders.length === 0 && orders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('orders.noOrders')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filtres */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Statut:</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmé</SelectItem>
                      <SelectItem value="ready">Prêt</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSortToggle}
                    className="flex items-center gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    Date {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>

              {/* Tableau des commandes */}
              <Card>
                <CardHeader>
                  <CardTitle>Historique des commandes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Produits</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            #{order.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.order_items.map((item, index) => (
                                <div key={index} className="text-sm">
                                  {item.items.name}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.order_items.map((item, index) => (
                                <div key={index} className="text-sm">
                                  {item.quantity}x
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(order.created_at), 'dd/MM/yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            €{order.total_amount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredOrders.length === 0 && orders.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucune commande ne correspond aux filtres sélectionnés.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderHistory;