import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvent } from '@/contexts/EventContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Plus, Eye } from 'lucide-react';

interface UserLocation {
  id: string;
  location_name: string;
  address: string | null;
}

interface Item {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
}

interface ReturnItem {
  item_id: string;
  quantity: number;
  reason: string;
}

interface ProductReturn {
  id: string;
  user_location_id: string | null;
  status: string;
  return_date: string;
  validation_date: string | null;
  notes: string | null;
  admin_notes: string | null;
  product_return_items: Array<{
    item_id: string;
    declared_quantity: number;
    validated_quantity: number | null;
    unit_price: number;
    reason: string | null;
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

export const ReturnLogger = () => {
  const { user } = useAuth();
  const { currentEvent } = useEvent();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [returnItems, setReturnItems] = useState<{ [key: string]: ReturnItem }>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [returns, setReturns] = useState<ProductReturn[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);

  useEffect(() => {
    if (user && currentEvent) {
      fetchLocations();
      fetchItems();
      fetchReturns();
    }
  }, [user, currentEvent]);

  const fetchLocations = async () => {
    if (!user || !currentEvent) return;

    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', currentEvent.id);

    if (error) {
      console.error('Error fetching locations:', error);
    } else {
      setLocations(data || []);
    }
  };

  const fetchItems = async () => {
    if (!currentEvent) return;

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('event_id', currentEvent.id)
      .eq('available', true)
      .order('name');

    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setItems(data || []);
    }
  };

  const fetchReturns = async () => {
    if (!user || !currentEvent) return;

    const { data, error } = await supabase
      .from('product_returns')
      .select(`
        *,
        user_locations (location_name, address),
        product_return_items (
          *,
          items (name, image_url)
        )
      `)
      .eq('user_id', user.id)
      .eq('event_id', currentEvent.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching returns:', error);
    } else {
      setReturns(data || []);
    }
  };

  const handleQuantityChange = (itemId: string, quantity: string) => {
    const qty = parseInt(quantity) || 0;
    if (qty > 0) {
      const item = items.find(i => i.id === itemId);
      setReturnItems(prev => ({
        ...prev,
        [itemId]: {
          item_id: itemId,
          quantity: qty,
          reason: prev[itemId]?.reason || ''
        }
      }));
    } else {
      setReturnItems(prev => {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      });
    }
  };

  const handleReasonChange = (itemId: string, reason: string) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        reason
      }
    }));
  };

  const calculateTotal = () => {
    return Object.entries(returnItems).reduce((sum, [itemId, returnItem]) => {
      const item = items.find(i => i.id === itemId);
      return sum + (item ? item.price * returnItem.quantity : 0);
    }, 0);
  };

  const handleSubmitReturn = async () => {
    if (!user || !currentEvent || !selectedLocation) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un emplacement",
        variant: "destructive"
      });
      return;
    }

    if (Object.keys(returnItems).length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un produit à retourner",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create return record
      const { data: returnData, error: returnError } = await supabase
        .from('product_returns')
        .insert({
          user_id: user.id,
          event_id: currentEvent.id,
          user_location_id: selectedLocation,
          notes: generalNotes,
          status: 'pending'
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return items
      const returnItemsData = Object.entries(returnItems).map(([itemId, returnItem]) => {
        const item = items.find(i => i.id === itemId);
        return {
          return_id: returnData.id,
          item_id: itemId,
          declared_quantity: returnItem.quantity,
          unit_price: item?.price || 0,
          reason: returnItem.reason
        };
      });

      const { error: itemsError } = await supabase
        .from('product_return_items')
        .insert(returnItemsData);

      if (itemsError) throw itemsError;

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'return_submitted',
        title: 'Retour soumis',
        message: 'Votre retour a été soumis avec succès. Il sera traité par un administrateur.'
      });

      // Create notification for admins
      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminUsers) {
        await supabase.from('notifications').insert(
          adminUsers.map(admin => ({
            user_id: admin.user_id,
            type: 'new_return',
            title: 'Nouveau retour',
            message: `Nouveau retour soumis - Montant: $${calculateTotal().toFixed(2)}`
          }))
        );
      }

      toast({
        title: "Succès",
        description: "Votre retour a été soumis avec succès"
      });

      // Reset form
      setIsDialogOpen(false);
      setSelectedLocation('');
      setReturnItems({});
      setGeneralNotes('');
      fetchReturns();
    } catch (error) {
      console.error('Error submitting return:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission du retour",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-orange-100 text-orange-700">En attente</Badge>;
      case 'validated':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Validé</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-700">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateReturnTotal = (returnData: ProductReturn) => {
    return returnData.product_return_items.reduce((sum, item) => {
      const qty = item.validated_quantity !== null ? item.validated_quantity : item.declared_quantity;
      return sum + (qty * item.unit_price);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Retours de produits
            </span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Soumettre un retour
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nouveau retour de produits</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Emplacement de livraison</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un emplacement" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.location_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Produits à retourner</Label>
                    <div className="space-y-3 mt-2">
                      {items.map(item => (
                        <div key={item.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-3">
                            {item.image_url && (
                              <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                            </div>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Quantité"
                              className="w-24"
                              value={returnItems[item.id]?.quantity || ''}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            />
                          </div>
                          {returnItems[item.id] && (
                            <Textarea
                              placeholder="Raison du retour (optionnel)"
                              value={returnItems[item.id]?.reason || ''}
                              onChange={(e) => handleReasonChange(item.id, e.target.value)}
                              rows={2}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Notes générales (optionnel)</Label>
                    <Textarea
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      rows={3}
                      placeholder="Ajoutez des notes concernant ce retour"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Montant total à retourner:</span>
                      <span className="text-red-600">-${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleSubmitReturn} disabled={isLoading}>
                      {isLoading ? 'Soumission...' : 'Soumettre le retour'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold">Historique des retours</h3>
            {returns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun retour soumis</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Emplacement</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map(returnData => (
                    <TableRow key={returnData.id}>
                      <TableCell>{new Date(returnData.return_date).toLocaleDateString()}</TableCell>
                      <TableCell>{returnData.user_locations?.location_name || 'N/A'}</TableCell>
                      <TableCell>{returnData.product_return_items.length} produits</TableCell>
                      <TableCell className="text-red-600">-${calculateReturnTotal(returnData).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(returnData.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedReturn(returnData)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du retour</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date de soumission</p>
                  <p className="font-medium">{new Date(selectedReturn.return_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  {getStatusBadge(selectedReturn.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emplacement</p>
                  <p className="font-medium">{selectedReturn.user_locations?.location_name || 'N/A'}</p>
                </div>
                {selectedReturn.validation_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date de validation</p>
                    <p className="font-medium">{new Date(selectedReturn.validation_date).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Produits retournés</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Qté déclarée</TableHead>
                      <TableHead>Qté validée</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReturn.product_return_items.map(item => (
                      <TableRow key={item.item_id}>
                        <TableCell>{item.items.name}</TableCell>
                        <TableCell>{item.declared_quantity}</TableCell>
                        <TableCell className="font-bold">
                          {item.validated_quantity !== null ? item.validated_quantity : 'En attente'}
                        </TableCell>
                        <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600">
                          -${((item.validated_quantity !== null ? item.validated_quantity : item.declared_quantity) * item.unit_price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedReturn.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Vos notes</p>
                  <p className="mt-1">{selectedReturn.notes}</p>
                </div>
              )}

              {selectedReturn.admin_notes && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Notes de l'administrateur</p>
                  <p className="text-sm text-blue-800 mt-1">{selectedReturn.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
