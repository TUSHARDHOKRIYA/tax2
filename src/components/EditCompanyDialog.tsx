import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Company } from '@/data/mockData';
import { Building2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EditCompanyDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (company: Company) => Promise<void> | void;
}

const EditCompanyDialog = ({ company, open, onOpenChange, onSave }: EditCompanyDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    previousBalance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!company || !open) return;

    setFormData({
      name: company.name ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
      previousBalance:
        company.pendingAmount !== undefined ? String(company.pendingAmount) : '',
    });
    setErrors({});
  }, [company, open]);

  if (!company) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

    const updatedCompany: Company = {
      ...company,
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      pendingAmount: parsedBalance,
    };

    await onSave(updatedCompany);

    toast({
      title: 'Company updated',
      description: `${updatedCompany.name} has been updated successfully`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Edit company
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-sm font-medium">
              Company name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              placeholder="Enter company name"
              className="rounded-lg bg-muted/30 border-border"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                setErrors((prev) => ({ ...prev, name: '' }));
              }}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-sm font-medium">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-phone"
                placeholder="+91 98765 43210"
                className="rounded-lg bg-muted/30 border-border"
                value={formData.phone}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, phone: e.target.value }));
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="contact@company.com"
                className="rounded-lg bg-muted/30 border-border"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address" className="text-sm font-medium">
              Address
            </Label>
            <Input
              id="edit-address"
              placeholder="Full address"
              className="rounded-lg bg-muted/30 border-border"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="edit-previousBalance"
              className="text-sm font-medium"
            >
              Previous balance (₹)
            </Label>
            <Input
              id="edit-previousBalance"
              type="number"
              min={0}
              placeholder="0"
              className="rounded-lg bg-muted/30 border-border"
              value={formData.previousBalance}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  previousBalance: e.target.value,
                }))
              }
            />
            {errors.previousBalance && (
              <p className="text-xs text-destructive">
                {errors.previousBalance}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg">
              <Save className="h-4 w-4 mr-1" />
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyDialog;

