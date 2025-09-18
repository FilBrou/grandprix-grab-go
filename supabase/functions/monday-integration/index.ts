import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MONDAY_API_TOKEN = Deno.env.get('MONDAY_API_TOKEN');
const MONDAY_API_URL = 'https://api.monday.com/v2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MondayResponse {
  data?: any;
  errors?: any[];
  error_message?: string;
}

async function makeMondayRequest(query: string, variables?: any): Promise<MondayResponse> {
  try {
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
    
    return result;
  } catch (error) {
    console.error('Error making Monday API request:', error);
    throw error;
  }
}

// Get all boards
async function getBoards() {
  const query = `
    query {
      boards (limit: 50) {
        id
        name
        description
        state
        board_folder_id
        workspace_id
      }
    }
  `;
  
  return await makeMondayRequest(query);
}

// Get items from a board
async function getBoardItems(boardId: string) {
  const query = `
    query ($boardId: [ID!]) {
      boards (ids: $boardId) {
        id
        name
        items {
          id
          name
          state
          created_at
          updated_at
          column_values {
            id
            text
            value
            type
          }
        }
      }
    }
  `;
  
  return await makeMondayRequest(query, { boardId: [parseInt(boardId)] });
}

// Normalize column values based on column type
function normalizeColumnValues(columnValues: any, columns: any[]): any {
  if (!columnValues || !columns) return columnValues;

  const normalized: any = {};
  
  for (const [key, value] of Object.entries(columnValues)) {
    const column = columns.find(col => col.id === key);
    if (!column) {
      normalized[key] = value;
      continue;
    }

    switch (column.type) {
      case 'email':
        // Email columns need {email: "...", text: "..."}
        if (typeof value === 'string') {
          // If it's a plain string, treat it as email
          normalized[key] = {
            email: value,
            text: value.split('@')[0] // Use part before @ as display text
          };
        } else if (typeof value === 'object' && value !== null) {
          // If it's already an object, keep it
          normalized[key] = value;
        } else {
          normalized[key] = value;
        }
        break;
      
      case 'text':
      case 'long_text':
        // Text columns need plain strings
        if (typeof value === 'object' && value !== null) {
          normalized[key] = JSON.stringify(value);
        } else {
          normalized[key] = String(value || '');
        }
        break;
      
      case 'numbers':
        // Number columns need numeric values
        normalized[key] = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        break;
      
      case 'status':
        // Status columns need plain strings
        normalized[key] = String(value || '');
        break;
      
      case 'date':
        // Date columns need date strings in YYYY-MM-DD format
        if (value instanceof Date) {
          normalized[key] = value.toISOString().split('T')[0];
        } else if (typeof value === 'string') {
          normalized[key] = value.split('T')[0]; // Remove time part if present
        } else {
          normalized[key] = value;
        }
        break;
      
      default:
        normalized[key] = value;
    }
  }
  
  return normalized;
}

// Create a new item
async function createItem(boardId: string, itemName: string, columnValues?: any) {
  // Get board columns to normalize values
  let normalizedColumnValues = columnValues;
  if (columnValues) {
    try {
      const columnsResult = await getBoardColumns(boardId);
      if (columnsResult.data?.boards?.[0]?.columns) {
        normalizedColumnValues = normalizeColumnValues(columnValues, columnsResult.data.boards[0].columns);
      }
    } catch (error) {
      console.warn('Could not fetch columns for normalization:', error);
    }
  }

  const query = `
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON) {
      create_item (
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
        name
        created_at
        column_values {
          id
          text
          value
          type
        }
      }
    }
  `;
  
  return await makeMondayRequest(query, {
    boardId: parseInt(boardId),
    itemName,
    columnValues: normalizedColumnValues ? JSON.stringify(normalizedColumnValues) : undefined
  });
}

// Update an item
async function updateItem(itemId: string, columnValues: any) {
  const query = `
    mutation ($itemId: ID!, $columnValues: JSON) {
      change_multiple_column_values (
        item_id: $itemId,
        board_id: null,
        column_values: $columnValues
      ) {
        id
        name
        column_values {
          id
          text
          value
          type
        }
      }
    }
  `;
  
  return await makeMondayRequest(query, {
    itemId: parseInt(itemId),
    columnValues: JSON.stringify(columnValues)
  });
}

// Get board columns information
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MONDAY_API_TOKEN) {
      throw new Error('MONDAY_API_TOKEN is not configured');
    }

    const { action, ...params } = await req.json();
    console.log('Monday integration request:', { action, params });

    let result;

    switch (action) {
      case 'getBoards':
        result = await getBoards();
        break;

      case 'getBoardItems':
        if (!params.boardId) {
          throw new Error('boardId is required for getBoardItems');
        }
        result = await getBoardItems(params.boardId);
        break;

      case 'getBoardColumns':
        if (!params.boardId) {
          throw new Error('boardId is required for getBoardColumns');
        }
        result = await getBoardColumns(params.boardId);
        break;

      case 'createItem':
        if (!params.boardId || !params.itemName) {
          throw new Error('boardId and itemName are required for createItem');
        }
        result = await createItem(params.boardId, params.itemName, params.columnValues);
        break;

      case 'updateItem':
        if (!params.itemId || !params.columnValues) {
          throw new Error('itemId and columnValues are required for updateItem');
        }
        result = await updateItem(params.itemId, params.columnValues);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (result.errors && result.errors.length > 0) {
      console.error('Monday API errors:', result.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.errors[0].message || 'Monday API error',
          errors: result.errors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in monday-integration function:', error);
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