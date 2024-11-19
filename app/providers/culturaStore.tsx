"use client";
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ApiResponse, Crop, CropCreate, CropUpdate, UserCropSelection, CropSelection } from '../types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/Controllers';
const API_URL = `${BASE_URL}/Crop`;

interface CropContextState {
  data: Crop[];
  selections: UserCropSelection[];
  error: string | null;
  loading: boolean;
}

interface CropContextType extends CropContextState {
  setData: (data: Crop[] | ((prevData: Crop[]) => Crop[])) => void;
  setSelections: (selections: UserCropSelection[] | ((prev: UserCropSelection[]) => UserCropSelection[])) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  createCrop: (data: CropCreate) => Promise<void>;
  updateCrop: (id: number, data: CropUpdate) => Promise<void>;
  deleteCrop: (id: number) => Promise<void>;
  getCrop: (id: number) => Promise<void>;
  getAllCrops: () => Promise<void>;
  searchCrops: (query: string) => Promise<void>;
  getRecommendations: (query: string) => Promise<void>;
  getSelectedCrops: () => Promise<void>;
  updateCropSelection: (selection: CropSelection) => Promise<void>;
  clearData: () => void;
}

const initialState: CropContextState = {
  data: [],
  selections: [],
  error: null,
  loading: false,
};

const CropContext = createContext<CropContextType | null>(null);

interface ProviderProps {
  children: ReactNode;
}

export const GlobalContextProvider = ({ children }: ProviderProps) => {
  const [state, setState] = useState<CropContextState>(initialState);
  const { user } = useUser();

  const setData = (dataOrUpdater: Crop[] | ((prevData: Crop[]) => Crop[])) => {
    setState(prev => ({
      ...prev,
      data: typeof dataOrUpdater === 'function' ? dataOrUpdater(prev.data) : dataOrUpdater
    }));
  };

  const setSelections = (selectionsOrUpdater: UserCropSelection[] | ((prev: UserCropSelection[]) => UserCropSelection[])) => {
    setState(prev => ({
      ...prev,
      selections: typeof selectionsOrUpdater === 'function' ? selectionsOrUpdater(prev.selections) : selectionsOrUpdater
    }));
  };
  
  const setError = (error: string | null) => setState(prev => ({ ...prev, error }));
  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }));

  const axiosConfig = {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const handleApiError = (error: unknown) => {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        window.location.href = '/api/auth/login';
        return;
      }
      setError(error.response?.data?.error || error.message);
    } else {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
    setLoading(false);
  };

  const createCrop = async (data: CropCreate) => {
    if (!user?.sub) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post<ApiResponse<Crop>>(
        `${API_URL}/crop/single/${user.sub}`,
        data,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.data) {
        setData(prevData => [...prevData, response.data.data!]);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateCrop = async (cropId: number, data: CropUpdate) => {
    if (!user?.sub) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put<ApiResponse<Crop>>(
        `${API_URL}/crop/${cropId}/${user.sub}`,
        data,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.data) {
        setData(prevData => 
          prevData.map(crop => 
            crop.id === cropId ? { ...crop, ...response.data.data } : crop
          )
        );
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCrop = async (cropId: number) => {
    if (!user?.sub) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete<ApiResponse>(
        `${API_URL}/crops/${cropId}`,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setData(prevData => prevData.filter(crop => crop.id !== cropId));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getCrop = async (id: number) => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse<Crop>>(
        `${API_URL}/crop/id/${id}`,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.crops) {
        setData(response.data.crops);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getAllCrops = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse<Crop>>(
        `${API_URL}/crops/retrieve/all`,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else {
        if (response.data.crops) {
          setData(response.data.crops);
        }
        if (response.data.selections) {
          setSelections(response.data.selections);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const searchCrops = async (query: string) => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse<Crop>>(
        `${API_URL}/crops/search/${query}`,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.crops) {
        setData(response.data.crops);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async (query: string) => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse<Crop>>(
        `${API_URL}/crops/recommendations/${query}`,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.crops) {
        setData(response.data.crops);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCrops = async () => {
    if (!user?.sub) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get<ApiResponse<Crop>>(
        `${API_URL}/crops/user/selectedCrops`,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.crops) {
        setData(response.data.crops);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateCropSelection = async ({ cropId, selectare, numSelections }: CropSelection) => {
    if (!user?.sub) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put<ApiResponse<UserCropSelection>>(
        `${API_URL}/crops/${cropId}/selectare`,
        { selectare, numSelections },
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.data) {
        setSelections(prev => {
          const index = prev.findIndex(s => s.cropId === cropId);
          if (index >= 0) {
            return [
              ...prev.slice(0, index),
              response.data.data!,
              ...prev.slice(index + 1)
            ];
          }
          return [...prev, response.data.data!];
        });
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setState(initialState);
  };

  const contextValue: CropContextType = {
    ...state,
    setData,
    setSelections,
    setError,
    setLoading,
    createCrop,
    updateCrop,
    deleteCrop,
    getCrop,
    getAllCrops,
    searchCrops,
    getRecommendations,
    getSelectedCrops,
    updateCropSelection,
    clearData,
  };

  return (
    <CropContext.Provider value={contextValue}>
      {children}
    </CropContext.Provider>
  );
};

export const useGlobalContextCrop = () => {
  const context = useContext(CropContext);
  if (!context) {
    throw new Error('useGlobalContextCrop must be used within a GlobalContextProvider');
  }
  return context;
};
