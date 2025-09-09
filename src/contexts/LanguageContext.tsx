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
    'common.remove': 'Supprimer',
    'common.quantity': 'Quantité',
    'common.total': 'Total',
    'common.empty': 'Vide',
    
    // Cart
    'cart.title': 'Panier',
    'cart.empty': 'Votre panier est vide',
    'cart.items': 'articles',
    'cart.item': 'article',
    'cart.subtotal': 'Sous-total',
    'cart.clearAll': 'Vider le panier',
    'cart.checkout': 'Valider la commande',
    'checkout.title': 'Validation de commande',
    'checkout.subtitle': 'Finalisez votre commande pour le Grand Prix de Montréal',
    'checkout.backToCart': 'Retour au panier',
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
    'common.remove': 'Remove',
    'common.quantity': 'Quantity',
    'common.total': 'Total',
    'common.empty': 'Empty',
    
    // Cart
    'cart.title': 'Cart',
    'cart.empty': 'Your cart is empty',
    'cart.items': 'items',
    'cart.item': 'item',
    'cart.subtotal': 'Subtotal',
    'cart.clearAll': 'Clear cart',
    'cart.checkout': 'Validate order',
    'checkout.title': 'Order Validation',
    'checkout.subtitle': 'Finalize your order for the Montreal Grand Prix',
    'checkout.backToCart': 'Back to cart',
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