import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryItem } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditInventoryItemDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function EditInventoryItemDialog({
  item,
  open,
  onOpenChange,
  onSaved,
}: EditInventoryItemDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [hsn, setHsn] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category ?? '');
      setHsn(item.hsn ?? '');
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    const trimmedName = name.trim();
    const trimmedHsn = hsn.trim();
    if (!trimmedName) {
      toast.error('Item name is required');
      return;
    }
    if (!trimmedHsn) {
      toast.error('HSN code is required');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          name: trimmedName,
          category: category.trim() || null,
          hsn: trimmedHsn,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) {
        toast.error(error.message || 'Failed to update item');
        return;
      }
      toast.success('Item updated');
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit item
          </DialogTitle>
          <DialogDescription>
            Update item name, category, and HSN code.
          </DialogDescription>
        </DialogHeader>
        {item && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Steel Bars (10mm)"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Electronics"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hsn">HSN Code *</Label>
              <Input
                id="edit-hsn"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                placeholder="e.g. 72142000"
                className="font-mono"
                disabled={isLoading}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
