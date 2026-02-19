import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useInvoiceWizardStore } from "@/store/invoiceWizardStore";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { pdf } from '@react-pdf/renderer';
import InvoicePdf from "@/components/InvoicePdf";
import {
    Search, Receipt, History as HistoryIcon, Calendar,
    Download, Sparkles, Building2, IndianRupee, FileText,
    ChevronDown, MapPin, Wallet, List, Pencil, Trash2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatIST, formatISTDate, formatISTMonthYear } from "@/lib/dateUtils";

interface HistoryInvoice {
    id: string;
    invoice_number: string;
    total_amount: number;
    tax_amount: number;
    amount_received: number;
    status: string;
    created_at: string;
    due_date: string | null;
    companies: {
        id: string;
        name: string;
        address: string;
        gst_no: string;
        state: string;
        state_code: string;
    };
    invoice_line_items: {
        id: string;
        quantity: number;
        unit_price: number;
        tax_rate: number;
        discount: number;
        line_total: number;
        item_name?: string;
        item_hsn?: string;
        item_unit?: string;
        inventory_items?: {
            name: string;
            hsn: string;
            unit: string;
        };
    }[];
}

export default function History() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { setCompany, setItems, setEditing, reset } = useInvoiceWizardStore();
    const [invoices, setInvoices] = useState<HistoryInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);
    const [sellerInfo, setSellerInfo] = useState<any>(null);
    const [bankDetails, setBankDetails] = useState<any>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [companiesWithBalance, setCompaniesWithBalance] = useState<{ id: string; name: string; pending_amount: number }[]>([]);

    // Fetch all invoices for the user
    useEffect(() => {
        const fetchInvoices = async () => {
            if (!user) return;
            setIsLoading(true);

            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    companies (*),
                    invoice_line_items (
                        *,
                        inventory_items (*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching invoices:", error);
                toast({
                    title: "Error",
                    description: "Failed to load invoice history.",
                    variant: "destructive"
                });
            } else {
                setInvoices(data || []);
            }
            setIsLoading(false);
        };
        fetchInvoices();
    }, [user]);

    // Fetch companies with outstanding balance (for "Outstanding balances" list)
    useEffect(() => {
        const fetchCompaniesBalance = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('companies')
                .select('id, name, pending_amount')
                .order('pending_amount', { ascending: false });
            if (error) {
                console.error("Error fetching companies balance:", error);
                return;
            }
            const withBalance = (data || []).filter((c) => Number(c.pending_amount || 0) > 0);
            setCompaniesWithBalance(withBalance.map((c) => ({
                id: c.id,
                name: c.name,
                pending_amount: Number(c.pending_amount || 0),
            })));
        };
        fetchCompaniesBalance();
    }, [user]);

    // Fetch seller & bank details
    useEffect(() => {
        const fetchAccountInfo = async () => {
            if (!user) return;
            const { data: sellerData } = await supabase
                .from('seller_info')
                .select('*')
                .eq('user_id', user.id)
                .single();
            const { data: bankData } = await supabase
                .from('bank_details')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (sellerData) setSellerInfo(sellerData);
            if (bankData) setBankDetails(bankData);
        };
        fetchAccountInfo();
    }, [user]);

    const handleDeleteInvoice = async (invoice: HistoryInvoice) => {
        if (!user) return;
        const confirmDelete = window.confirm(
            `Delete invoice ${invoice.invoice_number} for ${invoice.companies?.name || 'this customer'}? This cannot be undone.`,
        );
        if (!confirmDelete) return;

        try {
            const total = Number(invoice.total_amount || 0);

            // Get current pending balance
            const { data: companyRow, error: companyError } = await supabase
                .from('companies')
                .select('pending_amount')
                .eq('id', invoice.companies.id)
                .eq('user_id', user.id)
                .single();

            if (companyError) {
                console.error('Failed to load company for delete:', companyError);
                toast({
                    title: 'Error',
                    description: 'Could not load company balance before deleting invoice.',
                    variant: 'destructive',
                });
                return;
            }

            const previous = Number(companyRow?.pending_amount || 0);
            const next = Math.max(0, previous - total);

            // Update company pending_amount
            const { error: updateError } = await supabase
                .from('companies')
                .update({
                    pending_amount: next,
                    last_transaction: new Date().toISOString(),
                })
                .eq('id', invoice.companies.id)
                .eq('user_id', user.id);

            if (updateError) {
                console.error('Failed to update company balance on delete:', updateError);
                toast({
                    title: 'Error',
                    description: 'Failed to update company balance while deleting invoice.',
                    variant: 'destructive',
                });
                return;
            }

            // Delete invoice (line items will be deleted via ON DELETE CASCADE)
            const { error: deleteError } = await supabase
                .from('invoices')
                .delete()
                .eq('id', invoice.id)
                .eq('user_id', user.id);

            if (deleteError) {
                console.error('Failed to delete invoice:', deleteError);
                toast({
                    title: 'Error',
                    description: 'Failed to delete invoice.',
                    variant: 'destructive',
                });
                return;
            }

            // Update local invoices list
            setInvoices((prev) => prev.filter((inv) => inv.id !== invoice.id));

            // Update outstanding balances list
            setCompaniesWithBalance((prev) => {
                const updated = prev.map((c) =>
                    c.id === invoice.companies.id
                        ? { ...c, pending_amount: next }
                        : c,
                );
                return updated.filter((c) => c.pending_amount > 0);
            });

            toast({
                title: 'Invoice deleted',
                description: `Invoice ${invoice.invoice_number} has been deleted and balance updated.`,
            });
        } catch (error) {
            console.error('Unexpected error deleting invoice:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred while deleting the invoice.',
                variant: 'destructive',
            });
        }
    };

    const handleDownloadInvoice = async (invoice: HistoryInvoice) => {
        setIsGeneratingPdf(invoice.id);
        try {
            const companyDetails = {
                name: sellerInfo?.name || "Sunshine Industries",
                address: sellerInfo?.address
                    ? [sellerInfo.address]
                    : ["Survey No.211 Plot No.2", "Government Industrial Estate Piparia", "Silvassa"],
                gstin: sellerInfo?.gst_no || "26AFFFS1447B1ZA",
                state: sellerInfo?.state || "Dadra & Nagar Haveli and Daman & Diu",
                stateCode: sellerInfo?.state_code || "26",
                contact: sellerInfo?.phone
                    ? [sellerInfo.phone]
                    : ["+91 8347477555", "+91-9624640555"],
                email: sellerInfo?.email || "sunshineindustries02@gmail.com",
                website: sellerInfo?.website || "www.sunshineindustriess.com"
            };

            const targetBank = {
                accountHolderName: bankDetails?.account_name || "Sunshine Industries",
                bankName: bankDetails?.bank_name || "Yes Bank",
                accountNo: bankDetails?.account_number || "025626900000011",
                branchAndIFSC: bankDetails?.branch && bankDetails?.ifsc_code
                    ? `${bankDetails.branch}, ${bankDetails.ifsc_code}`
                    : "SILVASSA & YESB0000256"
            };

            const buyerDetails = {
                name: invoice.companies?.name || "N/A",
                address: [invoice.companies?.address || ""],
                gstin: invoice.companies?.gst_no || "N/A",
                pan: "",
                state: invoice.companies?.state || "",
                stateCode: invoice.companies?.state_code || "",
                placeOfSupply: invoice.companies?.state || "",
                contact: "",
                email: "",
            };

            const invoiceDetails = {
                invoiceNo: invoice.invoice_number,
                invoiceDate: formatIST(invoice.created_at),
                modeOfPayment: "Cash/Bank"
            };

            const items = (invoice.invoice_line_items || []).map((item, idx) => ({
                slNo: idx + 1,
                description: (item.item_name || item.inventory_items?.name || "Item").trim(),
                hsn: item.item_hsn || item.inventory_items?.hsn || '',
                boxes: undefined,
                itemsPerBox: undefined,
                quantity: `${Number(item.quantity) || 0} ${item.item_unit || item.inventory_items?.unit || 'pcs'}`,
                rate: Number(item.unit_price) || 0,
                unit: item.item_unit || item.inventory_items?.unit || 'pcs',
                amount: Number(item.line_total) || 0,
            }));

            const blob = await pdf(
                <InvoicePdf
                    company={companyDetails}
                    buyer={buyerDetails}
                    invoiceDetails={invoiceDetails}
                    items={items}
                    previousBalance={0}
                    bankDetails={targetBank}
                />
            ).toBlob();

            if (!blob) throw new Error("Failed to generate PDF");

            const filename = `Invoice_${invoice.invoice_number.replace(/\//g, '_')}.pdf`;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 30000);

            toast({
                title: "Downloaded",
                description: `Invoice ${invoice.invoice_number} downloaded successfully.`
            });
        } catch (error) {
            console.error("PDF download error:", error);
            toast({
                title: "Error",
                description: "Failed to generate or download the invoice.",
                variant: "destructive"
            });
        } finally {
            setIsGeneratingPdf(null);
        }
    };

    // Filtering
    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Stats
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const totalInvoices = invoices.length;

    // Group by date
    const groupedByDate: Record<string, HistoryInvoice[]> = {};
    filteredInvoices.forEach(inv => {
        const dateKey = formatISTMonthYear(inv.created_at);
        if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
        groupedByDate[dateKey].push(inv);
    });

    const handleEditFromHistory = (invoice: HistoryInvoice) => {
        reset();

        const comp = invoice.companies;
        if (comp) {
            setCompany({
                id: comp.id,
                name: comp.name,
                gstNo: comp.gst_no || 'N/A',
                address: comp.address || '',
                state: comp.state || '',
                stateCode: comp.state_code || '',
                pendingAmount: 0,
                lastTransaction: '',
                phone: '',
                email: '',
            });
        }

        const lineItems = (invoice.invoice_line_items || []).map((li, idx) => ({
            id: `edit-item-${li.id}`,
            item: {
                id: li.inventory_item_id || `edit-${Date.now()}-${idx}`,
                name: li.item_name || li.inventory_items?.name || 'Item',
                hsn: li.item_hsn || li.inventory_items?.hsn || '',
                rate: Number(li.unit_price) || 0,
                stock: 9999,
                unit: li.item_unit || li.inventory_items?.unit || 'pcs',
                gstRate: Number(li.tax_rate) || 0,
                category: '',
            },
            quantity: Number(li.quantity) || 1,
            discount: Number(li.discount) || 0,
        }));
        setItems(lineItems);
        setEditing(invoice.id, invoice.invoice_number);
        navigate('/dashboard/items');
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <header className="invoice-page-header">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <HistoryIcon className="h-6 w-6 text-primary" />
                            Transaction history
                        </h1>
                        <p className="text-muted-foreground text-sm mt-0.5">All past invoices in one place</p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 shrink-0">
                                    <Wallet className="h-4 w-4" />
                                    Outstanding balances
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <List className="h-5 w-5 text-primary" />
                                        Outstanding balances
                                    </DialogTitle>
                                </DialogHeader>
                                <p className="text-sm text-muted-foreground">Companies with remaining balance to be collected</p>
                                {companiesWithBalance.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">No outstanding balances</p>
                                ) : (
                                    <ScrollArea className="max-h-[320px] rounded-md border border-border">
                                        <div className="p-2 space-y-1">
                                            {companiesWithBalance.map((c) => (
                                                <div
                                                    key={c.id}
                                                    className="flex items-center justify-between gap-4 py-3 px-3 rounded-lg hover:bg-muted/50 border-b border-border last:border-0"
                                                >
                                                    <span className="font-medium text-foreground truncate flex-1 min-w-0">{c.name}</span>
                                                    <span className="font-semibold text-orange-600 shrink-0">₹{c.pending_amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                                {companiesWithBalance.length > 0 && (
                                    <p className="text-xs text-muted-foreground text-right">
                                        Total: ₹{companiesWithBalance.reduce((s, c) => s + c.pending_amount, 0).toLocaleString()}
                                    </p>
                                )}
                            </DialogContent>
                        </Dialog>
                        <div className="relative flex-1 md:w-64 min-w-[140px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search invoice or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="invoice-card">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <IndianRupee className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Total revenue</p>
                            <p className="text-lg font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="invoice-card">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Total invoices</p>
                            <p className="text-lg font-bold text-foreground">{totalInvoices}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="invoice-card">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Outstanding</p>
                            <p className="text-lg font-bold text-foreground">₹{companiesWithBalance.reduce((s, c) => s + c.pending_amount, 0).toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <div className="invoice-card flex flex-col items-center justify-center py-16">
                    <Sparkles className="h-8 w-8 text-primary animate-spin mb-3" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="invoice-card flex flex-col items-center justify-center py-20 text-center">
                    <HistoryIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">
                        {searchTerm ? "No matching invoices" : "No invoices yet"}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                        {searchTerm ? "Try a different search." : "Create your first invoice from Create Invoice to see it here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedByDate).map(([dateGroup, dateInvoices]) => (
                        <div key={dateGroup}>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2 flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                {dateGroup}
                            </h3>
                            <div className="space-y-3">
                                {dateInvoices.map((inv) => (
                                    <Card
                                        key={inv.id}
                                        className="invoice-card cursor-pointer hover:border-primary/40 transition-colors"
                                        onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-primary/10 text-primary">
                                                        <Receipt className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-semibold text-foreground truncate">{inv.companies?.name || "Unknown"}</p>
                                                            {inv.status === 'updated' && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                                    <Pencil className="h-2.5 w-2.5" /> Edited
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {inv.invoice_number} · {formatIST(inv.created_at)}
                                                            · {(inv.invoice_line_items || []).length} item{(inv.invoice_line_items || []).length !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                                    <div className="text-right">
                                                        <p className="font-semibold text-foreground">₹{Number(inv.total_amount).toLocaleString()}</p>
                                                    </div>
                                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === inv.id ? 'rotate-180' : ''}`} />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9"
                                                        title="Edit invoice"
                                                        onClick={(e) => { e.stopPropagation(); handleEditFromHistory(inv); }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9"
                                                        title="Download PDF"
                                                        onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(inv); }}
                                                        disabled={isGeneratingPdf === inv.id}
                                                    >
                                                        {isGeneratingPdf === inv.id ? <Sparkles className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 text-destructive border-destructive/40"
                                                        title="Delete invoice"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void handleDeleteInvoice(inv);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {expandedId === inv.id && (
                                                <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Company</p>
                                                            <p className="text-sm font-semibold text-foreground">{inv.companies?.name}</p>
                                                            {inv.companies?.address && (
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{inv.companies.address}</p>
                                                            )}
                                                            <p className="text-xs text-muted-foreground pt-1 border-t border-border mt-1">Created: {formatIST(inv.created_at)}</p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Payment</p>
                                                            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Invoice total</span><span className="font-medium text-foreground">₹{Number(inv.total_amount).toLocaleString()}</span></div>
                                                            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Received</span><span className="font-medium text-emerald-600">₹{Number(inv.amount_received || 0).toLocaleString()}</span></div>
                                                            <div className="flex justify-between text-xs pt-2 border-t border-border">
                                                                <span className="text-muted-foreground">Balance due</span>
                                                                <span className={`font-medium ${Number(inv.total_amount) - Number(inv.amount_received || 0) <= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                                    ₹{Math.max(0, Number(inv.total_amount) - Number(inv.amount_received || 0)).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {inv.due_date && <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1"><Calendar className="h-3 w-3" />Due: {formatISTDate(inv.due_date)}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg border border-border overflow-hidden">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="border-b border-border bg-muted/50">
                                                                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">#</th>
                                                                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">Item</th>
                                                                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">HSN</th>
                                                                    <th className="py-2 px-3 text-center font-medium text-muted-foreground">Qty</th>
                                                                    <th className="py-2 px-3 text-right font-medium text-muted-foreground">Rate</th>
                                                                    <th className="py-2 px-3 text-right font-medium text-muted-foreground">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(inv.invoice_line_items || []).map((item, idx) => (
                                                                    <tr key={item.id} className="border-b border-border last:border-0">
                                                                        <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                                                                        <td className="py-2 px-3 font-medium text-foreground">{item.item_name || item.inventory_items?.name || 'Item'}</td>
                                                                        <td className="py-2 px-3 text-muted-foreground font-mono">{item.item_hsn || item.inventory_items?.hsn || '-'}</td>
                                                                        <td className="py-2 px-3 text-center text-foreground">{item.quantity} {item.item_unit || item.inventory_items?.unit || 'pcs'}</td>
                                                                        <td className="py-2 px-3 text-right font-mono text-foreground">₹{Number(item.unit_price).toLocaleString()}</td>
                                                                        <td className="py-2 px-3 text-right font-mono font-semibold text-foreground">₹{Number(item.line_total).toLocaleString()}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
