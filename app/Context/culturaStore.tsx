"use client";
import { createContext, useContext } from 'react';
import axios from 'axios';
import { useSignals  } from "@preact/signals-react/runtime";
import { signal } from "@preact/signals-react";
import { useUser } from '@auth0/nextjs-auth0/client';

const API_URL = 'http://localhost:3000/api/Controllers/Crop/';
const API_URL_ROTATION = 'http://localhost:3000/api/Controllers/Rotation/';

type DataType = {
  
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
  token: string;
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
  selectare: (cropId: number, selectare: boolean, numSelections: number) => Promise<void>;
  SinglePage: (id: string) => Promise<void>;
  getAllCrops: () => Promise<void>;
  updateCrop: (cropId: string, data: DataType) => Promise<void>;
  areThereCrops: any;
  setCropRotation: any;
  generateCropRotation: (fieldSize: number, numberOfDivisions: number, rotationName: string, crops: DataType, maxYears: number, ResidualNitrogenSupply: number) => Promise<void>;
  getCropRecommendations: (cropName: string) => Promise<any>;
  getCropRotation: () => Promise<void>;
  deleteCropRotation: (id: string) => Promise<void>;
  cropRotation: any;
  singleCrop: any;
  updateNitrogenBalanceAndRegenerateRotation: (data: any) => Promise<void>;
  updateDivisionSizeAndRedistribute: (data: any) => Promise<void>;
  addTheCropRecommendation: (data: RecommendationType) => Promise<void>;
  isCropRotationLoading: any;

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
const cropRotationSignal = signal([]);
const singleCropSignal = signal(null);
const areThereCropsSignal = signal(false);
const selectionsSignal = signal([]);
const userStatus = signal(false);

const { user, error: authError, isLoading: isUserLoading  } = useUser();

userStatus.value = isUserLoading;



const getCropRotation = async () => {
 // useSignals(); 
  // Wait until isUserLoading is false

  try {
    console.log("making a get request to get crop rotation try");
    const response = await axios.get(API_URL_ROTATION + "getRotation/rotation/" + user.sub);
    if (response.status === 200 || response.status === 203) {
      cropRotationSignal.value = response.data;
      console.log("crop rotation fetched 1 " + response?.data + response?.data?.message );
    } else {
      isErrorSignal(true)
      messageSignal.value = 'Error getting crop rotation';
      cropRotationSignal.value = response.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
  
  }

  console.log( "crop rotation fetched signal " + cropRotationSignal.value?.message);

};


const createCrop = async (data) => {
  console.log('createCrop triggered with object props: ' + JSON.stringify(data));
  loadingSignal.value = true
  try {
    const response = await axios.post(`${API_URL}crop/single/${user.sub}`, data);
    if (response.status === 201) {
      isSuccessSignal.value = true
      messageSignal.value ='Crop created successfully';
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error creating crop';
    }
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
};

const updateCrop = async (cropId: string, data: DataType) => {

  loadingSignal.value = true
  try {
    const response = await axios.put(`${API_URL}crop/${cropId}/${user.sub}`, data, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value ='Crop updated successfully';
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error updating crop';
    }
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
};
const getCrops = async () => {


  console.log("getting crops..")
  try {
    loadingSignal.value = true
    const response = await axios.get(`${API_URL}crops/retrieve/all`, {});

    if (response.status === 200) {
      const newCrops = response.data.crops;
      if (newCrops !== cropsSignal.value) {
        cropsSignal.value = newCrops;
        areThereCropsSignal.value = true
      }
    } else {
      const newCrops = response.data.crops;
      if (newCrops !== cropsSignal.value) {
        cropsSignal.value = newCrops;
        isErrorSignal.value = true
        messageSignal.value = 'Error getting crops';
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    loadingSignal.value = false
  }

  console.log("crops are done in getCrops: " + !loadingSignal.value)
};

const deleteCrop = async (cropId: string) => {


  loadingSignal.value = true
  try {
    const response = await axios.delete(`${API_URL}crops/${user.sub}/${cropId}`, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value = 'Crop deleted successfully';
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error deleting crop';
    }
  } catch (err) {
    console.error(err)
  } finally {
  loadingSignal.value = false
  }
};

const selectare = async (cropId: number, selectare: boolean, numSelections: number) => {


  loadingSignal.value = true
  try {
    const response = await axios.put(`${API_URL}crops/${cropId}/selectare`, { selectare: selectare, numSelections: numSelections }, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value = 'Crop selected successfully';
    } 
  } catch (err) {
    console.error(err)
  }  finally {
  loadingSignal.value = false
  } 
};

const SinglePage = async (id: string) => {

  
  loadingSignal.value = true
  try {
    const response = await axios.get(`${API_URL}crop/id/${id}`, {});
    if (response.status === 200) {
      const data = await response.data;
      singleCropSignal.value = data.crops[0];
    } 
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
};

  const addTheCropRecommendation = async (data: RecommendationType) => {


    loadingSignal.value = true
    try {
      const response = await axios.post(`${API_URL}crops/recommendations/${user.sub}`, data, {});
      if (response.status === 201) {
        isSuccessSignal.value = true
        messageSignal.value ='Recommendation added successfully';
      } 
    } catch (err) {
      console.error(err);
    }
    loadingSignal.value = false
  };
  
  const generateCropRotation = async (
    fieldSize: number,
    numberOfDivisions: number,
    rotationName: string,
    crops: DataType,
    maxYears: number,
    ResidualNitrogenSupply: number,
  ) => {

    loadingSignal.value = true
  
    try {
      const response = await axios.post(
        `${API_URL_ROTATION}generateRotation/rotation/${user.sub}`,
        { 
          fieldSize, 
          numberOfDivisions,
          rotationName,
          crops,
          maxYears,
          ResidualNitrogenSupply,
        },
        {}
      );
      if (response.status === 200 || response.status === 201) {
        cropRotationSignal.value = response.data;
      } 
    } catch (err) {
      console.error(err);
    } finally {
    loadingSignal.value = false
  
    }
  };
  

  const getAllCrops = async () => {


    try {
      loadingSignal.value = true
      const response = await axios.get(`${API_URL}crops/retrieve/all`, {});
      loadingSignal.value = false
      if (response.status === 200) {
        console.log("getting all crops..")
        const data = await response.data;
        cropsSignal.value = data.crops;
        areThereCropsSignal.value = true
        selectionsSignal.value = data.selections;
       
      }  else {
        cropsSignal.value = response.data.crops;
        isErrorSignal.value = true
        messageSignal.value = 'Error getting crops';
      }
    } catch (err) {
      console.error(err)
      areThereCropsSignal.value = false
    } finally {
      loadingSignal.value = false
    }
    console.log("crops are done fetching loading  signal is: " +  loadingSignal)
  };
  
  const deleteCropRotation = async (id: string) => {

    const confirmDelete = window.confirm("Are you sure you want to delete this crop rotation?");
    if (!confirmDelete) {
      return;
    }
    loadingSignal.value = true
    try {
      const response = await axios.delete(`${API_URL_ROTATION}deleteRotation/${user.sub}/${id}`, {});
      if (response.status === 200) {
        isSuccessSignal.value = true
        messageSignal.value = ('Crop rotation deleted successfully');
      } 
    } catch (err) {
      console.error(err)
    }
    loadingSignal.value = false
  };
  
  const getCropRecommendations = async (cropName: string) => {


    let recommendations = [];
    if (cropName !== '') {
      try {
        const response = await axios.get(`${API_URL}/crops/recommendations/${cropName}`, {});
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
  
  
  const updateNitrogenBalanceAndRegenerateRotation = async (data: any) => {
    const { id, rotationName, year, division, nitrogenBalance } = data;
    loadingSignal.value = true
    try {
      const response = await axios.put(`${API_URL_ROTATION}updateNitrogenBalance/rotation/${user.sub}`, {id, year, rotationName, division, nitrogenBalance }, {});
      if (response.status === 200) {
        isSuccessSignal.value = true
        messageSignal.value = ('Nitrogen Balance and Crop Rotation updated successfully');
        cropRotationSignal.value =(response.data);
      } 
    } catch (err) {
      console.error(err);
    }
    loadingSignal.value = false
  };
  

const updateDivisionSizeAndRedistribute = async (data: any) => {
  const { id, rotationName, division, newDivisionSize } = data;
  loadingSignal.value = true
  try {
    const response = await axios.put(`${API_URL_ROTATION}updateDivisionSizeAndRedistribute/rotation/${user.sub}`, {id, rotationName, division, newDivisionSize }, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value = ('Division Size and Crop Rotation updated successfully');
      cropRotationSignal.value = (response.data);
    } 
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
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
      setCropRotation: cropRotationSignal,
      generateCropRotation,
      getCropRecommendations,
      getCropRotation,
      deleteCropRotation,
      cropRotation: cropRotationSignal,
      singleCrop: singleCropSignal,
      updateNitrogenBalanceAndRegenerateRotation,
      updateDivisionSizeAndRedistribute,
      addTheCropRecommendation,
    
      
    }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContextCrop = () => {
  return useContext(GlobalContext);
};

// Path: app\features\Context\culturaStore.tsx

