import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
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
  const query = `${product.category} ${product.name}`.toLowerCase();
  const imageUrl = product.image || product.image_url || `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;

  const handleAddToCart = async () => {
    await addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image_url: imageUrl
    });
  };
  return <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <img
            src={imageUrl}
            alt={`${product.name} - ${t('category.' + product.category)}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
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

      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} disabled={!product.available || product.stock === 0 || isLoading} className="w-full" variant={product.available && product.stock > 0 ? "default" : "secondary"}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isLoading ? t('common.loading') : product.available && product.stock > 0 ? t('common.addToCart') : t('common.outOfStock')}
        </Button>
      </CardFooter>
    </Card>;
};
export default ProductCard;