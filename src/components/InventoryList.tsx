import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/data/mockData';
import { Package, Search, Plus, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import AddInventoryItemDialog from '@/components/AddInventoryItemDialog';

interface InventoryListProps {
  items: InventoryItem[];
  onAddItem: (item: InventoryItem) => void;
  onCreateInventoryItem?: (item: Omit<InventoryItem, 'id'>) => void;
  onRemoveInventoryItem?: (id: string) => void;
}

const InventoryList = ({ items, onAddItem, onCreateInventoryItem, onRemoveInventoryItem }: InventoryListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.hsn.includes(searchTerm)
  );

  useEffect(() => {
    setHighlightedIndex((prev) =>
      filteredItems.length ? Math.min(prev, filteredItems.length - 1) : 0
    );
  }, [filteredItems.length]);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const, icon: AlertTriangle };
    if (stock < 50) return { label: 'Low Stock', variant: 'warning' as const, icon: AlertTriangle };
    return { label: 'In Stock', variant: 'success' as const, icon: CheckCircle };
  };

  return (
    <Card className="h-full shadow-card animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5 text-primary" />
            Inventory Items
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {filteredItems.length} items
            </Badge>
            {onCreateInventoryItem && (
              <AddInventoryItemDialog onAddItem={onCreateInventoryItem} />
            )}
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="inventory-search"
            placeholder="Search by name or HSN, use ↓ / ↑ and Enter to add"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex((prev) =>
                  filteredItems.length ? Math.min(prev + 1, filteredItems.length - 1) : 0
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex((prev) => Math.max(0, prev - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const target = filteredItems[highlightedIndex] ?? filteredItems[0];
                if (target) onAddItem(target);
              }
            }}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredItems.map((item, index) => {
          const status = getStockStatus(item.stock);
          const StatusIcon = status.icon;
          
          return (
            <div
              key={item.id}
              className={`group flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:shadow-card-hover hover:border-primary/20 ${index === highlightedIndex ? 'ring-2 ring-primary/50' : ''}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddItem(item);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedIndex((prev) => Math.max(0, prev - 1));
                }
              }}
              onClick={() => setHighlightedIndex(index)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <Badge variant="outline" className="font-mono text-xs">
                    HSN: {item.hsn}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="font-mono">₹{item.rate.toLocaleString()}/{item.unit}</span>
                  <span className="flex items-center gap-1">
                    <StatusIcon className={`h-3 w-3 ${status.variant === 'success' ? 'text-success' : status.variant === 'warning' ? 'text-warning' : 'text-destructive'}`} />
                    {item.stock} {item.unit}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    GST: {item.gstRate}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onAddItem(item)}
                  disabled={item.stock === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                {onRemoveInventoryItem && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                    onClick={() => {
                      const confirmed = window.confirm(
                        'Are you sure you want to delete this item from your inventory?',
                      );
                      if (!confirmed) return;
                      onRemoveInventoryItem(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default InventoryList;
