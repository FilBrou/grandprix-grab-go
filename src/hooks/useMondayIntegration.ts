import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MondayBoard {
  id: string;
  name: string;
  description?: string;
  state: string;
  board_folder_id?: string;
  workspace_id?: string;
}

export interface MondayItem {
  id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
  column_values: MondayColumnValue[];
}

export interface MondayColumnValue {
  id: string;
  text: string;
  value: string;
  type: string;
}

export interface MondayColumn {
  id: string;
  title: string;
  type: string;
  settings_str: string;
}

export const useMondayIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callMondayFunction = async (action: string, params: any = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('monday-integration', {
        body: { action, ...params }
      });

      if (error) {
        throw new Error(error.message || 'Error calling Monday integration');
      }

      if (!data.success) {
        throw new Error(data.error || 'Monday API returned an error');
      }

      return data.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getBoards = async (): Promise<MondayBoard[]> => {
    const result = await callMondayFunction('getBoards');
    return result.boards || [];
  };

  const getBoardItems = async (boardId: string): Promise<MondayItem[]> => {
    const result = await callMondayFunction('getBoardItems', { boardId });
    return result.boards?.[0]?.items || [];
  };

  const getBoardColumns = async (boardId: string): Promise<MondayColumn[]> => {
    const result = await callMondayFunction('getBoardColumns', { boardId });
    return result.boards?.[0]?.columns || [];
  };

  const createItem = async (
    boardId: string, 
    itemName: string, 
    columnValues?: Record<string, any>
  ): Promise<MondayItem> => {
    const result = await callMondayFunction('createItem', {
      boardId,
      itemName,
      columnValues
    });
    return result.create_item;
  };

  const updateItem = async (
    itemId: string, 
    columnValues: Record<string, any>
  ): Promise<MondayItem> => {
    const result = await callMondayFunction('updateItem', {
      itemId,
      columnValues
    });
    return result.change_multiple_column_values;
  };

  return {
    loading,
    error,
    getBoards,
    getBoardItems,
    getBoardColumns,
    createItem,
    updateItem
  };
};