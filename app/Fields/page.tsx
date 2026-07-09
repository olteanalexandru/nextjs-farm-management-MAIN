'use client';

import { useEffect, useState } from 'react';

interface Field {
  id: number;
  name: string;
  areaHa: number | null;
  soilType: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  notes: string | null;
  createdAt: string;
}

const SOIL_TYPES = ['Sandy', 'Loamy', 'Clay', 'Silt', 'Sandy Loam', 'Clay Loam', 'Silt Loam'];

const EMPTY_FORM = {
  name: '',
  areaHa: '',
  soilType: '',
  gpsLat: '',
  gpsLng: '',
  notes: '',
};

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);

  const loadFields = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/Controllers/Field');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load fields');
      setFields(data.fields || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        areaHa: form.areaHa !== '' ? Number(form.areaHa) : null,
        soilType: form.soilType || null,
        gpsLat: form.gpsLat !== '' ? Number(form.gpsLat) : null,
        gpsLng: form.gpsLng !== '' ? Number(form.gpsLng) : null,
        notes: form.notes || null,
      };

      const res = editingId
        ? await fetch(`/api/Controllers/Field/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/Controllers/Field', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (!res.ok) throw new Error('Failed to save field');
      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      setShowForm(false);
      await loadFields();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (field: Field) => {
    setForm({
      name: field.name,
      areaHa: field.areaHa != null ? String(field.areaHa) : '',
      soilType: field.soilType || '',
      gpsLat: field.gpsLat != null ? String(field.gpsLat) : '',
      gpsLng: field.gpsLng != null ? String(field.gpsLng) : '',
      notes: field.notes || '',
    });
    setEditingId(field.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this field?')) return;
    try {
      await fetch(`/api/Controllers/Field/${id}`, { method: 'DELETE' });
      await loadFields();
    } catch {
      setError('Failed to delete field');
    }
  };

  const handleCancel = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="border-b pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Registry</h1>
          <p className="mt-1 text-gray-600">Manage your farm fields. Link soil tests, harvest records, and rotations to specific fields.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
          >
            + Add Field
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit Field' : 'New Field'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. North Field"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area (hectares)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.areaHa}
                  onChange={e => setForm(f => ({ ...f, areaHa: e.target.value }))}
                  placeholder="e.g. 5.5"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
                <select
                  value={form.soilType}
                  onChange={e => setForm(f => ({ ...f, soilType: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— Select —</option>
                  {SOIL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPS Latitude</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={form.gpsLat}
                    onChange={e => setForm(f => ({ ...f, gpsLat: e.target.value }))}
                    placeholder="e.g. 45.943"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPS Longitude</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={form.gpsLng}
                    onChange={e => setForm(f => ({ ...f, gpsLng: e.target.value }))}
                    placeholder="e.g. 24.967"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes about this field…"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : editingId ? 'Update Field' : 'Add Field'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No fields yet</p>
          <p className="text-sm mt-1">Add your first field to start linking soil tests and harvest records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field.id} className="bg-white rounded-lg shadow border p-5 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 text-lg">{field.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(field)}
                    className="text-xs px-2 py-1 border rounded text-blue-600 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                {field.areaHa != null && (
                  <span><span className="font-medium">Area:</span> {field.areaHa} ha</span>
                )}
                {field.soilType && (
                  <span><span className="font-medium">Soil:</span> {field.soilType}</span>
                )}
                {field.gpsLat != null && field.gpsLng != null && (
                  <span className="col-span-2 text-xs text-gray-400">
                    GPS: {Number(field.gpsLat).toFixed(4)}, {Number(field.gpsLng).toFixed(4)}
                  </span>
                )}
              </div>
              {field.notes && (
                <p className="text-sm text-gray-500 border-t pt-2">{field.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
