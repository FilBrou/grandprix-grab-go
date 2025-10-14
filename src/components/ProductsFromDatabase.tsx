import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import ProductCard from './ProductCard';
import CategoryFilter from './CategoryFilter';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DatabaseItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  available: boolean;
  image_url?: string;
}

const ProductsFromDatabase: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [items, setItems] = useState<DatabaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch items from database
  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('available', true)
        .order('name');

      if (error) throw error;
      
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Real-time updates for items
  useEffect(() => {
    const channel = supabase
      .channel('items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items'
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get unique categories and item counts
  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(item => item.category)));
    return ['all', ...cats];
  }, [items]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length
    };
    
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    
    return counts;
  }, [items]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = items;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  }, [items, selectedCategory, searchTerm]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>{t('common.loading')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Catalogue des Produits</span>
          <Badge variant="secondary">
            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            itemCounts={itemCounts}
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                image: product.image_url
              }}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Aucun produit trouvé avec ces filtres
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={resetFilters}
            >
              <Filter className="mr-2 h-4 w-4" />
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsFromDatabase;