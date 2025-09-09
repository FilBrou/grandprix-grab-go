import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Warehouse, Building, Truck, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface CollectionPoint {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  type: 'entrepot' | 'sous_entrepot' | 'point_de_livraison';
  created_at: string;
}

const CollectionPoints = () => {
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const { toast } = useToast();

  const translations = {
    fr: {
      title: 'Points de Collecte',
      subtitle: 'Découvrez tous nos points de collecte disponibles pour récupérer vos commandes',
      loading: 'Chargement des points de collecte...',
      error: 'Erreur lors du chargement',
      noPoints: 'Aucun point de collecte disponible',
      entrepot: 'Entrepôt',
      sous_entrepot: 'Sous-entrepôt',
      point_de_livraison: 'Point de livraison',
      coordinates: 'Coordonnées GPS',
      openInMaps: 'Ouvrir dans Google Maps',
      address: 'Adresse',
      pointsAvailable: 'points de collecte disponibles'
    },
    en: {
      title: 'Collection Points',
      subtitle: 'Discover all our available collection points to pick up your orders',
      loading: 'Loading collection points...',
      error: 'Error loading points',
      noPoints: 'No collection points available',
      entrepot: 'Warehouse',
      sous_entrepot: 'Sub-warehouse',
      point_de_livraison: 'Delivery point',
      coordinates: 'GPS Coordinates',
      openInMaps: 'Open in Google Maps',
      address: 'Address',
      pointsAvailable: 'collection points available'
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

  const openInMaps = (point: CollectionPoint) => {
    if (point.latitude && point.longitude) {
      const url = `https://maps.google.com/maps?q=${point.latitude},${point.longitude}&z=16`;
      window.open(url, '_blank');
    } else {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(point.location)}`;
      window.open(url, '_blank');
    }
  };

  const groupedPoints = collectionPoints.reduce((acc, point) => {
    if (!acc[point.type]) {
      acc[point.type] = [];
    }
    acc[point.type].push(point);
    return acc;
  }, {} as Record<string, CollectionPoint[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.subtitle}
          </p>
          {!isLoading && (
            <Badge variant="secondary" className="mt-4">
              {collectionPoints.length} {t.pointsAvailable}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        ) : collectionPoints.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">{t.noPoints}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedPoints).map(([type, points]) => {
              const IconComponent = typeIcons[type as keyof typeof typeIcons];
              
              return (
                <div key={type} className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">{t[type as keyof typeof translations.fr]}</h2>
                    <Badge variant={typeColors[type as keyof typeof typeColors]}>
                      {points.length} {points.length === 1 ? 'point' : 'points'}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {points.map((point) => (
                      <Card key={point.id} className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-muted">
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{point.name}</CardTitle>
                                <Badge variant={typeColors[point.type]} className="mt-1">
                                  {t[point.type]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">
                              {t.address}
                            </h4>
                            <p className="text-sm">{point.location}</p>
                          </div>
                          
                          {point.latitude && point.longitude && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                {t.coordinates}
                              </h4>
                              <p className="text-sm font-mono">
                                {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                              </p>
                            </div>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInMaps(point)}
                            className="w-full"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t.openInMaps}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default CollectionPoints;