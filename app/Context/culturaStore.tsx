"use client";
import { createContext, useContext, Dispatch, SetStateAction, useState, useEffect } from 'react';
import axios from 'axios';
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
  selections:any;
  // setCrops: Dispatch<SetStateAction<any>>;
  isLoading: boolean;
  isCropRotationLoading: boolean;
  setisCropRotationLoading: Dispatch<SetStateAction<boolean>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isError: boolean;
  setIsError: Dispatch<SetStateAction<boolean>>;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  createCrop: (data: DataType) => Promise<void>;
  getCrops: () => Promise<void>;
  deleteCrop: ( cropId: string) => Promise<void>;
  selectare: (cropId:number, selectare: boolean, numSelections: number) => Promise<void>;
  SinglePage: (id: string) => Promise<void>;
  getAllCrops: () => Promise<void>;
  updateCrop: (id: string, data: DataType) => Promise<void>;
  areThereCrops: boolean;
  cropRotation: any;
  setCropRotation: Dispatch<SetStateAction<any>>;
  generateCropRotation: ( fieldSize: number, numberOfDivisions: number, rotationName: string, filteredCrops: any , maxYears: number, ResidualNitrogenSupply?: number ) => Promise<void>;
  addTheCropRecommendation: (data: RecommendationType) => Promise<void>;
  setRecommendations: Dispatch<SetStateAction<RecommendationType[]>>;
  getCropRecommendations: (cropName: string) => Promise<any>;
  getCropRotation: () => Promise<void>;
  singleCrop: any;
  updateNitrogenBalanceAndRegenerateRotation: ( data: DataType) => Promise<void>;
  updateDivisionSizeAndRedistribute: ( data: DataType) => Promise<void>;
  loadingStateAtTheMoment : () => Promise<boolean>;
}

interface Props {
  children: React.ReactNode;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {
  const [crops, setCrops] = useState<DataType[]>([]);

  const [loading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [cropRotation, setCropRotation] = useState([]);
  const [singleCrop, setSingleCrop] = useState<DataType>();
  const [areThereCrops, setAreThereCrops] = useState(false);
  const [isCropRotationLoading , setIsCropRotationLoading] = useState(false); 
const [selections, setSelections] = useState([]);
const { user, error: authError, isLoading: isUserLoading  } = useUser();


// useEffect(() => {
//   loadingStateAtTheMoment();
// }, [loading]);

const loadingStateAtTheMoment = async () => {
  try {
    if (loading || isCropRotationLoading || isUserLoading) {
      console.log("Loading state at the moment");
      return true;
    } else {
      console.log("Loading state is false now");
      return false;
    }
  } catch (error) {
    console.log(error);
  }
};

const getCropRotation = async () => {
  if (!user) {
    console.log("User is not loaded yet");
    return;
  }
  setIsLoading(true);
  setIsCropRotationLoading(true);

  try {
    console.log("making a get request to get crop rotation try");
    const response = await axios.get(API_URL_ROTATION + "getRotation/rotation/" + user.sub);
    if (response.status === 200) {
      setCropRotation(response.data);
    }
  } catch (err) {
    console.error(err);
  }
  console.log( "crop rotation fetched ");
  setIsLoading(false);
  setIsCropRotationLoading(false);
};

  const createCrop = async (data) => {
    console.log('createCrop triggered with object props: ' + JSON.stringify(data));
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}crop/single/${user.sub}`, data);
      if (response.status === 201) {
        setIsSuccess(true);
        setMessage('Crop created successfully');
      } else {
        setIsError(true);
        setMessage('Error creating crop');
      }
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false);
  };

  const updateCrop = async (cropId: string, data: DataType) => {
    setIsLoading(true);
    try {
      const response = await axios.put(`${API_URL}crop/${cropId}/${user.sub}`, data, {
      });
      if (response.status === 200) {
        setIsSuccess(true);
        setMessage('Crop updated successfully');
      } else {
        setIsError(true);
        setMessage('Error updating crop');
      }
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false);
  };

  const getCrops = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}crops/retrieve/all` , {
      });
      if (response.status === 200) {
        setCrops(response.data.crops);
        setAreThereCrops(true);
        console.log(response.data);
      } else {
        setIsError(true);
        console.log(response.data);
        setMessage('Error getting crops');
        
      }
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false);
  };

  const deleteCrop = async ( cropId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.delete(`${API_URL}crops/${user.sub}/${cropId}`, {

      });
      if (response.status === 200) {
        setIsSuccess(true);
        setMessage('Crop deleted successfully');
      } else {
        setIsError(true);
        setMessage('Error deleting crop');
      }
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false);
  };

  // API_URL + "/crops/crops/selectare/" + id + "/selectare"
// await selectare(_id, newSelectArea, numSelections);
  const selectare = async (cropId:number, selectare: boolean, numSelections: number) => {
    setIsLoading(true);
    try {
    const response = await axios.put(`${API_URL}crops/${cropId}/selectare`, { selectare: selectare, numSelections: numSelections }, {
    });
    if (response.status === 200) {
      setIsSuccess(true);
      setMessage('Crop selected successfully');
    } 
  } catch (err) {
    console.error(err)
  }
    setIsLoading(false);
  };

  const SinglePage = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}crop/id/${id}`, {
      });
      if (response.status === 200) {
        const data = await response.data
        setSingleCrop(data.crops[0]);
      } 
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false);
  };



  const addTheCropRecommendation = async (data: RecommendationType) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}crops/recommendations/${user.sub} `, data, {
      });
      if (response.status === 201) {
        setIsSuccess(true);
        setMessage('Recommendation added successfully');
      } 
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false);
  };

  const generateCropRotation = async (
    fieldSize: number,
    numberOfDivisions: number,
    rotationName: string,
    crops: DataType,
    maxYears: number,
    ResidualNitrogenSupply:number,
  ) => {
    setIsLoading(true);
    setIsCropRotationLoading(true);
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
        setCropRotation(response.data);
      } 
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false);
    setIsCropRotationLoading(false);
  };

  const getAllCrops = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}crops/retrieve/all`, {
      });
      if (response.status === 200) {
        const data = await response.data;
        setCrops(data.crops);
        setAreThereCrops(true);
        setSelections(data.selections);
      } 
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false);
  };

  const deleteCropRotation = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await axios.delete(`${API_URL_ROTATION}${id}`, {
      });
      if (response.status === 200) {
        setIsSuccess(true);
        setMessage('Crop rotation deleted successfully');
      } 
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false);
  };

  const getCropRecommendations = async (cropName: string) => {
    let recommendations = [];
    if (cropName !== '') {
      try {
        const response = await axios.get(`${API_URL}/crops/recommendations/${cropName}`, {
        });
        if (response.status === 200) {
          recommendations = response.data.crops
        }
      } catch (error) {
        console.error(error);
      }
    }
    console.log("recommendations: ", recommendations);
    return recommendations;
  }

  const updateNitrogenBalanceAndRegenerateRotation = async (  data: any) => {
  setIsLoading(true);
  const {id , rotationName, year, division, nitrogenBalance } = data;
  try {
    const response = await axios.put(`${API_URL_ROTATION}updateNitrogenBalance/rotation/${user.sub}`, {id, year, rotationName,division, nitrogenBalance }, {
    });
    if (response.status === 200) {
      setIsSuccess(true);
      setMessage('Nitrogen Balance and Crop Rotation updated successfully');
      setCropRotation(response.data);
    } 
  } catch (err) {
    console.error(err)
  }
  setIsLoading(false);
};

const updateDivisionSizeAndRedistribute = async ( data: any) => {
  const { id,  rotationName, division, newDivisionSize } = data;
  setIsLoading(true);
  try {
    const response = await axios.put(`${API_URL_ROTATION}updateDivisionSizeAndRedistribute/rotation/${user.sub}`, {id, rotationName, division, newDivisionSize }, {
    });
    if (response.status === 200) {
      setIsSuccess(true);
      setMessage('Division Size and Crop Rotation updated successfully');
      setCropRotation(response.data);
    } 
  } catch (err) {
    console.error(err)
  }
  setIsLoading(false);
};

  return (
    <GlobalContext.Provider
      value={{
        crops,
        selections,
  

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
        addTheCropRecommendation,
        isCropRotationLoading,
        loadingStateAtTheMoment
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

