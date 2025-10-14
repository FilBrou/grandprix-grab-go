import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';

// Import all the generated images
import monsterEnergy from '@/assets/products/monster-energy.jpg';
import dasaniWater from '@/assets/products/dasani-water.jpg';
import cocaCola from '@/assets/products/coca-cola.jpg';
import cocaColaZero from '@/assets/products/coca-cola-zero.jpg';
import sprite from '@/assets/products/sprite.jpg';
import gingerAle from '@/assets/products/ginger-ale.jpg';
import tonic from '@/assets/products/tonic.jpg';
import soda from '@/assets/products/soda.jpg';
import poweradeBlue from '@/assets/products/powerade-blue.jpg';

const UploadDrinkImages = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const imageMap = {
    'Monster': { image: monsterEnergy, id: '275d426f-dce6-4437-9afc-1051e6653bfe' },
    'Eau Dasani': { image: dasaniWater, id: '34655cf0-0ad1-44f7-8bb2-4c76a3dfc58f' },
    'Coca-Cola': { image: cocaCola, id: 'b209fe65-6e3d-4a76-a79f-50be7b9e7879' },
    'Coca-Cola Zéro': { image: cocaColaZero, id: 'dbabba34-5c84-4459-a3c7-3ca73a24b869' },
    'Sprite': { image: sprite, id: '9158ba23-32ab-4cd5-b2dd-bfb9948a5c46' },
    'Coke': { image: cocaCola, id: 'd8c975bd-fab2-461e-8a4e-b88f9cde14cb' },
    'Coke zéro': { image: cocaColaZero, id: '54f8d608-2b12-4c19-867a-d27886dd71ad' },
    'Gingerale': { image: gingerAle, id: '875e574f-ffeb-4b57-a99c-06e4fe651c8c' },
    'Tonic': { image: tonic, id: '0a51dfbf-b304-4e1f-a8e9-7da9111232f1' },
    'Soda': { image: soda, id: '4cd8bb17-6675-441c-acd1-bdf5b4fc9eff' },
    'Powerade - Bleu': { image: poweradeBlue, id: '0a9c6da3-ddbb-4774-8a98-72ce35ae285b' },
  };

  const uploadImages = async () => {
    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const [name, { image, id }] of Object.entries(imageMap)) {
        try {
          // Fetch the image from the imported path
          const response = await fetch(image);
          const blob = await response.blob();
          
          // Create a filename
          const filename = `${id}.jpg`;
          
          // Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(filename, blob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (uploadError) {
            console.error(`Failed to upload ${name}:`, uploadError);
            errorCount++;
            continue;
          }

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('item-images')
            .getPublicUrl(filename);

          // Update the item in the database
          const { error: updateError } = await supabase
            .from('items')
            .update({ image_url: publicUrl })
            .eq('id', id);

          if (updateError) {
            console.error(`Failed to update ${name}:`, updateError);
            errorCount++;
          } else {
            successCount++;
            console.log(`Successfully updated ${name}`);
          }
        } catch (error) {
          console.error(`Error processing ${name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Images uploaded",
          description: `Successfully uploaded ${successCount} images. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: "No images were uploaded successfully.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Upload Drink Product Images</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click below to upload AI-generated images for all soft drinks and update the database.
      </p>
      <Button 
        onClick={uploadImages} 
        disabled={isUploading}
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? 'Uploading...' : 'Upload All Drink Images'}
      </Button>
    </div>
  );
};

export default UploadDrinkImages;
