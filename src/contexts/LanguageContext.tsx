import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.catalog': 'Catalogue',
    'nav.cart': 'Panier',
    'nav.orders': 'Commandes',
    'nav.account': 'Compte',
    'nav.login': 'Connexion',
    
    // Hero Section
    'hero.title': 'Commandez pour le Grand Prix',
    'hero.subtitle': 'Découvrez notre sélection d\'items consommables et produits dérivés du Grand Prix de Montréal',
    'hero.cta': 'Explorer le catalogue',
    
    // Categories
    'category.food': 'Nourriture',
    'category.drinks': 'Boissons',
    'category.merchandise': 'Produits dérivés',
    'category.all': 'Tous les produits',
    
    // Common
    'common.price': 'Prix',
    'common.addToCart': 'Ajouter au panier',
    'common.outOfStock': 'Rupture de stock',
    'common.available': 'Disponible',
    'common.loading': 'Chargement...',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.catalog': 'Catalog',
    'nav.cart': 'Cart',
    'nav.orders': 'Orders',
    'nav.account': 'Account',
    'nav.login': 'Login',
    
    // Hero Section
    'hero.title': 'Order for the Grand Prix',
    'hero.subtitle': 'Discover our selection of consumable items and merchandise from the Montreal Grand Prix',
    'hero.cta': 'Explore catalog',
    
    // Categories
    'category.food': 'Food',
    'category.drinks': 'Drinks',
    'category.merchandise': 'Merchandise',
    'category.all': 'All products',
    
    // Common
    'common.price': 'Price',
    'common.addToCart': 'Add to cart',
    'common.outOfStock': 'Out of stock',
    'common.available': 'Available',
    'common.loading': 'Loading...',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['fr']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};