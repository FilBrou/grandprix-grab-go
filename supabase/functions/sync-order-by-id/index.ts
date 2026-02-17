import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MONDAY_API_TOKEN = Deno.env.get('MONDAY_API_TOKEN');
const MONDAY_API_URL = 'https://api.monday.com/v2';

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  user_location_id: string | null;
  delivery_location: string | null;
  created_at: string;
  order_items: {
    quantity: number;
    unit_price: number;
    items: {
      name: string;
    };
  }[];
}

interface UserLocation {
  id: string;
  location_name: string;
  address: string | null;
}

async function makeMondayRequest(query: string, variables?: any) {
  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MONDAY_API_TOKEN}`,
      'Content-Type': 'application/json',
      'API-Version': '2023-10'
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  console.log('Monday API Response:', JSON.stringify(result, null, 2));

  if (result.errors && result.errors.length > 0) {
    console.error('Monday API errors:', result.errors);
    throw new Error(result.errors[0].message || 'Monday API error');
  }

  return result;
}

async function getBoardColumns(boardId: string) {
  const query = `
    query ($boardId: [ID!]) {
      boards (ids: $boardId) {
        id
        name
        columns {
          id
          title
          type
          settings_str
        }
      }
    }
  `;
  
  return await makeMondayRequest(query, { boardId: [parseInt(boardId)] });
}

async function createMondayItem(boardId: string, orderNumber: string, columnValues: any) {
  const query = `
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON) {
      create_item (
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `;
  
  return await makeMondayRequest(query, {
    boardId: parseInt(boardId),
    itemName: orderNumber,
    columnValues: JSON.stringify(columnValues)
  });
}

async function createSubitem(parentItemId: string, itemName: string, columnValues?: any) {
  const query = `
    mutation ($parentItemId: ID!, $itemName: String!, $columnValues: JSON) {
      create_subitem (
        parent_item_id: $parentItemId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
        name
        board { id }
      }
    }
  `;
  
  return await makeMondayRequest(query, {
    parentItemId: parseInt(parentItemId),
    itemName,
    columnValues: columnValues ? JSON.stringify(columnValues) : undefined
  });
}

async function getSubitemColumns(parentItemId: string) {
  // Create a temporary subitem to discover the sub-board, then get its columns
  const tempResult = await createSubitem(parentItemId, "__temp_column_discovery__");
  const subBoardId = tempResult.data?.create_subitem?.board?.id;
  const tempSubitemId = tempResult.data?.create_subitem?.id;
  
  if (!subBoardId) {
    console.warn('Could not discover sub-board ID');
    return { columns: [], subBoardId: null };
  }

  // Get columns of the sub-board
  const columnsResult = await getBoardColumns(subBoardId);
  const columns = columnsResult.data?.boards?.[0]?.columns || [];

  // Delete the temporary subitem
  if (tempSubitemId) {
    try {
      await makeMondayRequest(`mutation { delete_item (item_id: ${tempSubitemId}) { id } }`);
    } catch (e) {
      console.warn('Could not delete temp subitem:', e);
    }
  }

  return { columns, subBoardId };
}

function mapSubitemColumns(columns: any[]): Map<string, { id: string; type: string }> {
  const columnMap = new Map();
  columns.forEach((col: any) => {
    const title = col.title.toLowerCase();
    if (title.includes('quantit') || title.includes('qty')) columnMap.set('quantity', { id: col.id, type: col.type });
    if (title.includes('prix') || title.includes('price')) columnMap.set('price', { id: col.id, type: col.type });
    if (title.includes('sous-total') || title.includes('subtotal') || title.includes('total')) columnMap.set('subtotal', { id: col.id, type: col.type });
  });
  return columnMap;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, boardId } = await req.json();
    
    if (!orderId || !boardId) {
      throw new Error('orderId and boardId are required');
    }

    if (!MONDAY_API_TOKEN) {
      throw new Error('MONDAY_API_TOKEN is not configured');
    }

    console.log(`Syncing order ${orderId} to Monday board ${boardId}...`);

    // Fetch the specific order from Supabase
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          unit_price,
          items (name)
        )
      `)
      .eq('id', orderId);

    if (orderError) {
      throw new Error(`Error fetching order: ${orderError.message}`);
    }

    if (!orders || orders.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = orders[0] as Order;

    // Fetch user location if available
    let userLocation: UserLocation | null = null;
    if (order.user_location_id) {
      console.log(`Fetching user location ${order.user_location_id}...`);
      const { data: locationData, error: locationError } = await supabase
        .from('user_locations')
        .select('id, location_name, address')
        .eq('id', order.user_location_id)
        .single();
      
      if (!locationError && locationData) {
        userLocation = locationData;
        console.log(`User location found: ${userLocation.location_name}`);
      } else {
        console.warn(`User location not found for ID ${order.user_location_id}:`, locationError);
      }
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('user_id', order.user_id)
      .single();

    // Get board columns to map data properly
    const columnsResult = await getBoardColumns(boardId);
    const columns = columnsResult.data?.boards?.[0]?.columns || [];

    // Create column mapping based on column titles
    const columnMap = new Map();
    columns.forEach((col: any) => {
      const title = col.title.toLowerCase();
      if (title.includes('client') || title.includes('email') || title.includes('nom')) columnMap.set('client', { id: col.id, type: col.type });
      if (title.includes('statut') || title.includes('status')) columnMap.set('status', { id: col.id, type: col.type });
      if (title.includes('montant') || title.includes('total') || title.includes('prix')) columnMap.set('amount', { id: col.id, type: col.type });
      if (title.includes('point') || title.includes('collecte') || title.includes('livraison')) columnMap.set('collection', { id: col.id, type: col.type });
      if (title.includes('article') || title.includes('produit') || title.includes('item')) columnMap.set('items', { id: col.id, type: col.type });
      if (title === 'date' || (title.includes('date') && title.includes('commande'))) columnMap.set('date', { id: col.id, type: col.type });
      if (title.includes('id') && title.includes('commande')) columnMap.set('order_id', { id: col.id, type: col.type });
      if (title.includes('type') && title.includes('site')) columnMap.set('site_type', { id: col.id, type: col.type });
    });

    console.log('Detected columns:', Array.from(columnMap.entries()));

    // Prepare column values
    const columnValues: any = {};
    const clientInfo = profile?.email || 'N/A';
    const statusMapping: Record<string, string> = {
      pending: 'Nouvelle Commande',
      confirmed: 'En cours',
      ready: 'En cours',
      completed: 'Livré',
      cancelled: 'Annulé'
    };

    // Map order data to Monday columns
    if (columnMap.has('client')) {
      const clientCol = columnMap.get('client');
      if (clientCol.type === 'email') {
        columnValues[clientCol.id] = {
          email: profile?.email || '',
          text: profile?.name || clientInfo
        };
      } else if (clientCol.type === 'text') {
        columnValues[clientCol.id] = profile?.name ? `${profile.name} (${profile.email || ''})` : clientInfo;
      } else {
        columnValues[clientCol.id] = `${profile?.name || 'Client'} (${profile?.email || 'N/A'})`;
      }
    }

    if (columnMap.has('status')) {
      const statusCol = columnMap.get('status');
      columnValues[statusCol.id] = statusMapping[order.status] || order.status;
    }

    if (columnMap.has('amount')) {
      const amountCol = columnMap.get('amount');
      columnValues[amountCol.id] = parseFloat(order.total_amount.toString());
    }

    if (columnMap.has('collection')) {
      const collectionCol = columnMap.get('collection');
      const collectionPointText = userLocation
        ? `${userLocation.location_name}${userLocation.address ? ' - ' + userLocation.address : ''}`
        : order.delivery_location || 'Non spécifié';
      columnValues[collectionCol.id] = collectionPointText;
    }

    if (columnMap.has('items')) {
      const itemsCol = columnMap.get('items');
      const itemsText = order.order_items
        .map(item => `${item.quantity}x ${item.items.name} (${item.unit_price}€)`)
        .join(', ');
      columnValues[itemsCol.id] = itemsText;
    }

    if (columnMap.has('date')) {
      const dateCol = columnMap.get('date');
      columnValues[dateCol.id] = order.created_at.split('T')[0];
    }

    if (columnMap.has('order_id')) {
      const orderIdCol = columnMap.get('order_id');
      columnValues[orderIdCol.id] = order.id;
    }

    // Set "Type de site Web" to "Loveable" if column exists
    if (columnMap.has('site_type')) {
      const siteTypeCol = columnMap.get('site_type');
      columnValues[siteTypeCol.id] = 'Loveable';
    }

    console.log(`Column values for order: Commande #${order.id.slice(-8)}`, columnValues);

    // Create item in Monday
    const result = await createMondayItem(boardId, `Commande #${order.id.slice(-8)}`, columnValues);
    const mondayItemId = result.data?.create_item?.id;

    console.log(`Successfully synced order Commande #${order.id.slice(-8)} (Monday ID: ${mondayItemId})`);

    // Create subitems for each order item
    const subitemResults: any[] = [];
    if (mondayItemId && order.order_items.length > 0) {
      try {
        // Discover sub-board columns from the first subitem
        const { columns: subColumns } = await getSubitemColumns(mondayItemId);
        const subColumnMap = mapSubitemColumns(subColumns);
        console.log('Sub-board columns detected:', Array.from(subColumnMap.entries()));

        for (const orderItem of order.order_items) {
          try {
            const subColumnValues: any = {};

            if (subColumnMap.has('quantity')) {
              const qtyCol = subColumnMap.get('quantity')!;
              subColumnValues[qtyCol.id] = orderItem.quantity;
            }
            if (subColumnMap.has('price')) {
              const priceCol = subColumnMap.get('price')!;
              subColumnValues[priceCol.id] = orderItem.unit_price;
            }
            if (subColumnMap.has('subtotal')) {
              const subtotalCol = subColumnMap.get('subtotal')!;
              subColumnValues[subtotalCol.id] = orderItem.quantity * orderItem.unit_price;
            }

            const subResult = await createSubitem(
              mondayItemId,
              orderItem.items.name,
              Object.keys(subColumnValues).length > 0 ? subColumnValues : undefined
            );
            subitemResults.push({ name: orderItem.items.name, id: subResult.data?.create_subitem?.id });
            console.log(`Created subitem for ${orderItem.items.name}`);
          } catch (subError) {
            console.error(`Failed to create subitem for ${orderItem.items.name}:`, subError);
          }
        }
      } catch (subError) {
        console.error('Failed to create subitems (parent item still synced):', subError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Order ${order.id.slice(-8)} synced successfully`,
        mondayItemId,
        subitems: subitemResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in sync-order-by-id function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});