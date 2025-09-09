import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ImageGenerationButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerateImages = async () => {
    setIsGenerating(true);
    setResults(null);
    
    try {
      toast({
        title: 'Génération en cours...',
        description: 'Génération des images IA pour tous les produits',
      });

      const { data, error } = await supabase.functions.invoke('generate-product-images');
      
      if (error) throw error;
      
      setResults(data);
      
      toast({
        title: 'Images générées !',
        description: data.message,
        duration: 5000,
      });

    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la génération des images: ' + error.message,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Génération d'Images IA
        </CardTitle>
        <CardDescription>
          Générez automatiquement des images de qualité professionnelle pour tous vos produits grâce à l'IA Grok
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleGenerateImages}
          disabled={isGenerating}
          size="lg"
          className="w-full"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          {isGenerating ? 'Génération en cours...' : 'Générer toutes les images'}
        </Button>

        {results && (
          <div className="mt-6 space-y-2">
            <h3 className="font-semibold">Résultats:</h3>
            <p className="text-sm text-muted-foreground">{results.message}</p>
            
            {results.results && results.results.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {results.results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="truncate">{result.name}</span>
                    {result.status === 'error' && (
                      <span className="text-red-500 text-xs">({result.error})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageGenerationButton;