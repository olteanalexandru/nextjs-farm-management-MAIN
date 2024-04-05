"use client";
import { createContext, useContext, Dispatch, SetStateAction, useState, useCallback } from 'react';
import axios from 'axios';
import { set } from 'lodash';

const API_URL = 'http://localhost:5000/api/crops/';
const API_URL_crop = 'http://localhost:5000/api/crops/crops/';
const API_URL_cropRotation = 'http://localhost:5000/api/crops/cropRotation/';
const API_URL_cropRecommendations = 'http://localhost:5000/api/crops/cropRecommendations';
const API_URL_SELECT = 'http://localhost:5000/api/crops/cropSelect/';
const API_URL_CropFields = 'http://localhost:5000/api/crops/cropRotation/fields';

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
  // setCrops: Dispatch<SetStateAction<any>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isError: boolean;
  setIsError: Dispatch<SetStateAction<boolean>>;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  createCrop: (data: DataType, token: string) => Promise<void>;
  getCrops: (token: string) => Promise<void>;
  deleteCrop: (id: string, token: string) => Promise<void>;
  selectare: (id: string, selectare: boolean, _id: string, token: string, numSelections: number) => Promise<void>;
  SinglePage: (id: string) => Promise<void>;
  getAllCrops: () => Promise<void>;
  updateCrop: (id: string, data: DataType, token: string) => Promise<void>;
  areThereCrops: boolean;
  cropRotation: any;
  setCropRotation: Dispatch<SetStateAction<any>>;
  generateCropRotation: ( fieldSize: number, numberOfDivisions: number, rotationName: string, filteredCrops: any, token: string , maxYears: number, ResidualNitrogenSupply: number ) => Promise<void>;
  addTheCropRecommendation: (data: RecommendationType, token: string) => Promise<void>;
  setRecommendations: Dispatch<SetStateAction<RecommendationType[]>>;
  getCropRecommendations: (cropName: string, token: string) => Promise<void>;
  getCropRotation: (token: string) => Promise<void>;
  singleCrop: any;
  updateNitrogenBalanceAndRegenerateRotation: (token:string , data: DataType) => Promise<void>;
  updateDivisionSizeAndRedistribute: (token:string , data: DataType) => Promise<void>;

  
}

const ContextProps = createContext<ContextProps>({
  crops: [],
  setCrops: () => {},
  isLoading: true,
  setIsLoading: () => {},
  isError: false,
  setIsError: () => {},
  isSuccess: false,
  setIsSuccess: () => {},
  message: '',
  setMessage: () => {},
  createCrop: () => Promise.resolve(),
  getCrops: () => Promise.resolve(),
  deleteCrop: () => Promise.resolve(),
  selectare: () => Promise.resolve(),
  SinglePage: () => Promise.resolve(),
  getAllCrops: () => Promise.resolve(),
  updateCrop: () => Promise.resolve(),
  cropRotation: [],
  setCropRotation: () => {},
  generateCropRotation: () => Promise.resolve(),
  getCropRotation: () => Promise.resolve(),
  addTheCropRecommendation: () => Promise.resolve(),
  setRecommendations: () => {},
  getCropRecommendations: () => Promise.resolve(),
  singleCrop: [],
  updateNitrogenBalanceAndRegenerateRotation: () => Promise.resolve(),
  updateDivisionSizeAndRedistribute: () => Promise.resolve(),
});

interface Props {
  children: React.ReactNode;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {
  const [crops, setCrops] = useState<DataType[]>([]);
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [cropRotation, setCropRotation] = useState([]);
  const [singleCrop, setSingleCrop] = useState<DataType>();
  const [areThereCrops, setAreThereCrops] = useState(false);


  const createCrop = async (data: DataType, token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(API_URL, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 201) {
        setIsSuccess(true);
        setMessage('Crop created successfully');
      } else {
        setIsError(true);
        setMessage('Error creating crop');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error creating crop');
    }
    setIsLoading(false);
  };

  const updateCrop = async (id: string, data: DataType, token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.put(API_URL_crop + id, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setIsSuccess(true);
        setMessage('Crop updated successfully');
      } else {
        setIsError(true);
        setMessage('Error updating crop');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error updating crop');
    }
    setIsLoading(false);
  };



  const getCrops = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setCrops(response.data);
        setAreThereCrops(true);
      } else {
        setIsError(true);
        setMessage('Error getting crops');
        
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error getting crops');
    }
    setIsLoading(false);
  };

  
  const deleteCrop = async (id: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.delete(API_URL + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setIsSuccess(true);
        setMessage('Crop deleted successfully');
      } else {
        setIsError(true);
        setMessage('Error deleting crop');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error deleting crop');
    }
    setIsLoading(false);
  };



  const selectare = async (id: string, selectare: boolean, _id: string, token: string, numSelections: number) => {
    const response = await axios.post(API_URL_SELECT + id, { selectare: selectare, _id: _id, numSelections: numSelections }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const crops = await response.data;
    setCrops(crops);
  };

  const SinglePage = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        const data = await response.data;
        setSingleCrop(data);
      } else {
        setIsError(true);
        setMessage('Error getting crops');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error getting crops');
    }
    setIsLoading(false);
  };

  const getAllCrops = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL_crop, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        const data = await response.data;
        setCrops(data);
        setAreThereCrops(true);
      } else {
        setIsError(true);
        setAreThereCrops(false);
        setMessage('Error getting crops');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error getting crops');
    }
    setIsLoading(false);
  };

  
  const generateCropRotation = async (
    fieldSize: number,
    numberOfDivisions: number,
    rotationName: string,
    crops: DataType,
    token: string,
    maxYears: number,
    ResidualNitrogenSupply:number,
  ) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL_cropRotation}`,
        { 
          fieldSize, 
          numberOfDivisions,
          rotationName,
          crops,
          maxYears,
          ResidualNitrogenSupply,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.status === 200) {
        setCropRotation(response.data);
      } else {
        setIsError(true);
        setMessage('Error generating crop rotation');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error generating crop rotation');
    }
    setIsLoading(false);
  };

  const getCropRotation = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL_cropRotation}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setCropRotation(response.data);
      } else if (response.status === 204) {
        setMessage('Nu exista nici o rotatie de culturi');
        setCropRotation(response.data);
      } else
       {
        setIsError(true);
        setMessage('Eroare la preluarea rotatiei de culturi cu codul ' + response.status);
      }
    } catch (err) {
      setIsError(true);
      setMessage('Eroare la preluarea rotatiei de culturi');
    }
    setIsLoading(false);
  };

  const deleteCropRotation = async (id: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.delete(`${API_URL_cropRotation}${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setIsSuccess(true);
        setMessage('Crop rotation deleted successfully');
      } else {
        setIsError(true);
        setMessage('Error deleting crop rotation');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error deleting crop rotation');
    }
    setIsLoading(false);
  };




  const getCropRecommendations = useCallback(async (cropName: string, token: string) => {
    let recommendations = [];
    if (cropName !== '') {
      try {
        const response = await axios.get(
          `${API_URL_cropRecommendations}?cropName=${cropName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 200 && response.data.length > 0) { // check if response data is not empty
          recommendations = response.data;
        }
      } catch (error) {
        console.error(error);
      }
    }
    return recommendations;
  }, []);
  


  
  const updateNitrogenBalanceAndRegenerateRotation = async ( token: string, data: any) => {
  setIsLoading(true);
  const {rotationName, year, division, nitrogenBalance } = data;
  try {
    const response = await axios.put(`${API_URL_cropRotation}`, {year, rotationName,division, nitrogenBalance }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      setIsSuccess(true);
      setMessage('Nitrogen Balance and Crop Rotation updated successfully');
      setCropRotation(response.data);
    } else {
      setIsError(true);
      setMessage('Error updating Nitrogen Balance and Crop Rotation');
    }
  } catch (err) {
    setIsError(true);
    setMessage('Error updating Nitrogen Balance and Crop Rotation');
  }
  setIsLoading(false);
};

const updateDivisionSizeAndRedistribute = async (token: string, data: any) => {
  const { rotationName, division, newDivisionSize } = data;
  setIsLoading(true);
  try {
    const response = await axios.put(`${API_URL_CropFields}`, { rotationName, division, newDivisionSize }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      setIsSuccess(true);
      setMessage('Division Size and Crop Rotation updated successfully');
      setCropRotation(response.data);
    } else {
      setIsError(true);
      setMessage('Error updating Division Size and Crop Rotation');
    }
  } catch (err) {
    setIsError(true);
    setMessage('Error updating Division Size and Crop Rotation');
  }
  setIsLoading(false);
};

  
  

  

  return (
    <GlobalContext.Provider
      value={{
        crops,
        setCrops,
        isLoading,
        setIsLoading,
        isError,
        setIsError,
        isSuccess,
        setIsSuccess,
        message,
        setMessage,
        createCrop,
        getCrops,
        deleteCrop,
        selectare,
        SinglePage,
        getAllCrops,
        updateCrop,
        areThereCrops,
        setCropRotation,
        generateCropRotation,
        getCropRecommendations,
        getCropRotation,
        deleteCropRotation,
        cropRotation,
        singleCrop,
        updateNitrogenBalanceAndRegenerateRotation,
        updateDivisionSizeAndRedistribute,
      

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