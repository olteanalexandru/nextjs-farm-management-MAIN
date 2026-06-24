'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface OwnCrop {
  id: number;
  cropName: string;
}

interface HarvestRecord {
  id: number;
  cropId: number;
  cropName: string | null;
  rotationPlanId: number | null;
  harvestDate: string;
  fieldLocation: string | null;
  divisionSize: number | null;
  actualYield: number;
  yieldUnit: string;
  qualityGrade: string | null;
  notes: string | null;
}

interface YieldByCropYear {
  cropName: string;
  year: number;
  totalYield: number;
  unit: string;
}

interface HarvestSummary {
  totalHarvests: number;
  totalYield: number;
  distinctCrops: number;
  yieldByCropYear: YieldByCropYear[];
}

const EMPTY_FORM = {
  cropId: '',
  harvestDate: '',
  fieldLocation: '',
  divisionSize: '',
  actualYield: '',
  yieldUnit: 'kg',
  qualityGrade: '',
  notes: '',
};

export default function HarvestPage() {
  const [crops, setCrops] = useState<OwnCrop[]>([]);
  const [records, setRecords] = useState<HarvestRecord[]>([]);
  const [summary, setSummary] = useState<HarvestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cropsRes, recordsRes, summaryRes] = await Promise.all([
        fetch('/api/Controllers/Crop/crops/all'),
        fetch('/api/Controllers/Harvest'),
        fetch('/api/Controllers/Harvest/summary'),
      ]);

      const cropsData = await cropsRes.json();
      const recordsData = await recordsRes.json();
      const summaryData = await summaryRes.json();

      if (!cropsRes.ok) throw new Error(cropsData?.error || 'Failed to load crops');
      if (!recordsRes.ok) throw new Error(recordsData?.error || 'Failed to load harvest records');
      if (!summaryRes.ok) throw new Error(summaryData?.error || 'Failed to load harvest summary');

      setCrops((cropsData.crops || []).filter((c: any) => c.isOwnCrop));
      setRecords(recordsData.records || []);
      setSummary(summaryData.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  };

  const handleEdit = (record: HarvestRecord) => {
    setEditingId(record.id);
    setForm({
      cropId: record.cropId.toString(),
      harvestDate: record.harvestDate.slice(0, 10),
      fieldLocation: record.fieldLocation || '',
      divisionSize: record.divisionSize?.toString() || '',
      actualYield: record.actualYield.toString(),
      yieldUnit: record.yieldUnit,
      qualityGrade: record.qualityGrade || '',
      notes: record.notes || '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this harvest record?')) return;
    try {
      const res = await fetch(`/api/Controllers/Harvest/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to delete record');
      }
      await loadAll();
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
        cropId: form.cropId,
        harvestDate: form.harvestDate,
        fieldLocation: form.fieldLocation || undefined,
        divisionSize: form.divisionSize || undefined,
        actualYield: form.actualYield,
        yieldUnit: form.yieldUnit,
        qualityGrade: form.qualityGrade || undefined,
        notes: form.notes || undefined,
      };

      const url = editingId ? `/api/Controllers/Harvest/${editingId}` : '/api/Controllers/Harvest';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save harvest record');

      resetForm();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = useMemo(() => {
    if (!summary) return [];
    const byYear = new Map<number, Record<string, number | string>>();
    for (const row of summary.yieldByCropYear) {
      const entry = byYear.get(row.year) || { year: row.year };
      entry[row.cropName] = row.totalYield;
      byYear.set(row.year, entry);
    }
    return Array.from(byYear.values()).sort((a: any, b: any) => a.year - b.year);
  }, [summary]);

  const cropNames = useMemo(() => {
    if (!summary) return [];
    return Array.from(new Set(summary.yieldByCropYear.map(r => r.cropName)));
  }, [summary]);

  const colors = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Harvest & Yield Tracking</h1>
        <p className="mt-2 text-gray-600">Log harvests and track yield trends across seasons.</p>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Harvests Logged</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalHarvests}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Yield Recorded</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalYield.toFixed(1)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Distinct Crops Harvested</p>
            <p className="text-2xl font-bold text-gray-900">{summary.distinctCrops}</p>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-medium text-gray-900 mb-4">Yield by Crop and Year</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                {cropNames.map((name, i) => (
                  <Bar key={name} dataKey={name} fill={colors[i % colors.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="font-medium text-gray-900">{editingId ? 'Edit Harvest Record' : 'Log New Harvest'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
            <select
              value={form.cropId}
              onChange={(e) => setForm({ ...form, cropId: e.target.value })}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Select a crop</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>{crop.cropName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
            <input
              type="date"
              value={form.harvestDate}
              onChange={(e) => setForm({ ...form, harvestDate: e.target.value })}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Location</label>
            <input
              type="text"
              value={form.fieldLocation}
              onChange={(e) => setForm({ ...form, fieldLocation: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Division Size (ha)</label>
            <input
              type="number"
              step="0.01"
              value={form.divisionSize}
              onChange={(e) => setForm({ ...form, divisionSize: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Yield</label>
            <input
              type="number"
              step="0.01"
              value={form.actualYield}
              onChange={(e) => setForm({ ...form, actualYield: e.target.value })}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yield Unit</label>
            <select
              value={form.yieldUnit}
              onChange={(e) => setForm({ ...form, yieldUnit: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="kg">kg</option>
              <option value="t">tonnes</option>
              <option value="kg/ha">kg/ha</option>
              <option value="t/ha">t/ha</option>
              <option value="bushels">bushels</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quality Grade</label>
            <input
              type="text"
              value={form.qualityGrade}
              onChange={(e) => setForm({ ...form, qualityGrade: e.target.value })}
              placeholder="e.g. Grade A"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="flex justify-end gap-2">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300"
          >
            {submitting ? 'Saving...' : editingId ? 'Update Record' : 'Add Record'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Yield</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No harvest records yet. Log your first harvest above.</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{record.harvestDate.slice(0, 10)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{record.cropName}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{record.fieldLocation || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{record.actualYield} {record.yieldUnit}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{record.qualityGrade || '-'}</td>
                  <td className="px-4 py-2 text-sm space-x-2">
                    <button onClick={() => handleEdit(record)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
