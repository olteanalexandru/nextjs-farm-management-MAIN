'use client';

import { useEffect, useState } from 'react';

interface OwnCrop { id: number; cropName: string }
interface OwnField { id: number; name: string }

interface Observation {
  id: number;
  observedAt: string;
  fieldId: number | null;
  cropId: number | null;
  category: string;
  description: string;
  photoUrl: string | null;
  field?: { name: string } | null;
  crop?: { cropName: string } | null;
}

const CATEGORIES = ['PEST', 'DISEASE', 'EQUIPMENT', 'WEATHER', 'SOIL', 'GENERAL'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  PEST: 'bg-red-100 text-red-800',
  DISEASE: 'bg-orange-100 text-orange-800',
  EQUIPMENT: 'bg-blue-100 text-blue-800',
  WEATHER: 'bg-sky-100 text-sky-800',
  SOIL: 'bg-amber-100 text-amber-800',
  GENERAL: 'bg-gray-100 text-gray-700',
};

const EMPTY_FORM = {
  observedAt: new Date().toISOString().slice(0, 10),
  fieldId: '',
  cropId: '',
  category: 'GENERAL',
  description: '',
  photoUrl: '',
};

export default function ObservationLogPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [crops, setCrops] = useState<OwnCrop[]>([]);
  const [fields, setFields] = useState<OwnField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [obsRes, cropsRes, fieldsRes] = await Promise.all([
        fetch('/api/Controllers/Observation'),
        fetch('/api/Controllers/Crop/crops/all'),
        fetch('/api/Controllers/Field'),
      ]);
      const obsData = await obsRes.json();
      const cropsData = await cropsRes.json();
      const fieldsData = await fieldsRes.json();

      setObservations(obsData.observations || []);
      setCrops((cropsData.crops || []).filter((c: any) => c.isOwnCrop));
      setFields(fieldsData.fields || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (obs: Observation) => {
    setEditingId(obs.id);
    setForm({
      observedAt: obs.observedAt.slice(0, 10),
      fieldId: obs.fieldId?.toString() || '',
      cropId: obs.cropId?.toString() || '',
      category: obs.category,
      description: obs.description,
      photoUrl: obs.photoUrl || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this observation?')) return;
    try {
      const res = await fetch(`/api/Controllers/Observation/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setObservations((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        observedAt: form.observedAt,
        fieldId: form.fieldId || undefined,
        cropId: form.cropId || undefined,
        category: form.category,
        description: form.description,
        photoUrl: form.photoUrl || undefined,
      };

      const url = editingId ? `/api/Controllers/Observation/${editingId}` : '/api/Controllers/Observation';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save');
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = categoryFilter
    ? observations.filter((o) => o.category === categoryFilter)
    : observations;

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Observation photo" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}

      <div className="border-b pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Observation Log</h1>
          <p className="mt-1 text-gray-600">Timestamped journal of field observations, pests, and equipment notes.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm"
        >
          + New Observation
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="font-medium text-gray-900">{editingId ? 'Edit Observation' : 'New Observation'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.observedAt}
                onChange={(e) => setForm({ ...form, observedAt: e.target.value })}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field (optional)</label>
              <select
                value={form.fieldId}
                onChange={(e) => setForm({ ...form, fieldId: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">— None —</option>
                {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop (optional)</label>
              <select
                value={form.cropId}
                onChange={(e) => setForm({ ...form, cropId: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">— None —</option>
                {crops.map((c) => <option key={c.id} value={c.id}>{c.cropName}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL (optional)</label>
              <input
                type="url"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="https://..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              required
              minLength={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300">
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Save Observation'}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategoryFilter('')}
          className={`px-3 py-1 rounded-full text-sm ${!categoryFilter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(categoryFilter === c ? '' : c)}
            className={`px-3 py-1 rounded-full text-sm ${categoryFilter === c ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          <p>No observations yet. Start your field log with the button above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((obs) => (
            <div key={obs.id} className="bg-white rounded-lg shadow p-4 flex gap-4">
              {obs.photoUrl && (
                <button
                  type="button"
                  className="shrink-0"
                  onClick={() => setLightboxUrl(obs.photoUrl!)}
                >
                  <img
                    src={obs.photoUrl}
                    alt="Observation"
                    className="h-20 w-20 object-cover rounded-md border border-gray-200"
                  />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[obs.category] || 'bg-gray-100 text-gray-700'}`}>
                    {obs.category}
                  </span>
                  <span className="text-xs text-gray-500">{obs.observedAt.slice(0, 10)}</span>
                  {obs.field && <span className="text-xs text-gray-500">📍 {obs.field.name}</span>}
                  {obs.crop && <span className="text-xs text-gray-500">🌱 {obs.crop.cropName}</span>}
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line">{obs.description}</p>
              </div>
              <div className="shrink-0 flex flex-col gap-1">
                <button onClick={() => handleEdit(obs)} className="text-blue-600 text-xs hover:underline">Edit</button>
                <button onClick={() => handleDelete(obs.id)} className="text-red-600 text-xs hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
