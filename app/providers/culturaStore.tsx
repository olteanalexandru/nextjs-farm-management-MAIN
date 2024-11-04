"use client";
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';

// Use environment-based API URLs
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/Controllers';
const API_URL = `${BASE_URL}/Crop`;
const API_URL_ROTATION = `${BASE_URL}/Rotation`;

interface Crop {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
  plantingDate: string;
  harvestingDate: string;
  description: string;
  imageUrl: string;
  soilType: string;
  fertilizers: string[];
  pests: string[];
  diseases: string[];
  selectare: boolean;
  user: string;
  ItShouldNotBeRepeatedForXYears: number;
  nitrogenSupply: number;
  nitrogenDemand: number;
  residualNitrogen: number;
}

interface CropRecommendation {
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
}

interface CropRotation {
  _id: string;
  fieldSize: number;
  numberOfDivisions: number;
  rotationName: string;
  crops: Crop[];
  maxYears: number;
  ResidualNitrogenSupply: number;
}

interface CropContextState {
  crops: Crop[];
  selections: number[];
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  message: string;
  cropRotation: CropRotation[];
  singleCrop: Crop | null;
  areThereCrops: boolean;
}

interface CropContextType extends CropContextState {
  createCrop: (data: Omit<Crop, '_id' | 'user'>) => Promise<void>;
  getCrops: () => Promise<void>;
  deleteCrop: (cropId: string) => Promise<void>;
  selectare: (cropId: number, selectare: boolean, numSelections: number) => Promise<void>;
  SinglePage: (id: string) => Promise<void>;
  getAllCrops: () => Promise<void>;
  updateCrop: (cropId: string, data: Partial<Crop>) => Promise<void>;
  generateCropRotation: (params: {
    fieldSize: number;
    numberOfDivisions: number;
    rotationName: string;
    crops: Crop[];
    maxYears: number;
    ResidualNitrogenSupply: number;
  }) => Promise<void>;
  getCropRecommendations: (cropName: string) => Promise<CropRecommendation[]>;
  getCropRotation: () => Promise<void>;
  deleteCropRotation: (id: string) => Promise<void>;
  updateNitrogenBalanceAndRegenerateRotation: (data: {
    id: string;
    rotationName: string;
    year: number;
    division: number;
    nitrogenBalance: number;
  }) => Promise<void>;
  updateDivisionSizeAndRedistribute: (data: {
    id: string;
    rotationName: string;
    division: number;
    newDivisionSize: number;
  }) => Promise<void>;
  addTheCropRecommendation: (data: CropRecommendation) => Promise<void>;
}

const initialState: CropContextState = {
  crops: [],
  selections: [],
  isLoading: false,
  error: null,
  isSuccess: false,
  message: '',
  cropRotation: [],
  singleCrop: null,
  areThereCrops: false,
};

const CropContext = createContext<CropContextType | null>(null);

interface ProviderProps {
  children: ReactNode;
}

export const GlobalContextProvider = ({ children }: ProviderProps) => {
  const [state, setState] = useState<CropContextState>(initialState);
  const { user } = useUser();

  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, isLoading: loading }));
  const setError = (error: string | null) => setState(prev => ({ ...prev, error, isSuccess: false }));
  const setSuccess = (message: string) => setState(prev => ({ ...prev, isSuccess: true, message, error: null }));

  const handleApiError = (error: unknown) => {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    setError(errorMessage);
    setLoading(false);
  };

  const createCrop = async (data: Omit<Crop, '_id' | 'user'>) => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/crop/single/${user.sub}`, data);
      if (response.status === 201) {
        setSuccess('Crop created successfully');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getCrops = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/crops/retrieve/all`);
      if (response.status === 200) {
        setState(prev => ({
          ...prev,
          crops: response.data.crops,
          areThereCrops: true,
          error: null
        }));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCrop = async (cropId: string) => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/crops/${user.sub}/${cropId}`);
      if (response.status === 200) {
        setSuccess('Crop deleted successfully');
        getCrops(); // Refresh the crops list
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const selectare = async (cropId: number, selectare: boolean, numSelections: number) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/crops/${cropId}/selectare`, {
        selectare,
        numSelections
      });
      if (response.status === 200) {
        setSuccess('Crop selected successfully');
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const SinglePage = async (id: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/crop/id/${id}`);
      if (response.status === 200) {
        setState(prev => ({
          ...prev,
          singleCrop: response.data.crops[0],
          error: null
        }));
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const getAllCrops = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/crops/retrieve/all`);
      if (response.status === 200) {
        setState(prev => ({
          ...prev,
          crops: response.data.crops,
          selections: response.data.selections,
          areThereCrops: true,
          error: null
        }));
      }
    } catch (error) {
      handleApiError(error);
      setState(prev => ({ ...prev, areThereCrops: false }));
    }
  };

  const updateCrop = async (cropId: string, data: Partial<Crop>) => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/crop/${cropId}/${user.sub}`, data);
      if (response.status === 200) {
        setSuccess('Crop updated successfully');
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const generateCropRotation = async (params: {
    fieldSize: number;
    numberOfDivisions: number;
    rotationName: string;
    crops: Crop[];
    maxYears: number;
    ResidualNitrogenSupply: number;
  }) => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL_ROTATION}/generateRotation/rotation/${user.sub}`,
        params
      );
      if (response.status === 200 || response.status === 201) {
        setState(prev => ({
          ...prev,
          cropRotation: response.data,
          error: null
        }));
        await getCropRotation();
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const getCropRotation = async () => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL_ROTATION}/getRotation/rotation/${user.sub}`);
      if (response.status === 200 || response.status === 203) {
        setState(prev => ({
          ...prev,
          cropRotation: response.data,
          error: null
        }));
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const deleteCropRotation = async (id: string) => {
    if (!user?.sub) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this crop rotation?");
    if (!confirmDelete) return;
    
    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL_ROTATION}/deleteRotation/${user.sub}/${id}`);
      if (response.status === 200) {
        setSuccess('Crop rotation deleted successfully');
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const updateNitrogenBalanceAndRegenerateRotation = async (data: {
    id: string;
    rotationName: string;
    year: number;
    division: number;
    nitrogenBalance: number;
  }) => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL_ROTATION}/updateNitrogenBalance/rotation/${user.sub}`,
        data
      );
      if (response.status === 200) {
        setSuccess('Nitrogen Balance and Crop Rotation updated successfully');
        setState(prev => ({
          ...prev,
          cropRotation: response.data
        }));
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const updateDivisionSizeAndRedistribute = async (data: {
    id: string;
    rotationName: string;
    division: number;
    newDivisionSize: number;
  }) => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL_ROTATION}/updateDivisionSizeAndRedistribute/rotation/${user.sub}`,
        data
      );
      if (response.status === 200) {
        setSuccess('Division Size and Crop Rotation updated successfully');
        setState(prev => ({
          ...prev,
          cropRotation: response.data
        }));
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const getCropRecommendations = async (cropName: string): Promise<CropRecommendation[]> => {
    if (!cropName) return [];
    try {
      const response = await axios.get(`${API_URL}/crops/recommendations/${cropName}`);
      if (response.status === 200) {
        return response.data.crops;
      }
    } catch (error) {
      handleApiError(error);
    }
    return [];
  };

  const addTheCropRecommendation = async (data: CropRecommendation) => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/crops/recommendations/${user.sub}`, data);
      if (response.status === 201) {
        setSuccess('Recommendation added successfully');
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const contextValue: CropContextType = {
    ...state,
    createCrop,
    getCrops,
    deleteCrop,
    selectare,
    SinglePage,
    getAllCrops,
    updateCrop,
    generateCropRotation,
    getCropRecommendations,
    getCropRotation,
    deleteCropRotation,
    updateNitrogenBalanceAndRegenerateRotation,
    updateDivisionSizeAndRedistribute,
    addTheCropRecommendation,
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
