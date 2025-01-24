'use client';

import { makeAutoObservable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import axios from 'axios';
import { createContext, useContext, ReactNode } from 'react';

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

class SoilTestStore {
  soilTests: SoilTest[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setLoading = (value: boolean) => {
    this.loading = value;
  };

  setError = (error: string | null) => {
    this.error = error;
  };

  setSoilTests = (tests: SoilTest[]) => {
    this.soilTests = tests;
  };

  fetchSoilTests = async (): Promise<SoilTest[]> => {
    try {
      this.setLoading(true);
      const response = await axios.get<SoilTest[]>('/api/Controllers/Soil/soilTests');
      runInAction(() => {
        this.soilTests = response.data;
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

  saveSoilTest = async (editingTest: SoilTest | null, formData: SoilTestFormData): Promise<void> => {
    const url = editingTest
      ? `/api/Controllers/Soil/soilTest/${editingTest.id}`
      : '/api/Controllers/Soil/soilTest';

    const method = editingTest ? 'put' : 'post';

    try {
      this.setLoading(true);
      const response = await axios[method](url, {
        testDate: new Date(formData.testDate).toISOString(),
        fieldLocation: formData.fieldLocation,
        pH: parseFloat(formData.pH),
        organicMatter: parseFloat(formData.organicMatter),
        nitrogen: parseFloat(formData.nitrogen),
        phosphorus: parseFloat(formData.phosphorus),
        potassium: parseFloat(formData.potassium),
        texture: formData.texture,
        notes: formData.notes,
      });

      runInAction(() => {
        if (editingTest) {
          const index = this.soilTests.findIndex(test => test.id === editingTest.id);
          if (index !== -1) {
            this.soilTests[index] = response.data;
          }
        } else {
          this.soilTests.push(response.data);
        }
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

  deleteSoilTest = async (id: number): Promise<void> => {
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
}

const soilTestStore = new SoilTestStore();
const SoilTestContext = createContext<SoilTestStore>(soilTestStore);

export const SoilTestProvider = observer(({ children }: { children: ReactNode }) => {
  return (
    <SoilTestContext.Provider value={soilTestStore}>
      {children}
    </SoilTestContext.Provider>
  );
});

export function useSoilTests() {
  const context = useContext(SoilTestContext);
  if (context === undefined) {
    throw new Error('useSoilTests must be used within a SoilTestProvider');
  }
  return context;
}
