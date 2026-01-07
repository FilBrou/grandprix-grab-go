import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Calendar, MapPin, ArrowUpDown, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { format } from 'date-fns';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  user_location_id: string | null;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    items: {
      name: string;
      image_url: string | null;
    };
  }>;
  user_locations: {
    location_name: string;
    address: string | null;
  } | null;
}

const OrderHistory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

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
            user_location_id,
            order_items (
              quantity,
              unit_price,
              items (
                name,
                image_url
              )
            ),
            user_locations (
              location_name,
              address
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

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getTotalItems = (order: Order) => {
    return order.order_items.reduce((total, item) => total + item.quantity, 0);
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

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('orders.noOrders')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Sort Controls */}
              <div className="flex justify-end mb-6">
                <Button 
                  variant="outline" 
                  onClick={handleSortToggle}
                  className="flex items-center gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {t('orders.sortByDate')} {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>

              {/* Tableau des commandes */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('orders.history')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('orders.totalItems')}</TableHead>
                        <TableHead>{t('orders.date')}</TableHead>
                        <TableHead>{t('orders.total')}</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <Dialog key={order.id}>
                          <DialogTrigger asChild>
                            <TableRow className="cursor-pointer hover:bg-accent transition-colors">
                              <TableCell className="font-medium">
                                {getTotalItems(order)} {t('orders.items')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(order.created_at), 'dd/MM/yyyy')}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">
                                ${order.total_amount}
                              </TableCell>
                              <TableCell>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {t('orders.orderDetails')} #{order.id.slice(-8)}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Informations générales */}
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    {t('orders.date')}
                                  </label>
                                  <p className="font-medium">
                                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                </div>
                                {order.user_locations && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      {t('orders.collectionPoint')}
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{order.user_locations.location_name}</span>
                                      {order.user_locations.address && (
                                        <span className="text-muted-foreground">
                                          - {order.user_locations.address}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Détails des produits */}
                              <div>
                                <h4 className="font-medium mb-3">{t('orders.orderItems')}</h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>{t('orders.product')}</TableHead>
                                        <TableHead className="text-center">{t('orders.quantity')}</TableHead>
                                        <TableHead className="text-right">{t('orders.unitPrice')}</TableHead>
                                        <TableHead className="text-right">{t('orders.subtotal')}</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {order.order_items.map((item, index) => (
                                        <TableRow key={index}>
                                          <TableCell className="font-medium">
                                            {item.items.name}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {item.quantity}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            ${item.unit_price}
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            ${(item.quantity * item.unit_price).toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              {/* Total */}
                              <div className="flex justify-between items-center pt-4 border-t">
                                <span className="text-lg font-medium">
                                  {t('orders.total')}:
                                </span>
                                <span className="text-xl font-bold">
                                  ${order.total_amount}
                                </span>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </TableBody>
                  </Table>
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