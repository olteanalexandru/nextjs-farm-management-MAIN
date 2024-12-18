'use client';

import { createContext, useContext, useState, useCallback } from 'react';

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

interface FertilizationPlan {
  id: number;
  cropId: number;
  plannedDate: string;
  fertilizer: string;
  applicationRate: number;
  nitrogenContent: number;
  applicationMethod: string;
  notes?: string;
  completed: boolean;
  completedDate?: string;
  crop: {
    id: number;
    cropName: string;
  };
}

interface SoilManagementContextType {
  soilTests: SoilTest[];
  fertilizationPlans: FertilizationPlan[];
  loading: boolean;
  error: string | null;
  fetchSoilTests: () => Promise<void>;
  fetchFertilizationPlans: () => Promise<void>;
  addSoilTest: (data: Omit<SoilTest, 'id'>) => Promise<SoilTest>;
  updateSoilTest: (id: number, data: Partial<SoilTest>) => Promise<SoilTest>;
  deleteSoilTest: (id: number) => Promise<void>;
  addFertilizationPlan: (data: Omit<FertilizationPlan, 'id' | 'crop'>) => Promise<FertilizationPlan>;
  updateFertilizationPlan: (id: number, data: Partial<FertilizationPlan>) => Promise<FertilizationPlan>;
  deleteFertilizationPlan: (id: number) => Promise<void>;
  clearError: () => void;
}

const SoilManagementContext = createContext<SoilManagementContextType | undefined>(undefined);

export function SoilManagementProvider({ children }: { children: React.ReactNode }) {
  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);
  const [fertilizationPlans, setFertilizationPlans] = useState<FertilizationPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSoilTests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/Controllers/Soil/soilTests');
      if (!response.ok) throw new Error('Failed to fetch soil tests');
      const data = await response.json();
      setSoilTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFertilizationPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/Controllers/Soil/fertilizationPlans');
      if (!response.ok) throw new Error('Failed to fetch fertilization plans');
      const data = await response.json();
      setFertilizationPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addSoilTest = useCallback(async (data: Omit<SoilTest, 'id'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/Controllers/Soil/soilTest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add soil test');
      const newTest = await response.json();
      setSoilTests(prev => [...prev, newTest]);
      return newTest;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSoilTest = useCallback(async (id: number, data: Partial<SoilTest>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/Controllers/Soil/soilTest/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update soil test');
      const updatedTest = await response.json();
      setSoilTests(prev => prev.map(test => test.id === id ? updatedTest : test));
      return updatedTest;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSoilTest = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/Controllers/Soil/soilTest/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete soil test');
      setSoilTests(prev => prev.filter(test => test.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addFertilizationPlan = useCallback(async (data: Omit<FertilizationPlan, 'id' | 'crop'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/Controllers/Soil/fertilizationPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add fertilization plan');
      const newPlan = await response.json();
      setFertilizationPlans(prev => [...prev, newPlan]);
      return newPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFertilizationPlan = useCallback(async (id: number, data: Partial<FertilizationPlan>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/Controllers/Soil/fertilizationPlan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update fertilization plan');
      const updatedPlan = await response.json();
      setFertilizationPlans(prev => prev.map(plan => plan.id === id ? updatedPlan : plan));
      return updatedPlan;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFertilizationPlan = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/Controllers/Soil/fertilizationPlan/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete fertilization plan');
      setFertilizationPlans(prev => prev.filter(plan => plan.id !== id));
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

  const value = {
    soilTests,
    fertilizationPlans,
    loading,
    error,
    fetchSoilTests,
    fetchFertilizationPlans,
    addSoilTest,
    updateSoilTest,
    deleteSoilTest,
    addFertilizationPlan,
    updateFertilizationPlan,
    deleteFertilizationPlan,
    clearError,
  };

  return (
    <SoilManagementContext.Provider value={value}>
      {children}
    </SoilManagementContext.Provider>
  );
}

export function useSoilManagement() {
  const context = useContext(SoilManagementContext);
  if (context === undefined) {
    throw new Error('useSoilManagement must be used within a SoilManagementProvider');
  }
  return context;
}
