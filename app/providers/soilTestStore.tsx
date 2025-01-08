'use client';

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

interface SoilTestContextType {
  fetchSoilTests: () => Promise<SoilTest[]>;
  saveSoilTest: (editingTest: SoilTest | null, formData: SoilTestFormData) => Promise<void>;
  deleteSoilTest: (id: number) => Promise<void>;
}

const SoilTestContext = createContext<SoilTestContextType | undefined>(undefined);

export function SoilTestProvider({ children }: { children: ReactNode }) {
  const fetchSoilTests = async (): Promise<SoilTest[]> => {
    const response = await fetch('/api/Controllers/Soil/soilTests');
    if (!response.ok) {
      throw new Error('Failed to fetch soil tests');
    }
    return response.json();
  };

  const saveSoilTest = async (editingTest: SoilTest | null, formData: SoilTestFormData): Promise<void> => {
    const url = editingTest
      ? `/api/Controllers/Soil/soilTest/${editingTest.id}`
      : '/api/Controllers/Soil/soilTest';

    const method = editingTest ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
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

    if (!response.ok) {
      throw new Error(`Failed to ${editingTest ? 'update' : 'create'} soil test`);
    }
  };

  const deleteSoilTest = async (id: number): Promise<void> => {
    const response = await fetch(`/api/Controllers/Soil/soilTest/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete soil test');
    }
  };

  return (
    <SoilTestContext.Provider value={{
      fetchSoilTests,
      saveSoilTest,
      deleteSoilTest,
    }}>
      {children}
    </SoilTestContext.Provider>
  );
}

export function useSoilTests() {
  const context = useContext(SoilTestContext);
  if (context === undefined) {
    throw new Error('useSoilTests must be used within a SoilTestProvider');
  }
  return context;
}
