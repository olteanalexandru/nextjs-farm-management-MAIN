'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface SubsidyRecord {
  id: number;
  subsidyName: string;
  subsidyType: string;
  amount: number | null;
  currency: string;
  applicationDate: string | null;
  deadline: string | null;
  status: string;
  notes: string | null;
}

const STATUSES = ['PLANNED', 'APPLIED', 'APPROVED', 'REJECTED', 'RECEIVED'] as const;
type Status = typeof STATUSES[number];

const TYPES = ['AREA_PAYMENT', 'RURAL_DEVELOPMENT', 'AGRI_ENVIRONMENT', 'YOUNG_FARMER', 'OTHER'] as const;

const STATUS_COLORS: Record<Status, string> = {
  PLANNED:  'bg-gray-100 text-gray-700',
  APPLIED:  'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
};

const EMPTY_FORM = {
  subsidyName: '',
  subsidyType: 'AREA_PAYMENT',
  amount: '',
  currency: 'EUR',
  applicationDate: '',
  deadline: '',
  status: 'PLANNED' as Status,
  notes: '',
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function SubsidyPage() {
  const [records, setRecords] = useState<SubsidyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Status | ''>('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/Controllers/Subsidy');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRecords(data.records ?? []);
    } catch {
      setError('Failed to load subsidy records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const filtered = useMemo(() =>
    filterStatus ? records.filter(r => r.status === filterStatus) : records,
    [records, filterStatus]
  );

  const stats = useMemo(() => {
    const totalApproved = records.filter(r => r.status === 'APPROVED' || r.status === 'RECEIVED').reduce((s, r) => s + (r.amount ?? 0), 0);
    const totalReceived = records.filter(r => r.status === 'RECEIVED').reduce((s, r) => s + (r.amount ?? 0), 0);
    const upcoming = records.filter(r => {
      const d = daysUntil(r.deadline);
      return d != null && d >= 0 && d <= 30 && r.status !== 'RECEIVED' && r.status !== 'REJECTED';
    });
    return { totalApproved, totalReceived, upcoming };
  }, [records]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(r: SubsidyRecord) {
    setEditingId(r.id);
    setForm({
      subsidyName: r.subsidyName,
      subsidyType: r.subsidyType,
      amount: r.amount != null ? String(r.amount) : '',
      currency: r.currency,
      applicationDate: r.applicationDate ? r.applicationDate.slice(0, 10) : '',
      deadline: r.deadline ? r.deadline.slice(0, 10) : '',
      status: r.status as Status,
      notes: r.notes ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        subsidyName: form.subsidyName.trim(),
        subsidyType: form.subsidyType,
        amount: form.amount ? Number(form.amount) : null,
        currency: form.currency || 'EUR',
        applicationDate: form.applicationDate || null,
        deadline: form.deadline || null,
        status: form.status,
        notes: form.notes || null,
      };
      const url = editingId ? `/api/Controllers/Subsidy/${editingId}` : '/api/Controllers/Subsidy';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed'); }
      setShowForm(false);
      await loadRecords();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this subsidy record?')) return;
    try {
      const res = await fetch(`/api/Controllers/Subsidy/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await loadRecords();
    } catch { alert('Failed to delete'); }
  }

  async function quickStatus(id: number, status: Status) {
    try {
      await fetch(`/api/Controllers/Subsidy/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await loadRecords();
    } catch { alert('Failed to update status'); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subsidies & Compliance</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track EU CAP subsidies, applications, and deadlines</p>
            </div>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Subsidy
            </button>
          </div>

          {error && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {/* Deadline alerts */}
          {stats.upcoming.length > 0 && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">
                ⚠ Deadline within 30 days: {stats.upcoming.map(r => {
                  const d = daysUntil(r.deadline);
                  return `${r.subsidyName} (${d === 0 ? 'today' : `${d}d`})`;
                }).join(', ')}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="px-6 py-4 border-b border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600">Applied</p>
              <p className="text-2xl font-bold text-blue-900">{records.filter(r => r.status === 'APPLIED').length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">Approved (€)</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalApproved > 0 ? `€${stats.totalApproved.toLocaleString()}` : '—'}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-emerald-600">Received (€)</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.totalReceived > 0 ? `€${stats.totalReceived.toLocaleString()}` : '—'}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="px-6 py-3 flex items-center gap-2 flex-wrap border-b border-gray-100">
            <span className="text-sm text-gray-500">Status:</span>
            {(['', ...STATUSES] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s as Status | '')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterStatus === s ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}>
                {s === '' ? 'All' : s}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No subsidy records. Add your first application.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Subsidy','Type','Amount','Status','Application Date','Deadline','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(r => {
                    const deadlineDays = daysUntil(r.deadline);
                    const deadlineAlert = deadlineDays != null && deadlineDays >= 0 && deadlineDays <= 30;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {r.subsidyName}
                          {r.notes && <p className="text-xs text-gray-400 mt-0.5 font-normal max-w-xs truncate">{r.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.subsidyType.replace('_', ' ')}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {r.amount != null ? `${r.currency} ${Number(r.amount).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={r.status}
                            onChange={e => quickStatus(r.id, e.target.value as Status)}
                            className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_COLORS[r.status as Status] ?? STATUS_COLORS.PLANNED}`}
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {r.applicationDate ? new Date(r.applicationDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap font-medium ${deadlineAlert ? 'text-amber-700' : 'text-gray-700'}`}>
                          {r.deadline ? (
                            <>
                              {new Date(r.deadline).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                              {deadlineAlert && <span className="ml-1 text-xs text-amber-600">({deadlineDays}d)</span>}
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-gray-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(r.id)} className="p-1 text-gray-400 hover:text-red-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Subsidy' : 'Add Subsidy'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subsidy Name *</label>
                  <input type="text" value={form.subsidyName} onChange={e => setForm(f => ({ ...f, subsidyName: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g. SAPS Basic Payment 2024" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select value={form.subsidyType} onChange={e => setForm(f => ({ ...f, subsidyType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    {['EUR', 'RON', 'USD', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Date</label>
                  <input type="date" value={form.applicationDate} onChange={e => setForm(f => ({ ...f, applicationDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Eligibility criteria, documentation required…" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {submitting ? 'Saving…' : editingId ? 'Update' : 'Add Subsidy'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
