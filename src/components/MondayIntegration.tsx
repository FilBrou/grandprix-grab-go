import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMondayIntegration, MondayBoard, MondayItem, MondayColumn } from '@/hooks/useMondayIntegration';
import { Calendar, Clock, Plus, RefreshCw, Settings } from 'lucide-react';
import { format } from 'date-fns';

const MondayIntegration = () => {
  const { toast } = useToast();
  const { 
    loading, 
    error, 
    getBoards, 
    getBoardItems, 
    getBoardColumns, 
    createItem, 
    updateItem 
  } = useMondayIntegration();

  const [boards, setBoards] = useState<MondayBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [items, setItems] = useState<MondayItem[]>([]);
  const [columns, setColumns] = useState<MondayColumn[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadBoards = async () => {
    try {
      const boardsData = await getBoards();
      setBoards(boardsData);
      toast({
        title: "Boards loaded",
        description: `Found ${boardsData.length} boards`
      });
    } catch (err: any) {
      toast({
        title: "Error loading boards",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const loadBoardData = async (boardId: string) => {
    if (!boardId) return;
    
    try {
      const [itemsData, columnsData] = await Promise.all([
        getBoardItems(boardId),
        getBoardColumns(boardId)
      ]);
      
      setItems(itemsData);
      setColumns(columnsData);
      
      toast({
        title: "Board data loaded",
        description: `Found ${itemsData.length} items and ${columnsData.length} columns`
      });
    } catch (err: any) {
      toast({
        title: "Error loading board data",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleCreateItem = async () => {
    if (!selectedBoard || !newItemName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a board and enter an item name",
        variant: "destructive"
      });
      return;
    }

    try {
      await createItem(selectedBoard, newItemName.trim());
      setNewItemName('');
      setShowCreateForm(false);
      
      // Reload items
      await loadBoardData(selectedBoard);
      
      toast({
        title: "Item created",
        description: `Successfully created "${newItemName}"`
      });
    } catch (err: any) {
      toast({
        title: "Error creating item",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoard(boardId);
    setItems([]);
    setColumns([]);
    if (boardId) {
      loadBoardData(boardId);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const selectedBoardInfo = boards.find(board => board.id === selectedBoard);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Monday.com Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={loadBoards} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Boards
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="board-select">Select Board</Label>
            <Select value={selectedBoard} onValueChange={handleBoardChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a Monday.com board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    <div className="flex items-center gap-2">
                      <span>{board.name}</span>
                      <Badge variant="outline">{board.state}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBoardInfo && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{selectedBoardInfo.name}</h4>
                  {selectedBoardInfo.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedBoardInfo.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Badge>{selectedBoardInfo.state}</Badge>
                    {selectedBoardInfo.workspace_id && (
                      <Badge variant="outline">
                        Workspace: {selectedBoardInfo.workspace_id}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {selectedBoard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Board Items ({items.length})
              </CardTitle>
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showCreateForm && (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateItem} 
                      disabled={loading || !newItemName.trim()}
                    >
                      Create Item
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setNewItemName('');
                        setShowCreateForm(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && !items.length ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items found in this board
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Created: {format(new Date(item.created_at), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Updated: {format(new Date(item.updated_at), 'MMM dd, yyyy')}
                            </div>
                          </div>
                          {item.column_values.filter(cv => cv.text).length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.column_values
                                .filter(cv => cv.text)
                                .map((columnValue) => {
                                  const column = columns.find(c => c.id === columnValue.id);
                                  return (
                                    <div key={columnValue.id} className="text-xs">
                                      <span className="font-medium">
                                        {column?.title || columnValue.id}:
                                      </span>{' '}
                                      <span className="text-muted-foreground">
                                        {columnValue.text}
                                      </span>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">{item.state}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedBoard && columns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Board Columns ({columns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{column.title}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({column.type})
                    </span>
                  </div>
                  <Badge variant="outline">{column.id}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MondayIntegration;