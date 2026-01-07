import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
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
    'category.energy_drinks': 'Energy Drinks',
    'category.soft_drinks': 'Soft Drinks',
    'category.juices': 'Juices & Teas',
    'category.sports_drinks': 'Sports Drinks',
    'category.beer': 'Beer',
    'category.wine': 'Wine',
    'category.spirits': 'Spirits',
    'category.cocktails': 'Cocktails',
    
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
    
    // Orders
    'orders.history': 'My Orders',
    'orders.noOrders': 'No orders yet',
    'orders.id': 'ID',
    'orders.products': 'Products',
    'orders.quantity': 'Quantity',
    'orders.date': 'Date',
    'orders.status': 'Status',
    'orders.total': 'Total',
    'orders.filterByStatus': 'Filter by status',
    'orders.allStatuses': 'All',
    'orders.pending': 'Pending',
    'orders.confirmed': 'Confirmed',
    'orders.ready': 'Ready',
    'orders.completed': 'Completed',
    'orders.cancelled': 'Cancelled',
    'orders.sortByDate': 'Sort by date',
    'orders.noMatchingOrders': 'No orders match.',
    'orders.totalItems': 'Items',
    'orders.items': 'items',
    'orders.orderDetails': 'Order Summary',
    'orders.orderItems': 'Your Items',
    'orders.product': 'Product',
    'orders.unitPrice': 'Price',
    'orders.subtotal': 'Subtotal',
    'orders.collectionPoint': 'Pickup Location',
    
    // Quick Order
    'quickOrder.button': 'Quick Order',
    'quickOrder.frequentItems': 'Frequent Items',
    'quickOrder.orderAgain': 'Order Again',
    
    // Express Checkout
    'express.title': 'Express Checkout',
    'express.standard': 'Standard Checkout',
    
    // Language names
    'language.en': 'English',
    'language.fr': 'Français',
  },
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
    'category.energy_drinks': 'Boissons énergisantes',
    'category.soft_drinks': 'Boissons gazeuses',
    'category.juices': 'Jus et thés',
    'category.sports_drinks': 'Boissons sportives',
    'category.beer': 'Bières',
    'category.wine': 'Vins',
    'category.spirits': 'Spiritueux',
    'category.cocktails': 'Cocktails',
    
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
    
    // Orders
    'orders.history': 'Mes Commandes',
    'orders.noOrders': 'Aucune commande pour le moment',
    'orders.id': 'ID',
    'orders.products': 'Produits',
    'orders.quantity': 'Quantité',
    'orders.date': 'Date',
    'orders.status': 'Statut',
    'orders.total': 'Total',
    'orders.filterByStatus': 'Filtrer par statut',
    'orders.allStatuses': 'Tous',
    'orders.pending': 'En attente',
    'orders.confirmed': 'Confirmée',
    'orders.ready': 'Prête',
    'orders.completed': 'Terminée',
    'orders.cancelled': 'Annulée',
    'orders.sortByDate': 'Trier par date',
    'orders.noMatchingOrders': 'Aucune commande ne correspond.',
    'orders.totalItems': 'Articles',
    'orders.items': 'articles',
    'orders.orderDetails': 'Résumé de la Commande',
    'orders.orderItems': 'Vos Articles',
    'orders.product': 'Produit',
    'orders.unitPrice': 'Prix',
    'orders.subtotal': 'Sous-total',
    'orders.collectionPoint': 'Lieu de Retrait',
    
    // Quick Order
    'quickOrder.button': 'Commande rapide',
    'quickOrder.frequentItems': 'Articles fréquents',
    'quickOrder.orderAgain': 'Commander à nouveau',
    
    // Express Checkout
    'express.title': 'Paiement Express',
    'express.standard': 'Paiement Standard',
    
    // Language names
    'language.en': 'English',
    'language.fr': 'Français',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
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