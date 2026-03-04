import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryItem } from '@/data/mockData';
import { Plus, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AddInventoryItemDialogProps {
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
}

const AddInventoryItemDialog = ({ onAddItem }: AddInventoryItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hsn: '',
    rate: '',
    stock: '20',
    unit: '',
    gstRate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (!formData.hsn.trim()) newErrors.hsn = 'HSN code is required';

    const rate = Number(formData.rate);
    if (!formData.rate.trim() || Number.isNaN(rate) || rate <= 0) {
      newErrors.rate = 'Enter a valid rate greater than 0';
    }

    const stock = Number(formData.stock);
    if (formData.stock.trim() === '' || Number.isNaN(stock) || stock < 0) {
      newErrors.stock = 'Enter a valid stock (0 or more)';
    }

    if (!formData.unit.trim()) newErrors.unit = 'Unit is required';

    const gstRate = Number(formData.gstRate);
    if (
      formData.gstRate.trim() === '' ||
      Number.isNaN(gstRate) ||
      gstRate < 0 ||
      gstRate > 100
    ) {
      newErrors.gstRate = 'GST rate must be between 0 and 100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newItem: Omit<InventoryItem, 'id'> = {
      name: formData.name.trim(),
      hsn: formData.hsn.trim(),
      rate,
      stock,
      unit: formData.unit.trim(),
      gstRate,
    };

    onAddItem(newItem);

    setFormData({
      name: '',
      hsn: '',
      rate: '',
      stock: '20',
      unit: '',
      gstRate: '',
    });
    setErrors({});
    setOpen(false);

    toast({
      title: 'Item added',
      description: `${newItem.name} has been added to your item list`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Add New Item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name *</Label>
            <Input
              id="item-name"
              placeholder="e.g., Steel Bars (10mm)"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                setErrors((prev) => ({ ...prev, name: '' }));
              }}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hsn">HSN Code *</Label>
            <Input
              id="hsn"
              placeholder="e.g., 7214"
              value={formData.hsn}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, hsn: e.target.value }));
                setErrors((prev) => ({ ...prev, hsn: '' }));
              }}
              className="font-mono"
            />
            {errors.hsn && <p className="text-xs text-destructive">{errors.hsn}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Rate *</Label>
              <Input
                id="rate"
                type="number"
                min={0}
                placeholder="e.g., 5500"
                value={formData.rate}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, rate: e.target.value }));
                  setErrors((prev) => ({ ...prev, rate: '' }));
                }}
              />
              {errors.rate && <p className="text-xs text-destructive">{errors.rate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                placeholder="e.g., 150"
                value={formData.stock}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, stock: e.target.value }));
                  setErrors((prev) => ({ ...prev, stock: '' }));
                }}
              />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                placeholder="e.g., MT, Bags"
                value={formData.unit}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, unit: e.target.value }));
                  setErrors((prev) => ({ ...prev, unit: '' }));
                }}
              />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstRate">GST Rate % *</Label>
              <Input
                id="gstRate"
                type="number"
                min={0}
                max={100}
                placeholder="e.g., 18"
                value={formData.gstRate}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, gstRate: e.target.value }));
                  setErrors((prev) => ({ ...prev, gstRate: '' }));
                }}
              />
              {errors.gstRate && <p className="text-xs text-destructive">{errors.gstRate}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInventoryItemDialog;

