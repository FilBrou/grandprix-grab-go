import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import ItemForm from './ItemForm';

interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: 'food' | 'drinks' | 'merchandise';
  available: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

const ItemsManager = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { language } = useLanguage();
  const { toast } = useToast();

  const translations = {
    fr: {
      title: 'Gestion des Articles',
      description: 'Ajoutez, modifiez et gérez vos articles',
      addItem: 'Ajouter un Article',
      edit: 'Modifier',
      delete: 'Supprimer',
      name: 'Nom',
      description: 'Description',
      price: 'Prix',
      stock: 'Stock',
      category: 'Catégorie',
      status: 'Statut',
      available: 'Disponible',
      unavailable: 'Indisponible',
      food: 'Nourriture',
      drinks: 'Boissons',
      merchandise: 'Produits dérivés',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet article ?',
      itemDeleted: 'Article supprimé avec succès',
      error: 'Erreur',
      noItems: 'Aucun article trouvé'
    },
    en: {
      title: 'Items Management',
      description: 'Add, edit and manage your items',
      addItem: 'Add Item',
      edit: 'Edit',
      delete: 'Delete',
      name: 'Name',
      description: 'Description',
      price: 'Price',
      stock: 'Stock',
      category: 'Category',
      status: 'Status',
      available: 'Available',
      unavailable: 'Unavailable',
      food: 'Food',
      drinks: 'Drinks',
      merchandise: 'Merchandise',
      confirmDelete: 'Are you sure you want to delete this item?',
      itemDeleted: 'Item deleted successfully',
      error: 'Error',
      noItems: 'No items found'
    }
  };

  const t = translations[language];

  const categoryTranslations = {
    food: t.food,
    drinks: t.drinks,
    merchandise: t.merchandise
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: t.error,
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast({
        title: t.itemDeleted,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: t.error,
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.addItem}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t.noItems}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.name}</TableHead>
                    <TableHead className="hidden md:table-cell">{t.description}</TableHead>
                    <TableHead>{t.price}</TableHead>
                    <TableHead>{t.stock}</TableHead>
                    <TableHead>{t.category}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">
                        {item.description}
                      </TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={item.stock > 0 ? 'default' : 'destructive'}>
                          {item.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {categoryTranslations[item.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.available ? 'default' : 'secondary'}>
                          {item.available ? t.available : t.unavailable}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <ItemForm
          item={editingItem}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default ItemsManager;