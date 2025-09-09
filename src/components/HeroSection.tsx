import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-hero text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in slide-in-from-bottom-4 duration-1000">
            {t('hero.title')}
          </h1>
          
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-1000 delay-200">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom-4 duration-1000 delay-400">
            <Button 
              variant="hero"
              size="lg" 
              className="text-lg px-8 py-6 h-auto"
            >
              {t('hero.cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="racing" 
              size="lg"
              className="text-lg px-8 py-6 h-auto"
            >
              <MapPin className="mr-2 h-5 w-5" />
              Points de collecte
            </Button>
          </div>
        </div>
      </div>

      {/* Racing pattern decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
    </section>
  );
};

export default HeroSection;