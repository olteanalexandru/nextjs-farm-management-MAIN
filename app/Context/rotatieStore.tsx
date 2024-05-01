"use client";
import { createContext, useContext, Dispatch, SetStateAction, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL_cropRotation = 'http://localhost:5000/api/crops/cropRotation/';
const API_URL_cropRecommendations = 'http://localhost:5000/api/crops/cropRecommendations';
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
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isError: boolean;
  setIsError: Dispatch<SetStateAction<boolean>>;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  cropRotation: any;
  setCropRotation: Dispatch<SetStateAction<any>>;
  generateCropRotation: ( fieldSize: number, numberOfDivisions: number, rotationName: string, filteredCrops: any, token: string , maxYears: number, ResidualNitrogenSupply: number ) => Promise<void>;
  addTheCropRecommendation: (data: RecommendationType, token: string) => Promise<void>;
  getCropRotation: (token: string) => Promise<void>;
  updateNitrogenBalanceAndRegenerateRotation: (token:string , data: DataType) => Promise<void>;
  updateDivisionSizeAndRedistribute: (token:string , data: DataType) => Promise<void>;
}

const ContextProps = createContext<ContextProps>({
  isLoading: false,
  setIsLoading: () => {},
  isError: false,
  setIsError: () => {},
  isSuccess: false,
  setIsSuccess: () => {},
  message: '',
  setMessage: () => {},
  cropRotation: [],
  setCropRotation: () => {},
  generateCropRotation: () => Promise.resolve(),
  getCropRotation: () => Promise.resolve(),
  addTheCropRecommendation: () => Promise.resolve(),
  updateNitrogenBalanceAndRegenerateRotation: () => Promise.resolve(),
  updateDivisionSizeAndRedistribute: () => Promise.resolve(),
});

interface Props {
  children: React.ReactNode;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [cropRotation, setCropRotation] = useState([]);

  const generateCropRotation = async (
    fieldSize: number,
    numberOfDivisions: number,
    rotationName: string,
    crops: DataType,
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
        setMessage('Eroare la preluarea rotatiei de culturi');
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
    const response = await axios.put(`${API_URL_cropRotation}`, { rotationName, division, newDivisionSize }, {
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
        isLoading,
        setIsLoading,
        isError,
        setIsError,
        isSuccess,
        setIsSuccess,
        message,
        setMessage,
        setCropRotation,
        generateCropRotation,
        getCropRotation,
        cropRotation,
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
export const useGlobalContextCropRotation = () => {
  return useContext(GlobalContext);
};