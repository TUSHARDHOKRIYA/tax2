import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Company, companies as defaultCompanies } from '@/data/mockData';
import { useInvoiceWizardStore } from '@/store/invoiceWizardStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import AddCompanyDialog from '@/components/AddCompanyDialog';
import EditCompanyDialog from '@/components/EditCompanyDialog';
import { Users, Search, ArrowRight, MapPin, Phone, Wallet, Pencil, Trash2 } from 'lucide-react';

const CustomerStep = () => {
  const navigate = useNavigate();
  const { items, company, setCompany, editingInvoiceNumber } = useInvoiceWizardStore();
  const { user } = useAuthStore();
  const [allCompanies, setAllCompanies] = useState<Company[]>(defaultCompanies);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (error || !data) return;

        setAllCompanies(
          data.map((row) => ({
            id: row.id as string,
            name: row.name as string,
            gstNo: (row.gst_no as string) || 'N/A',
            address: (row.address as string) || '',
            state: (row.state as string) || '',
            stateCode: (row.state_code as string) || '',
            pendingAmount: Number(row.pending_amount || 0),
            lastTransaction: row.last_transaction as string | undefined,
            phone: (row.phone as string) || undefined,
            email: (row.email as string) || undefined,
          })),
        );
      } catch {
        // Ignore; fall back to defaults
      }
    };

    void load();
  }, [user]);

  useEffect(() => {
    // Allow starting from customer page - no redirect needed
  }, [items.length, navigate]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allCompanies;
    return allCompanies.filter((c) =>
      c.name.toLowerCase().includes(term),
    );
  }, [allCompanies, search]);

  // Keep highlighted index in range when filtered list changes
  useEffect(() => {
    setHighlightedIndex((prev) => (filtered.length === 0 ? 0 : Math.min(prev, filtered.length - 1)));
  }, [filtered.length]);

  const handleSelect = (c: Company) => {
    setCompany(c);
  };

  const handleSaveEditedCompany = async (updated: Company) => {
    // Always update UI state
    setAllCompanies((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
    if (company?.id === updated.id) {
      setCompany(updated);
    }

    if (!user) {
      alert('Not logged in – changes are only saved for this session.');
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: updated.name,
          phone: updated.phone,
          email: updated.email,
          address: updated.address,
          pending_amount: updated.pendingAmount ?? 0,
        })
        .eq('id', updated.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Failed to update company in database:', error);
        alert(`Failed to update company in database: ${error.message}`);
      }
    } catch (err) {
      console.error('❌ Unexpected error during company update:', err);
      alert('An unexpected error occurred while updating the company.');
    }
  };

  const handleDeleteCompany = async (target: Company) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to move "${target.name}" to Junk? It can be restored within 30 days, after which it will be permanently deleted.`,
    );
    if (!confirmDelete) return;

    // Always update UI state
    setDeletingId(target.id);
    setAllCompanies((prev) => prev.filter((c) => c.id !== target.id));
    if (company?.id === target.id) {
      setCompany(null);
    }

    if (!user) {
      alert('Not logged in – deletion is only for this session.');
      setDeletingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', target.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Failed to delete company from database:', error);
        alert(`Failed to delete company from database: ${error.message}`);
      }
    } catch (err) {
      console.error('❌ Unexpected error during company delete:', err);
      alert('An unexpected error occurred while deleting the company.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCompanyWizard = (c: Company) => {
    if (!user) {
      alert("Please log in to save companies permanently.");
      setAllCompanies((prev) => [...prev, c]);
      setCompany(c);
      return;
    }

    // Wrap in a promise to handle loading/error feedback
    const saveToDb = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .insert({
            user_id: user.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            address: c.address,
            pending_amount: c.pendingAmount ?? 0,
            state: c.state || 'Maharashtra',
            state_code: c.stateCode || '27',
            last_transaction: c.lastTransaction
              ? new Date(c.lastTransaction).toISOString()
              : null,
          })
          .select('*')
          .single();

        if (error) {
          console.error('❌ Database insert error:', error);
          alert(`Failed to save to database: ${error.message}`);
          // Fallback to memory but let user know
          setAllCompanies((prev) => [...prev, c]);
          setCompany(c);
          return;
        }

        if (data) {
          const saved: Company = {
            id: data.id as string,
            name: data.name as string,
            gstNo: (data.gst_no as string) || 'N/A',
            address: (data.address as string) || '',
            state: (data.state as string) || '',
            stateCode: (data.state_code as string) || '',
            pendingAmount: Number(data.pending_amount || 0),
            lastTransaction: data.last_transaction as string | undefined,
            phone: data.phone as string | undefined,
            email: data.email as string | undefined,
          };

          setAllCompanies((prev) => [...prev, saved]);
          setCompany(saved);
          console.log('✅ Company saved to database:', saved.name);
        }
      } catch (err) {
        console.error('❌ Unexpected error during save:', err);
        alert("An unexpected error occurred while saving to the database.");
        setAllCompanies((prev) => [...prev, c]);
        setCompany(c);
      }
    };

    void saveToDb();
  };

  const goNext = (options?: { skipAlertIfNoCompany?: boolean }) => {
    if (!company) {
      if (!options?.skipAlertIfNoCompany) {
        alert('Select a customer first (use arrow keys + Enter).');
      }
      return;
    }
    navigate('/dashboard/items');
  };

  // Shift+Enter anywhere on page → next step
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        goNext({ skipAlertIfNoCompany: true });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [company]);

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
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Step 1 – Select customer
              </h1>
              <p className="text-sm text-muted-foreground">
                Search by name · ↑↓ to move, Enter to select
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <section className="space-y-4">
            <Card className="invoice-card border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    Search customer
                  </CardTitle>
                  <AddCompanyDialog onAddCompany={handleAddCompanyWizard} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  autoFocus
                  placeholder="Type name or GST..."
                  className="rounded-lg bg-muted/30 border-border focus:bg-background"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.shiftKey) {
                      e.preventDefault();
                      const target = filtered[highlightedIndex] ?? filtered[0];
                      if (target) {
                        handleSelect(target);
                      }
                      goNext({ skipAlertIfNoCompany: true });
                      return;
                    }
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndex((prev) =>
                        filtered.length ? Math.min(prev + 1, filtered.length - 1) : 0
                      );
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIndex((prev) => Math.max(0, prev - 1));
                      return;
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = filtered[highlightedIndex] ?? filtered[0];
                      if (target) handleSelect(target);
                    }
                  }}
                />
                <div className="max-h-[360px] overflow-y-auto rounded-lg border border-border bg-muted/20">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-muted-foreground">No matching companies.</p>
                      <p className="text-xs text-muted-foreground mt-1">Add a new company using the button above.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {filtered.map((c, index) => {
                        const isSelected = company?.id === c.id;
                        const isHighlighted = index === highlightedIndex;
                        const isDeleting = deletingId === c.id;
                        return (
                          <li
                            key={c.id}
                            tabIndex={0}
                            className={`px-4 py-3 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset rounded-none ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                              } ${isHighlighted && !isSelected ? 'bg-muted/50' : ''} ${!isSelected && !isHighlighted ? 'hover:bg-muted/30' : ''}`}
                            onClick={() => { handleSelect(c); setHighlightedIndex(index); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.shiftKey) {
                                e.preventDefault();
                                handleSelect(c);
                                goNext({ skipAlertIfNoCompany: true });
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSelect(c);
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                const next = Math.min(index + 1, filtered.length - 1);
                                setHighlightedIndex(next);
                                (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const prev = Math.max(0, index - 1);
                                setHighlightedIndex(prev);
                                (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground truncate">{c.name}</p>
                                {c.address && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    {c.address}
                                  </p>
                                )}
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {c.state} · Code {c.stateCode}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {isSelected && (
                                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                )}
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingCompany(c);
                                      setEditDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    disabled={isDeleting}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      void handleDeleteCompany(c);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <Card className="invoice-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Selected customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!company ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 px-4 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">No customer selected</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Choose one from the list on the left</p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/20 border border-border p-4 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground text-base">{company.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{company.state} · {company.stateCode}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCompany(company);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/50"
                          disabled={deletingId === company.id}
                          onClick={() => void handleDeleteCompany(company)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    {(company.phone || company.email) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span className="font-mono text-xs">{company.phone || '—'}</span>
                        {company.email && <span className="text-xs">· {company.email}</span>}
                      </div>
                    )}
                    {company.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="text-xs">{company.address}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" />
                        Previous balance
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        ₹{(company.pendingAmount ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="invoice-card border-border">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
                <div>
                  <p className="font-medium text-foreground">Items in invoice</p>
                  <p className="text-xs text-muted-foreground">
                    {items.length} item{items.length !== 1 ? 's' : ''} added so far
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/dashboard/items')}>
                    Back to items
                  </Button>
                  <Button onClick={() => goNext()}>
                    Next: Add items
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <EditCompanyDialog
        company={editingCompany}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingCompany(null);
          }
        }}
        onSave={handleSaveEditedCompany}
      />
    </div>
  );
};

export default CustomerStep;

