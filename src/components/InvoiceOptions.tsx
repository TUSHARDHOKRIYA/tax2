import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, FileText, CreditCard } from 'lucide-react';

export interface InvoiceOptionsData {
  paymentTerms: string;
  dueDate: string;
  notes: string;
  transportMode: string;
  vehicleNo: string;
}

interface InvoiceOptionsProps {
  options: InvoiceOptionsData;
  onChange: (options: InvoiceOptionsData) => void;
}

const paymentTermsOptions = [
  { value: 'immediate', label: 'Immediate Payment' },
  { value: '7days', label: 'Net 7 Days' },
  { value: '15days', label: 'Net 15 Days' },
  { value: '30days', label: 'Net 30 Days' },
  { value: '45days', label: 'Net 45 Days' },
  { value: '60days', label: 'Net 60 Days' },
  { value: 'custom', label: 'Custom Date' },
];

const transportModes = [
  { value: 'road', label: 'By Road' },
  { value: 'rail', label: 'By Rail' },
  { value: 'air', label: 'By Air' },
  { value: 'ship', label: 'By Ship' },
  { value: 'courier', label: 'By Courier' },
];

const InvoiceOptions = ({ options, onChange }: InvoiceOptionsProps) => {
  const calculateDueDate = (terms: string): string => {
    if (terms === 'custom') return options.dueDate;
    
    const today = new Date();
    let daysToAdd = 0;
    
    switch (terms) {
      case 'immediate': daysToAdd = 0; break;
      case '7days': daysToAdd = 7; break;
      case '15days': daysToAdd = 15; break;
      case '30days': daysToAdd = 30; break;
      case '45days': daysToAdd = 45; break;
      case '60days': daysToAdd = 60; break;
      default: daysToAdd = 30;
    }
    
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
  };

  const handleTermsChange = (value: string) => {
    const dueDate = calculateDueDate(value);
    onChange({ ...options, paymentTerms: value, dueDate });
  };

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-primary" />
          Invoice Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Payment Terms */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Payment Terms
            </Label>
            <Select value={options.paymentTerms} onValueChange={handleTermsChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                {paymentTermsOptions.map((term) => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Due Date
            </Label>
            <Input
              id="due-date"
              type="date"
              value={options.dueDate}
              onChange={(e) => onChange({ ...options, dueDate: e.target.value, paymentTerms: 'custom' })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Transport Mode */}
          <div className="space-y-2">
            <Label>Transport Mode</Label>
            <Select 
              value={options.transportMode} 
              onValueChange={(value) => onChange({ ...options, transportMode: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transport" />
              </SelectTrigger>
              <SelectContent>
                {transportModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle No */}
          <div className="space-y-2">
            <Label>Vehicle No. (Optional)</Label>
            <Input
              id="vehicle-no"
              placeholder="e.g., MH12AB1234"
              value={options.vehicleNo}
              onChange={(e) => onChange({ ...options, vehicleNo: e.target.value.toUpperCase() })}
              className="uppercase"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Additional Notes / Remarks</Label>
          <Textarea
            id="invoice-notes"
            placeholder="Add any special instructions, delivery notes, or remarks for this invoice..."
            value={options.notes}
            onChange={(e) => onChange({ ...options, notes: e.target.value })}
            className="min-h-[80px] resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceOptions;
