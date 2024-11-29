"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';
import { signal } from "@preact/signals-react";
import { CropCreate, RecommendationResponse } from '../types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/Controllers/';
const API_URL = `${BASE_URL}Crop/`;

interface ContextProps {
  crops: RecommendationResponse[];
  selections: any;
  isLoading: any;
  isError: any;
  isSuccess: any;
  message: any;
  createCrop: (data: CropCreate) => Promise<void>;
  getCrops: () => Promise<void>;
  deleteCrop: (cropId: string) => Promise<void>;
  selectare: (cropId: string | number, selectare: boolean, numSelections: number) => Promise<void>;
  SinglePage: (id: string) => Promise<void>;
  getAllCrops: () => Promise<void>;
  updateCrop: (cropId: string, data: CropCreate) => Promise<void>;
  areThereCrops: any;
  getCropRecommendations: (cropName?: string) => Promise<RecommendationResponse[]>;
  singleCrop: any;
  addTheCropRecommendation: (data: RecommendationResponse) => Promise<void>;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);

export function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  const [crops, setCrops] = useState<RecommendationResponse[]>([]);
  const loadingSignal = signal(false);
  const isErrorSignal = signal(false);
  const isSuccessSignal = signal(false);
  const messageSignal = signal('');
  const singleCropSignal = signal<RecommendationResponse | null>(null);
  const areThereCropsSignal = signal(false);
  const selectionsSignal = signal([]);
  const userStatus = signal(false);
  const refreshTrigger = signal(0);

  const { user, error: authError, isLoading: isUserLoading } = useUser();

  userStatus.value = isUserLoading;

  useEffect(() => {
    if (!isUserLoading && refreshTrigger.value > 0) {
      getAllCrops();
    }
  }, [refreshTrigger.value, isUserLoading]);

  const transformCropForRotation = (crop: any): RecommendationResponse => {
    const id = crop.id || parseInt(crop._id);
    return {
      id: id,
      _id: id?.toString() || '',
      cropName: crop.cropName,
      cropType: crop.cropType || '',
      nitrogenSupply: Number(crop.nitrogenSupply) || 0,
      nitrogenDemand: Number(crop.nitrogenDemand) || 0,
      pests: Array.isArray(crop.pests) ? crop.pests : 
             (Array.isArray(crop.details) ? crop.details
               .filter((d: any) => d.detailType === 'PEST')
               .map((d: any) => d.value) : []),
      diseases: Array.isArray(crop.diseases) ? crop.diseases :
               (Array.isArray(crop.details) ? crop.details
                 .filter((d: any) => d.detailType === 'DISEASE')
                 .map((d: any) => d.value) : [])
    };
  };

  const createCrop = useCallback(async (data: CropCreate) => {
    try {
      loadingSignal.value = true;
      const response = await axios.post(`${API_URL}crop/single`, {
        ...data,
        soilResidualNitrogen: data.soilResidualNitrogen
      });
      if (response.status === 201) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Crop created successfully';
        refreshTrigger.value += 1;
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error creating crop';
      }
    } catch (err) {
      console.error(err);
      isErrorSignal.value = true;
      messageSignal.value = 'Error creating crop';
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  const updateCrop = useCallback(async (cropId: string, data: CropCreate) => {
    try {
      loadingSignal.value = true;
      if (!user) {
        throw new Error('User is not authenticated');
      }
      const response = await axios.put(`${API_URL}crop/${cropId}/${user.sub}`, {
        ...data,
        soilResidualNitrogen: data.soilResidualNitrogen
      });
      if (response.status === 200) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Crop updated successfully';
        refreshTrigger.value += 1;
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error updating crop';
      }
    } catch (err) {
      console.error(err);
      isErrorSignal.value = true;
      messageSignal.value = 'Error updating crop';
    } finally {
      loadingSignal.value = false;
    }
  }, [user]);

  const getCrops = useCallback(async () => {
    try {
      loadingSignal.value = true;
      const response = await axios.get(`${API_URL}crops/retrieve/all`);
      if (response.status === 200) {
        const transformedCrops = (response.data.crops || []).map(transformCropForRotation);
        setCrops(transformedCrops);
      }
    } catch (error) {
      console.error('Error fetching crops:', error);
      isErrorSignal.value = true;
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  const deleteCrop = useCallback(async (cropId: string) => {
    try {
      loadingSignal.value = true;
      if (!user) {
        throw new Error('User is not authenticated');
      }
      const response = await axios.delete(`${API_URL}crops/${user.sub}/${cropId}`);
      if (response.status === 200) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Crop deleted successfully';
        refreshTrigger.value += 1;
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error deleting crop';
      }
    } catch (err) {
      console.error(err);
      isErrorSignal.value = true;
      messageSignal.value = 'Error deleting crop';
    } finally {
      loadingSignal.value = false;
    }
  }, [user]);

  const selectare = useCallback(async (cropId: number, selectare: boolean, numSelections: number) => {
    try {
      loadingSignal.value = true;
      const response = await axios.put(`${API_URL}crops/${cropId}/selectare`, { selectare, numSelections });
      if (response.status === 200) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Crop selected successfully';
        refreshTrigger.value += 1;
      }
    } catch (err) {
      console.error(err);
      isErrorSignal.value = true;
      messageSignal.value = 'Error selecting crop';
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  const SinglePage = useCallback(async (id: string) => {
    try {
      loadingSignal.value = true;
      const response = await axios.get(`${API_URL}crop/id/${id}`);
      if (response.status === 200 && response.data.crops && response.data.crops[0]) {
        isSuccessSignal.value = true;
        const transformedCrop = transformCropForRotation(response.data.crops[0]);
        singleCropSignal.value = transformedCrop;
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error loading crop details';
        singleCropSignal.value = null;
      }
    } catch (err) {
      console.error(err);
      isErrorSignal.value = true;
      messageSignal.value = 'Error loading crop details';
      singleCropSignal.value = null;
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  const getAllCrops = useCallback(async () => {
    try {
      loadingSignal.value = true;
      const response = await axios.get(`${API_URL}crops/retrieve/all`);
      
      if (response.status === 200) {
        const transformedCrops = (response.data.crops || [])
          .filter((crop: any) => crop.cropType !== 'RECOMMENDATION')
          .map(transformCropForRotation);
        setCrops(transformedCrops);
        areThereCropsSignal.value = transformedCrops.length > 0;
        selectionsSignal.value = response.data.selections;
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error getting crops';
      }
    } catch (err) {
      console.error(err);
      isErrorSignal.value = true;
      messageSignal.value = 'Error getting crops';
      areThereCropsSignal.value = false;
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  const getCropRecommendations = useCallback(async (cropName?: string): Promise<RecommendationResponse[]> => {
    try {
      loadingSignal.value = true;
      const url = cropName 
        ? `${API_URL}crops/recommendations/${cropName}`
        : `${API_URL}crops/recommendations`;
      
      const response = await axios.get(url);
      
      if (response.status === 200 && response.data.crops) {
        const recommendations = response.data.crops;
        return recommendations.map((rec: any) => ({
          id: rec.id,
          _id: rec.id.toString(),
          cropName: rec.cropName,
          cropType: 'RECOMMENDATION',
          nitrogenSupply: Number(rec.nitrogenSupply) || 0,
          nitrogenDemand: Number(rec.nitrogenDemand) || 0,
          pests: Array.isArray(rec.details) 
            ? rec.details.filter((d: any) => d.detailType === 'PEST').map((d: any) => d.value)
            : [],
          diseases: Array.isArray(rec.details)
            ? rec.details.filter((d: any) => d.detailType === 'DISEASE').map((d: any) => d.value)
            : []
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      isErrorSignal.value = true;
      messageSignal.value = 'Error fetching recommendations';
      return [];
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  const addTheCropRecommendation = useCallback(async (data: RecommendationResponse) => {
    try {
      loadingSignal.value = true;
      const cleanedData = {
        ...data,
        cropType: 'RECOMMENDATION',
        pests: data.pests.filter(pest => pest.trim() !== ''),
        diseases: data.diseases.filter(disease => disease.trim() !== ''),
        nitrogenSupply: Number(data.nitrogenSupply),
        nitrogenDemand: Number(data.nitrogenDemand)
      };

      const response = await axios.post(
        `${API_URL}crops/recommendations`,
        cleanedData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Recommendation added successfully';
        refreshTrigger.value += 1;
      } else {
        throw new Error(response.data.message || 'Failed to add recommendation');
      }
    } catch (err) {
      console.error('Error adding recommendation:', err);
      isErrorSignal.value = true;
      messageSignal.value = err instanceof Error ? err.message : 'Failed to add recommendation';
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        crops,
        getCrops,
        selections: selectionsSignal,
        isLoading: loadingSignal,
        isError: isErrorSignal,
        isSuccess: isSuccessSignal,
        message: messageSignal,
        createCrop,
        deleteCrop,
        selectare,
        SinglePage,
        getAllCrops,
        updateCrop,
        areThereCrops: areThereCropsSignal,
        getCropRecommendations,
        singleCrop: singleCropSignal,
        addTheCropRecommendation
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobalContextCrop = () => {
  return useContext(GlobalContext);
};
