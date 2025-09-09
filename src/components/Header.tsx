import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationBell from './NotificationBell';
import CartIcon from './CartIcon';
import Cart from './Cart';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, User, Settings, LogOut, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ] as const;

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <Globe className="h-4 w-4 mr-2" />
                <span className="mr-1">{currentLanguage?.flag}</span>
                {currentLanguage?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-background border shadow-md">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-accent"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                  {language === lang.code && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <div>
                <CartIcon onClick={() => setIsCartOpen(true)} />
              </div>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>{t('cart.title')}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <Cart />
              </div>
            </SheetContent>
          </Sheet>
          
          {user ? (
            <div className="flex items-center space-x-3">
              <NotificationBell />
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{profile?.name}</span>
                {isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
              
              <div className="flex space-x-2">
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin')} 
                    className="hover:bg-primary/10"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut} 
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/auth')} 
              className="hover:bg-primary/10"
            >
              <User className="h-4 w-4 mr-2" />
              {t('nav.login')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;