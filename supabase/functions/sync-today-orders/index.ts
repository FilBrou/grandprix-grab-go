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
  profiles: {
    email: string;
    name: string;
  };
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
        ),
        profiles (
          email,
          name
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

    // Monday.com configuration - using hardcoded values for auto-sync
    const boardId = '10084208629'; // TableauCommandes board ID
    let syncedCount = 0;
    let errors: string[] = [];

    for (const order of orders as Order[]) {
      try {
        const orderNumber = `Commande #${order.id.slice(-8)}`;
        const clientInfo = order.profiles?.email || 'Email non disponible';
        
        // Build items list
        const itemsList = order.order_items.map(item => 
          `${item.quantity}x ${item.items.name} (${item.unit_price}€)`
        ).join(', ');

        // Collection point info
        const collectionPointInfo = order.collection_points 
          ? `${order.collection_points.name} - ${order.collection_points.location}`
          : 'Point de collecte non défini';

        // Create Monday.com item
        const mondayItem = await createMondayItem(boardId, orderNumber, {
          text_mkvx37km: clientInfo,
          color_mkvxwgh5: 'En attente',
          numeric_mkvxa8vr: order.total_amount.toString(),
          text_mkvx47hv: collectionPointInfo,
          long_text_mkvxr408: itemsList,
          date_mkvxze2g: new Date(order.created_at).toISOString().split('T')[0],
          email_mkvxnk9v: order.profiles?.email || '',
          text_mkvxqz78: order.id
        });

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