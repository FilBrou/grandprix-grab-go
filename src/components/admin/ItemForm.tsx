import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: 'food' | 'drinks' | 'merchandise';
  available: boolean;
  image_url: string | null;
}

interface ItemFormProps {
  item?: Item | null;
  onClose: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'food' as 'food' | 'drinks' | 'merchandise',
    available: true,
    image_url: ''
  });

  const { language } = useLanguage();
  const { toast } = useToast();

  const translations = {
    fr: {
      title: item ? 'Modifier l\'Article' : 'Ajouter un Article',
      description: item ? 'Modifiez les détails de l\'article' : 'Ajoutez un nouvel article au catalogue',
      name: 'Nom',
      nameRequired: 'Le nom est requis',
      description: 'Description',
      price: 'Prix',
      priceRequired: 'Le prix est requis',
      stock: 'Stock',
      stockRequired: 'Le stock est requis',
      category: 'Catégorie',
      food: 'Nourriture',
      drinks: 'Boissons',
      merchandise: 'Produits dérivés',
      available: 'Disponible',
      imageUrl: 'URL de l\'image (optionnel)',
      cancel: 'Annuler',
      save: 'Enregistrer',
      update: 'Mettre à jour',
      saving: 'Enregistrement...',
      updating: 'Mise à jour...',
      itemSaved: 'Article enregistré avec succès',
      itemUpdated: 'Article mis à jour avec succès',
      error: 'Erreur'
    },
    en: {
      title: item ? 'Edit Item' : 'Add Item',
      description: item ? 'Edit item details' : 'Add a new item to the catalog',
      name: 'Name',
      nameRequired: 'Name is required',
      description: 'Description',
      price: 'Price',
      priceRequired: 'Price is required',
      stock: 'Stock',
      stockRequired: 'Stock is required',
      category: 'Category',
      food: 'Food',
      drinks: 'Drinks',
      merchandise: 'Merchandise',
      available: 'Available',
      imageUrl: 'Image URL (optional)',
      cancel: 'Cancel',
      save: 'Save',
      update: 'Update',
      saving: 'Saving...',
      updating: 'Updating...',
      itemSaved: 'Item saved successfully',
      itemUpdated: 'Item updated successfully',
      error: 'Error'
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        stock: item.stock.toString(),
        category: item.category,
        available: item.available,
        image_url: item.image_url || ''
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const itemData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        available: formData.available,
        image_url: formData.image_url || null
      };

      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: t.itemUpdated,
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('items')
          .insert([itemData]);

        if (error) throw error;

        toast({
          title: t.itemSaved,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: t.error,
        description: 'Failed to save item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="fixed inset-0 z-50 m-4 overflow-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t.category} *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: 'food' | 'drinks' | 'merchandise') =>
                  setFormData({ ...formData, category: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">{t.food}</SelectItem>
                  <SelectItem value="drinks">{t.drinks}</SelectItem>
                  <SelectItem value="merchandise">{t.merchandise}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t.price} *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">{t.stock} *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.description}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">{t.imageUrl}</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              checked={formData.available}
              onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
              disabled={isLoading}
            />
            <Label htmlFor="available">{t.available}</Label>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {item ? (isLoading ? t.updating : t.update) : (isLoading ? t.saving : t.save)}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ItemForm;