import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Company } from '@/data/mockData';
import { Plus, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AddCompanyDialogProps {
  onAddCompany: (company: Company) => void;
}

const AddCompanyDialog = ({ onAddCompany }: AddCompanyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    previousBalance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Contact number is required';

    const parsedBalance = formData.previousBalance.trim()
      ? Number(formData.previousBalance)
      : 0;

    if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      newErrors.previousBalance = 'Enter a valid previous balance (0 or more)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newCompany: Company = {
      id: `new-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      pendingAmount: parsedBalance,
      // Default values for schema compatibility
      state: 'Maharashtra',
      stateCode: '27',
    };

    onAddCompany(newCompany);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      previousBalance: ''
    });
    setErrors({});
    setOpen(false);

    toast({
      title: 'Company added',
      description: `${newCompany.name} has been added and selected`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Add new company
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Create a customer record for invoicing.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Company name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="Enter company name"
              className="rounded-lg bg-muted/30 border-border"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setErrors(prev => ({ ...prev, name: '' }));
              }}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                className="rounded-lg bg-muted/30 border-border"
                value={formData.phone}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, phone: e.target.value }));
                  setErrors(prev => ({ ...prev, phone: '' }));
                }}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@company.com"
                className="rounded-lg bg-muted/30 border-border"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">Address</Label>
            <Input
              id="address"
              placeholder="Full address"
              className="rounded-lg bg-muted/30 border-border"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="previousBalance" className="text-sm font-medium">Previous balance (₹)</Label>
            <Input
              id="previousBalance"
              type="number"
              min={0}
              placeholder="0"
              className="rounded-lg bg-muted/30 border-border"
              value={formData.previousBalance}
              onChange={(e) => setFormData(prev => ({ ...prev, previousBalance: e.target.value }))}
            />
            {errors.previousBalance && <p className="text-xs text-destructive">{errors.previousBalance}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg">
              <Plus className="h-4 w-4 mr-1" />
              Add company
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyDialog;
