"use client"
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useUserContext } from '../../providers/UserStore';
import { useGlobalContextCrop } from '../../providers/culturaStore';
import FormComponent from '../components/FormComponent';
import CropCardComponent from '../components/CropCardComponent';
import SelectAreaComponent from '../components/SelectAreaComponent';
import { useSignals  } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';
import { CropCreate } from '../../types/api';

// Add interface for API response
interface CropResponse {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety?: string;
  soilType?: string;
  climate?: string;
  ItShouldNotBeRepeatedForXYears: number | undefined;
  nitrogenSupply: number;
  nitrogenDemand: number;
  soilResidualNitrogen: number;
  fertilizers: string[];
  pests: string[];
  diseases: string[];
  userId: string;
  auth0Id: string;
}

function SinglePag() {
  useSignals();
  const { data: userData } = useUserContext();
  const { user, error, isLoading: isUserLoading } = useUser();
  const params = useParams();

  const {
    crops,
    isLoading,
    isError,
    message,
    selectare,
    SinglePage,
    deleteCrop,
    updateCrop,
  } = useGlobalContextCrop();

  const router = useRouter();
  const _id = params.id as string;
  useEffect(() => {
    if (!isUserLoading && _id) {
      SinglePage(_id).catch((error) => {
        console.error('Error fetching single page:', error);
      });
    }
  }, [_id, SinglePage, isUserLoading]);

  const [selectarea, setSelectarea] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updatedCrop, setUpdatedCrop] = useState<CropCreate>(() => ({
    cropName: '',
    ItShouldNotBeRepeatedForXYears: 0,
    description: '',
    cropType: '',
    cropVariety: '',
    diseases: [] as string[],
    fertilizers: [] as string[],
    pests: [] as string[],
    soilType: '',
    nitrogenDemand: 0,
    nitrogenSupply: 0,
    plantingDate: undefined,
    harvestingDate: undefined,
    soilResidualNitrogen: 0,
    climate: '',
    imageUrl: '',
  }));

  useEffect(() => {
    if (crops && crops.length > 0) {
      const crop = crops[0];
      setUpdatedCrop({
        cropName: crop.cropName || '',
        ItShouldNotBeRepeatedForXYears: crop.ItShouldNotBeRepeatedForXYears || 0,
        description: crop.description || '',
        cropType: crop.cropType || '',
        cropVariety: crop.cropVariety || '',
        diseases: crop.diseases || [],
        fertilizers: crop.fertilizers || [],
        pests: crop.pests || [],
        soilType: crop.soilType || '',
        nitrogenDemand: crop.nitrogenDemand || 0,
        nitrogenSupply: crop.nitrogenSupply || 0,
        plantingDate: crop.plantingDate,
        harvestingDate: crop.harvestingDate,
        soilResidualNitrogen: crop.soilResidualNitrogen || 0,
        climate: crop.climate || '',
      });
    }
  }, [crops]);


  const isOwner = (crop: CropResponse | undefined): boolean => {
    if (!crop || !user) return false;
    if (userData?.roleType?.toLowerCase() === 'admin') return true;
    return user.sub === crop.auth0Id;
  };

  // Memoize canEdit to prevent unnecessary recalculations
  const canEdit = React.useMemo(() => {
    if (!crops || !crops[0]) return false;
    return isOwner(crops[0] as CropResponse);
  }, [crops, user?.sub, userData?.roleType]);

  if (isLoading.value || !crops || crops.length === 0) {
    return (
      <div>
        <p>Loading crop ...</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!_id || !canEdit) return;
    try {
      await deleteCrop(_id);
      router.push('/Rotatie');
    } catch (error) {
      console.error('Error deleting crop:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!_id || !crops || crops.length === 0 || !isOwner(crops[0] as CropResponse)) return;
    
    const cropData: CropCreate = {
      ...updatedCrop,
      nitrogenSupply: Number(updatedCrop.nitrogenSupply),
      nitrogenDemand: Number(updatedCrop.nitrogenDemand),
      soilResidualNitrogen: Number(updatedCrop.soilResidualNitrogen),
      ItShouldNotBeRepeatedForXYears: Number(updatedCrop.ItShouldNotBeRepeatedForXYears),
    };
    
    await updateCrop(_id, cropData);
    setEditMode(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdatedCrop(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: string) => {
    const newArr = [...(updatedCrop[field] || [])];
    newArr[index] = e.target.value;
    setUpdatedCrop(prev => ({ ...prev, [field]: newArr }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (_id && userData && userData.roleType.toLowerCase() === "farmer") {
      await selectare(_id, !selectarea);
      setSelectarea(!selectarea);
    }
  };

  return (
    <div>
      <CropCardComponent 
        crops={crops[0] as CropCreate} 
        handleDelete={canEdit ? handleDelete : undefined} 
        canEdit={canEdit} 
        setEditMode={canEdit ? setEditMode : undefined} 
      />
      <FormComponent 
        handleUpdate={handleUpdate} 
        handleChange={handleChange} 
        handleArrayChange={handleArrayChange} 
        updatedCrop={updatedCrop} 
        editMode={editMode} 
        setEditMode={setEditMode} 
      />
      <SelectAreaComponent 
        onSubmit={onSubmit} 
        selectarea={selectarea} />
    </div>
  );
}

export default SinglePag;
