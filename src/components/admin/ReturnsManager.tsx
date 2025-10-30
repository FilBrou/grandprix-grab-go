import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RotateCcw, Check, X, Package } from 'lucide-react';

interface ProductReturn {
  id: string;
  user_id: string;
  event_id: string;
  user_location_id: string | null;
  status: string;
  return_date: string;
  validation_date: string | null;
  notes: string | null;
  admin_notes: string | null;
  product_return_items: Array<{
    id: string;
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
  profiles: {
    name: string | null;
    email: string;
  };
}

export const ReturnsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [returns, setReturns] = useState<ProductReturn[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<ProductReturn[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
  const [validatedQuantities, setValidatedQuantities] = useState<{ [key: string]: number }>({});
  const [adminNotes, setAdminNotes] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [stats, setStats] = useState({
    pending: 0,
    validated: 0,
    rejected: 0,
    validatedAmount: 0
  });

  useEffect(() => {
    fetchReturns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [returns, statusFilter]);

  const fetchReturns = async () => {
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
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching returns:', error);
      setReturns([]);
      return;
    }

    // Fetch profiles for each return
    const returnsWithProfiles = await Promise.all(
      (data || []).map(async (returnData) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('user_id', returnData.user_id)
          .single();

        return {
          ...returnData,
          profiles: profile || { name: null, email: 'Unknown' }
        };
      })
    );

    setReturns(returnsWithProfiles);
    calculateStats(returnsWithProfiles);
  };

  const calculateStats = (data: ProductReturn[]) => {
    const pending = data.filter(r => r.status === 'pending').length;
    const validated = data.filter(r => r.status === 'validated').length;
    const rejected = data.filter(r => r.status === 'rejected').length;
    
    const validatedAmount = data
      .filter(r => r.status === 'validated')
      .reduce((sum, r) => {
        const total = r.product_return_items.reduce((itemSum, item) => {
          return itemSum + ((item.validated_quantity || 0) * item.unit_price);
        }, 0);
        return sum + total;
      }, 0);

    setStats({ pending, validated, rejected, validatedAmount });
  };

  const applyFilters = () => {
    let filtered = [...returns];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredReturns(filtered);
  };

  const openValidationModal = (returnData: ProductReturn) => {
    setSelectedReturn(returnData);
    const initialQuantities: { [key: string]: number } = {};
    returnData.product_return_items.forEach(item => {
      initialQuantities[item.id] = item.declared_quantity;
    });
    setValidatedQuantities(initialQuantities);
    setAdminNotes('');
  };

  const calculateDeclaredTotal = () => {
    if (!selectedReturn) return 0;
    return selectedReturn.product_return_items.reduce((sum, item) => {
      return sum + (item.declared_quantity * item.unit_price);
    }, 0);
  };

  const calculateValidatedTotal = () => {
    if (!selectedReturn) return 0;
    return selectedReturn.product_return_items.reduce((sum, item) => {
      const qty = validatedQuantities[item.id] || 0;
      return sum + (qty * item.unit_price);
    }, 0);
  };

  const handleValidate = async () => {
    if (!selectedReturn || !user) return;

    const declaredTotal = calculateDeclaredTotal();
    const validatedTotal = calculateValidatedTotal();
    const hasAdjustments = declaredTotal !== validatedTotal;

    if (hasAdjustments && !adminNotes.trim()) {
      toast({
        title: "Notes requises",
        description: "Veuillez ajouter des notes expliquant les ajustements de quantités",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);

    try {
      // Update return status
      const { error: returnError } = await supabase
        .from('product_returns')
        .update({
          status: 'validated',
          validation_date: new Date().toISOString(),
          validated_by: user.id,
          admin_notes: adminNotes
        })
        .eq('id', selectedReturn.id);

      if (returnError) throw returnError;

      // Update validated quantities for each item
      for (const item of selectedReturn.product_return_items) {
        const { error: itemError } = await supabase
          .from('product_return_items')
          .update({
            validated_quantity: validatedQuantities[item.id]
          })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: selectedReturn.user_id,
        type: 'return_validated',
        title: 'Retour validé',
        message: `Votre retour de $${validatedTotal.toFixed(2)} a été validé et sera déduit de votre solde.${hasAdjustments ? ' Des ajustements ont été apportés.' : ''}`
      });

      toast({
        title: "Succès",
        description: "Le retour a été validé avec succès"
      });

      setSelectedReturn(null);
      fetchReturns();
    } catch (error) {
      console.error('Error validating return:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la validation",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReturn || !rejectReason.trim()) {
      toast({
        title: "Raison requise",
        description: "Veuillez indiquer la raison du rejet",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);

    try {
      const { error } = await supabase
        .from('product_returns')
        .update({
          status: 'rejected',
          admin_notes: rejectReason
        })
        .eq('id', selectedReturn.id);

      if (error) throw error;

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: selectedReturn.user_id,
        type: 'return_rejected',
        title: 'Retour rejeté',
        message: `Votre retour a été rejeté. Raison: ${rejectReason}`
      });

      toast({
        title: "Succès",
        description: "Le retour a été rejeté"
      });

      setSelectedReturn(null);
      setShowRejectDialog(false);
      setRejectReason('');
      fetchReturns();
    } catch (error) {
      console.error('Error rejecting return:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du rejet",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
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

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.validated}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejetés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant validé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.validatedAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Gestion des retours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Filtrer par statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="validated">Validés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Returns Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Retour</TableHead>
                  <TableHead>Concessionnaire</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucun retour trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReturns.map(returnData => {
                    const total = returnData.product_return_items.reduce((sum, item) => {
                      return sum + (item.declared_quantity * item.unit_price);
                    }, 0);

                    return (
                      <TableRow key={returnData.id}>
                        <TableCell className="font-mono text-sm">{returnData.id.slice(-8)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{returnData.profiles.name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{returnData.profiles.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{returnData.user_locations?.location_name || 'N/A'}</TableCell>
                        <TableCell>{new Date(returnData.return_date).toLocaleDateString()}</TableCell>
                        <TableCell>{returnData.product_return_items.length}</TableCell>
                        <TableCell className="text-red-600">-${total.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(returnData.status)}</TableCell>
                        <TableCell>
                          {returnData.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openValidationModal(returnData)}
                            >
                              Valider
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Validation Modal */}
      <Dialog open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validation du retour</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              {/* Info Section */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Concessionnaire</p>
                  <p className="font-medium">{selectedReturn.profiles.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{selectedReturn.profiles.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emplacement</p>
                  <p className="font-medium">{selectedReturn.user_locations?.location_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de soumission</p>
                  <p className="font-medium">{new Date(selectedReturn.return_date).toLocaleString()}</p>
                </div>
                {selectedReturn.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Notes du concessionnaire</p>
                    <p className="text-sm mt-1">{selectedReturn.notes}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold mb-2">Produits retournés</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Qté déclarée</TableHead>
                      <TableHead>Qté validée</TableHead>
                      <TableHead>Prix unit.</TableHead>
                      <TableHead>Sous-total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReturn.product_return_items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.items.image_url && (
                              <img src={item.items.image_url} alt={item.items.name} className="w-10 h-10 object-cover rounded" />
                            )}
                            <span>{item.items.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{item.declared_quantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={item.declared_quantity}
                            value={validatedQuantities[item.id] || 0}
                            onChange={(e) => setValidatedQuantities(prev => ({
                              ...prev,
                              [item.id]: parseInt(e.target.value) || 0
                            }))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600">
                          -${((validatedQuantities[item.id] || 0) * item.unit_price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant déclaré:</span>
                  <span className="font-semibold">-${calculateDeclaredTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant validé:</span>
                  <span className="font-bold text-lg text-red-600">-${calculateValidatedTotal().toFixed(2)}</span>
                </div>
                {calculateDeclaredTotal() !== calculateValidatedTotal() && (
                  <div className="flex justify-between text-orange-600">
                    <span>Écart:</span>
                    <span className="font-semibold">
                      ${Math.abs(calculateDeclaredTotal() - calculateValidatedTotal()).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <Label>Notes administrateur {calculateDeclaredTotal() !== calculateValidatedTotal() && <span className="text-red-600">*</span>}</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Ajoutez des notes (obligatoire si les quantités sont ajustées)"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedReturn(null)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isValidating}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button onClick={handleValidate} disabled={isValidating}>
                  <Check className="h-4 w-4 mr-2" />
                  {isValidating ? 'Validation...' : 'Valider'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter le retour</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 mt-4">
                <p>Veuillez indiquer la raison du rejet:</p>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Raison du rejet..."
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={!rejectReason.trim() || isValidating}>
              Confirmer le rejet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
