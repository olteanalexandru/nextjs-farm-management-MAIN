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
      SinglePage(_id).then(() => {
        console.log('SinglePage call with ID:', _id);
      }).catch((error) => {
        console.error('Error fetching single page:', error);
      });
    }
  }, [_id, SinglePage, isUserLoading]);

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
        imageUrl: crop.imageUrl || '',
      });
    }
  }, [crops]);

  const [selectarea, setSelectarea] = useState(false);
  const [numSelections, setNumSelections] = useState(1);
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

  // Update the isOwner function to match the API response structure
  const isOwner = (crop: any) => {
    if (!user || !crop) return false;
    
    // Check if user is admin
    if (userData.roleType.toLowerCase() === 'admin') return true;
    
    // Check if user owns the crop using auth0Id
    if (user.sub === crop.auth0Id) return true;
    
   
  };

  // Update canEdit logic to handle array properly
  const canEdit = isOwner;

  console.log('Current user:', user?.sub); // Debug
  console.log('Crop owner:', crops[0]?.auth0Id); // Debug
  console.log('Can edit:', canEdit); // Debug

  if (isLoading.value || !crops || crops.length === 0) {
    return (
      <div>
        <p>Loading crop ...</p>
      </div>
    );
  }

  if (isError.message) {
    console.log("Eroare  " + message);
  }

  // Update handleDelete with permission check
  const handleDelete = async () => {
    if (!_id || !canEdit) return;
    try {
      await deleteCrop(_id);
      console.log('Crop deleted');
      router.push('/Rotatie');
    } catch (error) {
      console.error('Error deleting crop:', error);
    }
  };

  // Update handleUpdate with permission check
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (_id || !crops.length > 0 || !canEdit) return;
    
    const cropData: CropCreate = {
      ...updatedCrop,
      imageUrl: crops[0].imageUrl || '',
      cropName: updatedCrop.cropName,
      cropType: updatedCrop.cropType,
      cropVariety: updatedCrop.cropVariety,
      soilType: updatedCrop.soilType,
      nitrogenSupply: Number(updatedCrop.nitrogenSupply),
      nitrogenDemand: Number(updatedCrop.nitrogenDemand),
      soilResidualNitrogen: Number(updatedCrop.soilResidualNitrogen),
      ItShouldNotBeRepeatedForXYears: Number(updatedCrop.ItShouldNotBeRepeatedForXYears),
      fertilizers: updatedCrop.fertilizers,
      pests: updatedCrop.pests,
      diseases: updatedCrop.diseases,
      climate: updatedCrop.climate,
      description: updatedCrop.description,
      plantingDate: updatedCrop.plantingDate,
      harvestingDate: updatedCrop.harvestingDate,
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
        crops={crops[0]} 
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
        selectarea={selectarea} 
        setSelectarea={setSelectarea} />
    </div>
  );
}

export default SinglePag;
