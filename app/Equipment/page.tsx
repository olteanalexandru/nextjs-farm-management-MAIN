'use client';

import { useCallback, useEffect, useState } from 'react';

interface MaintenanceLog {
  id: number;
  logDate: string;
  description: string;
  cost: number | null;
  hoursAtService: number | null;
  notes: string | null;
}

interface EquipmentItem {
  id: number;
  name: string;
  equipmentType: string;
  purchaseDate: string | null;
  hoursUsed: number | null;
  nextServiceDueAt: string | null;
  notes: string | null;
  maintenanceLogs: MaintenanceLog[];
}

const EMPTY_FORM = {
  name: '',
  equipmentType: '',
  purchaseDate: '',
  hoursUsed: '',
  nextServiceDueAt: '',
  notes: '',
};

const EMPTY_LOG = {
  logDate: new Date().toISOString().slice(0, 10),
  description: '',
  cost: '',
  hoursAtService: '',
  notes: '',
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function EquipmentPage() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [logItem, setLogItem] = useState<EquipmentItem | null>(null);
  const [logForm, setLogForm] = useState({ ...EMPTY_LOG });
  const [logHistory, setLogHistory] = useState<MaintenanceLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/Controllers/Equipment');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(data.equipment ?? []);
    } catch {
      setError('Failed to load equipment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(item: EquipmentItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      equipmentType: item.equipmentType,
      purchaseDate: item.purchaseDate ? item.purchaseDate.slice(0, 10) : '',
      hoursUsed: item.hoursUsed != null ? String(item.hoursUsed) : '',
      nextServiceDueAt: item.nextServiceDueAt ? item.nextServiceDueAt.slice(0, 10) : '',
      notes: item.notes ?? '',
    });
    setShowForm(true);
  }

  async function openLog(item: EquipmentItem) {
    setLogItem(item);
    setLogForm({ ...EMPTY_LOG });
    setLogLoading(true);
    try {
      const res = await fetch(`/api/Controllers/Equipment/${item.id}/maintenance`);
      if (res.ok) { const d = await res.json(); setLogHistory(d.logs ?? []); }
    } finally { setLogLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        equipmentType: form.equipmentType.trim(),
        purchaseDate: form.purchaseDate || null,
        hoursUsed: form.hoursUsed ? Number(form.hoursUsed) : null,
        nextServiceDueAt: form.nextServiceDueAt || null,
        notes: form.notes || null,
      };
      const url = editingId ? `/api/Controllers/Equipment/${editingId}` : '/api/Controllers/Equipment';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed'); }
      setShowForm(false);
      await loadItems();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this equipment? All maintenance logs will also be deleted.')) return;
    try {
      const res = await fetch(`/api/Controllers/Equipment/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await loadItems();
    } catch { alert('Failed to delete'); }
  }

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!logItem) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/Controllers/Equipment/${logItem.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate: logForm.logDate,
          description: logForm.description.trim(),
          cost: logForm.cost ? Number(logForm.cost) : null,
          hoursAtService: logForm.hoursAtService ? Number(logForm.hoursAtService) : null,
          notes: logForm.notes || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed'); }
      const data = await res.json();
      setLogHistory(h => [data.log, ...h]);
      setLogForm({ ...EMPTY_LOG });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  const serviceDue = items.filter(i => {
    const d = daysUntil(i.nextServiceDueAt);
    return d != null && d <= 14;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Equipment & Machinery</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track machinery, hours, and maintenance schedules</p>
            </div>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Equipment
            </button>
          </div>

          {error && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {/* Service due alert */}
          {serviceDue.length > 0 && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">
                ⚠ Service due soon: {serviceDue.map(i => {
                  const d = daysUntil(i.nextServiceDueAt);
                  return `${i.name} (${d != null && d < 0 ? 'overdue' : `in ${d} days`})`;
                }).join(', ')}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="px-6 py-4 border-b border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600">Total Equipment</p>
              <p className="text-2xl font-bold text-purple-900">{items.length}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-600">Service Due ≤14d</p>
              <p className="text-2xl font-bold text-amber-900">{serviceDue.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Hours Logged</p>
              <p className="text-2xl font-bold text-gray-900">
                {items.reduce((s, i) => s + (i.hoursUsed != null ? Number(i.hoursUsed) : 0), 0).toFixed(0)}h
              </p>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <svg className="mx-auto w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">No equipment added yet.</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map(item => {
                const serviceDays = daysUntil(item.nextServiceDueAt);
                const serviceStatus = serviceDays == null ? null : serviceDays < 0 ? 'overdue' : serviceDays <= 7 ? 'soon' : 'ok';
                return (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.equipmentType}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openLog(item)} title="Maintenance log"
                          className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 border border-purple-200">
                          Log
                        </button>
                        <button onClick={() => openEdit(item)} className="p-1 text-gray-400 hover:text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-600">
                      {item.hoursUsed != null && <p>Hours used: <span className="font-medium text-gray-900">{Number(item.hoursUsed).toFixed(0)}h</span></p>}
                      {item.purchaseDate && <p>Purchased: <span className="font-medium">{new Date(item.purchaseDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span></p>}
                      {item.nextServiceDueAt && (
                        <p>Next service: <span className={`font-medium ${serviceStatus === 'overdue' ? 'text-red-600' : serviceStatus === 'soon' ? 'text-amber-600' : 'text-gray-900'}`}>
                          {new Date(item.nextServiceDueAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                          {serviceDays != null && (` (${serviceDays < 0 ? 'overdue' : `in ${serviceDays}d`})`)}
                        </span></p>
                      )}
                    </div>
                    {item.maintenanceLogs[0] && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        Last service: {new Date(item.maintenanceLogs[0].logDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })} — {item.maintenanceLogs[0].description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Equipment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Equipment' : 'Add Equipment'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g. John Deere 6120M" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <input type="text" value={form.equipmentType} onChange={e => setForm(f => ({ ...f, equipmentType: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Tractor, Combine, Sprayer…" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Used</label>
                  <input type="number" min="0" step="0.1" value={form.hoursUsed} onChange={e => setForm(f => ({ ...f, hoursUsed: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Service Due</label>
                  <input type="date" value={form.nextServiceDueAt} onChange={e => setForm(f => ({ ...f, nextServiceDueAt: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {submitting ? 'Saving…' : editingId ? 'Update' : 'Add Equipment'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Log Modal */}
      {logItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Maintenance Log</h2>
                <p className="text-sm text-gray-500">{logItem.name}</p>
              </div>
              <button onClick={() => setLogItem(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleLogSubmit} className="p-6 space-y-3 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={logForm.logDate} onChange={e => setLogForm(f => ({ ...f, logDate: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (€)</label>
                  <input type="number" min="0" step="0.01" value={logForm.cost} onChange={e => setLogForm(f => ({ ...f, cost: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input type="text" value={logForm.description} onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Oil change, filter replacement…" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours at Service</label>
                  <input type="number" min="0" step="0.1" value={logForm.hoursAtService} onChange={e => setLogForm(f => ({ ...f, hoursAtService: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {submitting ? 'Saving…' : 'Add Log Entry'}
              </button>
            </form>
            <div className="p-4 overflow-y-auto flex-1">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">History</h3>
              {logLoading ? <p className="text-sm text-gray-400">Loading…</p> : logHistory.length === 0 ? (
                <p className="text-sm text-gray-400">No maintenance logs yet.</p>
              ) : (
                <div className="space-y-2">
                  {logHistory.map(log => (
                    <div key={log.id} className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-purple-900">{log.description}</span>
                        <span className="text-gray-500 text-xs">{new Date(log.logDate).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5 space-x-3">
                        {log.cost != null && <span>€{Number(log.cost).toFixed(2)}</span>}
                        {log.hoursAtService != null && <span>{Number(log.hoursAtService).toFixed(0)}h</span>}
                      </div>
                      {log.notes && <p className="text-xs text-gray-500 mt-0.5">{log.notes}</p>}
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
