import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';
import { Building2, Landmark, Save, Loader2 } from 'lucide-react';

interface SellerInfo {
    name: string;
    address: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
    gst_no: string;
    pan: string;
    phone: string;
    email: string;
}

interface BankInfo {
    account_name: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    branch: string;
}

const defaultSeller: SellerInfo = {
    name: '',
    address: '',
    city: '',
    state: '',
    state_code: '',
    pincode: '',
    gst_no: '',
    pan: '',
    phone: '',
    email: '',
};

const defaultBank: BankInfo = {
    account_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    branch: '',
};

const CompanySettings = () => {
    const { user } = useAuthStore();
    const [seller, setSeller] = useState<SellerInfo>(defaultSeller);
    const [bank, setBank] = useState<BankInfo>(defaultBank);
    const [loading, setLoading] = useState(true);
    const [savingSeller, setSavingSeller] = useState(false);
    const [savingBank, setSavingBank] = useState(false);

    // Load existing data
    useEffect(() => {
        if (!user) return;

        const load = async () => {
            setLoading(true);
            try {
                const [sellerRes, bankRes] = await Promise.all([
                    supabase.from('seller_info').select('*').eq('user_id', user.id).single(),
                    supabase.from('bank_details').select('*').eq('user_id', user.id).single(),
                ]);

                if (sellerRes.data) {
                    setSeller({
                        name: sellerRes.data.name || '',
                        address: sellerRes.data.address || '',
                        city: sellerRes.data.city || '',
                        state: sellerRes.data.state || '',
                        state_code: sellerRes.data.state_code || '',
                        pincode: sellerRes.data.pincode || '',
                        gst_no: sellerRes.data.gst_no || '',
                        pan: sellerRes.data.pan || '',
                        phone: sellerRes.data.phone || '',
                        email: sellerRes.data.email || '',
                    });
                }

                if (bankRes.data) {
                    setBank({
                        account_name: bankRes.data.account_name || '',
                        bank_name: bankRes.data.bank_name || '',
                        account_number: bankRes.data.account_number || '',
                        ifsc_code: bankRes.data.ifsc_code || '',
                        branch: bankRes.data.branch || '',
                    });
                }
            } catch (err) {
                console.error('Error loading settings:', err);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [user]);

    const handleSaveSeller = async () => {
        if (!user) return;
        setSavingSeller(true);

        try {
            // Try update first
            const { data: existing } = await supabase
                .from('seller_info')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (existing) {
                const { error } = await supabase
                    .from('seller_info')
                    .update({
                        name: seller.name,
                        address: seller.address,
                        city: seller.city,
                        state: seller.state,
                        state_code: seller.state_code,
                        pincode: seller.pincode,
                        gst_no: seller.gst_no,
                        pan: seller.pan,
                        phone: seller.phone,
                        email: seller.email,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                const { error } = await supabase.from('seller_info').insert({
                    user_id: user.id,
                    ...seller,
                });

                if (error) throw error;
            }

            toast({
                title: 'Company info saved',
                description: 'Your company details have been updated successfully.',
            });
        } catch (err: any) {
            console.error('Error saving seller info:', err);
            toast({
                title: 'Error saving company info',
                description: err?.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setSavingSeller(false);
        }
    };

    const handleSaveBank = async () => {
        if (!user) return;
        setSavingBank(true);

        try {
            const { data: existing } = await supabase
                .from('bank_details')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (existing) {
                const { error } = await supabase
                    .from('bank_details')
                    .update({
                        account_name: bank.account_name,
                        bank_name: bank.bank_name,
                        account_number: bank.account_number,
                        ifsc_code: bank.ifsc_code,
                        branch: bank.branch,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                const { error } = await supabase.from('bank_details').insert({
                    user_id: user.id,
                    ...bank,
                });

                if (error) throw error;
            }

            toast({
                title: 'Bank details saved',
                description: 'Your bank details have been updated successfully.',
            });
        } catch (err: any) {
            console.error('Error saving bank details:', err);
            toast({
                title: 'Error saving bank details',
                description: err?.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setSavingBank(false);
        }
    };

    const updateSeller = (field: keyof SellerInfo, value: string) => {
        setSeller((prev) => ({ ...prev, [field]: value }));
    };

    const updateBank = (field: keyof BankInfo, value: string) => {
        setBank((prev) => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="invoice-page">
            <header className="invoice-page-header">
                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">
                            Company Settings
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Edit your company and bank details that appear on invoices
                        </p>
                    </div>
                </div>
            </header>

            <main className="pt-6 space-y-6">
                {/* Company Information */}
                <Card className="invoice-card border-border shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Company Information
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            These details will appear as the seller information on your invoices.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="company-name">Company Name</Label>
                                <Input
                                    id="company-name"
                                    placeholder="e.g. Sunshine Industries"
                                    value={seller.name}
                                    onChange={(e) => updateSeller('name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gst-no">GST Number (GSTIN)</Label>
                                <Input
                                    id="gst-no"
                                    placeholder="e.g. 27AABCU9603R1ZM"
                                    value={seller.gst_no}
                                    onChange={(e) => updateSeller('gst_no', e.target.value)}
                                    maxLength={15}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="e.g. Plot 123, Industrial Area, Phase 2"
                                value={seller.address}
                                onChange={(e) => updateSeller('address', e.target.value)}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    placeholder="e.g. Mumbai"
                                    value={seller.city}
                                    onChange={(e) => updateSeller('city', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    placeholder="e.g. Maharashtra"
                                    value={seller.state}
                                    onChange={(e) => updateSeller('state', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state-code">State Code</Label>
                                <Input
                                    id="state-code"
                                    placeholder="e.g. 27"
                                    value={seller.state_code}
                                    onChange={(e) => updateSeller('state_code', e.target.value)}
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="pincode">Pincode</Label>
                                <Input
                                    id="pincode"
                                    placeholder="e.g. 400001"
                                    value={seller.pincode}
                                    onChange={(e) => updateSeller('pincode', e.target.value)}
                                    maxLength={10}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pan">PAN Number</Label>
                                <Input
                                    id="pan"
                                    placeholder="e.g. AABCU9603R"
                                    value={seller.pan}
                                    onChange={(e) => updateSeller('pan', e.target.value)}
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone / Contact</Label>
                                <Input
                                    id="phone"
                                    placeholder="e.g. +91 98765 43210"
                                    value={seller.phone}
                                    onChange={(e) => updateSeller('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="e.g. info@company.com"
                                    value={seller.email}
                                    onChange={(e) => updateSeller('email', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSaveSeller} disabled={savingSeller}>
                                {savingSeller ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Company Info
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Details */}
                <Card className="invoice-card border-border shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Landmark className="h-5 w-5 text-primary" />
                            Bank Details
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            These details will appear in the bank section of your invoices.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="account-name">Account Holder Name</Label>
                                <Input
                                    id="account-name"
                                    placeholder="e.g. Sunshine Industries"
                                    value={bank.account_name}
                                    onChange={(e) => updateBank('account_name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bank-name">Bank Name</Label>
                                <Input
                                    id="bank-name"
                                    placeholder="e.g. State Bank of India"
                                    value={bank.bank_name}
                                    onChange={(e) => updateBank('bank_name', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account-number">Account Number</Label>
                            <Input
                                id="account-number"
                                placeholder="e.g. 1234567890123456"
                                value={bank.account_number}
                                onChange={(e) => updateBank('account_number', e.target.value)}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ifsc-code">IFSC Code</Label>
                                <Input
                                    id="ifsc-code"
                                    placeholder="e.g. SBIN0001234"
                                    value={bank.ifsc_code}
                                    onChange={(e) => updateBank('ifsc_code', e.target.value)}
                                    maxLength={11}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="branch">Branch</Label>
                                <Input
                                    id="branch"
                                    placeholder="e.g. Industrial Area Branch, Mumbai"
                                    value={bank.branch}
                                    onChange={(e) => updateBank('branch', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSaveBank} disabled={savingBank}>
                                {savingBank ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Bank Details
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default CompanySettings;
