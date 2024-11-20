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
    cropName: crops?.cropName,
    ItShouldNotBeRepeatedForXYears: crops?.ItShouldNotBeRepeatedForXYears,
    description: crops?.description,
    cropType: crops?.cropType,
    cropVariety: crops?.cropVariety,
    diseases: crops?.diseases,
    fertilizers: crops?.fertilizers,
    pests: crops?.pests,
    soilType: crops?.soilType,
    nitrogenDemand: crops?.nitrogenDemand,
    nitrogenSupply: crops?.nitrogenSupply,
    plantingDate: crops?.plantingDate,
    harvestingDate: crops?.harvestingDate,
    soilResidualNitrogen: crops?.soilResidualNitrogen,
  }));
  
  const canEdit = userData.role.toLocaleLowerCase() === 'admin' ||  crops?.user == userData._id;
  const editPressed = () => {
    setEditMode(true);
  }
  
  useEffect(() => {
    if (!isUserLoading) {
      SinglePage(_id);
      console.log('SinglePage call');
    }
  }, [isUserLoading]);

  if (isError.message) {
    console.log("Eroare  " + message);
  }
  useEffect(() => {
    setUpdatedCrop({
      cropName: crops?.cropName,
      ItShouldNotBeRepeatedForXYears: crops?.ItShouldNotBeRepeatedForXYears,
      description: crops?.description,
      cropType: crops?.cropType,
      cropVariety: crops?.cropVariety,
      diseases: crops?.diseases,
      fertilizers: crops?.fertilizers,
      pests: crops?.pests,
      soilType: crops?.soilType,
      nitrogenDemand: crops?.nitrogenDemand,
      nitrogenSupply: crops?.nitrogenSupply,
      plantingDate: crops?.plantingDate,
      harvestingDate: crops?.harvestingDate,
      soilResidualNitrogen: crops?.soilResidualNitrogen,
    });
  }, [crops]); // Only re-run the effect if crops changes
  
console.log('crops', crops);

 // Don't render the components until the necessary data is available
 if (isLoading.value || !crops) {
  return (
    <div>
      <p>Loading crop ...</p>
    </div>
  );
}

  const handleDelete = async () => {
    try {
      await deleteCrop(_id);
      console.log('Crop deleted');
      navigate.push('/pages/Rotatie');
    } catch (error) {
      console.error('Error deleting crop:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (_id) {
      const cropData = {
        ...updatedCrop,
        _id: crops._id,
        imageUrl: crops.imageUrl,
        selectare: crops.selectare,
        user: crops.user,
        residualNitrogen: crops.residualNitrogen
      };
      await updateCrop(_id, cropData);
      setEditMode(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedCrop({ ...updatedCrop, [name]: value });
  };

  const handleArrayChange = (e, index, field) => {
    const newArr = [...updatedCrop[field]];
    newArr[index] = e.target.value;
    setUpdatedCrop({ ...updatedCrop, [field]: newArr });
  };

  const onSubmit = async (e, newSelectArea) => {
    e.preventDefault();
    if (userData && userData.role.toLowerCase() === "farmer") {
      await selectare(_id, newSelectArea, numSelections);
      setSelectarea(newSelectArea);
    }
  };
  console.log(updatedCrop)

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





