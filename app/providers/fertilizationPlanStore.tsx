'use client';

import { createContext, useContext, useState, useCallback } from 'react';

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

interface FertilizationPlanContextType {
  plans: FertilizationPlan[];
  loading: boolean;
  error: string | null;
  fetchFertilizationPlans: () => Promise<FertilizationPlan[]>;
  saveFertilizationPlan: (editingPlan: FertilizationPlan | null, formData: FertilizationPlanFormData) => Promise<void>;
  deleteFertilizationPlan: (id: number) => Promise<void>;
  fetchCrops: () => Promise<Crop[]>;
  clearError: () => void;
}

const FertilizationPlanContext = createContext<FertilizationPlanContextType | undefined>(undefined);

export function FertilizationPlanProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<FertilizationPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFertilizationPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/Controllers/Soil/fertilizationPlans');
      if (!response.ok) throw new Error('Failed to fetch fertilization plans');
      const data = await response.json();
      setPlans(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCrops = useCallback(async () => {
    try {
      const response = await fetch('/api/Controllers/Crop/crops');
      if (!response.ok) throw new Error('Failed to fetch crops');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, []);

  const saveFertilizationPlan = useCallback(async (editingPlan: FertilizationPlan | null, formData: FertilizationPlanFormData) => {
    const endpoint = editingPlan
      ? `/api/Controllers/Soil/fertilizationPlan/${editingPlan.id}`
      : '/api/Controllers/Soil/fertilizationPlan';
    const method = editingPlan ? 'PUT' : 'POST';

    try {
      setLoading(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFertilizationPlans]);

  const deleteFertilizationPlan = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/Controllers/Soil/fertilizationPlan/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete fertilization plan');
      setPlans(prev => prev.filter(plan => plan.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <FertilizationPlanContext.Provider
      value={{
        plans,
        loading,
        error,
        fetchFertilizationPlans,
        saveFertilizationPlan,
        deleteFertilizationPlan,
        fetchCrops,
        clearError,
      }}
    >
      {children}
    </FertilizationPlanContext.Provider>
  );
}

export function useFertilizationPlans() {
  const context = useContext(FertilizationPlanContext);
  if (context === undefined) {
    throw new Error('useFertilizationPlans must be used within a FertilizationPlanProvider');
  }
  return context;
}
