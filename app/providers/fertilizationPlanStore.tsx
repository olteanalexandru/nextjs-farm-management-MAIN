'use client';

import { makeAutoObservable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import axios from 'axios';
import { createContext, useContext } from 'react';

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

export class FertilizationPlanStore {
  plans: FertilizationPlan[] = [];
  crops: Crop[] = [];
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

  setPlans = (plans: FertilizationPlan[]) => {
    this.plans = plans;
  };

  setCrops = (crops: Crop[]) => {
    this.crops = crops;
  };

  fetchFertilizationPlans = async () => {
    try {
      this.setLoading(true);
      const response = await axios.get<FertilizationPlan[]>('/api/Controllers/Soil/fertilizationPlans');
      runInAction(() => {
        this.plans = response.data;
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

  fetchCrops = async () => {
    try {
      const response = await axios.get<Crop[]>('/api/Controllers/Crop/crops');
      runInAction(() => {
        this.crops = response.data;
      });
      return response.data;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'An error occurred';
      });
      throw err;
    }
  };

  saveFertilizationPlan = async (editingPlan: FertilizationPlan | null, formData: FertilizationPlanFormData) => {
    const endpoint = editingPlan
      ? `/api/Controllers/Soil/fertilizationPlan/${editingPlan.id}`
      : '/api/Controllers/Soil/fertilizationPlan';
    const method = editingPlan ? 'put' : 'post';

    try {
      this.setLoading(true);
      await axios[method](endpoint, {
        cropId: parseInt(formData.cropId),
        plannedDate: new Date(formData.plannedDate).toISOString(),
        fertilizer: formData.fertilizer,
        applicationRate: parseFloat(formData.applicationRate),
        nitrogenContent: parseFloat(formData.nitrogenContent),
        applicationMethod: formData.applicationMethod,
        notes: formData.notes,
      });
      await this.fetchFertilizationPlans();
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
      await axios.put(`/api/Controllers/Soil/fertilizationPlan/${id}`, data);
      await this.fetchFertilizationPlans();
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
        this.plans = this.plans.filter(plan => plan.id !== id);
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

const fertilizationPlanStore = new FertilizationPlanStore();
const FertilizationPlanContext = createContext<FertilizationPlanStore>(fertilizationPlanStore);

export const FertilizationPlanProvider = observer(({ children }: { children: React.ReactNode }) => {
  return (
    <FertilizationPlanContext.Provider value={fertilizationPlanStore}>
      {children}
    </FertilizationPlanContext.Provider>
  );
});

export function useFertilizationPlans() {
  const context = useContext(FertilizationPlanContext);
  if (context === undefined) {
    throw new Error('useFertilizationPlans must be used within a FertilizationPlanProvider');
  }
  return context;
}
