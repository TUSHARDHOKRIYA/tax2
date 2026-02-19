import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Company } from "@/data/mockData";
import { formatIST, formatISTShort } from "@/lib/dateUtils";
import {
  Wallet,
  Search,
  Building2,
  IndianRupee,
  Plus,
  History,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface CompanyPayment {
  id: string;
  company_id: string;
  company_name?: string;
  amount: number;
  previous_balance: number;
  new_balance: number;
  note?: string | null;
  created_at: string;
}

export default function ManagePayments() {
  const { user } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [allPayments, setAllPayments] = useState<CompanyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [companyPayments, setCompanyPayments] = useState<Record<string, CompanyPayment[]>>({});

  const totalOutstanding = useMemo(
    () => companies.reduce((sum, c) => sum + (c.pendingAmount ?? 0), 0),
    [companies]
  );

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.gstNo && c.gstNo.toLowerCase().includes(term))
    );
  }, [companies, searchTerm]);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("pending_amount", { ascending: false });

    if (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies.");
      setLoading(false);
      return;
    }

    setCompanies(
      (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        gstNo: row.gst_no ?? "",
        address: row.address ?? "",
        state: row.state ?? "",
        stateCode: row.state_code ?? "",
        pendingAmount: Number(row.pending_amount ?? 0),
        lastTransaction: row.last_transaction,
        phone: row.phone,
        email: row.email,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const loadAllPayments = useCallback(async () => {
    if (!user) return;
    setPaymentsLoading(true);
    const { data, error } = await supabase
      .from("company_payments")
      .select(`
        id,
        company_id,
        amount,
        previous_balance,
        new_balance,
        note,
        created_at,
        companies ( name )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      setPaymentsLoading(false);
      return;
    }

    const list: CompanyPayment[] = (data || []).map((row: any) => ({
      id: row.id,
      company_id: row.company_id,
      company_name: row.companies?.name,
      amount: Number(row.amount ?? 0),
      previous_balance: Number(row.previous_balance ?? 0),
      new_balance: Number(row.new_balance ?? 0),
      note: row.note,
      created_at: row.created_at,
    }));

    setAllPayments(list);

    const byCompany: Record<string, CompanyPayment[]> = {};
    list.forEach((p) => {
      if (!byCompany[p.company_id]) byCompany[p.company_id] = [];
      byCompany[p.company_id].push(p);
    });
    setCompanyPayments(byCompany);
    setPaymentsLoading(false);
  }, [user]);

  useEffect(() => {
    loadAllPayments();
  }, [loadAllPayments]);

  const openAddPayment = (company: Company) => {
    setSelectedCompany(company);
    setPaymentAmount("");
    setPaymentNote("");
    setShowPaymentDialog(true);
  };

  const handleRecordPayment = async () => {
    if (!user || !selectedCompany) return;
    const amount = Number(paymentAmount.replace(/,/g, "").trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    const pending = selectedCompany.pendingAmount ?? 0;
    if (amount > pending) {
      toast.error("Amount cannot be more than pending balance (₹" + pending.toLocaleString() + ").");
      return;
    }

    setSubmitting(true);
    const previous = pending;
    const next = Math.max(0, previous - amount);

    try {
      const { error: insertError } = await supabase.from("company_payments").insert({
        user_id: user.id,
        company_id: selectedCompany.id,
        amount,
        previous_balance: previous,
        new_balance: next,
        note: paymentNote.trim() || null,
      });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("companies")
        .update({
          pending_amount: next,
          last_transaction: new Date().toISOString(),
        })
        .eq("id", selectedCompany.id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selectedCompany.id
            ? { ...c, pendingAmount: next, lastTransaction: new Date().toISOString() }
            : c
        )
      );

      setShowPaymentDialog(false);
      setSelectedCompany(null);
      setPaymentAmount("");
      setPaymentNote("");

      toast.success("Payment recorded. Balance updated.");
      await loadAllPayments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- DELETE PAYMENT ---
  const handleDeletePayment = async (payment: CompanyPayment) => {
    if (!user) return;
    const confirmDelete = window.confirm(
      `Delete payment of ₹${payment.amount.toLocaleString()} for ${payment.company_name || "this company"}? The balance will be restored.`
    );
    if (!confirmDelete) return;

    try {
      // 1. Get current company pending_amount
      const { data: companyRow, error: companyError } = await supabase
        .from("companies")
        .select("pending_amount")
        .eq("id", payment.company_id)
        .eq("user_id", user.id)
        .single();

      if (companyError) {
        console.error("Failed to load company:", companyError);
        toast.error("Could not load company balance.");
        return;
      }

      const currentPending = Number(companyRow?.pending_amount ?? 0);
      const restoredPending = currentPending + payment.amount;

      // 2. Delete the payment record
      const { error: deleteError } = await supabase
        .from("company_payments")
        .delete()
        .eq("id", payment.id)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Failed to delete payment:", deleteError);
        toast.error("Failed to delete payment.");
        return;
      }

      // 3. Update company pending_amount (add the payment back)
      const { error: updateError } = await supabase
        .from("companies")
        .update({
          pending_amount: restoredPending,
          last_transaction: new Date().toISOString(),
        })
        .eq("id", payment.company_id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update company balance:", updateError);
        toast.error("Payment deleted but failed to update company balance.");
      }

      // 4. Update local state
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === payment.company_id
            ? { ...c, pendingAmount: restoredPending, lastTransaction: new Date().toISOString() }
            : c
        )
      );

      toast.success("Payment deleted. Balance restored.");
      await loadAllPayments();
    } catch (err) {
      console.error("Unexpected error deleting payment:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <header className="invoice-page-header">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Manage Payments</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              View pending balances, record payments, and track history
            </p>
          </div>
        </div>
      </header>

      <Card className="invoice-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Total outstanding
          </CardTitle>
          <CardDescription>Sum of pending amount across all companies</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">
            ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      <Card className="invoice-card">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Companies with pending balance
              </CardTitle>
              <CardDescription>Search and add payment received</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search company name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading companies...</p>
          ) : filteredCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "No companies match your search." : "No companies found."}
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredCompanies.map((company) => {
                const pending = company.pendingAmount ?? 0;
                const expanded = expandedCompanyId === company.id;
                const payments = companyPayments[company.id] || [];

                return (
                  <li
                    key={company.id}
                    className="border border-border rounded-lg overflow-hidden bg-card"
                  >
                    <div className="flex items-center justify-between gap-2 p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-muted"
                          onClick={() =>
                            setExpandedCompanyId((id) => (id === company.id ? null : company.id))
                          }
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{company.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Pending: ₹{pending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={pending <= 0}
                        onClick={() => openAddPayment(company)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add payment
                      </Button>
                    </div>

                    {expanded && (
                      <div className="border-t border-border bg-muted/30 px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Payment history (company-wise)
                        </p>
                        {payments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No payments recorded yet.</p>
                        ) : (
                          <ul className="space-y-1.5 text-xs">
                            {payments.map((p) => (
                              <li
                                key={p.id}
                                className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0"
                              >
                                <span className="text-muted-foreground">
                                  {formatIST(p.created_at)}
                                </span>
                                <span className="font-medium text-emerald-600">
                                  +₹{p.amount.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">
                                  ₹{p.previous_balance.toLocaleString()} → ₹
                                  {p.new_balance.toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  title="Delete this payment"
                                  className="p-1 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"
                                  onClick={() => handleDeletePayment(p)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="invoice-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            All payments (cumulative)
          </CardTitle>
          <CardDescription>Latest payments across all companies</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading payment history...</p>
          ) : allPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 font-medium">Date & time (IST)</th>
                    <th className="text-left py-2 font-medium">Company</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                    <th className="text-right py-2 font-medium">Balance after</th>
                    <th className="text-center py-2 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">{formatIST(p.created_at)}</td>
                      <td className="py-2 font-medium">{p.company_name ?? "—"}</td>
                      <td className="py-2 text-right font-medium text-emerald-600">
                        +₹{p.amount.toLocaleString()}
                      </td>
                      <td className="py-2 text-right font-mono">
                        ₹{p.new_balance.toLocaleString()}
                      </td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          title="Delete this payment"
                          className="p-1 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"
                          onClick={() => handleDeletePayment(p)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {selectedCompany && (
                <>
                  Add amount received from <strong>{selectedCompany.name}</strong>. Pending balance: ₹
                  {(selectedCompany.pendingAmount ?? 0).toLocaleString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRecordPayment();
              }}
            >
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Amount received (₹) *</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-note">Note (optional)</Label>
                  <Input
                    id="payment-note"
                    placeholder="e.g. Bank transfer, Cheque no."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Recording..." : "Record payment"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
