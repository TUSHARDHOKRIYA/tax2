
import * as XLSX from 'xlsx';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Company } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, IndianRupee, Clock, History, TrendingUp, Receipt, Calendar, ArrowRight, Download, Sparkles, ChevronDown, BarChart3, Lightbulb, Target, Award, Package, ChevronRight, ChevronUp, Wallet, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { pdf } from '@react-pdf/renderer';
import InvoicePdf from "@/components/InvoicePdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatIST, formatISTDate, formatISTShort } from "@/lib/dateUtils";
import { FileSpreadsheet } from "lucide-react";

interface Invoice {
    id: string;
    invoice_number: string;
    total_amount: number;
    tax_amount: number;
    amount_received: number;
    status: string;
    created_at: string;
    companies?: {
        name: string;
        address: string;
        gst_no: string;
        state: string;
        state_code: string;
        contact?: string[];
        email?: string;
        website?: string;
    };
    invoice_line_items?: InvoiceLineItem[];
}

interface InvoiceLineItem {
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
}

interface CompanyPayment {
    id: string;
    amount: number;
    previous_balance: number;
    new_balance: number;
    note?: string | null;
    created_at: string;
}

export default function SalesReport() {
    const { user } = useAuthStore();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"stats" | "history">("stats");
    const [sellerInfo, setSellerInfo] = useState<any>(null);
    const [bankDetails, setBankDetails] = useState<any>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
    const [isLoadingAll, setIsLoadingAll] = useState(false);
    const [showDetailedInsights, setShowDetailedInsights] = useState(false);
    const [payments, setPayments] = useState<CompanyPayment[]>([]);
    const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentNote, setPaymentNote] = useState<string>('');

    // Load available companies for search
    useEffect(() => {
        const fetchCompanies = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('is_deleted', false)
                .order('name');

            if (error) {
                console.error("Error fetching companies:", error);
                return;
            }

            if (data) {
                setCompanies(data.map(row => ({
                    id: row.id,
                    name: row.name,
                    gstNo: row.gst_no,
                    address: row.address || "",
                    state: row.state || "",
                    stateCode: row.state_code || "",
                    pendingAmount: Number(row.pending_amount || 0),
                    lastTransaction: row.last_transaction
                })));
            }
        };
        fetchCompanies();
    }, [user]);

    // Fetch account info (seller & bank)
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

    // Fetch invoices when a company is selected
    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!selectedCompany) {
                setInvoices([]);
                return;
            }

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
                .eq('company_id', selectedCompany.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching invoices:", error);
                toast({
                    title: "Error",
                    description: "Failed to fetch company sales history.",
                    variant: "destructive"
                });
            } else {
                setInvoices(data || []);
            }
            setIsLoading(false);
        };

        fetchCompanyData();
    }, [selectedCompany]);

    // Fetch payment history when a company is selected
    useEffect(() => {
        const fetchPayments = async () => {
            if (!selectedCompany || !user) {
                setPayments([]);
                return;
            }
            setIsPaymentsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('company_payments')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('company_id', selectedCompany.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    // eslint-disable-next-line no-console
                    console.error("Error fetching company payments:", error);
                    return;
                }

                setPayments(
                    (data || []).map((row) => ({
                        id: row.id as string,
                        amount: Number(row.amount || 0),
                        previous_balance: Number(row.previous_balance || 0),
                        new_balance: Number(row.new_balance || 0),
                        note: row.note as string | null,
                        created_at: row.created_at as string,
                    }))
                );
            } finally {
                setIsPaymentsLoading(false);
            }
        };

        fetchPayments();
    }, [selectedCompany, user]);

    // Fetch all invoices when no company selected (for monthly report)
    useEffect(() => {
        const fetchAllInvoices = async () => {
            if (!user || selectedCompany) {
                if (!selectedCompany) setAllInvoices([]);
                return;
            }
            setIsLoadingAll(true);
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
                console.error("Error fetching all invoices:", error);
                toast({
                    title: "Error",
                    description: "Failed to load sales data for report.",
                    variant: "destructive"
                });
            } else {
                setAllInvoices(data || []);
            }
            setIsLoadingAll(false);
        };
        fetchAllInvoices();
    }, [user, selectedCompany]);

    const handleDownloadInvoice = async (invoice: Invoice) => {
        setIsGeneratingPdf(invoice.id);
        try {
            // Default fallbacks if profiles are empty
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
                title: "Success",
                description: "Invoice downloaded successfully."
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

    const filteredCompanies = companies.filter(c =>
        (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    const handleSelectCompany = (company: Company) => {
        setSelectedCompany(company);
        setSearchTerm("");
        setIsSearching(false);
        setHighlightedIndex(-1);
    };

    // --- EXCEL EXPORT ---
    const handleDownloadExcel = () => {
        if (!selectedCompany) return;

        const wb = XLSX.utils.book_new();

        // Sheet 1: Company Info
        const companyInfoData = [
            ['Company Report'],
            [],
            ['Company Name', selectedCompany.name],
            ['GST No.', selectedCompany.gstNo || 'N/A'],
            ['Address', selectedCompany.address || 'N/A'],
            ['State', selectedCompany.state || 'N/A'],
            ['State Code', selectedCompany.stateCode || 'N/A'],
            ['Pending Amount', `₹${(selectedCompany.pendingAmount ?? 0).toLocaleString()}`],
            ['Total Invoices', invoices.length],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Report Generated', formatIST(new Date())],
        ];
        const wsCompany = XLSX.utils.aoa_to_sheet(companyInfoData);
        wsCompany['!cols'] = [{ wch: 20 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, wsCompany, 'Company Info');

        // Sheet 2: Invoice Summary (date-wise)
        const invoiceRows = invoices
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((inv) => ({
                'Invoice No.': inv.invoice_number,
                'Date (IST)': formatIST(inv.created_at),
                'Total Amount': Number(inv.total_amount) || 0,
                'Amount Received': Number(inv.amount_received) || 0,
                'Balance Due': Math.max(0, Number(inv.total_amount) - Number(inv.amount_received || 0)),
                'Status': inv.status || 'sent',
                'Items Count': (inv.invoice_line_items || []).length,
            }));
        const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows);
        wsInvoices['!cols'] = [
            { wch: 16 }, { wch: 28 }, { wch: 14 },
            { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
        ];
        XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices');

        // Sheet 3: All Items sold (date-wise, per invoice line item)
        const itemRows: Record<string, any>[] = [];
        invoices
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .forEach((inv) => {
                (inv.invoice_line_items || []).forEach((li) => {
                    itemRows.push({
                        'Date (IST)': formatIST(inv.created_at),
                        'Invoice No.': inv.invoice_number,
                        'Item Name': li.item_name || li.inventory_items?.name || 'Item',
                        'HSN': li.item_hsn || li.inventory_items?.hsn || '',
                        'Unit': li.item_unit || li.inventory_items?.unit || 'pcs',
                        'Quantity': Number(li.quantity) || 0,
                        'Unit Price': Number(li.unit_price) || 0,
                        'Discount %': Number(li.discount) || 0,
                        'Total Amount': Number(li.line_total) || 0,
                    });
                });
            });
        const wsItems = XLSX.utils.json_to_sheet(itemRows.length > 0 ? itemRows : [{ 'No items found': '' }]);
        wsItems['!cols'] = [
            { wch: 28 }, { wch: 16 }, { wch: 24 }, { wch: 10 }, { wch: 8 },
            { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, wsItems, 'Item Details');

        // Sheet 4: Payment History
        const paymentRows = payments
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((p) => ({
                'Date (IST)': formatIST(p.created_at),
                'Amount Received': p.amount,
                'Previous Balance': p.previous_balance,
                'New Balance': p.new_balance,
                'Note': p.note || '',
            }));
        const wsPayments = XLSX.utils.json_to_sheet(paymentRows.length > 0 ? paymentRows : [{ 'No payments recorded': '' }]);
        wsPayments['!cols'] = [
            { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 30 },
        ];
        XLSX.utils.book_append_sheet(wb, wsPayments, 'Payment History');

        // Download
        const safeName = selectedCompany.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
        XLSX.writeFile(wb, `${safeName}_Report.xlsx`);
        toast({
            title: 'Excel downloaded',
            description: `Report for ${selectedCompany.name} downloaded successfully.`,
        });
    };

    // Calculate statistics
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const avgOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    // Prepare chart data (company view)
    const chartData = [...invoices]
        .reverse()
        .map(inv => ({
            name: formatISTShort(inv.created_at),
            total: Number(inv.total_amount)
        }))
        .slice(-10);

    // --- Monthly report (all trades) ---
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const monthlyMap = allInvoices.reduce<Record<string, { revenue: number; count: number }>>((acc, inv) => {
        const d = new Date(inv.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[key]) acc[key] = { revenue: 0, count: 0 };
        acc[key].revenue += Number(inv.total_amount) || 0;
        acc[key].count += 1;
        return acc;
    }, {});

    const monthlyChartData = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([key, v]) => ({
            month: key,
            name: new Date(key + '-01').toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', year: '2-digit' }),
            revenue: v.revenue,
            invoices: v.count
        }));

    const thisMonthRevenue = monthlyMap[thisMonthKey]?.revenue ?? 0;
    const lastMonthRevenue = monthlyMap[lastMonthKey]?.revenue ?? 0;
    const monthOverMonthGrowth = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : (thisMonthRevenue > 0 ? 100 : 0);

    const totalAllTimeRevenue = allInvoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const avgOrderAll = allInvoices.length > 0 ? totalAllTimeRevenue / allInvoices.length : 0;
    const uniqueCompanies = new Set(allInvoices.map(i => i.companies?.name).filter(Boolean)).size;

    const topCompaniesByRevenue = Object.entries(
        allInvoices.reduce<Record<string, number>>((acc, inv) => {
            const name = inv.companies?.name || 'Unknown';
            acc[name] = (acc[name] || 0) + Number(inv.total_amount);
            return acc;
        }, {})
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeekMap = allInvoices.reduce<Record<number, number>>((acc, inv) => {
        const day = new Date(inv.created_at).getDay();
        acc[day] = (acc[day] || 0) + Number(inv.total_amount);
        return acc;
    }, {});
    const dayOfWeekChartData = DAY_NAMES.map((name, i) => ({
        name,
        revenue: dayOfWeekMap[i] ?? 0,
        dayIndex: i
    })).filter(d => d.revenue > 0).length > 0
        ? DAY_NAMES.map((name, i) => ({ name, revenue: dayOfWeekMap[i] ?? 0 }))
        : DAY_NAMES.map((name, i) => ({ name, revenue: 0 }));

    const bestDayEntry = dayOfWeekChartData.length
        ? dayOfWeekChartData.reduce((best, cur) => (cur.revenue > best.revenue ? cur : best), dayOfWeekChartData[0])
        : null;

    const itemSalesMap = allInvoices.reduce<Record<string, { revenue: number; qty: number }>>((acc, inv) => {
        (inv.invoice_line_items || []).forEach((line) => {
            const name = (line.item_name || line.inventory_items?.name || 'Other').trim();
            if (!acc[name]) acc[name] = { revenue: 0, qty: 0 };
            acc[name].revenue += Number(line.line_total) || 0;
            acc[name].qty += Number(line.quantity) || 0;
        });
        return acc;
    }, {});
    const topItemsByRevenue = Object.entries(itemSalesMap)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10);
    const topItemsByQty = Object.entries(itemSalesMap)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 10);

    const bestMonthEntry = monthlyChartData.length
        ? monthlyChartData.reduce((best, cur) => (cur.revenue > best.revenue ? cur : best), monthlyChartData[0])
        : null;

    // Additional business metrics
    const totalOutstanding = companies.reduce((sum, c) => sum + Number(c.pendingAmount || 0), 0);
    const collectionRate = totalAllTimeRevenue > 0
        ? ((totalAllTimeRevenue - totalOutstanding) / totalAllTimeRevenue * 100)
        : 0;
    const avgRevenuePerCustomer = uniqueCompanies > 0 ? totalAllTimeRevenue / uniqueCompanies : 0;
    // Customer retention - customers with multiple invoices
    const customerInvoiceCount = allInvoices.reduce<Record<string, number>>((acc, inv) => {
        const name = inv.companies?.name || 'Unknown';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});
    const repeatCustomers = Object.values(customerInvoiceCount).filter(count => count > 1).length;
    const retentionRate = uniqueCompanies > 0 ? (repeatCustomers / uniqueCompanies * 100) : 0;

    // Outstanding amounts by customer
    const outstandingByCustomer = companies
        .filter(c => Number(c.pendingAmount || 0) > 0)
        .sort((a, b) => Number(b.pendingAmount || 0) - Number(a.pendingAmount || 0))
        .slice(0, 10)
        .map(c => ({
            name: c.name.length > 20 ? c.name.slice(0, 19) + '…' : c.name,
            amount: Number(c.pendingAmount || 0)
        }));

    const insights: { icon: React.ReactNode; title: string; detail: string; variant?: 'success' | 'warning' | 'neutral' }[] = [];
    if (monthOverMonthGrowth > 0 && thisMonthRevenue > 0) {
        insights.push({
            icon: <TrendingUp className="h-4 w-4" />,
            title: `Revenue up ${monthOverMonthGrowth.toFixed(1)}% vs last month`,
            detail: "Keep momentum with consistent outreach and follow-ups.",
            variant: 'success'
        });
    } else if (monthOverMonthGrowth < 0 && lastMonthRevenue > 0) {
        insights.push({
            icon: <Target className="h-4 w-4" />,
            title: `Revenue down ${Math.abs(monthOverMonthGrowth).toFixed(1)}% vs last month`,
            detail: "Focus on closing pending quotes and re-engaging inactive customers.",
            variant: 'warning'
        });
    }
    if (bestMonthEntry && bestMonthEntry.revenue > 0) {
        insights.push({
            icon: <Award className="h-4 w-4" />,
            title: `Best month: ${bestMonthEntry.name} (₹${(bestMonthEntry.revenue / 1_00_000).toFixed(1)}L)`,
            detail: "Replicate seasonal promotions or campaigns from that period."
        });
    }
    if (topCompaniesByRevenue.length > 0) {
        const topShare = topCompaniesByRevenue[0][1] / Math.max(1, totalAllTimeRevenue) * 100;
        if (topShare > 30) {
            insights.push({
                icon: <Building2 className="h-4 w-4" />,
                title: `Top customer contributes ${topShare.toFixed(0)}% of revenue`,
                detail: "Diversify client base to reduce concentration risk."
            });
        }
    }
    if (uniqueCompanies > 0 && allInvoices.length > 0) {
        const invPerCompany = allInvoices.length / uniqueCompanies;
        insights.push({
            icon: <BarChart3 className="h-4 w-4" />,
            title: `${uniqueCompanies} active customers · ${invPerCompany.toFixed(1)} orders/customer avg`,
            detail: "Increase repeat orders with loyalty offers or reminders."
        });
    }
    if (bestDayEntry && bestDayEntry.revenue > 0) {
        insights.push({
            icon: <Calendar className="h-4 w-4" />,
            title: `Peak sales day: ${bestDayEntry.name}`,
            detail: "Schedule promotions and outreach on this day for better response."
        });
    }
    if (topItemsByRevenue.length > 0 && topItemsByRevenue[0][1].revenue > 0) {
        const [itemName, data] = topItemsByRevenue[0];
        const pct = totalAllTimeRevenue > 0 ? (data.revenue / totalAllTimeRevenue * 100).toFixed(0) : '0';
        insights.push({
            icon: <Package className="h-4 w-4" />,
            title: `Top-selling item: ${itemName} (${pct}% of revenue)`,
            detail: "Keep stock and promote this product for maximum impact."
        });
    }

    // Payment & Collection Insights
    if (collectionRate < 80 && totalOutstanding > 0) {
        insights.push({
            icon: <Wallet className="h-4 w-4" />,
            title: `Collection rate: ${collectionRate.toFixed(1)}% · ₹${(totalOutstanding / 1000).toFixed(0)}k outstanding`,
            detail: "Focus on follow-ups for pending payments to improve cash flow.",
            variant: 'warning'
        });
    } else if (collectionRate >= 80 && totalOutstanding > 0) {
        insights.push({
            icon: <Wallet className="h-4 w-4" />,
            title: `Collection rate: ${collectionRate.toFixed(1)}% · Good payment collection`,
            detail: "Maintain payment follow-up processes to sustain this rate."
        });
    }

    // Customer Value Insights
    if (avgRevenuePerCustomer > 0) {
        insights.push({
            icon: <Building2 className="h-4 w-4" />,
            title: `Avg revenue per customer: ₹${(avgRevenuePerCustomer / 1000).toFixed(0)}k`,
            detail: avgRevenuePerCustomer > 50000
                ? "High customer value - focus on retention and upselling."
                : "Opportunity to increase order value through bundling or promotions."
        });
    }

    // Retention Insights
    if (retentionRate > 0) {
        insights.push({
            icon: <History className="h-4 w-4" />,
            title: `${retentionRate.toFixed(0)}% customer retention · ${repeatCustomers} repeat customers`,
            detail: retentionRate > 50
                ? "Strong customer loyalty - leverage for referrals and testimonials."
                : "Focus on post-sale follow-ups to increase repeat purchases."
        });
    }

    // Outstanding Amounts Insight
    if (outstandingByCustomer.length > 0 && outstandingByCustomer[0].amount > 0) {
        const topOutstanding = outstandingByCustomer[0];
        insights.push({
            icon: <Target className="h-4 w-4" />,
            title: `Top outstanding: ${topOutstanding.name} (₹${(topOutstanding.amount / 1000).toFixed(0)}k)`,
            detail: "Prioritize collection from top outstanding accounts.",
            variant: outstandingByCustomer[0].amount > 50000 ? 'warning' : 'neutral'
        });
    }

    // Growth Trend Insight
    if (monthlyChartData.length >= 3) {
        const recent3Months = monthlyChartData.slice(-3);
        const growthTrend = recent3Months[2].revenue > recent3Months[0].revenue;
        if (growthTrend) {
            insights.push({
                icon: <TrendingUp className="h-4 w-4" />,
                title: "Positive 3-month growth trend",
                detail: "Business is growing - scale operations and maintain quality.",
                variant: 'success'
            });
        }
    }

    // Sort insights by priority: warnings first, then success, then neutral
    insights.sort((a, b) => {
        const priority = { warning: 0, success: 1, neutral: 2, undefined: 2 };
        return priority[a.variant || 'neutral'] - priority[b.variant || 'neutral'];
    });

    const mainInsightsLimit = 4;
    const mainInsights = insights.slice(0, mainInsightsLimit);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <header className="invoice-page-header">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-primary" />
                            Sales report
                        </h1>
                        <p className="text-muted-foreground text-sm mt-0.5">View company-wise performance and transactions</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search company..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setIsSearching(true);
                                        setHighlightedIndex(-1);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            e.preventDefault();
                                            setIsSearching(false);
                                            setHighlightedIndex(-1);
                                            return;
                                        }
                                        if (!isSearching || !searchTerm || filteredCompanies.length === 0) return;
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            setHighlightedIndex((prev) =>
                                                prev < filteredCompanies.length - 1 ? prev + 1 : prev
                                            );
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                                        } else if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
                                            handleSelectCompany(filteredCompanies[idx]);
                                        }
                                    }}
                                    className="pl-9"
                                />
                            </div>
                            {selectedCompany && (
                                <Button variant="outline" size="icon" onClick={() => { setSelectedCompany(null); setInvoices([]); }}>
                                    ×
                                </Button>
                            )}
                        </div>
                        {isSearching && searchTerm && (
                            <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-card shadow-lg z-[100] max-h-80 overflow-y-auto animate-in fade-in">
                                {filteredCompanies.length > 0 ? (
                                    filteredCompanies.map((company, index) => (
                                        <button
                                            key={company.id}
                                            className={`w-full text-left px-4 py-3 border-b border-border last:border-0 flex items-center justify-between ${index === highlightedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                                            onClick={() => handleSelectCompany(company)}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                        >
                                            <div>
                                                <p className="text-sm font-medium">{company.name}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">No matching companies</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {!selectedCompany ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="invoice-card overflow-hidden border-primary/20">
                        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">Monthly Sales Report</h2>
                                    <p className="text-muted-foreground text-sm mt-0.5">Business insights across all trades · Select a company above for customer-wise details</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isLoadingAll ? (
                        <div className="invoice-card flex flex-col items-center justify-center py-24">
                            <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-sm text-muted-foreground">Loading sales data...</p>
                        </div>
                    ) : allInvoices.length === 0 ? (
                        <div className="invoice-card flex flex-col items-center justify-center py-24 text-center">
                            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4 border border-border">
                                <Building2 className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">No sales data yet</h3>
                            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                                Create invoices to see your monthly report and business insights here. You can also select a company above for customer-wise details.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <MetricCard
                                    title="This month revenue"
                                    value={`₹${thisMonthRevenue.toLocaleString()}`}
                                    description={lastMonthRevenue > 0 ? `${monthOverMonthGrowth >= 0 ? '+' : ''}${monthOverMonthGrowth.toFixed(1)}% vs last month` : "All-time this month"}
                                    icon={<IndianRupee className="h-5 w-5 text-emerald-500" />}
                                    status={monthOverMonthGrowth >= 0 ? "success" : "warning"}
                                />
                                <MetricCard
                                    title="Total revenue (all time)"
                                    value={`₹${totalAllTimeRevenue.toLocaleString()}`}
                                    description={`${allInvoices.length} invoices · ${uniqueCompanies} customers`}
                                    icon={<TrendingUp className="h-5 w-5 text-primary" />}
                                />
                                <MetricCard
                                    title="Average order value"
                                    value={`₹${avgOrderAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                    description="Per transaction average"
                                    icon={<BarChart3 className="h-5 w-5 text-zinc-400" />}
                                />
                            </div>

                            <div className="invoice-card overflow-hidden border-border shadow-sm">
                                <div className="p-6 pb-0">
                                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-primary" />
                                        Monthly revenue trend
                                    </h3>
                                    <p className="text-muted-foreground text-sm mt-0.5">Last 12 months · All trades</p>
                                </div>
                                <div className="p-6 pt-4">
                                    <div className="h-[320px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={monthlyChartData} margin={{ top: 16, right: 16, left: 8, bottom: 24 }} barCategoryGap="12%">
                                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} dy={8} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `₹${v / 1000}k`} width={44} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 10, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', padding: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                                                    itemStyle={{ color: 'hsl(var(--primary))' }}
                                                />
                                                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                                    {monthlyChartData.map((_, i) => (
                                                        <Cell key={i} fill={i === monthlyChartData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.7)'} stroke={i === monthlyChartData.length - 1 ? 'hsl(var(--primary))' : undefined} strokeWidth={i === monthlyChartData.length - 1 ? 1.5 : 0} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-card overflow-hidden">
                                <div className="p-6 pb-0">
                                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        Sales by day of week
                                    </h3>
                                    <p className="text-muted-foreground text-sm mt-0.5">Which days bring most revenue</p>
                                </div>
                                <div className="p-6 pt-4">
                                    <div className="h-[240px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dayOfWeekChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', padding: 12 }}
                                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                                />
                                                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="hsl(var(--primary) / 0.8)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-3">
                                <div className="lg:col-span-2 invoice-card">
                                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                                        <Lightbulb className="h-4 w-4 text-primary" />
                                        Key insights
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-4">Most important takeaways</p>
                                    {mainInsights.length > 0 ? (
                                        <div className="space-y-3">
                                            {mainInsights.map((ins, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex gap-4 p-4 rounded-xl border transition-colors ${ins.variant === 'success' ? 'bg-emerald-500/[0.06] border-emerald-500/30 hover:border-emerald-500/50' :
                                                        ins.variant === 'warning' ? 'bg-amber-500/[0.06] border-amber-500/30 hover:border-amber-500/50' :
                                                            'bg-card/80 border-border hover:border-primary/30'
                                                        }`}
                                                >
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ins.variant === 'success' ? 'bg-emerald-500/15 text-emerald-600' :
                                                        ins.variant === 'warning' ? 'bg-amber-500/15 text-amber-600' :
                                                            'bg-primary/10 text-primary'
                                                        }`}>
                                                        {ins.icon}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-foreground leading-snug">{ins.title}</p>
                                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ins.detail}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Add more sales data to see personalized insights.</p>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="invoice-card border-border shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-border bg-muted/20">
                                            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                                <Award className="h-4 w-4 text-primary" />
                                                Top customers
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">By total revenue</p>
                                        </div>
                                        {topCompaniesByRevenue.length > 0 ? (
                                            <div className="divide-y divide-border/60">
                                                {topCompaniesByRevenue.slice(0, 5).map(([name, rev], i) => {
                                                    const pct = totalAllTimeRevenue > 0 ? ((rev / totalAllTimeRevenue) * 100).toFixed(1) : '0';
                                                    const rankBg = i === 0 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : i === 1 ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400' : i === 2 ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400' : 'bg-muted/60 text-muted-foreground';
                                                    return (
                                                        <div key={name} className={`flex items-center gap-3 px-4 py-3 ${i % 2 === 0 ? 'bg-muted/15' : 'bg-background'} transition-colors hover:bg-muted/25`}>
                                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${rankBg}`}>
                                                                {i + 1}
                                                            </span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-foreground truncate">{name}</p>
                                                                <p className="text-[11px] text-muted-foreground">Share: {pct}%</p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-sm font-semibold text-foreground">₹{rev.toLocaleString()}</p>
                                                                <p className="text-[10px] text-muted-foreground">revenue</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-6 text-center">
                                                <Award className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">No customer data yet.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="invoice-card border-border shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-border bg-muted/20">
                                            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                                <Package className="h-4 w-4 text-primary" />
                                                Top selling items
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">By revenue</p>
                                        </div>
                                        {topItemsByRevenue.length > 0 ? (
                                            <div className="divide-y divide-border/60">
                                                {topItemsByRevenue.slice(0, 5).map(([name, data], i) => {
                                                    const pct = totalAllTimeRevenue > 0 ? ((data.revenue / totalAllTimeRevenue) * 100).toFixed(1) : '0';
                                                    const rankBg = i === 0 ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : i === 1 ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400' : i === 2 ? 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' : 'bg-muted/60 text-muted-foreground';
                                                    return (
                                                        <div key={name} className={`flex items-center gap-3 px-4 py-3 ${i % 2 === 0 ? 'bg-muted/15' : 'bg-background'} transition-colors hover:bg-muted/25`}>
                                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${rankBg}`}>
                                                                {i + 1}
                                                            </span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-foreground truncate">{name}</p>
                                                                <p className="text-[11px] text-muted-foreground">Share: {pct}% · {data.qty} sold</p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-sm font-semibold text-foreground">₹{data.revenue.toLocaleString()}</p>
                                                                <p className="text-[10px] text-muted-foreground">revenue</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-6 text-center">
                                                <Package className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">No item data yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => setShowDetailedInsights(!showDetailedInsights)}
                                >
                                    {showDetailedInsights ? (
                                        <>
                                            <ChevronUp className="h-4 w-4" />
                                            Hide detailed insights
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight className="h-4 w-4" />
                                            More detailed insights
                                        </>
                                    )}
                                </Button>
                            </div>

                            {showDetailedInsights && (
                                <div className="space-y-6 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-300">
                                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        Detailed insights &amp; reports
                                    </h3>

                                    <div className="invoice-card overflow-hidden">
                                        <div className="p-4 pb-0">
                                            <h4 className="text-sm font-semibold text-foreground">Item sales by revenue (top 10)</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">Revenue contribution by product</p>
                                        </div>
                                        <div className="p-4 h-[280px]">
                                            {topItemsByRevenue.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={topItemsByRevenue.slice(0, 10).map(([name, d]) => ({ name: name.length > 12 ? name.slice(0, 11) + '…' : name, revenue: d.revenue }))} layout="vertical" margin={{ left: 4, right: 4 }} barCategoryGap="20%">
                                                        <XAxis type="number" tickFormatter={(v) => `₹${v / 1000}k`} fontSize={9} />
                                                        <YAxis type="category" dataKey="name" width={80} fontSize={9} tickLine={false} />
                                                        <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                                                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No item data</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <div className="invoice-card">
                                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                Monthly summary
                                            </h4>
                                            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Month</TableHead>
                                                            <TableHead className="text-right">Invoices</TableHead>
                                                            <TableHead className="text-right">Revenue</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {[...monthlyChartData].reverse().map((row) => (
                                                            <TableRow key={row.month}>
                                                                <TableCell className="font-medium text-xs">{row.name}</TableCell>
                                                                <TableCell className="text-right text-xs">{row.invoices}</TableCell>
                                                                <TableCell className="text-right font-mono text-xs">₹{row.revenue.toLocaleString()}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                        <div className="invoice-card">
                                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                                <Package className="h-4 w-4 text-primary" />
                                                Top items by quantity sold
                                            </h4>
                                            <div className="space-y-2 max-h-[320px] overflow-y-auto">
                                                {topItemsByQty.length > 0 ? (
                                                    topItemsByQty.map(([name, data], i) => (
                                                        <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                                            <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                                                            <span className="text-sm font-medium truncate flex-1 min-w-0">{name}</span>
                                                            <span className="text-sm font-semibold shrink-0">{data.qty} units</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">No data</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="invoice-card overflow-hidden">
                                            <div className="p-4 pb-0">
                                                <h4 className="text-sm font-semibold text-foreground">Sales by day of week</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">Revenue distribution across weekdays</p>
                                            </div>
                                            <div className="p-4 pt-2 h-[240px]">
                                                {dayOfWeekChartData.some(d => d.revenue > 0) ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={dayOfWeekChartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                                                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                                            <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                                                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No data</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {outstandingByCustomer.length > 0 && (
                                        <div className="invoice-card overflow-hidden">
                                            <div className="p-4 pb-0">
                                                <h4 className="text-sm font-semibold text-foreground">Top outstanding amounts by customer</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">Focus collection efforts on these accounts</p>
                                            </div>
                                            <div className="p-4 h-[280px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={outstandingByCustomer} layout="vertical" margin={{ left: 4, right: 4 }} barCategoryGap="20%">
                                                        <XAxis type="number" tickFormatter={(v) => `₹${v / 1000}k`} fontSize={9} />
                                                        <YAxis type="category" dataKey="name" width={100} fontSize={9} tickLine={false} />
                                                        <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Outstanding']} />
                                                        <Bar dataKey="amount" radius={[0, 4, 4, 0]} fill="hsl(var(--destructive) / 0.7)" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    <div className="invoice-card">
                                        <h4 className="text-sm font-semibold text-foreground mb-3">All insights</h4>
                                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                            {insights.length > 0 ? insights.map((ins, i) => (
                                                <div key={i} className={`flex gap-3 p-3 rounded-lg border ${ins.variant === 'warning' ? 'bg-amber-500/[0.06] border-amber-500/25' :
                                                    ins.variant === 'success' ? 'bg-emerald-500/[0.06] border-emerald-500/25' :
                                                        'bg-muted/40 border-border'
                                                    }`}>
                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${ins.variant === 'warning' ? 'bg-amber-500/15 text-amber-600' :
                                                        ins.variant === 'success' ? 'bg-emerald-500/15 text-emerald-600' :
                                                            'bg-primary/10 text-primary'
                                                        }`}>{ins.icon}</div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-foreground leading-snug">{ins.title}</p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{ins.detail}</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-sm text-muted-foreground">No insights yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex p-1 bg-muted rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab("stats")}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === "stats" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === "history" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            History
                        </button>
                    </div>

                    {activeTab === "stats" ? (
                        <>
                            <div className="invoice-card overflow-hidden">
                                <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-foreground">{selectedCompany.name}</h2>
                                        {selectedCompany.state && (
                                            <p className="text-muted-foreground text-sm mt-1">{selectedCompany.state}</p>
                                        )}
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 shrink-0"
                                            onClick={handleDownloadExcel}
                                            disabled={isLoading || invoices.length === 0}
                                        >
                                            <FileSpreadsheet className="h-4 w-4" />
                                            Download Excel
                                        </Button>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current balance</p>
                                            <p className={`text-2xl font-bold ${selectedCompany.pendingAmount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                ₹{selectedCompany.pendingAmount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-t border-border">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Company</p>
                                            <p className="text-sm text-foreground">{selectedCompany.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Last transaction</p>
                                            <p className="text-sm text-foreground">
                                                {selectedCompany.lastTransaction
                                                    ? formatISTDate(selectedCompany.lastTransaction)
                                                    : "New customer"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                                <TrendingUp className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Volume</p>
                                                <p className="text-sm text-foreground">{invoices.length} invoices</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => {
                                                setPaymentAmount('');
                                                setPaymentNote('');
                                                setShowPaymentDialog(true);
                                            }}
                                        >
                                            <Wallet className="h-3.5 w-3.5" />
                                            Record payment
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <MetricCard
                                    title="Total Sales"
                                    value={`₹${totalRevenue.toLocaleString()}`}
                                    description="Aggregate trade value"
                                    icon={<IndianRupee className="h-5 w-5 text-emerald-500" />}
                                />
                                <MetricCard
                                    title="Invoices"
                                    value={invoices.length.toString()}
                                    description="Total transactions"
                                    icon={<Receipt className="h-5 w-5 text-blue-500" />}
                                />
                                <MetricCard
                                    title="Order Average"
                                    value={`₹${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                    description="Avg. per transaction"
                                    icon={<TrendingUp className="h-5 w-5 text-zinc-400" />}
                                />
                                <MetricCard
                                    title="Trust Score"
                                    value="High" // Symbolic, could be dynamic
                                    description="Based on payment history"
                                    status="success"
                                    icon={<History className="h-5 w-5 text-purple-500" />}
                                />
                            </div>

                            <div className="invoice-card overflow-hidden">
                                <div className="p-6 pb-0">
                                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        Revenue (last 10 orders)
                                    </h3>
                                    <p className="text-muted-foreground text-sm mt-0.5">Sales performance</p>
                                </div>
                                <div className="p-6 pt-4">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', padding: 12 }}
                                                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 600 }}
                                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                />
                                                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} activeDot={{ r: 5 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    Transactions
                                </h3>
                                {invoices.length > 0 ? (
                                    invoices.map((inv) => (
                                        <Card
                                            key={inv.id}
                                            className="invoice-card cursor-pointer hover:border-primary/40 transition-colors"
                                            onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                                                            <Receipt className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-foreground">{inv.invoice_number}</p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {formatISTShort(inv.created_at)}
                                                                · {(inv.invoice_line_items || []).length} item{(inv.invoice_line_items || []).length !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right">
                                                            <p className="font-semibold text-foreground">₹{Number(inv.total_amount).toLocaleString()}</p>
                                                        </div>
                                                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === inv.id ? 'rotate-180' : ''}`} />
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-9 w-9"
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
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!user || !selectedCompany) return;
                                                                const confirmDelete = window.confirm(`Delete invoice ${inv.invoice_number}? This cannot be undone.`);
                                                                if (!confirmDelete) return;

                                                                try {
                                                                    const total = Number(inv.total_amount || 0);
                                                                    const { data: companyRow, error: companyError } = await supabase
                                                                        .from('companies')
                                                                        .select('pending_amount')
                                                                        .eq('id', selectedCompany.id)
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

                                                                    const nowIso = new Date().toISOString();

                                                                    const { error: updateError } = await supabase
                                                                        .from('companies')
                                                                        .update({
                                                                            pending_amount: next,
                                                                            last_transaction: nowIso,
                                                                        })
                                                                        .eq('id', selectedCompany.id)
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

                                                                    const { error: deleteError } = await supabase
                                                                        .from('invoices')
                                                                        .delete()
                                                                        .eq('id', inv.id)
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

                                                                    // Update local state
                                                                    setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
                                                                    setAllInvoices((prev) => prev.filter((i) => i.id !== inv.id));
                                                                    setSelectedCompany({
                                                                        ...selectedCompany,
                                                                        pendingAmount: next,
                                                                        lastTransaction: nowIso,
                                                                    });
                                                                    setCompanies((prev) =>
                                                                        prev.map((c) =>
                                                                            c.id === selectedCompany.id
                                                                                ? { ...c, pendingAmount: next, lastTransaction: nowIso }
                                                                                : c,
                                                                        ),
                                                                    );

                                                                    toast({
                                                                        title: 'Invoice deleted',
                                                                        description: `Invoice ${inv.invoice_number} has been deleted and balance updated.`,
                                                                    });
                                                                } catch (error) {
                                                                    console.error('Unexpected error deleting invoice:', error);
                                                                    toast({
                                                                        title: 'Error',
                                                                        description: 'An unexpected error occurred while deleting the invoice.',
                                                                        variant: 'destructive',
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {expandedId === inv.id && (
                                                    <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Payment</p>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-muted-foreground">Invoice total</span>
                                                                <span className="font-medium text-foreground">₹{Number(inv.total_amount).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-muted-foreground">Amount received</span>
                                                                <span className="font-medium text-emerald-600">₹{Number(inv.amount_received || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs pt-2 border-t border-border">
                                                                <span className="text-muted-foreground">Balance due</span>
                                                                <span className={`font-medium ${Number(inv.total_amount) - Number(inv.amount_received || 0) <= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                                    ₹{Math.max(0, Number(inv.total_amount) - Number(inv.amount_received || 0)).toLocaleString()}
                                                                </span>
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
                                    ))
                                ) : (
                                    <div className="invoice-card flex flex-col items-center justify-center py-16 text-center">
                                        <History className="h-10 w-10 text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground">No transactions for this company.</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="invoice-card p-4">
                                    <h4 className="text-sm font-semibold text-foreground mb-3">Summary</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Lifetime trade</p>
                                            <p className="text-lg font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total invoices</p>
                                            <p className="text-lg font-bold text-foreground">{invoices.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Highest transaction</p>
                                            <p className="text-base font-bold text-foreground">₹{invoices.length > 0 ? Math.max(...invoices.map(i => i.total_amount)).toLocaleString() : '0'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="invoice-card p-4">
                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-primary" />
                                        Payment history
                                    </h4>
                                    {isPaymentsLoading ? (
                                        <p className="text-xs text-muted-foreground">Loading...</p>
                                    ) : payments.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No payments recorded yet.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-72 overflow-y-auto">
                                            {payments.map((p) => (
                                                <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatIST(p.created_at)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Balance: ₹{p.previous_balance.toLocaleString()} → <span className="font-semibold text-foreground">₹{p.new_balance.toLocaleString()}</span>
                                                        </p>
                                                        {p.note && (
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Note: {p.note}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-emerald-600">
                                                            +₹{p.amount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Record payment dialog */}
            {selectedCompany && (
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-primary" />
                                Record payment for {selectedCompany.name}
                            </DialogTitle>
                            <DialogDescription>
                                Enter the amount received from this customer. This will update their pending balance and create a balance history entry.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Current pending balance</span>
                                    <span className="font-semibold text-orange-600">
                                        ₹{selectedCompany.pendingAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-amount" className="text-sm font-medium">
                                    Amount received (₹)
                                </Label>
                                <Input
                                    id="payment-amount"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-note" className="text-sm font-medium">
                                    Note (optional)
                                </Label>
                                <Input
                                    id="payment-note"
                                    placeholder="e.g. Cash, UPI, Bank transfer"
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    if (!user || !selectedCompany) return;
                                    const amount = Number(paymentAmount);
                                    if (!amount || amount <= 0) {
                                        toast({
                                            title: "Invalid amount",
                                            description: "Enter a positive amount.",
                                            variant: "destructive",
                                        });
                                        return;
                                    }
                                    if (amount > selectedCompany.pendingAmount) {
                                        toast({
                                            title: "Amount too large",
                                            description: "Received amount cannot be more than current pending balance.",
                                            variant: "destructive",
                                        });
                                        return;
                                    }

                                    const previous = selectedCompany.pendingAmount;
                                    const next = Math.max(0, previous - amount);
                                    const nowIso = new Date().toISOString();

                                    try {
                                        const { error: insertError } = await supabase
                                            .from('company_payments')
                                            .insert({
                                                user_id: user.id,
                                                company_id: selectedCompany.id,
                                                amount,
                                                previous_balance: previous,
                                                new_balance: next,
                                                note: paymentNote || null,
                                            });
                                        if (insertError) {
                                            throw insertError;
                                        }

                                        const { error: updateError } = await supabase
                                            .from('companies')
                                            .update({
                                                pending_amount: next,
                                                last_transaction: nowIso,
                                            })
                                            .eq('id', selectedCompany.id)
                                            .eq('user_id', user.id);
                                        if (updateError) {
                                            throw updateError;
                                        }

                                        // Update local state
                                        setSelectedCompany({
                                            ...selectedCompany,
                                            pendingAmount: next,
                                            lastTransaction: nowIso,
                                        });
                                        setCompanies((prev) =>
                                            prev.map((c) =>
                                                c.id === selectedCompany.id
                                                    ? { ...c, pendingAmount: next, lastTransaction: nowIso }
                                                    : c
                                            )
                                        );

                                        // Refresh payments list
                                        setPayments((prev) => [
                                            {
                                                id: `local-${Date.now()}`,
                                                amount,
                                                previous_balance: previous,
                                                new_balance: next,
                                                note: paymentNote || null,
                                                created_at: nowIso,
                                            },
                                            ...prev,
                                        ]);

                                        toast({
                                            title: "Payment recorded",
                                            description: "Customer balance has been updated.",
                                        });
                                        setShowPaymentDialog(false);
                                        setPaymentAmount('');
                                        setPaymentNote('');
                                    } catch (error) {
                                        // eslint-disable-next-line no-console
                                        console.error("Failed to record payment:", error);
                                        toast({
                                            title: "Error",
                                            description: "Failed to record payment. Please try again.",
                                            variant: "destructive",
                                        });
                                    }
                                }}
                            >
                                <Wallet className="h-4 w-4 mr-2" />
                                Save payment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

function MetricCard({ title, value, description, icon, status }: {
    title: string,
    value: string,
    description: string,
    icon: React.ReactNode,
    status?: "success" | "warning" | "default"
}) {
    return (
        <Card className="invoice-card">
            <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-2">
                    <div className={`text-xl font-bold ${status === 'warning' ? 'text-orange-600' : status === 'success' ? 'text-emerald-600' : 'text-foreground'}`}>
                        {value}
                    </div>
                    <div className="text-muted-foreground">{icon}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    );
}
