import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InvoicePdf from '@/components/InvoicePdf';
import InvoiceSummary from '@/components/InvoiceSummary';
import { useInvoiceWizardStore } from '@/store/invoiceWizardStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { generateInvoiceNumber } from '@/data/mockData';
import { formatIST } from '@/lib/dateUtils';
import { FileDown, Sparkles, ArrowLeft, Pencil, Truck } from 'lucide-react';
import { toast } from 'sonner';

const ReviewStep = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { items, company, reset, editingInvoiceId, editingInvoiceNumber } = useInvoiceWizardStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [sellerInfo, setSellerInfo] = useState<any>(null);
    const [bankDetails, setBankDetails] = useState<any>(null);
    const [existingPending, setExistingPending] = useState<number>(0);
    const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
    const [motorVehicleNo, setMotorVehicleNo] = useState('');

    // Fetch seller & bank details for PDF
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

    const invoiceOptions = {
        paymentTerms: '30days',
        dueDate: (() => {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date.toISOString().split('T')[0];
        })(),
        notes: '',
        transportMode: 'road' as const,
        vehicleNo: '',
    };

    // Calculate totals for display
    const invoiceTotal = items.reduce((sum, item) =>
        sum + (item.item.rate * item.quantity * (1 - item.discount / 100)), 0
    );

    const handleDownloadClick = () => {
        if (!company) {
            toast.error("Customer required. Please go back and select a customer.");
            return;
        }
        if (items.length === 0) {
            toast.error("No items. Please add at least one item to the invoice.");
            return;
        }
        setMotorVehicleNo('');
        setVehicleDialogOpen(true);
    };

    const handleConfirmVehicleAndDownload = async () => {
        const vehicleNo = motorVehicleNo.trim();
        setVehicleDialogOpen(false);

        const { data: companyData } = await supabase
            .from('companies')
            .select('pending_amount')
            .eq('id', company!.id)
            .single();
        const pendingBefore = Number(companyData?.pending_amount || 0);
        void handleSaveAndDownload(pendingBefore, vehicleNo);
    };

    // Enter key on Review page → Download PDF
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || e.shiftKey || isGenerating) return;
            const target = e.target as HTMLElement;
            const tag = target?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            e.preventDefault();
            handleDownloadClick();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isGenerating]);

    // Save invoice and generate PDF without collecting payment here
    const handleSaveAndDownload = async (pendingBefore: number, motorVehicleNo: string = '') => {
        setIsGenerating(true);

        try {
            const isEditing = !!editingInvoiceId;
            const invoiceNumber = isEditing ? (editingInvoiceNumber || '') : generateInvoiceNumber();
            const now = new Date();
            const invoiceDateTime = formatIST(now);

            // 1. SAVE TO DATABASE (no payment collection here)
            try {
                if (user) {
                    const totalAmount = items.reduce((sum, item) =>
                        sum + (item.item.rate * item.quantity * (1 - item.discount / 100)), 0
                    );
                    const taxAmount = items.reduce((sum, item) =>
                        sum + (item.item.rate * item.quantity * (1 - item.discount / 100)) * ((item.item.gstRate || 0) / 100), 0
                    );

                    let invoiceId: string;

                    if (isEditing) {
                        // --- EDIT MODE: UPDATE existing invoice ---
                        // First get the old total to adjust pending amount
                        const { data: oldInvoice } = await supabase
                            .from('invoices')
                            .select('total_amount')
                            .eq('id', editingInvoiceId)
                            .single();
                        const oldTotal = Number(oldInvoice?.total_amount || 0);

                        const { error: updateInvError } = await supabase
                            .from('invoices')
                            .update({
                                company_id: company.id,
                                total_amount: totalAmount,
                                tax_amount: taxAmount,
                                status: 'updated',
                                updated_at: now.toISOString(),
                            })
                            .eq('id', editingInvoiceId);
                        if (updateInvError) throw new Error(`Database error (update invoice): ${updateInvError.message}`);

                        // Delete old line items
                        const { error: deleteError } = await supabase
                            .from('invoice_line_items')
                            .delete()
                            .eq('invoice_id', editingInvoiceId);
                        if (deleteError) throw new Error(`Database error (delete old line items): ${deleteError.message}`);

                        invoiceId = editingInvoiceId;

                        // Adjust company pending: remove old invoice amount, add new amount
                        const pendingDelta = totalAmount - oldTotal;
                        const newPending = pendingBefore + pendingDelta;
                        const { error: updateCompError } = await supabase
                            .from('companies')
                            .update({
                                pending_amount: Math.max(0, newPending),
                                last_transaction: now.toISOString()
                            })
                            .eq('id', company.id);
                        if (updateCompError) throw new Error(`Database error (company update): ${updateCompError.message}`);
                    } else {
                        // --- CREATE MODE: INSERT new invoice ---
                        const newPending = pendingBefore + totalAmount;
                        const invoiceStatus = 'sent';

                        const { data: invoiceData, error: invoiceError } = await supabase
                            .from('invoices')
                            .insert({
                                user_id: user.id,
                                company_id: company.id,
                                invoice_number: invoiceNumber,
                                total_amount: totalAmount,
                                tax_amount: taxAmount,
                                amount_received: 0,
                                status: invoiceStatus,
                                due_date: invoiceOptions.dueDate ? new Date(invoiceOptions.dueDate).toISOString() : null,
                                created_at: now.toISOString(),
                                updated_at: now.toISOString(),
                            })
                            .select()
                            .single();

                        if (invoiceError) throw new Error(`Database error (invoices): ${invoiceError.message}`);
                        if (!invoiceData) throw new Error('No invoice data returned from database');
                        invoiceId = invoiceData.id;

                        // Update company pending amount (previous pending + this invoice total)
                        const { error: updateError } = await supabase
                            .from('companies')
                            .update({
                                pending_amount: Math.max(0, newPending),
                                last_transaction: new Date().toISOString()
                            })
                            .eq('id', company.id);
                        if (updateError) throw new Error(`Database error (company update): ${updateError.message}`);
                    }

                    // Insert line items (for both create and edit)
                    const lineItems = items.map(item => {
                        const isLocalId = typeof item.item.id === 'string' && (item.item.id.startsWith('local-') || item.item.id.startsWith('edit-') || /^\d+$/.test(item.item.id));
                        return {
                            invoice_id: invoiceId,
                            inventory_item_id: isLocalId ? null : item.item.id,
                            item_name: item.item.name,
                            item_hsn: item.item.hsn || null,
                            item_unit: item.item.unit,
                            quantity: item.quantity,
                            unit_price: item.item.rate,
                            discount: item.discount,
                            tax_rate: item.item.gstRate || 0,
                            line_total: (item.item.rate * item.quantity * (1 - item.discount / 100))
                        };
                    });

                    const { error: lineItemsError } = await supabase
                        .from('invoice_line_items')
                        .insert(lineItems);
                    if (lineItemsError) throw new Error(`Database error (line items): ${lineItemsError.message}`);
                }
            } catch (dbError) {
                console.error('Database operation failed:', dbError);
                throw new Error(`Failed to save invoice to database: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
            }

            // 2. GENERATE PDF
            try {
                const addr = sellerInfo?.address;
                const addressLines = !addr
                    ? ["Survey No.211 Plot No.2", "Government Industrial Estate Piparia", "Silvassa"]
                    : Array.isArray(addr) ? addr : typeof addr === "string" ? addr.split(/\r?\n/).filter(Boolean) : [String(addr)];
                const companyDetails = {
                    name: sellerInfo?.name || "Sunshine Industries",
                    address: addressLines,
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
                    name: company.name,
                    address: [company.address || ""],
                    pan: company.pan || "",
                    gstin: company.gstNo || "",
                    state: company.state || "",
                    stateCode: company.stateCode || "",
                    placeOfSupply: company.state || "",
                    contact: company.phone || "",
                    email: company.email || "",
                };

                const invoiceDetailsData = {
                    invoiceNo: invoiceNumber,
                    invoiceDate: invoiceDateTime,
                    modeOfPayment: "Cash/Bank",
                    motorVehicleNo: motorVehicleNo || undefined,
                };

                const round2 = (n: number) => Math.round(n * 100) / 100;
                const itemsForPdf = items.map((item, idx) => {
                    const lineAmount = round2(item.item.rate * item.quantity * (1 - (item.discount || 0) / 100));
                    return {
                        slNo: idx + 1,
                        description: item.item.name || 'Item',
                        hsn: item.item.hsn ?? '',
                        boxes: (item.boxes != null && item.boxes !== undefined) ? Number(item.boxes) : undefined,
                        itemsPerBox: (item.itemsPerBox != null && item.itemsPerBox !== undefined) ? Number(item.itemsPerBox) : undefined,
                        quantity: `${item.quantity} ${item.item.unit || 'pcs'}`,
                        rate: round2(item.item.rate),
                        unit: item.item.unit || 'pcs',
                        amount: lineAmount,
                    };
                });

                const blob = await pdf(
                    <InvoicePdf
                        company={companyDetails}
                        buyer={buyerDetails}
                        invoiceDetails={invoiceDetailsData}
                        items={itemsForPdf}
                        bankDetails={targetBank}
                        previousBalance={pendingBefore}
                    />
                ).toBlob();

                if (!blob) {
                    throw new Error('PDF generation returned null blob');
                }

                const filename = `Invoice_${invoiceNumber.replace(/\//g, '_')}.pdf`;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // Revoke after delay so browser has time to start the download
                setTimeout(() => URL.revokeObjectURL(url), 30000);

                toast.success(isEditing
                    ? `Invoice ${invoiceNumber} has been updated & downloaded!`
                    : `Invoice ${invoiceNumber} has been downloaded & saved!`);

                // Reset wizard after successful save + PDF generation
                reset();
                navigate('/dashboard/history');
            } catch (pdfError) {
                console.error('PDF generation failed:', pdfError);
                throw new Error(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            console.error('Invoice save/PDF error:', error);

            toast.error(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="invoice-page">
            {editingInvoiceNumber && (
                <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-700 flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    Editing Invoice #{editingInvoiceNumber}
                </div>
            )}
            <header className="invoice-page-header">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-semibold text-foreground">
                        {editingInvoiceId ? 'Review & update invoice' : 'Step 3 – Review & download'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {editingInvoiceId ? 'Review your changes and download the updated PDF' : 'Check details and download your invoice PDF'}
                    </p>
                </div>
            </header>

            <main className="pt-6 max-w-3xl mx-auto space-y-6">
                {company && (
                    <Card className="invoice-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p className="font-semibold">{company.name}</p>
                            <p className="text-muted-foreground">{company.address}</p>
                            <p className="text-muted-foreground">
                                {company.state} ({company.stateCode})
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Card className="invoice-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Invoice Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        <th className="py-1 text-left font-medium">Item</th>
                                        <th className="py-1 text-center font-medium">Qty</th>
                                        <th className="py-1 text-right font-medium">Rate</th>
                                        <th className="py-1 text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.map((row) => {
                                        const amount = row.item.rate * row.quantity;
                                        return (
                                            <tr key={row.id}>
                                                <td className="py-1 pr-2">
                                                    <div className="font-medium">{row.item.name}</div>
                                                </td>
                                                <td className="py-1 text-center font-mono">
                                                    {row.quantity}
                                                </td>
                                                <td className="py-1 text-right font-mono">
                                                    ₹{row.item.rate.toFixed(2)}
                                                </td>
                                                <td className="py-1 text-right font-mono">
                                                    ₹{amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary with Totals */}
                <InvoiceSummary items={items} company={company} />

                <Card className="invoice-card">
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
                        <Button variant="outline" onClick={() => navigate('/dashboard/items')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to items
                        </Button>
                        <div className="flex flex-col items-stretch sm:items-end gap-1">
                            <Button
                                type="button"
                                onClick={handleDownloadClick}
                                disabled={isGenerating}
                                className="min-w-[180px]"
                            >
                                {isGenerating ? (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-1 animate-pulse" />
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="h-4 w-4 mr-1" />
                                        Download PDF
                                    </>
                                )}
                            </Button>

                            <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-primary" />
                                            Motor Vehicle Number
                                        </DialogTitle>
                                        <DialogDescription>
                                            Enter the vehicle number for this delivery. It will be printed on the invoice. You can leave it blank if not applicable.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-3 space-y-2">
                                        <Label htmlFor="motor-vehicle-no">Vehicle number</Label>
                                        <Input
                                            id="motor-vehicle-no"
                                            placeholder="e.g. MH01AB1234"
                                            value={motorVehicleNo}
                                            onChange={(e) => setMotorVehicleNo(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleConfirmVehicleAndDownload();
                                                }
                                            }}
                                            className="font-mono uppercase"
                                            autoFocus
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setVehicleDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleConfirmVehicleAndDownload}
                                        >
                                            <FileDown className="h-4 w-4 mr-1" />
                                            Download PDF
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            {(!company || items.length === 0) && !isGenerating && (
                                <p className="text-xs text-muted-foreground">
                                    {!company && items.length === 0
                                        ? "Select a customer and add items first"
                                        : !company
                                            ? "Select a customer first"
                                            : "Add at least one item"}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default ReviewStep;
