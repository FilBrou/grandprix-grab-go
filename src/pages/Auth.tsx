import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { signIn, signUp } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Détecter si on vient de la route admin
  const isAdminMode = location.state?.from === '/admin' || location.pathname === '/auth/admin';
  
  useEffect(() => {
    // Si on vient de /admin, on met à jour l'URL pour l'indiquer
    if (location.state?.from === '/admin' && location.pathname === '/auth') {
      navigate('/auth/admin', { replace: true, state: location.state });
    }
  }, [location, navigate]);

  const translations = {
    fr: {
      signIn: 'Connexion',
      signUp: 'Inscription',
      email: 'Email',
      password: 'Mot de passe',
      name: 'Nom',
      signInButton: 'Se connecter',
      signUpButton: 'S\'inscrire',
      signInDescription: 'Connectez-vous à votre compte',
      signUpDescription: 'Créez un nouveau compte',
      backToHome: 'Retour à l\'accueil',
      signInSuccess: 'Connexion réussie!',
      signUpSuccess: 'Inscription réussie! Vérifiez votre email.',
      error: 'Erreur',
      adminLogin: 'Connexion Admin',
      adminMode: 'Mode Administrateur',
      adminSignInDescription: 'Connectez-vous avec vos identifiants administrateur',
      adminAccess: 'Accès Admin',
      regularLogin: 'Connexion Standard'
    },
    en: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      signInButton: 'Sign In',
      signUpButton: 'Sign Up',
      signInDescription: 'Sign in to your account',
      signUpDescription: 'Create a new account',
      backToHome: 'Back to Home',
      signInSuccess: 'Successfully signed in!',
      signUpSuccess: 'Successfully signed up! Check your email.',
      error: 'Error',
      adminLogin: 'Admin Login',
      adminMode: 'Administrator Mode',
      adminSignInDescription: 'Sign in with your administrator credentials',
      adminAccess: 'Admin Access',
      regularLogin: 'Standard Login'
    }
  };

  const t = translations[language];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: t.error,
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t.signInSuccess,
        });
        // Rediriger vers admin si on est en mode admin, sinon vers home
        navigate(isAdminMode ? '/admin' : '/');
      }
    } catch (error) {
      toast({
        title: t.error,
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, name);
      
      if (error) {
        toast({
          title: t.error,
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t.signUpSuccess,
        });
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (error) {
      toast({
        title: t.error,
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.backToHome}
        </Button>

        <Card className={`border-primary/20 shadow-xl ${isAdminMode ? 'border-orange-500/30 bg-gradient-to-br from-background to-orange-50/20' : ''}`}>
          <CardHeader className="text-center">
            {isAdminMode && (
              <div className="mb-4">
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-4 py-2">
                  <Shield className="w-4 h-4 mr-2" />
                  {t.adminMode}
                </Badge>
              </div>
            )}
            <div className={`w-16 h-16 mx-auto mb-4 ${isAdminMode ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-primary to-accent'} rounded-full flex items-center justify-center`}>
              {isAdminMode ? (
                <Shield className="text-2xl text-white w-8 h-8" />
              ) : (
                <span className="text-2xl font-bold text-primary-foreground">GP</span>
              )}
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Grand Prix Montréal
            </CardTitle>
            {isAdminMode && (
              <p className="text-sm text-orange-600 font-medium mt-2">
                {t.adminAccess}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t.signIn}</TabsTrigger>
                <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <Card>
                  <CardHeader>
                    <CardDescription>
                      {isAdminMode ? t.adminSignInDescription : t.signInDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">{t.email}</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">{t.password}</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.signInButton}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardDescription>{t.signUpDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">{t.name}</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{t.email}</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{t.password}</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          minLength={6}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.signUpButton}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-6 border-t border-border">
              {!isAdminMode ? (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth/admin')}
                  className="w-full text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t.adminLogin}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  {t.regularLogin}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;