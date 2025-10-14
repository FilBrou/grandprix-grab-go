import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import QuickOrderButton from './QuickOrderButton';
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
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
    t,
    language
  } = useLanguage();
  const {
    addToCart,
    isLoading
  } = useCart();
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { frequentItems } = useOrderHistory();
  
  const isFrequentItem = frequentItems.some(item => item.id === product.id);
  
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
    await addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      image_url: imageUrl
    }, quantity);
    setQuantity(1); // Reset quantity after adding to cart
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    if (value >= 1) {
      setQuantity(value);
    }
  };
  return <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
        <AspectRatio ratio={16 / 9}>
          <div className={`w-full h-full ${getCategoryColor(product.category)} flex items-center justify-center overflow-hidden`}>
            {!imageError ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl mb-2">🍷</div>
                <span className="text-xs text-muted-foreground">{product.name}</span>
              </div>
            )}
          </div>
        </AspectRatio>

        <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg leading-tight" style={{color: '#000000'}}>{product.name}</h3>
          <Badge variant="outline" className="ml-2 shrink-0" style={{color: '#000000'}}>
            {t(`category.${product.category}`)}
          </Badge>
        </div>
        
        <p className="text-sm mb-3 line-clamp-2" style={{color: '#000000'}}>
          {product.description}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-3">
        {/* Quick Order Badge for frequent items */}
        {isFrequentItem && product.available && (
          <div className="w-full">
            <QuickOrderButton
              itemId={product.id}
              itemName={product.name}
              itemPrice={product.price}
              itemCategory={product.category}
              itemImage={imageUrl}
              defaultQuantity={1}
              className="w-full"
            />
          </div>
        )}

        {/* Quantity Controls - Improved touch targets */}
        {product.available && (
          <div className="w-full">
            <label className="text-sm font-medium mb-2 block" style={{color: '#000000'}}>
              {t('common.quantity')}:
            </label>
            <div className="flex items-center justify-center gap-2 w-full bg-white border rounded-md p-2 shadow-sm">
              <Button
                variant="outline"
                size="sm"
                className="h-12 w-12 border-2 min-w-[48px] min-h-[48px]"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                style={{borderColor: '#000000'}}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-20 text-center h-12 font-medium text-lg"
                min={1}
                style={{color: '#000000'}}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-12 w-12 border-2 min-w-[48px] min-h-[48px]"
                onClick={incrementQuantity}
                style={{borderColor: '#000000'}}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Add to Cart Button - Larger touch target */}
        <Button 
          onClick={handleAddToCart} 
          disabled={!product.available || isLoading}
          className="w-full h-14 min-h-[56px] text-base font-semibold border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{
            backgroundColor: !product.available ? '#CCCCCC' : '#FF0000',
            color: '#FFFFFF',
            borderColor: '#FFFFFF',
            padding: '12px'
          }}
        >
          <ShoppingCart className="mr-2 h-5 w-5 shrink-0" />
          <span className="truncate">
            {isLoading 
              ? t('common.loading') 
              : product.available
                ? (language === 'fr' ? 'Ajouter' : 'Add to Cart')
                : t('common.unavailable')
            }
          </span>
        </Button>
      </CardFooter>
    </Card>;
};
export default ProductCard;