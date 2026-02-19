import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InvoiceItem } from '@/data/mockData';
import { FileText, Trash2, Minus, Plus } from 'lucide-react';

interface InvoiceItemsProps {
  items: InvoiceItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDiscount: (id: string, discount: number) => void;
  onRemoveItem: (id: string) => void;
  inventoryManagementEnabled?: boolean;
  onConfirmItems?: () => void;
}

const InvoiceItems = ({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem,
  inventoryManagementEnabled = false,
  onConfirmItems,
}: InvoiceItemsProps) => {
  const calculateItemTotal = (item: InvoiceItem) => {
    const baseAmount = item.item.rate * item.quantity;
    const discountAmount = (baseAmount * item.discount) / 100;
    return baseAmount - discountAmount;
  };

  const calculateGst = (item: InvoiceItem) => {
    const taxableAmount = calculateItemTotal(item);
    return (taxableAmount * item.item.gstRate) / 100;
  };

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            Invoice Items
            {items.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length} item{items.length > 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
          {items.length > 0 && onConfirmItems && (
            <Button
              size="sm"
              variant="outline"
              onClick={onConfirmItems}
            >
              Confirm Items
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No items added yet</p>
            <p className="text-sm">Add items from the inventory list</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium text-right">Rate</th>
                  <th className="pb-2 font-medium text-center">Disc %</th>
                  <th className="pb-2 font-medium text-right">Taxable</th>
                  <th className="pb-2 font-medium text-right">GST</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((invoiceItem) => {
                  const taxableAmount = calculateItemTotal(invoiceItem);
                  const gstAmount = calculateGst(invoiceItem);
                  const total = taxableAmount + gstAmount;

                  return (
                    <tr key={invoiceItem.id} className="group">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{invoiceItem.item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            HSN: {invoiceItem.item.hsn} | GST: {invoiceItem.item.gstRate}%
                          </p>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() =>
                              onUpdateQuantity(
                                invoiceItem.id,
                                Math.max(1, invoiceItem.quantity - 1),
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            {...(inventoryManagementEnabled
                              ? { max: invoiceItem.item.stock }
                              : {})}
                            value={invoiceItem.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10);
                              if (Number.isNaN(value) || value <= 0) {
                                onUpdateQuantity(invoiceItem.id, 1);
                                return;
                              }

                              if (
                                inventoryManagementEnabled &&
                                value > invoiceItem.item.stock
                              ) {
                                onUpdateQuantity(
                                  invoiceItem.id,
                                  invoiceItem.item.stock,
                                );
                                return;
                              }

                              onUpdateQuantity(invoiceItem.id, value);
                            }}
                            className="w-16 h-7 text-center font-mono"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => {
                              const nextQuantity = inventoryManagementEnabled
                                ? Math.min(
                                    invoiceItem.item.stock,
                                    invoiceItem.quantity + 1,
                                  )
                                : invoiceItem.quantity + 1;
                              onUpdateQuantity(invoiceItem.id, nextQuantity);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {inventoryManagementEnabled && (
                          <p className="text-xs text-muted-foreground text-center mt-1">
                            Max: {invoiceItem.item.stock}{' '}
                            {invoiceItem.item.unit}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono">
                        ₹{invoiceItem.item.rate.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={invoiceItem.discount}
                          onChange={(e) => onUpdateDiscount(invoiceItem.id, Math.min(100, parseFloat(e.target.value) || 0))}
                          className="w-16 h-7 text-center font-mono mx-auto"
                        />
                      </td>
                      <td className="py-3 text-right font-mono">
                        ₹{taxableAmount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground">
                        ₹{gstAmount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono font-semibold">
                        ₹{total.toLocaleString()}
                      </td>
                      <td className="py-3 pl-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                          onClick={() => {
                            const confirmed = window.confirm(
                              'Are you sure you want to remove this item from the invoice?',
                            );
                            if (!confirmed) return;
                            onRemoveItem(invoiceItem.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceItems;
