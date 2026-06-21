"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { Crop } from 'app/types/api';

interface CropWikiFilters {
  search: string;
  cropType: string;
  soilType: string;
  sortBy: string;
  sortOrder: string;
  page: number;
}

interface CropWikiContextType {
  crops: Crop[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  filters: CropWikiFilters;
  fetchCrops: () => Promise<void>;
  updateFilters: (filters: Partial<CropWikiFilters>) => void;
  resetFilters: () => void;
  lookupWithAi: (cropName: string) => Promise<Crop | null>;
  aiLookupLoading: boolean;
  aiLookupError: string | null;
}

const initialFilters: CropWikiFilters = {
  search: '',
  cropType: '',
  soilType: '',
  sortBy: 'cropName',
  sortOrder: 'asc',
  page: 1
};

const CropWikiContext = createContext<CropWikiContextType | null>(null);

export function CropWikiProvider({ children }: { children: React.ReactNode }) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<CropWikiFilters>(initialFilters);
  const [aiLookupLoading, setAiLookupLoading] = useState(false);
  const [aiLookupError, setAiLookupError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  const fetchCrops = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.cropType && { cropType: filters.cropType }),
        ...(filters.soilType && { soilType: filters.soilType }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await axios.get(`/api/Controllers/Crop/crops/wiki?${queryParams}`);
      setCrops(response.data.crops);
      setTotalPages(response.data.pagination.totalPages);
      setError(null);
    } catch (error) {
      console.error('Error fetching crops:', error);
      setError('Failed to load crops. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<CropWikiFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const lookupWithAi = useCallback(async (cropName: string): Promise<Crop | null> => {
    setAiLookupLoading(true);
    setAiLookupError(null);
    try {
      const response = await axios.post('/api/Controllers/Crop/crops/ai-lookup', { cropName });
      const crop = response.data?.crops?.[0] ?? null;
      return crop;
    } catch (error: any) {
      const message = error?.response?.data?.error || 'AI lookup failed. Please try again later.';
      setAiLookupError(message);
      return null;
    } finally {
      setAiLookupLoading(false);
    }
  }, []);

  return (
    <CropWikiContext.Provider value={{
      crops,
      loading,
      error,
      totalPages,
      filters,
      fetchCrops,
      updateFilters,
      resetFilters,
      lookupWithAi,
      aiLookupLoading,
      aiLookupError
    }}>
      {children}
    </CropWikiContext.Provider>
  );
}

export const useCropWiki = () => {
  const context = useContext(CropWikiContext);
  if (!context) {
    throw new Error('useCropWiki must be used within a CropWikiProvider');
  }
  return context;
};
