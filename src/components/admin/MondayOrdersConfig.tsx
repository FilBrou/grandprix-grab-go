import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings, TestTube } from 'lucide-react';
import { useMondayIntegration, MondayBoard } from '@/hooks/useMondayIntegration';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface MondayOrderConfig {
  boardId: string;
  boardName: string;
  autoSync: boolean;
  statusMapping: Record<string, string>;
}

const MondayOrdersConfig: React.FC = () => {
  const [boards, setBoards] = useState<MondayBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [config, setConfig] = useState<MondayOrderConfig>({
    boardId: '',
    boardName: '',
    autoSync: false,
    statusMapping: {
      pending: 'En attente',
      confirmed: 'Confirmée',
      ready: 'Prête',
      completed: 'Terminée',
      cancelled: 'Annulée'
    }
  });
  const [testingConnection, setTestingConnection] = useState(false);

  const { getBoards, createItem, loading, error } = useMondayIntegration();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadBoards();
    loadSavedConfig();
  }, []);

  const loadBoards = async () => {
    try {
      const mondayBoards = await getBoards();
      setBoards(mondayBoards);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les tableaux Monday",
        variant: "destructive"
      });
    }
  };

  const loadSavedConfig = () => {
    const savedConfig = localStorage.getItem('monday-orders-config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      setSelectedBoard(parsed.boardId);
    }
  };

  const saveConfig = () => {
    const configToSave = {
      ...config,
      boardId: selectedBoard,
      boardName: boards.find(b => b.id === selectedBoard)?.name || ''
    };
    
    localStorage.setItem('monday-orders-config', JSON.stringify(configToSave));
    setConfig(configToSave);
    
    toast({
      title: "Configuration sauvegardée",
      description: "La configuration Monday pour les commandes a été enregistrée",
    });
  };

  const testConnection = async () => {
    if (!selectedBoard) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un tableau",
        variant: "destructive"
      });
      return;
    }

    setTestingConnection(true);
    try {
      await createItem(selectedBoard, 'Test - Commande #TEST123', {
        text: 'Client Test - test@example.com',
        status: 'En attente',
        numbers: '99.99',
        text8: 'Point de collecte test',
        long_text: '1x Produit Test (19.99€)',
        date: new Date().toISOString().split('T')[0],
        email: 'test@example.com'
      });

      toast({
        title: "Test réussi !",
        description: "Une commande de test a été créée dans Monday",
      });
    } catch (err) {
      toast({
        title: "Échec du test",
        description: "Impossible de créer l'item de test dans Monday",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Monday - Commandes
          </CardTitle>
          <CardDescription>
            Configurez l'intégration entre vos commandes et Monday.com
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-select">Tableau Monday pour les commandes</Label>
            <Select value={selectedBoard} onValueChange={setSelectedBoard}>
              <SelectTrigger id="board-select">
                <SelectValue placeholder="Sélectionnez un tableau" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-sync"
              checked={config.autoSync}
              onCheckedChange={(checked) => setConfig({ ...config, autoSync: checked })}
            />
            <Label htmlFor="auto-sync">Synchronisation automatique des commandes</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveConfig} disabled={!selectedBoard}>
              Sauvegarder la configuration
            </Button>
            <Button 
              variant="outline" 
              onClick={testConnection} 
              disabled={!selectedBoard || testingConnection}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testingConnection ? 'Test en cours...' : 'Tester la connexion'}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {config.boardId && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Configuré avec le tableau: {config.boardName}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Structure du tableau recommandée</CardTitle>
          <CardDescription>
            Colonnes suggérées pour votre tableau Monday
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">Nom: Numéro de commande</Badge>
              <Badge variant="outline">Client (texte)</Badge>
              <Badge variant="outline">Statut (statut)</Badge>
              <Badge variant="outline">Montant (nombre)</Badge>
              <Badge variant="outline">Point de collecte (texte)</Badge>
              <Badge variant="outline">Articles (texte long)</Badge>
              <Badge variant="outline">Date commande (date)</Badge>
              <Badge variant="outline">Email client (email)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MondayOrdersConfig;