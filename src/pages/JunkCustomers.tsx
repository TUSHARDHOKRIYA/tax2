import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Company } from '@/data/mockData';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Users, RotateCcw, Trash2, Clock } from 'lucide-react';
import { formatIST } from '@/lib/dateUtils';

interface DeletedCompanyRow {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  stateCode?: string;
  pendingAmount: number;
  deletedAt: string;
}

const JunkCustomers = () => {
  const { user } = useAuthStore();
  const [deletedCompanies, setDeletedCompanies] = useState<DeletedCompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgingId, setPurgingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadDeleted = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', true)
          .order('deleted_at', { ascending: false, nullsFirst: false });

        if (error || !data) {
          // eslint-disable-next-line no-console
          console.error('❌ Failed to load deleted companies:', error);
          return;
        }

        setDeletedCompanies(
          data.map((row) => ({
            id: row.id as string,
            name: (row.name as string) ?? '',
            phone: (row.phone as string) || undefined,
            email: (row.email as string) || undefined,
            address: (row.address as string) || undefined,
            state: (row.state as string) || undefined,
            stateCode: (row.state_code as string) || undefined,
            pendingAmount: Number(row.pending_amount || 0),
            deletedAt: (row.deleted_at as string) ?? new Date().toISOString(),
          })),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDeleted();
  }, [user]);

  const handlePermanentDelete = async (companyId: string, companyName: string) => {
    if (!user) return;
    const ok = window.confirm(
      `Permanently delete "${companyName}" and ALL their invoices, payments, and transaction history? This cannot be undone.`,
    );
    if (!ok) return;

    setPurgingId(companyId);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)
        .eq('user_id', user.id)
        .eq('is_deleted', true);

      if (error) {
        console.error('Failed to permanently delete company:', error);
        alert(`Failed to permanently delete: ${error.message}`);
        return;
      }
      setDeletedCompanies((prev) => prev.filter((c) => c.id !== companyId));
    } finally {
      setPurgingId(null);
    }
  };

  const handleRestore = async (companyId: string) => {
    if (!user) {
      // eslint-disable-next-line no-alert
      alert('Please log in to restore customers.');
      return;
    }

    setRestoringId(companyId);

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          is_deleted: false,
          deleted_at: null,
        })
        .eq('id', companyId)
        .eq('user_id', user.id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to restore company:', error);
        // eslint-disable-next-line no-alert
        alert(`Failed to restore company: ${error.message}`);
        return;
      }

      setDeletedCompanies((prev) => prev.filter((c) => c.id !== companyId));
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (iso: string) => formatIST(iso);

  const daysUntilPurge = (deletedAt: string) => {
    const deleted = new Date(deletedAt).getTime();
    const now = Date.now();
    const diffMs = 30 * 24 * 60 * 60 * 1000 - (now - deleted);
    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(days, 0);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Junk customers
            </h1>
            <p className="text-sm text-muted-foreground">
              Recently deleted customers. They are permanently removed after 30 days.
            </p>
          </div>
        </div>
      </header>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Deleted customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : deletedCompanies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 px-4 text-center">
              <Trash2 className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">
                No customers in Junk
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                When you delete a customer, it will appear here for 30 days.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedCompanies.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{c.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        Deleted
                      </Badge>
                    </div>
                    {c.address && (
                      <p className="text-xs text-muted-foreground">
                        {c.address}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {c.phone && <span>Phone: {c.phone}</span>}
                      {c.email && <span>Email: {c.email}</span>}
                      <span>
                        Pending balance: ₹{c.pendingAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>Deleted: {formatDate(c.deletedAt)}</span>
                      <span>·</span>
                      <span>
                        Auto delete in {daysUntilPurge(c.deletedAt)} days
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={restoringId === c.id}
                      onClick={() => void handleRestore(c.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restore
                    </Button>
                    {daysUntilPurge(c.deletedAt) <= 0 ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={purgingId === c.id}
                        onClick={() => void handlePermanentDelete(c.id, c.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {purgingId === c.id ? 'Deleting...' : 'Delete forever'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JunkCustomers;

