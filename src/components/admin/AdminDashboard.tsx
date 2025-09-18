import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Home,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ItemsManager from './ItemsManager';
import OrdersManager from './OrdersManager';
import ReportsManager from './ReportsManager';
import MondayIntegration from '../MondayIntegration';
import MondayOrdersConfig from './MondayOrdersConfig';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('items');
  const { language } = useLanguage();
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const translations = {
    fr: {
      title: 'Tableau de Bord Administrateur',
      subtitle: 'Gérez votre plateforme de commande Grand Prix Montréal',
      items: 'Articles',
      orders: 'Commandes',
      reports: 'Rapports',
      settings: 'Paramètres',
      integrations: 'Intégrations',
      mondayIntegration: 'Monday.com',
      welcome: 'Bienvenue',
      role: 'Rôle',
      admin: 'Administrateur',
      backToSite: 'Retour au site',
      signOut: 'Déconnexion'
    },
    en: {
      title: 'Admin Dashboard',
      subtitle: 'Manage your Montreal Grand Prix ordering platform',
      items: 'Items',
      orders: 'Orders',
      reports: 'Reports',
      settings: 'Settings',
      integrations: 'Integrations',
      mondayIntegration: 'Monday.com',
      welcome: 'Welcome',
      role: 'Role',
      admin: 'Administrator',
      backToSite: 'Back to Site',
      signOut: 'Sign Out'
    }
  };

  const t = translations[language];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">GP</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{t.title}</h1>
                <p className="text-sm text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {t.welcome}, {profile?.name}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {t.admin}
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="hover:bg-primary/10"
                >
                  <Home className="h-4 w-4 mr-2" />
                  {t.backToSite}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.signOut}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">{t.items}</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{t.orders}</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t.reports}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t.settings}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="items" className="space-y-6">
              <ItemsManager />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <OrdersManager />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <ReportsManager />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.settings}</CardTitle>
                  <CardDescription>
                    {language === 'fr' 
                      ? 'Configuration de la plateforme et intégrations' 
                      : 'Platform configuration and integrations'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <MondayOrdersConfig />
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t.integrations}</h3>
                      <MondayIntegration />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;