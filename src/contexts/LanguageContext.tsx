import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh' | 'hi' | 'es' | 'fr';

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
    
    // Language names
    'language.en': 'English',
    'language.zh': '中文',
    'language.hi': 'हिन्दी', 
    'language.es': 'Español',
    'language.fr': 'Français',
  },
  zh: {
    // Navigation
    'nav.home': '首页',
    'nav.catalog': '目录',
    'nav.cart': '购物车',
    'nav.orders': '订单',
    'nav.account': '账户',
    'nav.login': '登录',
    
    // Hero Section
    'hero.title': '为大奖赛下单',
    'hero.subtitle': '发现我们精选的蒙特利尔大奖赛消费品和商品',
    'hero.cta': '浏览目录',
    
    // Categories
    'category.food': '食物',
    'category.drinks': '饮料',
    'category.merchandise': '商品',
    'category.all': '所有产品',
    'category.energy_drinks': '能量饮料',
    'category.soft_drinks': '软饮料',
    'category.juices': '果汁和茶',
    'category.sports_drinks': '运动饮料',
    'category.beer': '啤酒',
    'category.wine': '葡萄酒',
    'category.spirits': '烈酒',
    'category.cocktails': '鸡尾酒',
    
    // Common
    'common.price': '价格',
    'common.addToCart': '加入购物车',
    'common.outOfStock': '缺货',
    'common.available': '有库存',
    'common.loading': '加载中...',
    'common.remove': '删除',
    'common.quantity': '数量',
    'common.total': '总计',
    'common.empty': '空',
    
    // Cart
    'cart.title': '购物车',
    'cart.empty': '您的购物车是空的',
    'cart.items': '项',
    'cart.item': '项',
    'cart.subtotal': '小计',
    'cart.clearAll': '清空购物车',
    'cart.checkout': '验证订单',
    'checkout.title': '订单验证',
    'checkout.subtitle': '完成您的蒙特利尔大奖赛订单',
    'checkout.backToCart': '返回购物车',
    
    // Language names
    'language.en': 'English',
    'language.zh': '中文',
    'language.hi': 'हिन्दी', 
    'language.es': 'Español',
    'language.fr': 'Français',
  },
  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.catalog': 'कैटालॉग',
    'nav.cart': 'कार्ट',
    'nav.orders': 'ऑर्डर',
    'nav.account': 'खाता',
    'nav.login': 'लॉगिन',
    
    // Hero Section
    'hero.title': 'ग्रां प्री के लिए ऑर्डर करें',
    'hero.subtitle': 'मॉन्ट्रियल ग्रां प्री से हमारे उपभोग्य वस्तुओं और माल का चयन खोजें',
    'hero.cta': 'कैटालॉग देखें',
    
    // Categories
    'category.food': 'खाना',
    'category.drinks': 'पेय',
    'category.merchandise': 'माल',
    'category.all': 'सभी उत्पाद',
    'category.energy_drinks': 'एनर्जी ड्रिंक',
    'category.soft_drinks': 'सॉफ्ट ड्रिंक',
    'category.juices': 'जूस और चाय',
    'category.sports_drinks': 'स्पोर्ट्स ड्रिंक',
    'category.beer': 'बीयर',
    'category.wine': 'वाइन',
    'category.spirits': 'स्पिरिट्स',
    'category.cocktails': 'कॉकटेल',
    
    // Common
    'common.price': 'मूल्य',
    'common.addToCart': 'कार्ट में जोड़ें',
    'common.outOfStock': 'स्टॉक में नहीं',
    'common.available': 'उपलब्ध',
    'common.loading': 'लोड हो रहा है...',
    'common.remove': 'हटाएं',
    'common.quantity': 'मात्रा',
    'common.total': 'कुल',
    'common.empty': 'खाली',
    
    // Cart
    'cart.title': 'कार्ट',
    'cart.empty': 'आपका कार्ट खाली है',
    'cart.items': 'आइटम',
    'cart.item': 'आइटम',
    'cart.subtotal': 'उप-योग',
    'cart.clearAll': 'कार्ट साफ़ करें',
    'cart.checkout': 'ऑर्डर सत्यापित करें',
    'checkout.title': 'ऑर्डर सत्यापन',
    'checkout.subtitle': 'मॉन्ट्रियल ग्रां प्री के लिए अपना ऑर्डर पूरा करें',
    'checkout.backToCart': 'कार्ट पर वापस जाएं',
    
    // Language names
    'language.en': 'English',
    'language.zh': '中文',
    'language.hi': 'हिन्दी', 
    'language.es': 'Español',
    'language.fr': 'Français',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.catalog': 'Catálogo',
    'nav.cart': 'Carrito',
    'nav.orders': 'Pedidos',
    'nav.account': 'Cuenta',
    'nav.login': 'Iniciar sesión',
    
    // Hero Section
    'hero.title': 'Pide para el Gran Premio',
    'hero.subtitle': 'Descubre nuestra selección de artículos consumibles y mercancía del Gran Premio de Montreal',
    'hero.cta': 'Explorar catálogo',
    
    // Categories
    'category.food': 'Comida',
    'category.drinks': 'Bebidas',
    'category.merchandise': 'Mercancía',
    'category.all': 'Todos los productos',
    'category.energy_drinks': 'Bebidas Energéticas',
    'category.soft_drinks': 'Refrescos',
    'category.juices': 'Jugos y Tés',
    'category.sports_drinks': 'Bebidas Deportivas',
    'category.beer': 'Cerveza',
    'category.wine': 'Vino',
    'category.spirits': 'Licores',
    'category.cocktails': 'Cócteles',
    
    // Common
    'common.price': 'Precio',
    'common.addToCart': 'Añadir al carrito',
    'common.outOfStock': 'Sin stock',
    'common.available': 'Disponible',
    'common.loading': 'Cargando...',
    'common.remove': 'Eliminar',
    'common.quantity': 'Cantidad',
    'common.total': 'Total',
    'common.empty': 'Vacío',
    
    // Cart
    'cart.title': 'Carrito',
    'cart.empty': 'Tu carrito está vacío',
    'cart.items': 'artículos',
    'cart.item': 'artículo',
    'cart.subtotal': 'Subtotal',
    'cart.clearAll': 'Vaciar carrito',
    'cart.checkout': 'Validar pedido',
    'checkout.title': 'Validación de Pedido',
    'checkout.subtitle': 'Finaliza tu pedido para el Gran Premio de Montreal',
    'checkout.backToCart': 'Volver al carrito',
    
    // Language names
    'language.en': 'English',
    'language.zh': '中文',
    'language.hi': 'हिन्दी', 
    'language.es': 'Español',
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
    
    // Language names
    'language.en': 'English',
    'language.zh': '中文',
    'language.hi': 'हिन्दी', 
    'language.es': 'Español',
    'language.fr': 'Français',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  
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