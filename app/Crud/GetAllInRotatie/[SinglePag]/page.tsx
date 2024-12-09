"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Form, Container, Button, Card, ListGroup } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useUserContext } from '../../../providers/UserStore';
import { useGlobalContextCrop } from '../../../providers/culturaStore';
import FormComponent from './components/FormComponent';
import CropCardComponent from './components/CropCardComponent';
import SelectAreaComponent from './components/SelectAreaComponent';
import { useSignals  } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';
import { CropCreate } from '../../../types/api';

function SinglePag() {
  useSignals();
  const { data: userData } = useUserContext();
  const { user, error, isLoading: isUserLoading } = useUser();

  const {
    singleCrop,
    isLoading,
    isError,
    message,
    selectare,
    SinglePage,
    deleteCrop,
    updateCrop,
  } = useGlobalContextCrop();

  const navigate = useRouter();
  const _id = useSearchParams().get('crop');
  const crops = singleCrop.value;

  const [selectarea, setSelectarea] = useState(false);
  const [numSelections, setNumSelections] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [updatedCrop, setUpdatedCrop] = useState(() => ({
    cropName: crops?.cropName || '',
    ItShouldNotBeRepeatedForXYears: crops?.ItShouldNotBeRepeatedForXYears || 0,
    description: crops?.description || '',
    cropType: crops?.cropType || '',
    cropVariety: crops?.cropVariety || '',
    diseases: crops?.diseases || [],
    fertilizers: crops?.fertilizers || [],
    pests: crops?.pests || [],
    soilType: crops?.soilType || '',
    nitrogenDemand: crops?.nitrogenDemand || 0,
    nitrogenSupply: crops?.nitrogenSupply || 0,
    plantingDate: crops?.plantingDate,
    harvestingDate: crops?.harvestingDate,
    soilResidualNitrogen: crops?.soilResidualNitrogen || 0,
    climate: crops?.climate || '',
  }));
  
  const canEdit = userData.roleType.toLocaleLowerCase() === 'admin' ||  crops?.user == userData.auth0Id;
  
  useEffect(() => {
    if (!isUserLoading && _id) {
      SinglePage(_id);
      console.log('SinglePage call');
    } else if (!_id) {
      navigate.push('/Rotatie');
    }
  }, [isUserLoading, _id]);

  if (isError.message) {
    console.log("Eroare  " + message);
  }

  useEffect(() => {
    if (crops) {
      setUpdatedCrop({
        cropName: crops.cropName || '',
        ItShouldNotBeRepeatedForXYears: crops.ItShouldNotBeRepeatedForXYears || 0,
        description: crops.description || '',
        cropType: crops.cropType || '',
        cropVariety: crops.cropVariety || '',
        diseases: crops.diseases || [],
        fertilizers: crops.fertilizers || [],
        pests: crops.pests || [],
        soilType: crops.soilType || '',
        nitrogenDemand: crops.nitrogenDemand || 0,
        nitrogenSupply: crops.nitrogenSupply || 0,
        plantingDate: crops.plantingDate,
        harvestingDate: crops.harvestingDate,
        soilResidualNitrogen: crops.soilResidualNitrogen || 0,
        climate: crops.climate || '',
      });
    }
  }, [crops]);
  
  if (isLoading.value || !crops) {
    return (
      <div>
        <p>Loading crop ...</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!_id) return;
    try {
      await deleteCrop(_id);
      console.log('Crop deleted');
      navigate.push('/Rotatie');
    } catch (error) {
      console.error('Error deleting crop:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (_id && crops) {
      const cropData: CropCreate = {
        ...updatedCrop,
        imageUrl: crops.imageUrl || '',
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
    }
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

  const onSubmit = async (e: React.FormEvent, newSelectArea: boolean) => {
    e.preventDefault();
    if (_id && userData && userData.roleType.toLowerCase() === "farmer") {
      await selectare(_id, newSelectArea);
      setSelectarea(newSelectArea);
    }
  };

  return (
    <div>
      <CropCardComponent 
        crops={crops} 
        handleDelete={handleDelete} 
        canEdit={canEdit} 
        setEditMode={setEditMode} 
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
        setSelectarea={setSelectarea} 
        numSelections={numSelections} 
        setNumSelections={setNumSelections} 
      />
    </div>
  );
}

export default SinglePag;
