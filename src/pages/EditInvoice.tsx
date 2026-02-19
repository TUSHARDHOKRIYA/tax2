import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInvoiceWizardStore } from '@/store/invoiceWizardStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Search, Pencil, FileText, Sparkles } from 'lucide-react';
import type { Company, InvoiceItem, InventoryItem } from '@/data/mockData';
import { formatIST } from '@/lib/dateUtils';

export default function EditInvoice() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { setCompany, setItems, setEditing, reset } = useInvoiceWizardStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [foundInvoice, setFoundInvoice] = useState<any>(null);

    const handleSearch = async () => {
        const term = searchTerm.trim();
        if (!term) {
            setError('Please enter an invoice number.');
            return;
        }
        if (!user) {
            setError('Please log in first.');
            return;
        }

        setIsLoading(true);
        setError('');
        setFoundInvoice(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('invoices')
                .select(`
          *,
          companies (*),
          invoice_line_items (
            *,
            inventory_items (*)
          )
        `)
                .eq('user_id', user.id)
                .ilike('invoice_number', `%${term}%`)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError || !data) {
                setError('Invoice not found. Check the number and try again.');
                setIsLoading(false);
                return;
            }

            setFoundInvoice(data);
        } catch {
            setError('An error occurred while searching.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditInvoice = (invoice: any) => {
        // Reset wizard first
        reset();

        // Set the company
        const comp = invoice.companies;
        if (comp) {
            const company: Company = {
                id: comp.id,
                name: comp.name,
                gstNo: comp.gst_no || 'N/A',
                address: comp.address || '',
                state: comp.state || '',
                stateCode: comp.state_code || '',
                pendingAmount: Number(comp.pending_amount || 0),
                lastTransaction: comp.last_transaction,
                phone: comp.phone,
                email: comp.email,
            };
            setCompany(company);
        }

        // Set the items
        const lineItems: InvoiceItem[] = (invoice.invoice_line_items || []).map(
            (li: any, idx: number) => {
                const inventoryItem: InventoryItem = {
                    id: li.inventory_item_id || `edit-${Date.now()}-${idx}`,
                    name: li.item_name || li.inventory_items?.name || 'Item',
                    hsn: li.item_hsn || li.inventory_items?.hsn || '',
                    rate: Number(li.unit_price) || 0,
                    stock: 9999,
                    unit: li.item_unit || li.inventory_items?.unit || 'pcs',
                    gstRate: Number(li.tax_rate) || 0,
                    category: '',
                };
                return {
                    id: `edit-item-${li.id}`,
                    item: inventoryItem,
                    quantity: Number(li.quantity) || 1,
                    discount: Number(li.discount) || 0,
                };
            }
        );
        setItems(lineItems);

        // Enter edit mode
        setEditing(invoice.id, invoice.invoice_number);

        // Navigate to the customer step
        navigate('/dashboard/company');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="invoice-page-header">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Pencil className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Edit Invoice</h1>
                        <p className="text-sm text-muted-foreground">
                            Search by invoice number to edit an existing invoice
                        </p>
                    </div>
                </div>
            </header>

            <Card className="invoice-card max-w-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        Find invoice
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            autoFocus
                            placeholder="Enter invoice number (e.g. INV/2602/0001)"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setError('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSearch();
                                }
                            }}
                            className="flex-1"
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? (
                                <Sparkles className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    {foundInvoice && (
                        <Card className="border-primary/30 bg-primary/5">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-foreground">
                                            {foundInvoice.invoice_number}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {foundInvoice.companies?.name || 'Unknown company'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Created:{' '}
                                            {formatIST(foundInvoice.created_at)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Items: {(foundInvoice.invoice_line_items || []).length} ·
                                            Total: ₹{Number(foundInvoice.total_amount).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span
                                            className={`inline-flex items-center text-[10px] h-5 px-2 rounded-md font-medium ${foundInvoice.status === 'updated'
                                                    ? 'bg-amber-500/15 text-amber-700'
                                                    : foundInvoice.status === 'paid'
                                                        ? 'bg-emerald-500/15 text-emerald-700'
                                                        : 'bg-blue-500/15 text-blue-700'
                                                }`}
                                        >
                                            {foundInvoice.status}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() => handleEditInvoice(foundInvoice)}
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit this invoice
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {!foundInvoice && !error && !isLoading && (
                        <div className="text-center py-8">
                            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Enter an invoice number above to search
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
