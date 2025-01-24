"use client";
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';

// Use environment-based API URLs
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/Controllers';
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

interface RotationItem {
  division: number;
  cropName: string;
  plantingDate: string;
  harvestingDate: string;
  divisionSize: number;
  nitrogenBalance: number;
}

interface RotationPlan {
  year: number;
  rotationItems: RotationItem[];
}

interface CropRotation {
  _id: string;
  fieldSize: number;
  numberOfDivisions: number;
  rotationName: string;
  crops: Crop[];
  maxYears: number;
  ResidualNitrogenSupply: number;
  rotationPlan: RotationPlan[];
}

interface RotationContextState {
  cropRotation: CropRotation[];
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  message: string;
}

interface RotationContextType extends RotationContextState {
  generateCropRotation: (params: {
    fieldSize: number;
    numberOfDivisions: number;
    rotationName: string;
    crops: Crop[];
    maxYears: number;
    ResidualNitrogenSupply: number;
  }) => Promise<void>;
  getCropRotation: () => Promise<void>;
  deleteCropRotation: (id: string) => Promise<void>;
  updateNitrogenBalanceAndRegenerateRotation: (data: {
    rotationName: string;
    year: number;
    division: number;
    nitrogenBalance: number;
  }) => Promise<void>;
  updateDivisionSizeAndRedistribute: (data: {
    rotationName: string;
    division: number;
    newDivisionSize: number;
  }) => Promise<void>;
}

const initialState: RotationContextState = {
  cropRotation: [],
  isLoading: false,
  error: null,
  isSuccess: false,
  message: '',
};

const RotationContext = createContext<RotationContextType | null>(null);

interface ProviderProps {
  children: ReactNode;
}

export const GlobalContextProvider = ({ children }: ProviderProps) => {
  const [state, setState] = useState<RotationContextState>(initialState);
  const { user } = useUser();

  const setLoading = (isLoading: boolean) => 
    setState(prev => ({ ...prev, isLoading }));

  const setError = (error: string | null) => 
    setState(prev => ({ ...prev, error, isSuccess: false, message: error || '' }));

  const setSuccess = (message: string) => 
    setState(prev => ({ ...prev, isSuccess: true, error: null, message }));

  const handleApiError = (error: unknown) => {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    setError(errorMessage);
    setLoading(false);
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
      const response = await axios.post<CropRotation[]>(
        `${API_URL_ROTATION}/generateRotation/rotation/${user.sub}`,
        params
      );
      if (response.status === 200 || response.status === 201) {
        setState(prev => ({
          ...prev,
          cropRotation: response.data,
          error: null,
          isSuccess: true,
          message: 'Crop rotation generated successfully'
        }));
        await getCropRotation();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  

  const getCropRotation = async () => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.get<CropRotation[]>(
        `${API_URL_ROTATION}/getRotation/rotation/${user.sub}`
      );
      if (response.status === 200 || response.status === 203) {
        setState(prev => ({
          ...prev,
          cropRotation: response.data,
          error: null
        }));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCropRotation = async (id: string) => {
    if (!user?.sub) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this crop rotation?");
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await axios.delete(
        `${API_URL_ROTATION}/deleteRotation/${user.sub}/${id}`
      );
      if (response.status === 200) {
        setSuccess('Crop rotation deleted successfully');
        // Refresh the rotation list
        getCropRotation();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateNitrogenBalanceAndRegenerateRotation = async (data: {
    rotationName: string;
    year: number;
    division: number;
    nitrogenBalance: number;
  }) => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.put<CropRotation[]>(
        `${API_URL_ROTATION}/updateNitrogenBalance/rotation/${user.sub}`,
        data
      );
      if (response.status === 200) {
        setState(prev => ({
          ...prev,
          cropRotation: response.data,
          isSuccess: true,
          message: 'Nitrogen Balance and Crop Rotation updated successfully',
          error: null
        }));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateDivisionSizeAndRedistribute = async (data: {
    rotationName: string;
    division: number;
    newDivisionSize: number;
  }) => {
    if (!user?.sub) return;
    setLoading(true);
    try {
      const response = await axios.put<CropRotation[]>(
        `${API_URL_ROTATION}/updateDivisionSizeAndRedistribute/rotation/${user.sub}`,
        data
      );
      if (response.status === 200) {
        setState(prev => ({
          ...prev,
          cropRotation: response.data,
          isSuccess: true,
          message: 'Division Size and Crop Rotation updated successfully',
          error: null
        }));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue: RotationContextType = {
    ...state,
    generateCropRotation,
    getCropRotation,
    deleteCropRotation,
    updateNitrogenBalanceAndRegenerateRotation,
    updateDivisionSizeAndRedistribute,
  };

  return (
    <RotationContext.Provider value={contextValue}>
      {children}
    </RotationContext.Provider>
  );
};

export const useGlobalContextRotation = () => {
  const context = useContext(RotationContext);
  if (!context) {
    throw new Error('useGlobalContextRotation must be used within a GlobalContextProvider');
  }
  return context;
};
