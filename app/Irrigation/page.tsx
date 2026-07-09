'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface IrrigationEvent {
  id: number;
  eventDate: string;
  durationMin: number | null;
  volumeM3: number | null;
  method: string;
  waterSource: string | null;
  notes: string | null;
}

const METHODS = ['DRIP', 'SPRINKLER', 'FLOOD', 'FURROW', 'OTHER'] as const;
type Method = typeof METHODS[number];

const METHOD_COLORS: Record<Method, string> = {
  DRIP:       'bg-blue-100 text-blue-800',
  SPRINKLER:  'bg-cyan-100 text-cyan-800',
  FLOOD:      'bg-indigo-100 text-indigo-800',
  FURROW:     'bg-teal-100 text-teal-800',
  OTHER:      'bg-gray-100 text-gray-800',
};

const EMPTY_FORM = {
  eventDate: new Date().toISOString().slice(0, 10),
  durationMin: '',
  volumeM3: '',
  method: 'DRIP' as Method,
  waterSource: '',
  notes: '',
};

export default function IrrigationPage() {
  const [events, setEvents] = useState<IrrigationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/Controllers/Irrigation?year=${year}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setError('Failed to load irrigation events');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const stats = useMemo(() => {
    const totalVol = events.reduce((s, e) => s + (e.volumeM3 != null ? Number(e.volumeM3) : 0), 0);
    const totalMin = events.reduce((s, e) => s + (e.durationMin ?? 0), 0);
    return { count: events.length, totalVol, totalMin };
  }, [events]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(ev: IrrigationEvent) {
    setEditingId(ev.id);
    setForm({
      eventDate: ev.eventDate.slice(0, 10),
      durationMin: ev.durationMin != null ? String(ev.durationMin) : '',
      volumeM3: ev.volumeM3 != null ? String(ev.volumeM3) : '',
      method: ev.method as Method,
      waterSource: ev.waterSource ?? '',
      notes: ev.notes ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        eventDate: form.eventDate,
        durationMin: form.durationMin ? Number(form.durationMin) : null,
        volumeM3: form.volumeM3 ? Number(form.volumeM3) : null,
        method: form.method,
        waterSource: form.waterSource || null,
        notes: form.notes || null,
      };
      const url = editingId ? `/api/Controllers/Irrigation/${editingId}` : '/api/Controllers/Irrigation';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed'); }
      setShowForm(false);
      await loadEvents();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this irrigation event?')) return;
    try {
      const res = await fetch(`/api/Controllers/Irrigation/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadEvents();
    } catch { alert('Failed to delete'); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Irrigation Log</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track water usage, methods, and durations</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded hover:bg-gray-100">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm font-medium text-gray-700 w-12 text-center">{year}</span>
                <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded hover:bg-gray-100">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Log Event
              </button>
            </div>
          </div>

          {error && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {/* Stats */}
          <div className="px-6 py-4 border-b border-gray-200 grid grid-cols-3 gap-4">
            <div className="bg-cyan-50 rounded-lg p-3">
              <p className="text-xs text-cyan-600">Events</p>
              <p className="text-2xl font-bold text-cyan-900">{stats.count}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600">Total Volume</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalVol > 0 ? `${stats.totalVol.toFixed(1)} m³` : '—'}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-xs text-indigo-600">Total Duration</p>
              <p className="text-2xl font-bold text-indigo-900">{stats.totalMin > 0 ? `${Math.round(stats.totalMin / 60)}h ${stats.totalMin % 60}m` : '—'}</p>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <svg className="mx-auto w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c-4.97 5.38-7 8.88-7 12a7 7 0 0014 0c0-3.12-2.03-6.62-7-12z" />
              </svg>
              <p className="text-sm">No irrigation events for {year}. Log your first event.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Date','Method','Duration','Volume','Water Source','Notes','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {new Date(ev.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLORS[ev.method as Method] ?? METHOD_COLORS.OTHER}`}>
                          {ev.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{ev.durationMin != null ? `${ev.durationMin} min` : '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{ev.volumeM3 != null ? `${Number(ev.volumeM3).toFixed(2)} m³` : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{ev.waterSource ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{ev.notes ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(ev)} className="p-1 text-gray-400 hover:text-gray-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(ev.id)} className="p-1 text-gray-400 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Event' : 'Log Irrigation Event'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method *</label>
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as Method }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" min="0" step="1" value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume (m³)</label>
                  <input type="number" min="0" step="0.001" value={form.volumeM3} onChange={e => setForm(f => ({ ...f, volumeM3: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Water Source</label>
                  <input type="text" value={form.waterSource} onChange={e => setForm(f => ({ ...f, waterSource: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Well, river, reservoir…" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                  {submitting ? 'Saving…' : editingId ? 'Update' : 'Log Event'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
