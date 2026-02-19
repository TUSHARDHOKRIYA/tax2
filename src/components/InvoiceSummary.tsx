import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InvoiceItem, Company } from '@/data/mockData';
import { Calculator, TrendingUp } from 'lucide-react';

interface InvoiceSummaryProps {
  items: InvoiceItem[];
  company: Company | null;
}

const InvoiceSummary = ({ items, company }: InvoiceSummaryProps) => {
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const baseAmount = item.item.rate * item.quantity;
      const discountAmount = (baseAmount * item.discount) / 100;
      return sum + (baseAmount - discountAmount);
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return items.reduce((sum, item) => {
      const baseAmount = item.item.rate * item.quantity;
      return sum + (baseAmount * item.discount) / 100;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const totalDiscount = calculateTotalDiscount();
  const grandTotal = subtotal;

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Calculator className="h-5 w-5 text-primary" />
          Invoice Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Add items to see the summary
          </p>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal (before discount)</span>
              <span className="font-mono">₹{(subtotal + totalDiscount).toLocaleString()}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount</span>
                <span className="font-mono">-₹{totalDiscount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-medium">
              <span>Total</span>
              <span className="font-mono">₹{subtotal.toLocaleString()}</span>
            </div>

            <Separator />

            {company?.pendingAmount && company.pendingAmount > 0 ? (
              <>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-semibold">Invoice Amount</span>
                  <span className="text-lg font-bold font-mono">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>

                <Separator />
                <div className="rounded-lg bg-warning/10 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-warning font-medium">
                    <TrendingUp className="h-4 w-4" />
                    Previous Balance
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Amount</span>
                    <span className="font-mono">₹{company.pendingAmount.toLocaleString()}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Payable</span>
                    <span className="text-2xl font-bold font-mono text-primary">
                      ₹{(grandTotal + company.pendingAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-semibold">Grand Total</span>
                <span className="text-2xl font-bold font-mono text-primary">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceSummary;
