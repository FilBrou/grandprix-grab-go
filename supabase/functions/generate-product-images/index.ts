import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const grokApiKey = Deno.env.get('Grok')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting product image generation...');

    // Récupérer tous les produits depuis la base de données
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('*')
      .is('image_url', null);

    if (fetchError) {
      console.error('Error fetching items:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${items?.length || 0} items without images`);

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Tous les produits ont déjà des images' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const item of items) {
      try {
        console.log(`Generating image for: ${item.name}`);

        // Créer un prompt détaillé basé sur le produit
        const prompt = createProductPrompt(item);
        console.log(`Prompt: ${prompt}`);

        // Générer l'image avec xAI Grok
        const imageResponse = await fetch('https://api.x.ai/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${grokApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'grok-vision-beta',
            prompt: prompt,
            size: '1024x1024',
            quality: 'high',
            n: 1
          }),
        });

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          console.error(`Grok API error for ${item.name}:`, errorText);
          throw new Error(`Grok API error: ${imageResponse.status} - ${errorText}`);
        }

        const imageData = await imageResponse.json();
        console.log(`Image generated for ${item.name}`);

        if (!imageData.data || !imageData.data[0] || !imageData.data[0].url) {
          throw new Error('Invalid response from Grok API');
        }

        const imageUrl = imageData.data[0].url;

        // Télécharger l'image
        const imageDownload = await fetch(imageUrl);
        if (!imageDownload.ok) {
          throw new Error(`Failed to download image: ${imageDownload.status}`);
        }

        const imageBlob = await imageDownload.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        // Uploader vers Supabase Storage
        const fileName = `${item.id}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${item.name}:`, uploadError);
          throw uploadError;
        }

        // Obtenir l'URL publique
        const { data: publicUrlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;

        // Mettre à jour le produit avec l'URL de l'image
        const { error: updateError } = await supabase
          .from('items')
          .update({ image_url: publicUrl })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Database update error for ${item.name}:`, updateError);
          throw updateError;
        }

        console.log(`Successfully processed ${item.name}`);
        results.push({
          id: item.id,
          name: item.name,
          image_url: publicUrl,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error processing ${item.name}:`, error);
        results.push({
          id: item.id,
          name: item.name,
          status: 'error',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return new Response(
      JSON.stringify({
        message: `Génération terminée: ${successCount} succès, ${errorCount} erreurs`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-product-images function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function createProductPrompt(item: any): string {
  const categoryPrompts = {
    food: "une photo appétissante de nourriture haute qualité, éclairage professionnel, fond neutre, style culinaire magazine",
    drinks: "une photo de boisson rafraîchissante avec des gouttes de condensation, éclairage dynamique, fond dégradé",
    merchandise: "une photo de produit commercial sur fond blanc, éclairage studio professionnel, haute résolution",
    beer: "une photo de bière fraîche avec mousse, verre transparent, éclairage doré",
    wine: "une photo élégante de vin, bouteille et verre, éclairage sophistiqué",
    spirits: "une photo premium de spiritueux, bouteille élégante, éclairage dramatique",
    cocktails: "une photo colorée de cocktail avec garniture, verre transparent, éclairage vibrant",
    soft_drinks: "une photo fraîche de boisson gazeuse avec bulles, éclairage vif",
    energy_drinks: "une photo dynamique de boisson énergisante, éclairage néon, style sportif",
    sports_drinks: "une photo de boisson sportive avec effet rafraîchissant, éclairage énergique",
    juices: "une photo fraîche de jus de fruits avec fruits frais, éclairage naturel"
  };

  const basePrompt = categoryPrompts[item.category as keyof typeof categoryPrompts] || categoryPrompts.food;
  
  return `${basePrompt}, ${item.name}, ${item.description || ''}, photo professionnelle haute qualité, réaliste, bien éclairé`;
}