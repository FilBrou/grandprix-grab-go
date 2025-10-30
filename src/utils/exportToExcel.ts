import * as XLSX from 'xlsx';

interface OrderItem {
  quantity: number;
  unit_price: number;
  items: {
    name: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  user_locations: {
    location_name: string;
  } | null;
  order_items: OrderItem[];
}

interface ReturnItem {
  item_id: string;
  declared_quantity: number;
  validated_quantity: number | null;
  unit_price: number;
  items: {
    name: string;
  };
}

interface ProductReturn {
  id: string;
  validation_date: string | null;
  status: string;
  user_locations: {
    location_name: string;
  } | null;
  product_return_items: ReturnItem[];
}

interface UserInfo {
  name: string;
  email: string;
}

export const exportOrderHistoryToExcel = (
  orders: Order[],
  returns: ProductReturn[],
  userInfo: UserInfo,
  totalOrders: number,
  totalReturns: number,
  netBalance: number
) => {
  // Sheet 1: Résumé
  const summaryData = [
    ['Grand Prix de Montréal - Historique des transactions'],
    [''],
    ['Concessionnaire', userInfo.name],
    ['Email', userInfo.email],
    ['Date d\'export', new Date().toLocaleDateString()],
    [''],
    ['Total Commandes', `$${totalOrders.toFixed(2)}`],
    ['Total Retours', `-$${totalReturns.toFixed(2)}`],
    ['Solde Net', `$${netBalance.toFixed(2)}`],
  ];

  // Sheet 2: Commandes détaillées
  const ordersData = [
    ['N° Commande', 'Date', 'Emplacement', 'Nombre d\'items', 'Montant'],
    ...orders.map(order => [
      order.id.slice(-8),
      new Date(order.created_at).toLocaleDateString(),
      order.user_locations?.location_name || 'N/A',
      order.order_items.length,
      order.total_amount
    ])
  ];

  // Sheet 3: Retours détaillés
  const returnsData = [
    ['N° Retour', 'Date validation', 'Statut', 'Emplacement', 'Montant'],
    ...returns.map(ret => {
      const total = ret.product_return_items.reduce((sum, item) => {
        const qty = item.validated_quantity !== null ? item.validated_quantity : item.declared_quantity;
        return sum + (qty * item.unit_price);
      }, 0);

      return [
        ret.id.slice(-8),
        ret.validation_date ? new Date(ret.validation_date).toLocaleDateString() : 'N/A',
        ret.status === 'validated' ? 'Validé' : ret.status === 'pending' ? 'En attente' : 'Rejeté',
        ret.user_locations?.location_name || 'N/A',
        -total
      ];
    })
  ];

  // Sheet 4: Détail items commandes
  const orderItemsData = [
    ['N° Commande', 'Produit', 'Quantité', 'Prix unitaire', 'Sous-total'],
    ...orders.flatMap(order =>
      order.order_items.map(item => [
        order.id.slice(-8),
        item.items.name,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price
      ])
    )
  ];

  // Sheet 5: Détail items retours
  const returnItemsData = [
    ['N° Retour', 'Produit', 'Qté déclarée', 'Qté validée', 'Prix unitaire', 'Sous-total'],
    ...returns.flatMap(ret =>
      ret.product_return_items.map(item => [
        ret.id.slice(-8),
        item.items.name,
        item.declared_quantity,
        item.validated_quantity !== null ? item.validated_quantity : 'N/A',
        item.unit_price,
        (item.validated_quantity || 0) * item.unit_price
      ])
    )
  ];

  // Créer le workbook
  const wb = XLSX.utils.book_new();
  
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  const ws2 = XLSX.utils.aoa_to_sheet(ordersData);
  const ws3 = XLSX.utils.aoa_to_sheet(returnsData);
  const ws4 = XLSX.utils.aoa_to_sheet(orderItemsData);
  const ws5 = XLSX.utils.aoa_to_sheet(returnItemsData);
  
  XLSX.utils.book_append_sheet(wb, ws1, 'Résumé');
  XLSX.utils.book_append_sheet(wb, ws2, 'Commandes');
  XLSX.utils.book_append_sheet(wb, ws3, 'Retours');
  XLSX.utils.book_append_sheet(wb, ws4, 'Détail Commandes');
  XLSX.utils.book_append_sheet(wb, ws5, 'Détail Retours');
  
  // Télécharger
  const fileName = `historique_${userInfo.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
