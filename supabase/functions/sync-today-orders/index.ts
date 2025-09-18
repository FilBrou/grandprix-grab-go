import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  collection_points: {
    name: string;
    location: string;
  };
  order_items: Array<{
    quantity: number;
    unit_price: number;
    items: {
      name: string;
    };
  }>;
}

async function getBoardColumns(boardId: string) {
  const query = `
    query($boardId: ID!) {
      boards(ids: [$boardId]) {
        columns {
          id
          title
          type
        }
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mondayApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { boardId }
    })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('Monday API Error:', result.errors);
    throw new Error(`Monday API Error: ${result.errors[0]?.message}`);
  }

  return result.data.boards[0]?.columns || [];
}

async function createMondayItem(boardId: string, orderNumber: string, columnValues: any) {
  const query = `
    mutation($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
        name
        created_at
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mondayApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        boardId,
        itemName: orderNumber,
        columnValues: JSON.stringify(columnValues)
      }
    })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('Monday API Error:', result.errors);
    throw new Error(`Monday API Error: ${result.errors[0]?.message}`);
  }

  return result.data.create_item;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting sync of today\'s orders...');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch all orders from today with related data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_amount,
        status,
        created_at,
        collection_points (
          name,
          location
        ),
        order_items (
          quantity,
          unit_price,
          items (
            name
          )
        )
      `)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw new Error(`Error fetching orders: ${ordersError.message}`);
    }

    console.log(`Found ${orders?.length || 0} orders for today (${today})`);

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No orders found for today',
        synced: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Monday.com configuration
    const boardId = '10084208629'; // TableauCommandes board ID
    
    // Get board columns to map correctly
    const columns = await getBoardColumns(boardId);
    const columnMap = new Map();
    
    // Create a mapping of column titles to IDs
    columns.forEach(col => {
      const title = col.title.toLowerCase();
      if (title.includes('client') || title.includes('email')) columnMap.set('client', { id: col.id, type: col.type });
      if (title.includes('statut') || title.includes('status')) columnMap.set('status', { id: col.id, type: col.type });
      if (title.includes('montant') || title.includes('total')) columnMap.set('amount', { id: col.id, type: col.type });
      if (title.includes('point') || title.includes('collecte')) columnMap.set('collection', { id: col.id, type: col.type });
      if (title.includes('article') || title.includes('produit')) columnMap.set('items', { id: col.id, type: col.type });
      if (title.includes('date') && title.includes('commande')) columnMap.set('date', { id: col.id, type: col.type });
      if (title.includes('id') && title.includes('commande')) columnMap.set('order_id', { id: col.id, type: col.type });
    });

    console.log('Detected columns:', Array.from(columnMap.entries()));
    
    // Fetch user profiles separately for better performance
    const userIds = [...new Set(orders.map(order => order.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, name')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    let syncedCount = 0;
    let errors: string[] = [];

    for (const order of orders as Order[]) {
      try {
        const orderNumber = `Commande #${order.id.slice(-8)}`;
        const profile = profileMap.get(order.user_id);
        const clientInfo = profile?.email || 'Email non disponible';
        
        // Build items list
        const itemsList = order.order_items.map(item => 
          `${item.quantity}x ${item.items.name} (${item.unit_price}€)`
        ).join(', ');

        // Collection point info
        const collectionPointInfo = order.collection_points 
          ? `${order.collection_points.name} - ${order.collection_points.location}`
          : 'Point de collecte non défini';

        // Build column values with proper formatting
        const columnValues: any = {};
        
        // Client info (email column)
        if (columnMap.has('client')) {
          const clientCol = columnMap.get('client');
          if (clientCol.type === 'email') {
            columnValues[clientCol.id] = {
              email: profile?.email || '',
              text: profile?.name || 'Client'
            };
          } else {
            columnValues[clientCol.id] = clientInfo;
          }
        }
        
        // Status
        if (columnMap.has('status')) {
          const statusCol = columnMap.get('status');
          if (statusCol.type === 'color') {
            columnValues[statusCol.id] = { label: 'En attente' };
          } else {
            columnValues[statusCol.id] = 'En attente';
          }
        }
        
        // Amount (numeric)
        if (columnMap.has('amount')) {
          const amountCol = columnMap.get('amount');
          columnValues[amountCol.id] = parseFloat(order.total_amount.toString());
        }
        
        // Collection point
        if (columnMap.has('collection')) {
          const collectionCol = columnMap.get('collection');
          columnValues[collectionCol.id] = collectionPointInfo;
        }
        
        // Items list
        if (columnMap.has('items')) {
          const itemsCol = columnMap.get('items');
          columnValues[itemsCol.id] = itemsList;
        }
        
        // Date
        if (columnMap.has('date')) {
          const dateCol = columnMap.get('date');
          columnValues[dateCol.id] = new Date(order.created_at).toISOString().split('T')[0];
        }
        
        // Order ID
        if (columnMap.has('order_id')) {
          const orderIdCol = columnMap.get('order_id');
          columnValues[orderIdCol.id] = order.id;
        }

        console.log('Column values for order:', orderNumber, columnValues);

        // Create Monday.com item
        const mondayItem = await createMondayItem(boardId, orderNumber, columnValues);

        console.log(`Successfully synced order ${orderNumber} (Monday ID: ${mondayItem.id})`);
        syncedCount++;

      } catch (error) {
        const errorMsg = `Failed to sync order #${order.id.slice(-8)}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    const result = {
      success: true,
      message: `Sync completed for ${today}`,
      totalOrders: orders.length,
      synced: syncedCount,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Sync results:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-today-orders function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});