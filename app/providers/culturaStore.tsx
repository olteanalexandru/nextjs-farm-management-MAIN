"use client";
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';
import { signal } from "@preact/signals-react";

// Use environment-based API URLs
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/Controllers/';
const API_URL = `${BASE_URL}Crop/`;

type DataType = {
  _id: string | number;
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
};

type RecommendationType = {
  id?: number;
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
};

interface RecommendationResponse {
  id: number;
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
  _id?: string;
  cropType: string;
}

interface ContextProps {
  crops: RecommendationResponse[];
  selections: any;
  isLoading: any;
  isError: any;
  isSuccess: any;
  message: any;
  createCrop: (data: DataType) => Promise<void>;
  getCrops: () => Promise<void>;
  deleteCrop: (cropId: string) => Promise<void>;
  selectare: (cropId: string | number, selectare: boolean, numSelections: number) => Promise<void>;
  SinglePage: (id: string) => Promise<void>;
  getAllCrops: () => Promise<void>;
  updateCrop: (cropId: string, data: DataType) => Promise<void>;
  areThereCrops: any;
  getCropRecommendations: (cropName?: string) => Promise<any>; // Update the type definition
  singleCrop: any;
  addTheCropRecommendation: (data: RecommendationType) => Promise<void>;
}

interface Props {
  children: React.ReactNode;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);

export function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  const [crops, setCrops] = useState<RecommendationResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const cropsSignal = signal<RecommendationResponse[]>([]);
  const loadingSignal = signal(false);
  const isErrorSignal = signal(false);
  const isSuccessSignal = signal(false);
  const messageSignal = signal('');
  const singleCropSignal = signal(null);
  const areThereCropsSignal = signal(false);
  const selectionsSignal = signal([]);
  const userStatus = signal(false);

  const { user, error: authError, isLoading: isUserLoading } = useUser();

  userStatus.value = isUserLoading;

  const createCrop = async (data: DataType) => {
    console.log('createCrop triggered with object props: ' + JSON.stringify(data));
    loadingSignal.value = true;
    try {
      const response = await axios.post(`${API_URL}crop/single`, data);
      if (response.status === 201) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Crop created successfully';
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error creating crop';
      }
    } catch (err) {
      console.error(err);
    }
    loadingSignal.value = false;
  };

  const updateCrop = async (cropId: string, data: DataType) => {
    loadingSignal.value = true;
    try {
      if (!user) {
        throw new Error('User is not authenticated');
      }
      const response = await axios.put(`${API_URL}crop/${cropId}/${user.sub}`, data, {});
      if (response.status === 200) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Crop updated successfully';
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error updating crop';
      }
    } catch (err) {
      console.error(err);
    }
    loadingSignal.value = false;
  };

  const getCrops = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/Controllers/Crop/crops/retrieve/all');
      const data = await response.json();
      setCrops(data.crops || []);
    } catch (error) {
      console.error('Error fetching crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCrop = async (cropId: string) => {
    loadingSignal.value = true;
    try {
      if (!user) {
        throw new Error('User is not authenticated');
      }
      const response = await axios.delete(`${API_URL}crops/${user.sub}/${cropId}`, {});
      if (response.status === 200) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Crop deleted successfully';
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error deleting crop';
      }
    } catch (err) {
      console.error(err);
    } finally {
      loadingSignal.value = false;
    }
  };

  const selectare = async (cropId: number, selectare: boolean, numSelections: number) => {
    loadingSignal.value = true;
    try {
      const response = await axios.put(`${API_URL}crops/${cropId}/selectare`, { selectare: selectare, numSelections: numSelections }, {});
      if (response.status === 200) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Crop selected successfully';
      }
    } catch (err) {
      console.error(err);
    } finally {
      loadingSignal.value = false;
    }
  };

  const SinglePage = async (id: string) => {
    loadingSignal.value = true;
    try {
      const response = await axios.get(`${API_URL}crop/id/${id}`, {});
      if (response.status === 200) {
        const data = await response.data;
        isSuccessSignal.value = true;
        singleCropSignal.value = data.crops[0];
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error in single page crop';
      }
    } catch (err) {
      console.error(err);
    } finally {
      loadingSignal.value = false;
    }
  };

  const addTheCropRecommendation = async (data: RecommendationType) => {
    loadingSignal.value = true;
    try {
      const cleanedData = {
        ...data,
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
  };

  const getAllCrops = useCallback(async () => {
    try {
      loadingSignal.value = true;
      const response = await axios.get(`${API_URL}crops/retrieve/all`, {});
      if (response.status === 200) {
        console.log("getting all crops..");
        const data = await response.data;
        setCrops(data.crops || []); // Update the crops state
        cropsSignal.value = data.crops;
        areThereCropsSignal.value = true;
        selectionsSignal.value = data.selections;
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error getting crops';
      }
    } catch (err) {
      console.error(err);
      areThereCropsSignal.value = false;
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  const getCropRecommendations = useCallback(async (cropName?: string) => {
    try {
      loadingSignal.value = true; // Set loading state
      const url = cropName 
        ? `${API_URL}crops/recommendations/${cropName}`
        : `${API_URL}crops/recommendations`;
        
      console.log('Fetching recommendations from:', url);
      const response = await axios.get(url);
      
      // Reset loading state before processing data
      loadingSignal.value = false;
      
      if (response.status === 200) {
        console.log('Raw response:', response.data);
        
        const recommendations = response.data.crops || [];
        console.log(`Processing ${recommendations.length} recommendations`);
        
        // Transform and filter the recommendations
        const transformedRecommendations = recommendations
          .filter(rec => rec && rec.cropType === 'RECOMMENDATION')
          .map(rec => ({
            id: rec.id,
            cropName: rec.cropName,
            nitrogenSupply: rec.nitrogenSupply,
            nitrogenDemand: rec.nitrogenDemand,
            pests: rec.pests || [],
            diseases: rec.diseases || [],
            _id: rec.id.toString(),
            cropType: rec.cropType
          }));

        console.log('Transformed recommendations:', transformedRecommendations);
        
        setCrops(transformedRecommendations);
        cropsSignal.value = transformedRecommendations;
        areThereCropsSignal.value = transformedRecommendations.length > 0;
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      isErrorSignal.value = true;
      messageSignal.value = 'Error fetching recommendations';
      setCrops([]); // Reset crops on error
      cropsSignal.value = [];
    } finally {
      loadingSignal.value = false; // Ensure loading state is reset
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
