export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  available: boolean;
  image?: string;
}

export const mockProducts: Product[] = [
  // Food
  {
    id: '1',
    name: 'Burger Grand Prix',
    description: 'Burger signature avec fromage québécois et bacon fumé',
    price: 18.99,
    category: 'food',
    stock: 25,
    available: true,
  },
  {
    id: '2',
    name: 'Poutine Racing',
    description: 'Poutine traditionnelle avec sauce à la viande spéciale GP',
    price: 12.99,
    category: 'food',
    stock: 30,
    available: true,
  },
  {
    id: '3',
    name: 'Hot-Dog Formule 1',
    description: 'Hot-dog artisanal avec oignons caramélisés',
    price: 8.99,
    category: 'food',
    stock: 0,
    available: false,
  },

  // Drinks
  {
    id: '4',
    name: 'Énergie Red Racing',
    description: 'Boisson énergisante édition spéciale Grand Prix',
    price: 6.99,
    category: 'drinks',
    stock: 50,
    available: true,
  },
  {
    id: '5',
    name: 'Bière Locale Montréal',
    description: 'Bière craft brassée localement pour l\'événement',
    price: 9.99,
    category: 'drinks',
    stock: 20,
    available: true,
  },
  {
    id: '6',
    name: 'Limonade Championne',
    description: 'Limonade fraîche aux fruits du Québec',
    price: 4.99,
    category: 'drinks',
    stock: 40,
    available: true,
  },

  // Merchandise
  {
    id: '7',
    name: 'Casquette GP Montréal 2024',
    description: 'Casquette officielle rouge et noire édition limitée',
    price: 34.99,
    category: 'merchandise',
    stock: 15,
    available: true,
  },
  {
    id: '8',
    name: 'T-Shirt Racing Team',
    description: 'T-shirt premium 100% coton avec logo brodé',
    price: 29.99,
    category: 'merchandise',
    stock: 8,
    available: true,
  },
  {
    id: '9',
    name: 'Porte-clés Circuit',
    description: 'Porte-clés miniature du circuit Gilles-Villeneuve',
    price: 14.99,
    category: 'merchandise',
    stock: 100,
    available: true,
  },
];

export const categories = ['all', 'food', 'drinks', 'merchandise'];

export const getItemCounts = (products: Product[]) => {
  const counts: Record<string, number> = {};
  
  counts['all'] = products.length;
  
  categories.forEach(category => {
    if (category !== 'all') {
      counts[category] = products.filter(p => p.category === category).length;
    }
  });
  
  return counts;
};