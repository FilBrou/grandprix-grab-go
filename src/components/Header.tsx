import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, User, Settings, LogOut, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const Header = () => {
  const {
    language,
    setLanguage
  } = useLanguage();
  const {
    user,
    profile,
    isAdmin,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const translations = {
    fr: {
      home: 'Accueil',
      catalog: 'Catalogue',
      orders: 'Commandes',
      login: 'Connexion',
      admin: 'Admin'
    },
    en: {
      home: 'Home',
      catalog: 'Catalog',
      orders: 'Orders',
      login: 'Sign In',
      admin: 'Admin'
    }
  };
  const t = translations[language];
  return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        

        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" className="text-sm font-medium">
            {t.home}
          </Button>
          <Button variant="ghost" className="text-sm font-medium">
            {t.catalog}
          </Button>
          <Button variant="ghost" className="text-sm font-medium">
            {t.orders}
          </Button>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} className="hover:bg-primary/10">
            <Globe className="h-4 w-4 mr-2" />
            {language.toUpperCase()}
          </Button>

          <Button variant="ghost" size="sm" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-primary text-primary-foreground">
              0
            </Badge>
          </Button>
          
          {user ? <div className="flex items-center space-x-3">
              <NotificationBell />
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{profile?.name}</span>
                {isAdmin && <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>}
              </div>
              
              <div className="flex space-x-2">
                {isAdmin && <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="hover:bg-primary/10">
                    <Settings className="h-4 w-4 mr-2" />
                    {t.admin}
                  </Button>}
                <Button variant="ghost" size="sm" onClick={signOut} className="hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div> : <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="hover:bg-primary/10">
              <User className="h-4 w-4 mr-2" />
              {t.login}
            </Button>}
        </div>
      </div>
    </header>;
};
export default Header;