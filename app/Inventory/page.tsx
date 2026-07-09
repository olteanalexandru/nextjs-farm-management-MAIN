'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorderThreshold: number | null;
  costPerUnit: number | null;
  supplier: string | null;
  notes: string | null;
}

interface InventoryTransaction {
  id: number;
  itemId: number;
  type: 'IN' | 'OUT';
  quantity: number;
  notes: string | null;
  transDate: string;
}

const CATEGORIES = ['SEED', 'FERTILIZER', 'PESTICIDE', 'FUEL', 'EQUIPMENT_PART', 'OTHER'] as const;
type Category = typeof CATEGORIES[number];

const CAT_COLORS: Record<Category, string> = {
  SEED:           'bg-green-100 text-green-800',
  FERTILIZER:     'bg-blue-100 text-blue-800',
  PESTICIDE:      'bg-red-100 text-red-800',
  FUEL:           'bg-orange-100 text-orange-800',
  EQUIPMENT_PART: 'bg-purple-100 text-purple-800',
  OTHER:          'bg-gray-100 text-gray-800',
};

const EMPTY_FORM = {
  name: '',
  category: 'OTHER' as Category,
  quantity: '',
  unit: '',
  reorderThreshold: '',
  costPerUnit: '',
  supplier: '',
  notes: '',
};

const EMPTY_TX = {
  type: 'IN' as 'IN' | 'OUT',
  quantity: '',
  notes: '',
  transDate: new Date().toISOString().slice(0, 10),
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<Category | ''>('');
  const [txItem, setTxItem] = useState<InventoryItem | null>(null);
  const [txForm, setTxForm] = useState({ ...EMPTY_TX });
  const [txHistory, setTxHistory] = useState<InventoryTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/Controllers/Inventory');
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = useMemo(() =>
    filterCat ? items.filter(i => i.category === filterCat) : items,
    [items, filterCat]
  );

  const lowStock = useMemo(() =>
    items.filter(i => i.reorderThreshold != null && i.quantity <= i.reorderThreshold),
    [items]
  );

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category as Category,
      quantity: String(item.quantity),
      unit: item.unit,
      reorderThreshold: item.reorderThreshold != null ? String(item.reorderThreshold) : '',
      costPerUnit: item.costPerUnit != null ? String(item.costPerUnit) : '',
      supplier: item.supplier ?? '',
      notes: item.notes ?? '',
    });
    setShowForm(true);
  }

  async function openTx(item: InventoryItem) {
    setTxItem(item);
    setTxForm({ ...EMPTY_TX });
    setTxLoading(true);
    try {
      const res = await fetch(`/api/Controllers/Inventory/${item.id}/transaction`);
      if (res.ok) {
        const data = await res.json();
        setTxHistory(data.transactions ?? []);
      }
    } finally {
      setTxLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit.trim(),
        reorderThreshold: form.reorderThreshold ? Number(form.reorderThreshold) : null,
        costPerUnit: form.costPerUnit ? Number(form.costPerUnit) : null,
        supplier: form.supplier || null,
        notes: form.notes || null,
      };
      const url = editingId ? `/api/Controllers/Inventory/${editingId}` : '/api/Controllers/Inventory';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to save');
      }
      setShowForm(false);
      await loadItems();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this inventory item? All transaction history will be lost.')) return;
    try {
      const res = await fetch(`/api/Controllers/Inventory/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadItems();
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch {
      alert('Failed to delete item');
    }
  }

  async function handleTxSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!txItem) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/Controllers/Inventory/${txItem.id}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: txForm.type,
          quantity: Number(txForm.quantity),
          notes: txForm.notes || null,
          transDate: txForm.transDate,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed');
      }
      const data = await res.json();
      setTxHistory(h => [{ ...data.transaction, transDate: data.transaction.transDate ?? txForm.transDate }, ...h]);
      setItems(prev => prev.map(i => i.id === txItem.id ? { ...i, quantity: Number(data.item.quantity) } : i));
      setTxItem(prev => prev ? { ...prev, quantity: Number(data.item.quantity) } : prev);
      setTxForm({ ...EMPTY_TX });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  }

  const totalValue = useMemo(() =>
    items.reduce((sum, i) => sum + (i.costPerUnit != null ? i.quantity * i.costPerUnit : 0), 0),
    [items]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track seeds, fertilizers, pesticides, and supplies</p>
            </div>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>

          {error && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {/* Stats row */}
          <div className="px-6 py-4 border-b border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-700">{lowStock.length}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600">Categories</p>
              <p className="text-2xl font-bold text-blue-900">{new Set(items.map(i => i.category)).size}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">Est. Value</p>
              <p className="text-2xl font-bold text-green-900">{totalValue > 0 ? `€${totalValue.toFixed(0)}` : '—'}</p>
            </div>
          </div>

          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">
                ⚠ {lowStock.length} item{lowStock.length > 1 ? 's' : ''} at or below reorder threshold:
                {' '}{lowStock.map(i => i.name).join(', ')}
              </p>
            </div>
          )}

          {/* Filter */}
          <div className="px-6 py-3 flex items-center gap-3 flex-wrap border-b border-gray-100">
            <span className="text-sm text-gray-500">Filter:</span>
            {(['', ...CATEGORIES] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat as Category | '')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterCat === cat ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}
              >
                {cat === '' ? 'All' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <svg className="mx-auto w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm">No items found. Add your first inventory item.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name','Category','Quantity','Unit','Reorder At','Cost/Unit','Supplier','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(item => {
                    const isLow = item.reorderThreshold != null && item.quantity <= item.reorderThreshold;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[item.category as Category] ?? CAT_COLORS.OTHER}`}>
                            {item.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                          {Number(item.quantity).toFixed(2)}
                          {isLow && <span className="ml-1 text-xs text-red-500">⚠</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                        <td className="px-4 py-3 text-gray-600">{item.reorderThreshold != null ? Number(item.reorderThreshold).toFixed(2) : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.costPerUnit != null ? `€${Number(item.costPerUnit).toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.supplier ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openTx(item)} title="Record transaction"
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200">
                              Stock
                            </button>
                            <button onClick={() => openEdit(item)} title="Edit" className="p-1 text-gray-400 hover:text-gray-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDelete(item.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Item' : 'Add Inventory Item'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g. Urea fertilizer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="kg, L, bags…" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input type="number" step="0.001" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder At</label>
                  <input type="number" step="0.001" min="0" value={form.reorderThreshold} onChange={e => setForm(f => ({ ...f, reorderThreshold: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost / Unit (€)</label>
                  <input type="number" step="0.01" min="0" value={form.costPerUnit} onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {submitting ? 'Saving…' : editingId ? 'Update' : 'Add Item'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
      {txItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stock Adjustment</h2>
                <p className="text-sm text-gray-500">{txItem.name} — current: <strong>{Number(txItem.quantity).toFixed(2)} {txItem.unit}</strong></p>
              </div>
              <button onClick={() => setTxItem(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleTxSubmit} className="p-6 space-y-4 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-300">
                    {(['IN', 'OUT'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTxForm(f => ({ ...f, type: t }))}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${txForm.type === t ? (t === 'IN' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {t === 'IN' ? '+ IN' : '− OUT'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input type="number" step="0.001" min="0.001" value={txForm.quantity} onChange={e => setTxForm(f => ({ ...f, quantity: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={txForm.transDate} onChange={e => setTxForm(f => ({ ...f, transDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={txForm.notes} onChange={e => setTxForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Reason / supplier / usage…" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                {submitting ? 'Recording…' : 'Record'}
              </button>
            </form>

            <div className="p-4 overflow-y-auto flex-1">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction History</h3>
              {txLoading ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : txHistory.length === 0 ? (
                <p className="text-sm text-gray-400">No transactions yet.</p>
              ) : (
                <div className="space-y-2">
                  {txHistory.map(tx => (
                    <div key={tx.id} className={`rounded-lg p-2.5 text-sm border ${tx.type === 'IN' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex justify-between">
                        <span className={`font-semibold ${tx.type === 'IN' ? 'text-green-700' : 'text-red-700'}`}>
                          {tx.type === 'IN' ? '+' : '−'}{Number(tx.quantity).toFixed(2)}
                        </span>
                        <span className="text-gray-500 text-xs">{new Date(tx.transDate).toLocaleDateString('en-GB')}</span>
                      </div>
                      {tx.notes && <p className="text-xs text-gray-600 mt-0.5">{tx.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
