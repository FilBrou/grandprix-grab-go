import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SyncTodayOrders: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSyncToday = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-today-orders');
      
      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Synchronisation réussie",
          description: `${data.synced}/${data.totalOrders} commandes synchronisées avec Monday.com`,
          variant: "default"
        });

        if (data.errors && data.errors.length > 0) {
          console.warn('Sync errors:', data.errors);
          toast({
            title: "Avertissement",
            description: `${data.errors.length} erreurs pendant la synchronisation. Vérifiez la console.`,
            variant: "destructive"
          });
        }
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }

    } catch (error) {
      console.error('Error syncing today orders:', error);
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser les commandes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Synchronisation Monday.com
        </CardTitle>
        <CardDescription>
          Synchronise automatiquement toutes les commandes d'aujourd'hui avec Monday.com
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cette fonction synchronise toutes les commandes créées aujourd'hui vers le tableau Monday.com "TableauCommandes".
            Utilisez cette option si certaines commandes n'ont pas été synchronisées automatiquement.
          </p>
          
          <Button 
            onClick={handleSyncToday}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Synchronisation en cours...' : 'Synchroniser les commandes d\'aujourd\'hui'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncTodayOrders;