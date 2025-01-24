'use client';

import { makeAutoObservable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import axios from 'axios';
import { createContext, useContext } from 'react';

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

class SoilManagementStore {
  soilTests: SoilTest[] = [];
  fertilizationPlans: FertilizationPlan[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  clearError = () => {
    this.error = null;
  };

  setLoading = (value: boolean) => {
    this.loading = value;
  };

  setError = (error: string | null) => {
    this.error = error;
  };

  setSoilTests = (tests: SoilTest[]) => {
    this.soilTests = tests;
  };

  setFertilizationPlans = (plans: FertilizationPlan[]) => {
    this.fertilizationPlans = plans;
  };

  fetchSoilTests = async () => {
    try {
      this.setLoading(true);
      this.setError(null);
      const response = await axios.get<SoilTest[]>('/api/Controllers/Soil/soilTests');
      runInAction(() => {
        this.soilTests = response.data;
      });
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'An error occurred';
        this.soilTests = []; // Reset soil tests on error
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  fetchFertilizationPlans = async () => {
    try {
      this.setLoading(true);
      const response = await axios.get<FertilizationPlan[]>('/api/Controllers/Soil/fertilizationPlans');
      runInAction(() => {
        this.fertilizationPlans = response.data;
      });
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'An error occurred';
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  addSoilTest = async (data: Omit<SoilTest, 'id'>) => {
    try {
      this.setLoading(true);
      const response = await axios.post<SoilTest>('/api/Controllers/Soil/soilTest', data);
      runInAction(() => {
        this.soilTests.push(response.data);
      });
      return response.data;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'An error occurred';
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  updateSoilTest = async (id: number, data: Partial<SoilTest>) => {
    try {
      this.setLoading(true);
      const response = await axios.put<SoilTest>(`/api/Controllers/Soil/soilTest/${id}`, data);
      runInAction(() => {
        const index = this.soilTests.findIndex(test => test.id === id);
        if (index !== -1) {
          this.soilTests[index] = response.data;
        }
      });
      return response.data;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'An error occurred';
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  deleteSoilTest = async (id: number) => {
    try {
      this.setLoading(true);
      await axios.delete(`/api/Controllers/Soil/soilTest/${id}`);
      runInAction(() => {
        this.soilTests = this.soilTests.filter(test => test.id !== id);
      });
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'An error occurred';
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  addFertilizationPlan = async (data: Omit<FertilizationPlan, 'id' | 'crop'>) => {
    try {
      this.setLoading(true);
      const response = await axios.post<FertilizationPlan>('/api/Controllers/Soil/fertilizationPlan', data);
      runInAction(() => {
        this.fertilizationPlans.push(response.data);
      });
      return response.data;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'An error occurred';
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  updateFertilizationPlan = async (id: number, data: Partial<FertilizationPlan>) => {
    try {
      this.setLoading(true);
      const response = await axios.put<FertilizationPlan>(`/api/Controllers/Soil/fertilizationPlan/${id}`, data);
      runInAction(() => {
        const index = this.fertilizationPlans.findIndex(plan => plan.id === id);
        if (index !== -1) {
          this.fertilizationPlans[index] = response.data;
        }
      });
      return response.data;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'An error occurred';
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  deleteFertilizationPlan = async (id: number) => {
    try {
      this.setLoading(true);
      await axios.delete(`/api/Controllers/Soil/fertilizationPlan/${id}`);
      runInAction(() => {
        this.fertilizationPlans = this.fertilizationPlans.filter(plan => plan.id !== id);
      });
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'An error occurred';
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };
}

const soilManagementStore = new SoilManagementStore();
const SoilManagementContext = createContext<SoilManagementStore>(soilManagementStore);

export const SoilManagementProvider = observer(({ children }: { children: React.ReactNode }) => {
  return (
    <SoilManagementContext.Provider value={soilManagementStore}>
      {children}
    </SoilManagementContext.Provider>
  );
});

export function useSoilManagement() {
  const context = useContext(SoilManagementContext);
  if (context === undefined) {
    throw new Error('useSoilManagement must be used within a SoilManagementProvider');
  }
  return context;
}
