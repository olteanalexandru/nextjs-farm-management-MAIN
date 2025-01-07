"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';
import { signal } from "@preact/signals-react";
import { CropCreate, RecommendationResponse, CropType } from '../types/api';

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
  selectare: (cropId: string | number, selectare: boolean) => Promise<void>;
  SinglePage: (id: string) => Promise<void>;
  getAllCrops: () => Promise<void>;
  updateCrop: (cropId: string, data: CropCreate) => Promise<void>;
  areThereCrops: any;
  getCropRecommendations: (cropName?: string) => Promise<RecommendationResponse[]>;
  addTheCropRecommendation: (data: RecommendationResponse) => Promise<void>;
  updateSelectionCount: (cropId: string | number, count: number) => Promise<void>;
  singleCrop: { value: CropType | null };
  fetchSoilTests: () => Promise<any>;
  saveSoilTest: (editingTest: any, formData: any) => Promise<void>;
  deleteSoilTest: (id: string) => Promise<void>;
  fetchFertilizationPlans: () => Promise<any>;
  saveFertilizationPlan: (editingPlan: any, formData: any) => Promise<void>;
  deleteFertilizationPlan: (id: string) => Promise<void>;
  fetchRotations: () => Promise<any>;
  deleteRotation: (id: string) => Promise<void>;
  updateDivisionSize: (id: string, division: string, value: number) => Promise<any>;
  updateNitrogenBalance: (id: string, year: number, division: string, value: number) => Promise<any>;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);

export function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  const [crops, setCrops] = useState<RecommendationResponse[]>([]);
  const loadingSignal = signal(false);
  const isErrorSignal = signal(false);
  const isSuccessSignal = signal(false);
  const messageSignal = signal('');
  const areThereCropsSignal = signal(false);
  const selectionsSignal = signal([]);
  const userStatus = signal(false);
  const refreshTrigger = signal(0);
  const singleCropSignal = signal<CropType | null>(null);

  const { user, error: authError, isLoading: isUserLoading } = useUser();

  userStatus.value = isUserLoading;

  useEffect(() => {
    if (!isUserLoading && refreshTrigger.value > 0) {
      getAllCrops();
    }
  }, [refreshTrigger.value, isUserLoading]);

  const transformCropForRotation = useCallback((crop: any, selections: any[] = []): RecommendationResponse => {
    const id = crop.id || parseInt(crop._id);
    const selection = selections.find(s => s.cropId === id);
    
    return {
      id: id,
      _id: id?.toString() || '',
      userId: crop.userId,
      auth0Id: crop.user?.auth0Id,
      cropName: crop.cropName,
      cropType: crop.cropType || '',
      cropVariety: crop.cropVariety || '',
      plantingDate: crop.plantingDate?.toISOString(),
      harvestingDate: crop.harvestingDate?.toISOString(),
      description: crop.description || '',
      imageUrl: crop.imageUrl || '',
      soilType: crop.soilType || '',
      climate: crop.climate || '',
      nitrogenSupply: Number(crop.nitrogenSupply) || 0,
      nitrogenDemand: Number(crop.nitrogenDemand) || 0,
      isSelected: Boolean(selection?.selectionCount > 0),
      pests: Array.isArray(crop.pests) ? crop.pests : 
             (Array.isArray(crop.details) ? crop.details
               .filter((d: any) => d.detailType === 'PEST')
               .map((d: any) => d.value) : []),
      diseases: Array.isArray(crop.diseases) ? crop.diseases :
               (Array.isArray(crop.details) ? crop.details
                 .filter((d: any) => d.detailType === 'DISEASE')
                 .map((d: any) => d.value) : [])
    };
  }, []);

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
        
        // Transform the single crop response and maintain user data
        const updatedCrop = {
          ...transformCropForRotation(response.data.data),
          userId: response.data.data.userId,
          auth0Id: response.data.data.user?.auth0Id,
          user: response.data.data.user
        };
        
        // Update the crops state by replacing the updated crop
        setCrops(prevCrops => 
          prevCrops.map(crop => 
            crop.id === updatedCrop.id ? updatedCrop : crop
          )
        );
        
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
  }, [user, transformCropForRotation]);

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

  const selectare = useCallback(async (cropId: string | number, selectare: boolean) => {
    try {
      loadingSignal.value = true;
      const response = await axios.put(`${API_URL}crops/${cropId}/selectare`, { selectare });
      if (response.status === 200) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Crop selection updated successfully';
        await getAllCrops(); // Refresh to get updated selection status
      }
    } catch (err) {
      console.error(err);
      isErrorSignal.value = true;
      messageSignal.value = 'Error updating crop selection';
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
        const cropData = response.data.crops[0];
        const transformedCrop = {
          ...transformCropForRotation(cropData),
          userId: cropData.userId,
          auth0Id: cropData.auth0Id,
          user: cropData.user
        };
        setCrops([transformedCrop]);
        singleCropSignal.value = transformedCrop;
      } else {
        isErrorSignal.value = true;
        messageSignal.value = 'Error loading crop details';
      }
    } catch (err) {
      console.error(err);
      isErrorSignal.value = true;
      messageSignal.value = 'Error loading crop details';
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  const getAllCrops = useCallback(async () => {
    try {
      loadingSignal.value = true;
      console.log('Fetching all crops...');
      
      const response = await axios.get(`${API_URL}crops/retrieve/all`);
      console.log('API Response:', response.data);
      
      if (response.data && response.data.crops) {
        const selections = response.data.selections || [];
        const allCrops = response.data.crops || [];
        
        console.log('Raw crops:', allCrops.length);
        
        const transformedCrops = allCrops
          .filter((crop: any) => crop && crop.cropName) // Only valid crops
          .map((crop: any) => ({
            ...crop, // Keep all fields from the API
            isSelected: Boolean(selections.find((s: any) => s.cropId === crop.id)?.selectionCount > 0)
          }));
        
        console.log('Setting crops:', transformedCrops.length);
        setCrops(transformedCrops);
        areThereCropsSignal.value = transformedCrops.length > 0;
        selectionsSignal.value = selections;
      } else {
        console.error('Invalid response format:', response);
        isErrorSignal.value = true;
        messageSignal.value = 'Error getting crops';
      }
    } catch (err) {
      console.error('Error in getAllCrops:', err);
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

  const updateSelectionCount = useCallback(async (cropId: string | number, count: number) => {
    try {
      loadingSignal.value = true;
      const response = await axios.put(`${API_URL}crops/${cropId}/selectare`, { 
        selectare: true,
        numSelections: count 
      });
      if (response.status === 200) {
        await getAllCrops();
      }
    } catch (err) {
      console.error(err);
      isErrorSignal.value = true;
      messageSignal.value = 'Error updating selection count';
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  const fetchSoilTests = useCallback(async () => {
    const response = await axios.get('/api/Controllers/Soil/soilTests');
    if (response.status !== 200) throw new Error('Failed to fetch soil tests');
    return response.data;
  }, []);

  const saveSoilTest = useCallback(async (editingTest, formData) => {
    const endpoint = editingTest
      ? `/api/Controllers/Soil/soilTest/${editingTest.id}`
      : '/api/Controllers/Soil/soilTest';
    const method = editingTest ? 'PUT' : 'POST';

    const response = await axios({
      method,
      url: endpoint,
      headers: { 'Content-Type': 'application/json' },
      data: {
        testDate: new Date(formData.testDate).toISOString(),
        fieldLocation: formData.fieldLocation,
        pH: parseFloat(formData.pH),
        organicMatter: parseFloat(formData.organicMatter),
        nitrogen: parseFloat(formData.nitrogen),
        phosphorus: parseFloat(formData.phosphorus),
        potassium: parseFloat(formData.potassium),
        texture: formData.texture,
        notes: formData.notes,
      },
    });

    if (response.status !== 200) throw new Error('Failed to save soil test');
  }, []);

  const deleteSoilTest = useCallback(async (id) => {
    const response = await axios.delete(`/api/Controllers/Soil/soilTest/${id}`);
    if (response.status !== 200) throw new Error('Failed to delete soil test');
  }, []);

  const fetchFertilizationPlans = useCallback(async () => {
    const response = await axios.get('/api/Controllers/Soil/fertilizationPlans');
    if (response.status !== 200) throw new Error('Failed to fetch fertilization plans');
    return response.data;
  }, []);

  const saveFertilizationPlan = useCallback(async (editingPlan, formData) => {
    const endpoint = editingPlan
      ? `/api/Controllers/Soil/fertilizationPlan/${editingPlan.id}`
      : '/api/Controllers/Soil/fertilizationPlan';
    const method = editingPlan ? 'PUT' : 'POST';

    const response = await axios({
      method,
      url: endpoint,
      headers: { 'Content-Type': 'application/json' },
      data: {
        cropId: parseInt(formData.cropId),
        plannedDate: new Date(formData.plannedDate).toISOString(),
        fertilizer: formData.fertilizer,
        applicationRate: parseFloat(formData.applicationRate),
        nitrogenContent: parseFloat(formData.nitrogenContent),
        applicationMethod: formData.applicationMethod,
        notes: formData.notes,
      },
    });

    if (response.status !== 200) throw new Error('Failed to save fertilization plan');
  }, []);

  const deleteFertilizationPlan = useCallback(async (id) => {
    const response = await axios.delete(`/api/Controllers/Soil/fertilizationPlan/${id}`);
    if (response.status !== 200) throw new Error('Failed to delete fertilization plan');
  }, []);

  const fetchRotations = useCallback(async () => {
    const response = await axios.get('/api/Controllers/Rotation/getRotation');
    if (response.status !== 200) throw new Error('Failed to fetch rotations');
    return response.data;
  }, []);

  const deleteRotation = useCallback(async (id) => {
    const response = await axios.delete(`/api/Controllers/Rotation/deleteRotation/${id}`);
    if (response.status !== 200) throw new Error('Failed to delete rotation');
  }, []);

  const updateDivisionSize = useCallback(async (id, division, value) => {
    const response = await axios.put('/api/Controllers/Rotation/updateDivisionSizeAndRedistribute', {
      id,
      division,
      newDivisionSize: value,
    });
    if (response.status !== 200) throw new Error('Failed to update division size');
    return response.data;
  }, []);

  const updateNitrogenBalance = useCallback(async (id, year, division, value) => {
    const response = await axios.put('/api/Controllers/Rotation/updateNitrogenAndRecalculate', {
      id,
      year,
      division,
      nitrogenBalance: value,
      startYear: year,
    });
    if (response.status !== 200) throw new Error('Failed to update nitrogen balance');
    return response.data;
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
        addTheCropRecommendation,
        updateSelectionCount,
        singleCrop: singleCropSignal,
        fetchSoilTests,
        saveSoilTest,
        deleteSoilTest,
        fetchFertilizationPlans,
        saveFertilizationPlan,
        deleteFertilizationPlan,
        fetchRotations,
        deleteRotation,
        updateDivisionSize,
        updateNitrogenBalance,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobalContextCrop = () => {
  return useContext(GlobalContext);
};
