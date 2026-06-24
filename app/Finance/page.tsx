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

interface FinancialRecord {
  id: number;
  cropId: number | null;
  cropName: string | null;
  type: 'EXPENSE' | 'REVENUE';
  category: string;
  amount: number;
  currency: string;
  recordDate: string;
  description: string | null;
}

interface CropBreakdown {
  cropName: string;
  revenue: number;
  expense: number;
}

interface MonthBreakdown {
  month: string;
  revenue: number;
  expense: number;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  byCrop: CropBreakdown[];
  byMonth: MonthBreakdown[];
}

const EXPENSE_CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticides', 'Labor', 'Equipment', 'Fuel', 'Rent', 'Irrigation', 'Other'];
const REVENUE_CATEGORIES = ['Crop Sales', 'Subsidy', 'Other'];

const EMPTY_FORM = {
  type: 'EXPENSE' as 'EXPENSE' | 'REVENUE',
  category: '',
  amount: '',
  currency: 'EUR',
  recordDate: '',
  cropId: '',
  description: '',
};

export default function FinancePage() {
  const [crops, setCrops] = useState<OwnCrop[]>([]);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
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
        fetch('/api/Controllers/Finance'),
        fetch('/api/Controllers/Finance/summary'),
      ]);

      const cropsData = await cropsRes.json();
      const recordsData = await recordsRes.json();
      const summaryData = await summaryRes.json();

      if (!cropsRes.ok) throw new Error(cropsData?.error || 'Failed to load crops');
      if (!recordsRes.ok) throw new Error(recordsData?.error || 'Failed to load financial records');
      if (!summaryRes.ok) throw new Error(summaryData?.error || 'Failed to load financial summary');

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

  const handleEdit = (record: FinancialRecord) => {
    setEditingId(record.id);
    setForm({
      type: record.type,
      category: record.category,
      amount: record.amount.toString(),
      currency: record.currency,
      recordDate: record.recordDate.slice(0, 10),
      cropId: record.cropId?.toString() || '',
      description: record.description || '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this financial record?')) return;
    try {
      const res = await fetch(`/api/Controllers/Finance/${id}`, { method: 'DELETE' });
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
        type: form.type,
        category: form.category,
        amount: form.amount,
        currency: form.currency,
        recordDate: form.recordDate,
        cropId: form.cropId || undefined,
        description: form.description || undefined,
      };

      const url = editingId ? `/api/Controllers/Finance/${editingId}` : '/api/Controllers/Finance';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save financial record');

      resetForm();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = form.type === 'EXPENSE' ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES;

  const chartData = useMemo(() => {
    if (!summary) return [];
    return summary.byMonth.map(m => ({
      month: m.month,
      Revenue: m.revenue,
      Expense: m.expense,
    }));
  }, [summary]);

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
        <h1 className="text-2xl font-bold text-gray-900">Financial Tracking</h1>
        <p className="mt-2 text-gray-600">Track costs and revenue, and monitor profit and loss per crop.</p>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">€{summary.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">€{summary.totalExpense.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Net Profit</p>
            <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{summary.netProfit.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {summary && summary.byCrop.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h2 className="font-medium text-gray-900 mb-4">Profit & Loss by Crop</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expense</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summary.byCrop.map((c) => (
                <tr key={c.cropName}>
                  <td className="px-4 py-2 text-sm text-gray-700">{c.cropName}</td>
                  <td className="px-4 py-2 text-sm text-green-600">€{c.revenue.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-red-600">€{c.expense.toFixed(2)}</td>
                  <td className={`px-4 py-2 text-sm font-medium ${c.revenue - c.expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{(c.revenue - c.expense).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-medium text-gray-900 mb-4">Revenue vs Expenses by Month</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Revenue" fill="#16a34a" />
                <Bar dataKey="Expense" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="font-medium text-gray-900">{editingId ? 'Edit Financial Record' : 'Add Financial Record'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'EXPENSE' | 'REVENUE', category: '' })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="EXPENSE">Expense</option>
              <option value="REVENUE">Revenue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Select a category</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="RON">RON</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.recordDate}
              onChange={(e) => setForm({ ...form, recordDate: e.target.value })}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop (optional)</label>
            <select
              value={form.cropId}
              onChange={(e) => setForm({ ...form, cropId: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">None / General</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>{crop.cropName}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No financial records yet. Add your first record above.</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{record.recordDate.slice(0, 10)}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`text-xs px-2 py-1 rounded-full ${record.type === 'REVENUE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{record.category}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{record.cropName || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{record.currency} {record.amount.toFixed(2)}</td>
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
