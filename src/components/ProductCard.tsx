import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  available: boolean;
  image?: string;
  image_url?: string;
}
interface ProductCardProps {
  product: Product;
}
const ProductCard: React.FC<ProductCardProps> = ({
  product
}) => {
  const {
    t
  } = useLanguage();
  const {
    addToCart,
    isLoading
  } = useCart();
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Générer une couleur basée sur la catégorie
  const getCategoryColor = (category: string) => {
    const colors = {
      beer: 'bg-amber-100',
      wine: 'bg-purple-100', 
      spirits: 'bg-red-100',
      cocktails: 'bg-pink-100',
      soft_drinks: 'bg-blue-100',
      energy_drinks: 'bg-green-100',
      sports_drinks: 'bg-orange-100',
      juices: 'bg-yellow-100'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100';
  };

  // Utiliser picsum.photos avec un seed basé sur l'ID du produit pour une image consistante
  const fallbackImageUrl = `https://picsum.photos/seed/${product.id}/800/600`;
  const imageUrl = product.image || product.image_url || fallbackImageUrl;

  const handleAddToCart = async () => {
    for (let i = 0; i < quantity; i++) {
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        stock: product.stock,
        image_url: imageUrl
      });
    }
    setQuantity(1); // Reset quantity after adding to cart
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    if (value >= 1 && value <= product.stock) {
      setQuantity(value);
    }
  };
  return <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
        <AspectRatio ratio={16 / 9} className={`${getCategoryColor(product.category)} flex items-center justify-center`}>
          {!imageError ? (
            <img
              src={imageUrl}
              alt={`${product.name} - ${t('category.' + product.category)}`}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
              <div className="text-4xl mb-2">🍷</div>
              <span className="text-sm font-medium">{t(`category.${product.category}`)}</span>
            </div>
          )}
        </AspectRatio>

        <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
          <Badge variant="outline" className="ml-2 shrink-0">
            {t(`category.${product.category}`)}
          </Badge>
        </div>
        
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-end">
          <span className="text-sm text-muted-foreground">
            Stock: {product.stock}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-3">
        {/* Add to Cart Button */}
        <Button 
          onClick={handleAddToCart} 
          disabled={!product.available || product.stock === 0 || isLoading} 
          className="w-full h-10 text-sm" 
          variant={product.available && product.stock > 0 ? "default" : "secondary"}
        >
          <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {isLoading ? t('common.loading') : product.available && product.stock > 0 ? t('common.addToCart') : t('common.outOfStock')}
          </span>
        </Button>

        {/* Quantity Controls */}
        {product.available && product.stock > 0 && (
          <div className="flex items-center justify-center space-x-3 w-full">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-16 text-center h-8"
              min={1}
              max={product.stock}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={incrementQuantity}
              disabled={quantity >= product.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>;
};
export default ProductCard;