import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, User, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/icon-192.png" alt="GP Montreal" className="h-10 w-10" />
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            GP Montréal
          </h1>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" className="text-sm font-medium">
            {t('nav.home')}
          </Button>
          <Button variant="ghost" className="text-sm font-medium">
            {t('nav.catalog')}
          </Button>
          <Button variant="ghost" className="text-sm font-medium">
            {t('nav.orders')}
          </Button>
        </nav>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="flex items-center space-x-1"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium">{language.toUpperCase()}</span>
          </Button>

          <Button variant="ghost" size="sm" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-primary text-primary-foreground">
              0
            </Badge>
          </Button>

          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t('nav.login')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;