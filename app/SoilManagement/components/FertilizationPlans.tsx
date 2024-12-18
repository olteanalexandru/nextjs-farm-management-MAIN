'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Crop {
  id: number;
  cropName: string;
}

interface FertilizationPlan {
  id: number;
  plannedDate: string;
  fertilizer: string;
  applicationRate: number;
  nitrogenContent: number;
  applicationMethod: string;
  notes?: string;
  completed: boolean;
  completedDate?: string;
  crop: Crop;
}

interface FertilizationPlanFormData {
  cropId: string;
  plannedDate: string;
  fertilizer: string;
  applicationRate: string;
  nitrogenContent: string;
  applicationMethod: string;
  notes?: string;
}

export default function FertilizationPlans() {
  const t = useTranslations('SoilManagement');
  const [plans, setPlans] = useState<FertilizationPlan[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FertilizationPlan | null>(null);
  const [formData, setFormData] = useState<FertilizationPlanFormData>({
    cropId: '',
    plannedDate: '',
    fertilizer: '',
    applicationRate: '',
    nitrogenContent: '',
    applicationMethod: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetchFertilizationPlans(),
      fetchCrops()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchFertilizationPlans = async () => {
    try {
      const response = await fetch('/api/Controllers/Soil/fertilizationPlans');
      if (!response.ok) throw new Error('Failed to fetch fertilization plans');
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchCrops = async () => {
    try {
      const response = await fetch('/api/Controllers/Crop/crops/retrieve/all');
      if (!response.ok) throw new Error('Failed to fetch crops');
      const data = await response.json();
      setCrops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingPlan
        ? `/api/Controllers/Soil/fertilizationPlan/${editingPlan.id}`
        : '/api/Controllers/Soil/fertilizationPlan';
      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropId: parseInt(formData.cropId),
          plannedDate: new Date(formData.plannedDate).toISOString(),
          fertilizer: formData.fertilizer,
          applicationRate: parseFloat(formData.applicationRate),
          nitrogenContent: parseFloat(formData.nitrogenContent),
          applicationMethod: formData.applicationMethod,
          notes: formData.notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to save fertilization plan');

      await fetchFertilizationPlans();
      setShowForm(false);
      setEditingPlan(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      const response = await fetch(`/api/Controllers/Soil/fertilizationPlan/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete fertilization plan');
      await fetchFertilizationPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (plan: FertilizationPlan) => {
    setEditingPlan(plan);
    setFormData({
      cropId: plan.crop.id.toString(),
      plannedDate: new Date(plan.plannedDate).toISOString().split('T')[0],
      fertilizer: plan.fertilizer,
      applicationRate: plan.applicationRate.toString(),
      nitrogenContent: plan.nitrogenContent.toString(),
      applicationMethod: plan.applicationMethod,
      notes: plan.notes || '',
    });
    setShowForm(true);
  };

  const handleComplete = async (id: number) => {
    try {
      const response = await fetch(`/api/Controllers/Soil/fertilizationPlan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: true,
          completedDate: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to mark plan as completed');
      await fetchFertilizationPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      cropId: '',
      plannedDate: '',
      fertilizer: '',
      applicationRate: '',
      nitrogenContent: '',
      applicationMethod: '',
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
        <h2 className="text-xl font-semibold">{t('fertilizationPlans')}</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingPlan(null);
            resetForm();
          }}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          {showForm ? t('cancel') : t('addNewPlan')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('crop')}</label>
              <select
                required
                value={formData.cropId}
                onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">{t('selectCrop')}</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.cropName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('plannedDate')}</label>
              <input
                type="date"
                required
                value={formData.plannedDate}
                onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('fertilizer')}</label>
              <input
                type="text"
                required
                value={formData.fertilizer}
                onChange={(e) => setFormData({ ...formData, fertilizer: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('applicationRate')}</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.applicationRate}
                onChange={(e) => setFormData({ ...formData, applicationRate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('nitrogenContent')}</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.nitrogenContent}
                onChange={(e) => setFormData({ ...formData, nitrogenContent: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('applicationMethod')}</label>
              <select
                required
                value={formData.applicationMethod}
                onChange={(e) => setFormData({ ...formData, applicationMethod: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">{t('selectMethod')}</option>
                <option value="Broadcast">{t('broadcast')}</option>
                <option value="Band">{t('band')}</option>
                <option value="Foliar">{t('foliar')}</option>
                <option value="Fertigation">{t('fertigation')}</option>
                <option value="Injection">{t('injection')}</option>
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
              {editingPlan ? t('updatePlan') : t('addPlan')}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {plans.length === 0 ? (
          <p className="text-gray-500 text-center">{t('noPlans')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('plannedDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('crop')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('fertilizer')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('applicationRate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('nitrogenContent')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('applicationMethod')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.id} className={plan.completed ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(plan.plannedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{plan.crop.cropName}</td>
                    <td className="px-6 py-4">{plan.fertilizer}</td>
                    <td className="px-6 py-4">{plan.applicationRate} kg/ha</td>
                    <td className="px-6 py-4">{plan.nitrogenContent}%</td>
                    <td className="px-6 py-4">{plan.applicationMethod}</td>
                    <td className="px-6 py-4">
                      {plan.completed ? (
                        <span className="text-green-600">
                          {t('completed')} {plan.completedDate && `(${new Date(plan.completedDate).toLocaleDateString()})`}
                        </span>
                      ) : (
                        <span className="text-yellow-600">{t('pending')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {!plan.completed && (
                        <>
                          <button
                            onClick={() => handleEdit(plan)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => handleComplete(plan.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            {t('complete')}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(plan.id)}
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
