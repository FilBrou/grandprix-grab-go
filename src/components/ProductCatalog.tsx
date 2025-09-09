import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from './ProductCard';
import CategoryFilter from './CategoryFilter';
import { mockProducts, categories, getItemCounts, Product } from '@/data/mockProducts';

const ProductCatalog = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState('all');

  const filteredProducts = useMemo(() => {
    let filtered = mockProducts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by price range
    if (priceRange !== 'all') {
      const ranges = {
        'under-10': (price: number) => price < 10,
        '10-20': (price: number) => price >= 10 && price < 20,
        '20-30': (price: number) => price >= 20 && price < 30,
        'over-30': (price: number) => price >= 30,
      };
      const rangeFn = ranges[priceRange as keyof typeof ranges];
      if (rangeFn) {
        filtered = filtered.filter(product => rangeFn(product.price));
      }
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [selectedCategory, searchTerm, sortBy, priceRange]);

  const handleAddToCart = (productId: string) => {
    // Cette fonction sera connectée au panier une fois Supabase configuré
    console.log('Adding to cart:', productId);
    // TODO: Implémenter l'ajout au panier avec Supabase
  };

  const itemCounts = getItemCounts(mockProducts);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('nav.catalog')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Découvrez notre sélection d'items disponibles pour le Grand Prix
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom A-Z</SelectItem>
                <SelectItem value="price-low">Prix croissant</SelectItem>
                <SelectItem value="price-high">Prix décroissant</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les prix</SelectItem>
                <SelectItem value="under-10">Moins de 10$</SelectItem>
                <SelectItem value="10-20">10$ - 20$</SelectItem>
                <SelectItem value="20-30">20$ - 30$</SelectItem>
                <SelectItem value="over-30">Plus de 30$</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                  product={product}
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
              onClick={() => {
                setSelectedCategory('all');
                setSearchTerm('');
                setPriceRange('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductCatalog;