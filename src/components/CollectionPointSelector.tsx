import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Check } from 'lucide-react';

interface UserLocation {
  id: string;
  location_name: string;
  address: string | null;
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
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const translations = {
    fr: {
      title: 'Mes Emplacements',
      subtitle: 'Sélectionnez l\'emplacement de livraison',
      loading: 'Chargement de vos emplacements...',
      error: 'Erreur lors du chargement',
      noPoints: 'Aucun emplacement disponible',
      select: 'Sélectionner',
      selected: 'Sélectionné'
    },
    en: {
      title: 'My Locations',
      subtitle: 'Select delivery location',
      loading: 'Loading your locations...',
      error: 'Error loading locations',
      noPoints: 'No locations available',
      select: 'Select',
      selected: 'Selected'
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchUserLocations();
  }, [user]);

  const fetchUserLocations = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('location_name', { ascending: true });

      if (error) throw error;

      setUserLocations(data || []);
    } catch (error) {
      console.error('Error fetching user locations:', error);
      toast({
        title: t.error,
        description: 'Failed to load locations',
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

  if (userLocations.length === 0) {
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
        {userLocations.map((location) => {
          const isSelected = selectedPointId === location.id;
          
          return (
            <Card 
              key={location.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => handleSelectPoint(location.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-2">{location.location_name}</h4>
                      
                      {location.address && (
                        <p className="text-sm text-muted-foreground">
                          {location.address}
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