import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Package, Tag } from "lucide-react";

const AddItem = () => {
    const { user } = useAuthStore();
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [hsn, setHsn] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedHsn = hsn.trim();
        if (!trimmedName) {
            toast.error("Item Name is required");
            return;
        }
        if (!trimmedHsn) {
            toast.error("HSN Code is required");
            return;
        }

        if (!user) {
            toast.error("You must be logged in to add items.");
            return;
        }

        setIsLoading(true);

        try {
            // Check for duplicates
            const { data: existingItems, error: fetchError } = await supabase
                .from('inventory_items')
                .select('id')
                .eq('user_id', user.id)
                .ilike('name', trimmedName);

            if (fetchError) {
                console.error("Error checking for duplicates:", fetchError);
                toast.error(`Failed to check for duplicates: ${fetchError.message || JSON.stringify(fetchError)}`);
                setIsLoading(false);
                return;
            }

            if (existingItems && existingItems.length > 0) {
                toast.error("Item with this name already exists.");
                setIsLoading(false);
                return;
            }

            const { error } = await supabase
                .from('inventory_items')
                .insert({
                    user_id: user.id,
                    name: trimmedName,
                    category: category.trim(),
                    hsn: trimmedHsn,
                    gst_rate: 0,
                    rate: 0,
                    stock: 0,
                    unit: 'pc'
                });

            if (error) {
                console.error("Error adding item:", error);
                // Helpful message if category column is missing
                if (error.message?.includes('category') || error.code === '42703') {
                    // FALLBACK: Try adding without category
                    const { error: fallbackError } = await supabase
                        .from('inventory_items')
                        .insert({
                            user_id: user.id,
                            name: trimmedName,
                            rate: 0,
                            stock: 0,
                            unit: 'pc'
                        });

                    if (fallbackError) {
                        toast.error("Failed to add item (even without category): " + fallbackError.message);
                    } else {
                        toast.warning("Item added, BUT Category/HSN may not be saved. Run the SQL script if needed.");
                        setName("");
                        setCategory("");
                        setHsn("");
                    }
                } else {
                    toast.error("Failed to add item: " + error.message);
                }
            } else {
                toast.success("Item added successfully!");
                setName("");
                setCategory("");
                setHsn("");
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-10 animate-fade-in">
            <header className="invoice-page-header">
                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Add item</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">Add a new product to your inventory</p>
                    </div>
                </div>
            </header>
            <Card className="invoice-card max-w-lg border-border shadow-sm overflow-hidden">
                <CardHeader className="pb-4 border-b border-border bg-muted/20">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Item details
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Enter name, category, and HSN code. Rate and stock can be set later from Items.</p>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-foreground">
                                Item name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. Wireless Mouse"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                className="rounded-lg bg-muted/30 border-border focus:bg-background h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-sm font-medium text-foreground">
                                Category
                            </Label>
                            <Input
                                id="category"
                                placeholder="e.g. Electronics"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={isLoading}
                                className="rounded-lg bg-muted/30 border-border focus:bg-background h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hsn" className="text-sm font-medium text-foreground">
                                HSN Code <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="hsn"
                                placeholder="e.g. 7214 or 72142000"
                                value={hsn}
                                onChange={(e) => setHsn(e.target.value)}
                                disabled={isLoading}
                                className="rounded-lg bg-muted/30 border-border focus:bg-background h-10 font-mono"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-10 rounded-lg font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? "Adding..." : "Add item"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AddItem;
