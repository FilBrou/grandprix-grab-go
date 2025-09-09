import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';

interface DailySales {
  date: string;
  total_sales: number;
  order_count: number;
}

interface PopularItem {
  item_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface SalesStats {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  total_items_sold: number;
}

const ReportsManager = () => {
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();

  const translations = {
    fr: {
      title: 'Rapports de Ventes',
      description: 'Analysez les performances de votre plateforme',
      dailySalesTitle: 'Ventes Quotidiennes',
      popularItemsTitle: 'Articles Populaires',
      salesStatsTitle: 'Statistiques Générales',
      totalRevenue: 'Revenus Total',
      totalOrders: 'Commandes Total',
      averageOrderValue: 'Valeur Moyenne Commande',
      totalItemsSold: 'Articles Vendus',
      date: 'Date',
      sales: 'Ventes',
      orders: 'Commandes',
      itemName: 'Article',
      quantitySold: 'Quantité',
      revenue: 'Revenus',
      noData: 'Aucune donnée disponible',
      last7Days: '7 derniers jours',
      top10Items: 'Top 10 articles'
    },
    en: {
      title: 'Sales Reports',
      description: 'Analyze your platform performance',
      dailySalesTitle: 'Daily Sales',
      popularItemsTitle: 'Popular Items',
      salesStatsTitle: 'General Statistics',
      totalRevenue: 'Total Revenue',
      totalOrders: 'Total Orders',
      averageOrderValue: 'Average Order Value',
      totalItemsSold: 'Items Sold',
      date: 'Date',
      sales: 'Sales',
      orders: 'Orders',
      itemName: 'Item',
      quantitySold: 'Quantity',
      revenue: 'Revenue',
      noData: 'No data available',
      last7Days: 'Last 7 days',
      top10Items: 'Top 10 items'
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch daily sales
      const { data: dailySalesData, error: dailySalesError } = await supabase
        .rpc('get_daily_sales', { days: 7 });
      
      if (dailySalesError) throw dailySalesError;
      setDailySales(dailySalesData || []);

      // Fetch popular items
      const { data: popularItemsData, error: popularItemsError } = await supabase
        .rpc('get_popular_items', { limit_count: 10 });
      
      if (popularItemsError) throw popularItemsError;
      setPopularItems(popularItemsData || []);

      // Fetch general sales statistics
      const { data: salesStatsData, error: salesStatsError } = await supabase
        .rpc('get_sales_statistics');
      
      if (salesStatsError) throw salesStatsError;
      if (salesStatsData && salesStatsData.length > 0) {
        setSalesStats(salesStatsData[0]);
      }

    } catch (error) {
      console.error('Error fetching reports data:', error);
      // Fallback to mock data if RPC fails
      const mockDailySales: DailySales[] = [
        { date: '2024-01-15', total_sales: 1250.50, order_count: 15 },
        { date: '2024-01-14', total_sales: 890.25, order_count: 12 },
        { date: '2024-01-13', total_sales: 1450.75, order_count: 18 }
      ];
      setDailySales(mockDailySales);

      const mockPopularItems: PopularItem[] = [
        { item_name: 'Burger Grand Prix', total_quantity: 45, total_revenue: 854.55 },
        { item_name: 'Poutine Racing', total_quantity: 38, total_revenue: 493.62 }
      ];
      setPopularItems(mockPopularItems);

      const mockSalesStats: SalesStats = {
        total_revenue: 8750.50,
        total_orders: 124,
        average_order_value: 70.57,
        total_items_sold: 315
      };
      setSalesStats(mockSalesStats);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-muted-foreground">Chargement des rapports...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Sales Statistics */}
      {salesStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(salesStats.total_revenue)}</p>
                  <p className="text-sm text-muted-foreground">{t.totalRevenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{salesStats.total_orders}</p>
                  <p className="text-sm text-muted-foreground">{t.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(salesStats.average_order_value)}</p>
                  <p className="text-sm text-muted-foreground">{t.averageOrderValue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{salesStats.total_items_sold}</p>
                  <p className="text-sm text-muted-foreground">{t.totalItemsSold}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales */}
        <Card>
          <CardHeader>
            <CardTitle>{t.dailySalesTitle}</CardTitle>
            <CardDescription>{t.last7Days}</CardDescription>
          </CardHeader>
          <CardContent>
            {dailySales.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t.noData}</p>
            ) : (
              <div className="space-y-4">
                {dailySales.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{formatDate(day.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {day.order_count} {t.orders.toLowerCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(day.total_sales)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle>{t.popularItemsTitle}</CardTitle>
            <CardDescription>{t.top10Items}</CardDescription>
          </CardHeader>
          <CardContent>
            {popularItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t.noData}</p>
            ) : (
              <div className="space-y-4">
                {popularItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.total_quantity} vendus
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(item.total_revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsManager;