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
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <MapPin className="h-4 w-4 md:h-5 md:w-5" />
          {t.title}
        </CardTitle>
        <CardDescription className="text-sm">{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        {userLocations.map((location) => {
          const isSelected = selectedPointId === location.id;
          
          return (
            <button
              key={location.id}
              onClick={() => handleSelectPoint(location.id)}
              className={`w-full text-left rounded-lg border-2 p-4 min-h-[64px] md:min-h-[56px] transition-all duration-200 ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 md:p-1.5 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <MapPin className="h-5 w-5 md:h-4 md:w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm md:text-base mb-1">{location.location_name}</h4>
                    
                    {location.address && (
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {location.address}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="ml-2 flex-shrink-0">
                  {isSelected ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="h-5 w-5 md:h-4 md:w-4" />
                      <span className="hidden md:inline text-sm font-medium">{t.selected}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground hidden md:inline">
                      {t.select}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CollectionPointSelector;