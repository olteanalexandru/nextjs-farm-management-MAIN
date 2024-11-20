"use client";
import React, { createContext, useContext, type ReactNode } from 'react';
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
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
};

interface ContextProps {
  crops: any;
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
  getCropRecommendations: (cropName: string) => Promise<any>;
  singleCrop: any;
  addTheCropRecommendation: (data: RecommendationType) => Promise<void>;
}

interface Props {
  children: React.ReactNode;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);

export const GlobalContextProvider: React.FC<Props> = ({ children }) => {
  const cropsSignal = signal([]);
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
    console.log("getting crops..");
    try {
      loadingSignal.value = true;
      const response = await axios.get(`${API_URL}crops/retrieve/all`, {});

      if (response.status === 200) {
        const newCrops = response.data.crops;
        if (newCrops !== cropsSignal.value) {
          cropsSignal.value = newCrops;
          areThereCropsSignal.value = true;
        }
      } else {
        const newCrops = response.data.crops;
        if (newCrops !== cropsSignal.value) {
          cropsSignal.value = newCrops;
          isErrorSignal.value = true;
          messageSignal.value = 'Error getting crops';
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      loadingSignal.value = false;
    }
  };

  const deleteCrop = async (cropId: string) => {
    loadingSignal.value = true;
    try {
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
      const response = await axios.post(`${API_URL}crops/recommendations/${user.sub}`, data, {});
      if (response.status === 201) {
        isSuccessSignal.value = true;
        messageSignal.value = 'Recommendation added successfully';
      }
    } catch (err) {
      console.error(err);
    }
    loadingSignal.value = false;
  };

  const getAllCrops = async () => {
    try {
      loadingSignal.value = true;
      const response = await axios.get(`${API_URL}crops/retrieve/all`, {});
      if (response.status === 200) {
        console.log("getting all crops..");
        const data = await response.data;
        cropsSignal.value = data.crops;
        areThereCropsSignal.value = true;
        selectionsSignal.value = data.selections;
      } else {
        cropsSignal.value = response.data.crops;
        isErrorSignal.value = true;
        messageSignal.value = 'Error getting crops';
      }
    } catch (err) {
      console.error(err);
      areThereCropsSignal.value = false;
    } finally {
      loadingSignal.value = false;
    }
  };

  const getCropRecommendations = async (cropName: string) => {
    let recommendations = [];
    if (cropName !== '') {
      try {
        const response = await axios.get(`${API_URL}crops/recommendations/${cropName}`, {});
        if (response.status === 200) {
          recommendations = response.data.crops;
        }
      } catch (error) {
        console.error(error);
      }
    }
    console.log("recommendations: ", recommendations);
    return recommendations;
  };

  return (
    <GlobalContext.Provider
      value={{
        crops: cropsSignal,
        selections: selectionsSignal,
        isLoading: loadingSignal,
        isError: isErrorSignal,
        isSuccess: isSuccessSignal,
        message: messageSignal,
        createCrop,
        getCrops,
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
};

export const useGlobalContextCrop = () => {
  return useContext(GlobalContext);
};
