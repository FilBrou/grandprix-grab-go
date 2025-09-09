import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImageUrl, 
  onImageUpload, 
  onImageRemove 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  const translations = {
    fr: {
      uploadImage: 'Télécharger une image',
      orEnterUrl: 'Ou entrer une URL',
      enterImageUrl: 'URL de l\'image',
      useUrl: 'Utiliser l\'URL',
      remove: 'Supprimer',
      uploading: 'Téléchargement...',
      uploadError: 'Erreur lors du téléchargement',
      invalidFile: 'Fichier invalide. Utilisez JPG, PNG ou WebP.',
      fileTooLarge: 'Fichier trop volumineux. Maximum 10MB.',
      currentImage: 'Image actuelle'
    },
    en: {
      uploadImage: 'Upload Image',
      orEnterUrl: 'Or enter URL',
      enterImageUrl: 'Image URL',
      useUrl: 'Use URL',
      remove: 'Remove',
      uploading: 'Uploading...',
      uploadError: 'Upload error',
      invalidFile: 'Invalid file. Use JPG, PNG or WebP.',
      fileTooLarge: 'File too large. Maximum 10MB.',
      currentImage: 'Current image'
    }
  };

  const t = translations[language];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: t.invalidFile,
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t.fileTooLarge,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      onImageUpload(publicUrl);
      
      toast({
        title: 'Image téléchargée avec succès',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t.uploadError,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImageUpload(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-4">
      {currentImageUrl && (
        <div className="relative">
          <Label className="text-sm font-medium">{t.currentImage}</Label>
          <div className="mt-2 relative inline-block">
            <img 
              src={currentImageUrl} 
              alt="Current item" 
              className="w-32 h-32 object-cover rounded-lg border border-border"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={onImageRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t.uploadImage}</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  {t.uploading}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t.uploadImage}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t.orEnterUrl}</Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder={t.enterImageUrl}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;