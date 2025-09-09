import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Warehouse, Building, Truck, Check } from 'lucide-react';

interface CollectionPoint {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  type: 'entrepot' | 'sous_entrepot' | 'point_de_livraison';
  created_at: string;
}

interface CollectionPointSelectorProps {
  selectedPointId: string | null;
  onSelectPoint: (pointId: string) => void;
  className?: string;
}

const CollectionPointSelector: React.FC<CollectionPointSelectorProps> = ({ 
  selectedPointId, 
  onSelectPoint,
  className = "" 
}) => {
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const { toast } = useToast();

  const translations = {
    fr: {
      title: 'Points de Collecte',
      subtitle: 'Sélectionnez votre point de collecte préféré',
      loading: 'Chargement des points de collecte...',
      error: 'Erreur lors du chargement',
      noPoints: 'Aucun point de collecte disponible',
      select: 'Sélectionner',
      selected: 'Sélectionné',
      entrepot: 'Entrepôt',
      sous_entrepot: 'Sous-entrepôt',
      point_de_livraison: 'Point de livraison',
      coordinates: 'Coordonnées'
    },
    en: {
      title: 'Collection Points',
      subtitle: 'Select your preferred collection point',
      loading: 'Loading collection points...',
      error: 'Error loading points',
      noPoints: 'No collection points available',
      select: 'Select',
      selected: 'Selected',
      entrepot: 'Warehouse',
      sous_entrepot: 'Sub-warehouse',
      point_de_livraison: 'Delivery point',
      coordinates: 'Coordinates'
    }
  };

  const t = translations[language];

  const typeIcons = {
    entrepot: Warehouse,
    sous_entrepot: Building,
    point_de_livraison: Truck
  };

  const typeColors = {
    entrepot: 'default' as const,
    sous_entrepot: 'secondary' as const,
    point_de_livraison: 'outline' as const
  };

  useEffect(() => {
    fetchCollectionPoints();
  }, []);

  const fetchCollectionPoints = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('collection_points')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setCollectionPoints((data || []).map(point => ({
        ...point,
        type: point.type as 'entrepot' | 'sous_entrepot' | 'point_de_livraison'
      })));
    } catch (error) {
      console.error('Error fetching collection points:', error);
      toast({
        title: t.error,
        description: 'Failed to load collection points',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPoint = (pointId: string) => {
    onSelectPoint(pointId);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (collectionPoints.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t.noPoints}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {collectionPoints.map((point) => {
          const IconComponent = typeIcons[point.type];
          const isSelected = selectedPointId === point.id;
          
          return (
            <Card 
              key={point.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => handleSelectPoint(point.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sm">{point.name}</h4>
                        <Badge variant={typeColors[point.type]} className="text-xs">
                          {t[point.type]}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {point.location}
                      </p>
                      
                      {point.latitude && point.longitude && (
                        <p className="text-xs text-muted-foreground">
                          {t.coordinates}: {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-3">
                    {isSelected ? (
                      <div className="flex items-center gap-2 text-primary">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">{t.selected}</span>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm">
                        {t.select}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CollectionPointSelector;