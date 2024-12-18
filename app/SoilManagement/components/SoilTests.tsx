'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import LoadingSpinner from '../../components/LoadingSpinner';

interface SoilTest {
  id: number;
  testDate: string;
  fieldLocation: string;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  texture: string;
  notes?: string;
}

interface SoilTestFormData {
  testDate: string;
  fieldLocation: string;
  pH: string;
  organicMatter: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  texture: string;
  notes?: string;
}

export default function SoilTests() {
  const t = useTranslations('SoilManagement');
  const [tests, setTests] = useState<SoilTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<SoilTest | null>(null);
  const [formData, setFormData] = useState<SoilTestFormData>({
    testDate: '',
    fieldLocation: '',
    pH: '',
    organicMatter: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    texture: '',
    notes: '',
  });

  useEffect(() => {
    fetchSoilTests();
  }, []);

  const fetchSoilTests = async () => {
    try {
      const response = await fetch('/api/Controllers/Soil/soilTests');
      if (!response.ok) throw new Error('Failed to fetch soil tests');
      const data = await response.json();
      setTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingTest
        ? `/api/Controllers/Soil/soilTest/${editingTest.id}`
        : '/api/Controllers/Soil/soilTest';
      const method = editingTest ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testDate: new Date(formData.testDate).toISOString(),
          fieldLocation: formData.fieldLocation,
          pH: parseFloat(formData.pH),
          organicMatter: parseFloat(formData.organicMatter),
          nitrogen: parseFloat(formData.nitrogen),
          phosphorus: parseFloat(formData.phosphorus),
          potassium: parseFloat(formData.potassium),
          texture: formData.texture,
          notes: formData.notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to save soil test');

      await fetchSoilTests();
      setShowForm(false);
      setEditingTest(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      const response = await fetch(`/api/Controllers/Soil/soilTest/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete soil test');
      await fetchSoilTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (test: SoilTest) => {
    setEditingTest(test);
    setFormData({
      testDate: new Date(test.testDate).toISOString().split('T')[0],
      fieldLocation: test.fieldLocation,
      pH: test.pH.toString(),
      organicMatter: test.organicMatter.toString(),
      nitrogen: test.nitrogen.toString(),
      phosphorus: test.phosphorus.toString(),
      potassium: test.potassium.toString(),
      texture: test.texture,
      notes: test.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      testDate: '',
      fieldLocation: '',
      pH: '',
      organicMatter: '',
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      texture: '',
      notes: '',
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('soilTests')}</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingTest(null);
            resetForm();
          }}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          {showForm ? t('cancel') : t('addNewTest')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('testDate')}</label>
              <input
                type="date"
                required
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('fieldLocation')}</label>
              <input
                type="text"
                required
                value={formData.fieldLocation}
                onChange={(e) => setFormData({ ...formData, fieldLocation: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('pH')}</label>
              <input
                type="number"
                required
                step="0.1"
                value={formData.pH}
                onChange={(e) => setFormData({ ...formData, pH: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('organicMatter')}</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.organicMatter}
                onChange={(e) => setFormData({ ...formData, organicMatter: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('nitrogen')}</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.nitrogen}
                onChange={(e) => setFormData({ ...formData, nitrogen: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('phosphorus')}</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.phosphorus}
                onChange={(e) => setFormData({ ...formData, phosphorus: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('potassium')}</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.potassium}
                onChange={(e) => setFormData({ ...formData, potassium: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('texture')}</label>
              <select
                required
                value={formData.texture}
                onChange={(e) => setFormData({ ...formData, texture: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">{t('selectTexture')}</option>
                <option value="Sandy">{t('sandy')}</option>
                <option value="Loamy">{t('loamy')}</option>
                <option value="Clay">{t('clay')}</option>
                <option value="Silt">{t('silt')}</option>
                <option value="Sandy Loam">{t('sandyLoam')}</option>
                <option value="Clay Loam">{t('clayLoam')}</option>
                <option value="Silt Loam">{t('siltLoam')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              {editingTest ? t('updateTest') : t('addTest')}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {tests.length === 0 ? (
          <p className="text-gray-500 text-center">{t('noTests')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('testDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fieldLocation')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('pH')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('organicMatter')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NPK</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('texture')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(test.testDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{test.fieldLocation}</td>
                    <td className="px-6 py-4">{test.pH}</td>
                    <td className="px-6 py-4">{test.organicMatter}%</td>
                    <td className="px-6 py-4">
                      {test.nitrogen}/{test.phosphorus}/{test.potassium}
                    </td>
                    <td className="px-6 py-4">{test.texture}</td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleEdit(test)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(test.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
