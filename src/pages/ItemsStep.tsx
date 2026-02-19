import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { InvoiceItem, InventoryItem } from '@/data/mockData';
import { useInvoiceWizardStore } from '@/store/invoiceWizardStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import EditInventoryItemDialog from '@/components/EditInventoryItemDialog';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ItemsStep = () => {
  const navigate = useNavigate();
  const { items, setItems, editingInvoiceNumber } = useInvoiceWizardStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [addItemDialogItem, setAddItemDialogItem] = useState<InventoryItem | null>(null);
  const [addBoxes, setAddBoxes] = useState('');
  const [addItemsPerBox, setAddItemsPerBox] = useState('');
  const [addPricePerItem, setAddPricePerItem] = useState('');

  // Edit-item dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogItemId, setEditDialogItemId] = useState<string | null>(null);
  const [editBoxes, setEditBoxes] = useState('');
  const [editItemsPerBox, setEditItemsPerBox] = useState('');
  const [editPricePerItem, setEditPricePerItem] = useState('');

  // Edit inventory item (name, category, HSN) dialog
  const [editInventoryDialogOpen, setEditInventoryDialogOpen] = useState(false);
  const [editInventoryItem, setEditInventoryItem] = useState<InventoryItem | null>(null);

  const loadInventory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading inventory items for wizard:', error);
        return;
      }

      if (data && data.length > 0) {
        const mapped: InventoryItem[] = data.map((row: any) => ({
          id: row.id as string,
          name: row.name as string,
          hsn: (row.hsn as string) ?? '',
          gstRate: Number(row.gst_rate ?? 0),
          rate: Number(row.rate || 0),
          stock: Number(row.stock || 0),
          unit: row.unit as string,
          category: (row.category as string) ?? undefined,
        }));
        setInventory(mapped);
      } else {
        setInventory([]);
      }
    } catch (err) {
      console.error('Unexpected error loading inventory items for wizard:', err);
    }
  }, [user]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const openAddItemDialog = useCallback((item: InventoryItem) => {
    setAddItemDialogItem(item);
    setAddBoxes('');
    setAddItemsPerBox('');
    setAddPricePerItem('');
    setAddItemDialogOpen(true);
  }, []);

  const handleAddItem = useCallback(
    (item: InventoryItem, focusQuantity: boolean = false) => {
      openAddItemDialog(item);
    },
    [openAddItemDialog],
  );

  const confirmAddItem = useCallback(() => {
    if (!addItemDialogItem) return;
    const boxes = Math.max(1, Math.floor(Number(addBoxes) || 1));
    const itemsPerBox = Math.max(1, Math.floor(Number(addItemsPerBox) || 1));
    const pricePerItem = Math.max(0, Number(addPricePerItem) || 0);
    const totalQty = boxes * itemsPerBox;
    const existing = items.find((i) => i.item.id === addItemDialogItem.id);

    if (existing) {
      const nextItems = items.map((i) =>
        i.item.id === addItemDialogItem.id
          ? {
            ...i,
            quantity: i.quantity + totalQty,
            item: { ...i.item, rate: pricePerItem },
          }
          : i,
      );
      setItems(nextItems);
    } else {
      const newId = `wizard-${Date.now()}`;
      const itemCopy: InventoryItem = { ...addItemDialogItem, rate: pricePerItem };
      const newItem: InvoiceItem = {
        id: newId,
        item: itemCopy,
        quantity: totalQty,
        discount: 0,
        boxes,
        itemsPerBox,
      };
      setItems([...items, newItem]);
    }
    setAddItemDialogOpen(false);
    setAddItemDialogItem(null);
    setSearch('');
    // Refocus search bar after dialog closes so user can immediately add another item
    setTimeout(() => {
      const searchEl = document.getElementById('item-search');
      searchEl?.focus();
    }, 100);
  }, [addItemDialogItem, addBoxes, addItemsPerBox, addPricePerItem, items, setItems]);

  const openEditDialog = useCallback((row: InvoiceItem) => {
    setEditDialogItemId(row.id);
    setEditBoxes(String(row.boxes || 1));
    setEditItemsPerBox(String(row.itemsPerBox || row.quantity));
    setEditPricePerItem(String(row.item.rate));
    setEditDialogOpen(true);
  }, []);

  const confirmEditItem = useCallback(() => {
    if (!editDialogItemId) return;
    const boxes = Math.max(1, Math.floor(Number(editBoxes) || 1));
    const itemsPerBox = Math.max(1, Math.floor(Number(editItemsPerBox) || 1));
    const pricePerItem = Math.max(0, Number(editPricePerItem) || 0);
    const totalQty = boxes * itemsPerBox;
    setItems(
      items.map((i) =>
        i.id === editDialogItemId
          ? { ...i, quantity: totalQty, item: { ...i.item, rate: pricePerItem }, boxes, itemsPerBox }
          : i,
      ),
    );
    setEditDialogOpen(false);
    setEditDialogItemId(null);
  }, [editDialogItemId, editBoxes, editItemsPerBox, editPricePerItem, items, setItems]);

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const openEditInventory = useCallback((invItem: InventoryItem) => {
    setEditInventoryItem(invItem);
    setEditInventoryDialogOpen(true);
  }, []);

  const handleDeleteInventoryItem = useCallback(
    async (invItem: InventoryItem) => {
      if (!window.confirm(`Delete "${invItem.name}" from inventory?`)) return;
      try {
        const { error } = await supabase
          .from('inventory_items')
          .delete()
          .eq('id', invItem.id);
        if (error) {
          toast.error(error.message || 'Failed to delete item');
          return;
        }
        toast.success('Item deleted');
        await loadInventory();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete item');
      }
    },
    [loadInventory]
  );

  const goNext = () => {
    if (items.length === 0) {
      return;
    }
    navigate('/dashboard/review');
  };

  const goBack = () => {
    navigate('/dashboard/company');
  };

  // Shift+Enter anywhere on page → next step (Review)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (addItemDialogOpen || editDialogOpen) return;
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [items.length, addItemDialogOpen, editDialogOpen]);

  const totalAmount = items.reduce((sum, i) => {
    const base = i.item.rate * i.quantity;
    return sum + base;
  }, 0);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory;
    return inventory.filter(
      (it) =>
        it.name.toLowerCase().includes(term) ||
        (it.hsn && it.hsn.toLowerCase().includes(term)) ||
        (it.category && it.category.toLowerCase().includes(term)),
    );
  }, [inventory, search]);

  useEffect(() => {
    setHighlightedIndex((prev) =>
      filteredItems.length ? Math.min(prev, filteredItems.length - 1) : 0
    );
  }, [filteredItems.length]);

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
            Step 2 – Add items
          </h1>
          <p className="text-sm text-muted-foreground">
            ↑↓ to move, Enter to add. Shift+Enter for next step.
          </p>
        </div>
      </header>

      <main className="pt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="invoice-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">
                    Search & add items
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  id="item-search"
                  autoFocus
                  placeholder="Search by name, category or HSN; ↓/↑ and Enter to add"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.shiftKey) {
                      e.preventDefault();
                      goNext();
                      return;
                    }
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndex((prev) =>
                        filteredItems.length ? Math.min(prev + 1, filteredItems.length - 1) : 0
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
                      const target = filteredItems[highlightedIndex] ?? filteredItems[0];
                      if (target) handleAddItem(target, true);
                    }
                  }}
                />
                <div className="max-h-[420px] overflow-y-auto border rounded bg-card">
                  {filteredItems.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      No matching items.
                    </p>
                  ) : (
                    <ul id="item-list" className="text-xs">
                      {filteredItems.map((item, index) => (
                        <li
                          key={item.id}
                          tabIndex={0}
                          className={`px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-primary/10 focus:outline-none focus:bg-primary/10 flex items-center justify-between gap-2 ${index === highlightedIndex ? 'bg-primary/10' : ''}`}
                          onClick={() => { handleAddItem(item, true); setHighlightedIndex(index); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem(item, true);
                              return;
                            }
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
                              const nextItem = (e.currentTarget.nextElementSibling) as HTMLElement;
                              if (nextItem) nextItem.focus();
                              return;
                            }
                            if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedIndex((prev) => Math.max(0, prev - 1));
                              const prevItem = (e.currentTarget.previousElementSibling) as HTMLElement;
                              if (prevItem) prevItem.focus();
                              else document.getElementById('item-search')?.focus();
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {item.category && `Cat: ${item.category}`}
                              {item.hsn && (item.category ? ` · HSN: ${item.hsn}` : `HSN: ${item.hsn}`)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditInventory(item);
                              }}
                              title="Edit item"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInventoryItem(item);
                              }}
                              title="Delete item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-4">
            <Card className="invoice-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Selected Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Search on the left, then press Enter on an item row to add it.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="py-1 text-left font-medium">Item</th>
                          <th className="py-1 text-center font-medium">Qty</th>
                          <th className="py-1 text-right font-medium">Rate</th>
                          <th className="py-1 text-right font-medium">Amount</th>
                          <th className="py-1" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {items.map((row) => {
                          const amount = row.item.rate * row.quantity;
                          return (
                            <tr key={row.id}>
                              <td className="py-1 pr-2">
                                <div className="truncate max-w-[220px]">
                                  <span className="font-medium">{row.item.name}</span>
                                </div>
                                {row.item.category && (
                                  <div className="text-[10px] text-muted-foreground">
                                    Category: {row.item.category}
                                  </div>
                                )}
                              </td>
                              <td className="py-1 text-center align-middle">
                                <button
                                  type="button"
                                  className="w-16 border rounded px-1 py-0.5 text-center text-xs font-mono cursor-pointer hover:bg-primary/10 transition-colors"
                                  onClick={() => openEditDialog(row)}
                                >
                                  {row.quantity}
                                </button>
                              </td>
                              <td className="py-1 text-right align-middle">
                                <button
                                  type="button"
                                  className="w-20 border rounded px-1 py-0.5 text-right text-xs font-mono cursor-pointer hover:bg-primary/10 transition-colors"
                                  onClick={() => openEditDialog(row)}
                                >
                                  {row.item.rate.toFixed(2)}
                                </button>
                              </td>
                              <td className="py-1 text-right font-mono">
                                {amount.toFixed(2)}
                              </td>
                              <td className="py-1 pl-2 text-right flex gap-1 justify-end">
                                <button
                                  type="button"
                                  className="text-[11px] text-primary underline-offset-2 hover:underline"
                                  onClick={() => openEditDialog(row)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="text-[11px] text-destructive underline-offset-2 hover:underline"
                                  onClick={() => handleRemoveItem(row.id)}
                                >
                                  Remove
                                </button>
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

            <Card className="invoice-card">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 text-sm">
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Items count:</span>{' '}
                    <span className="font-mono">{items.length}</span>
                  </p>
                  <p>
                    <span className="font-medium">Total:</span>{' '}
                    <span className="font-mono">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={goBack}>
                    Back to customer
                  </Button>
                  <Button variant="outline" onClick={() => setItems([])}>
                    Clear items
                  </Button>
                  <Button onClick={goNext}>
                    Next: Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add item</DialogTitle>
            <DialogDescription>
              {addItemDialogItem ? (
                <>Enter boxes, items per box, and price per item. Amount will be calculated automatically.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {addItemDialogItem && (
            <div className="space-y-4 py-2">
              <p className="text-sm font-medium text-foreground">{addItemDialogItem.name}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="add-boxes">No. of boxes</Label>
                  <Input
                    id="add-boxes"
                    type="number"
                    min={1}
                    value={addBoxes}
                    onChange={(e) => setAddBoxes(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('add-items-per-box')?.focus();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-items-per-box">No. of items in each box</Label>
                  <Input
                    id="add-items-per-box"
                    type="number"
                    min={1}
                    value={addItemsPerBox}
                    onChange={(e) => setAddItemsPerBox(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('add-price')?.focus();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-price">Price per item (₹)</Label>
                <Input
                  id="add-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={addPricePerItem}
                  onChange={(e) => setAddPricePerItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmAddItem();
                    }
                  }}
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-mono font-medium">
                  {Math.max(1, Math.floor(Number(addBoxes) || 1))} × {Math.max(1, Math.floor(Number(addItemsPerBox) || 1))} ={' '}
                  {Math.max(1, Math.floor(Number(addBoxes) || 1)) * Math.max(1, Math.floor(Number(addItemsPerBox) || 1))} units
                </span>
                <span className="text-muted-foreground"> × ₹{(Number(addPricePerItem) || 0).toFixed(2)} = </span>
                <span className="font-mono font-semibold text-foreground">
                  ₹
                  {(
                    Math.max(1, Math.floor(Number(addBoxes) || 1)) *
                    Math.max(1, Math.floor(Number(addItemsPerBox) || 1)) *
                    (Number(addPricePerItem) || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAddItem} disabled={!addItemDialogItem}>
              Add to invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit-item dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit item</DialogTitle>
            <DialogDescription>
              {editDialogItemId ? (
                <>Update boxes, items per box, and price. Quantity will be recalculated.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {editDialogItemId && (() => {
            const editRow = items.find((i) => i.id === editDialogItemId);
            if (!editRow) return null;
            return (
              <div className="space-y-4 py-2">
                <p className="text-sm font-medium text-foreground">{editRow.item.name}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-boxes">No. of boxes</Label>
                    <Input
                      id="edit-boxes"
                      autoFocus
                      type="number"
                      min={1}
                      value={editBoxes}
                      onChange={(e) => setEditBoxes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('edit-items-per-box')?.focus();
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-items-per-box">No. of items in each box</Label>
                    <Input
                      id="edit-items-per-box"
                      type="number"
                      min={1}
                      value={editItemsPerBox}
                      onChange={(e) => setEditItemsPerBox(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('edit-price')?.focus();
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price per item (₹)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={editPricePerItem}
                    onChange={(e) => setEditPricePerItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmEditItem();
                      }
                    }}
                  />
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-mono font-medium">
                    {Math.max(1, Math.floor(Number(editBoxes) || 1))} × {Math.max(1, Math.floor(Number(editItemsPerBox) || 1))} ={' '}
                    {Math.max(1, Math.floor(Number(editBoxes) || 1)) * Math.max(1, Math.floor(Number(editItemsPerBox) || 1))} units
                  </span>
                  <span className="text-muted-foreground"> × ₹{(Number(editPricePerItem) || 0).toFixed(2)} = </span>
                  <span className="font-mono font-semibold text-foreground">
                    ₹
                    {(
                      Math.max(1, Math.floor(Number(editBoxes) || 1)) *
                      Math.max(1, Math.floor(Number(editItemsPerBox) || 1)) *
                      (Number(editPricePerItem) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEditItem} disabled={!editDialogItemId}>
              Update item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditInventoryItemDialog
        item={editInventoryItem}
        open={editInventoryDialogOpen}
        onOpenChange={setEditInventoryDialogOpen}
        onSaved={loadInventory}
      />
    </div>
  );
};

export default ItemsStep;

