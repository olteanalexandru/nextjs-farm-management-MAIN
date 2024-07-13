'use client'
import { useEffect, useState } from 'react';
import Spinner from '../../Crud/Spinner';
import Continut from '../../Crud/GetAllInRotatie/page';
import GridGenerator from '../../Componente/GridGen';
import styles from './Rotatie.module.css';
import { useGlobalContextCrop } from '../../Context/culturaStore';
import { useSignals } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';
import App from './Components/App';

export default function Rotatie() {
  const { crops, isLoading, getAllCrops, areThereCrops } = useGlobalContextCrop();
  const { user, error, isLoading: isUserLoading } = useUser();

  useSignals();

  useEffect(() => {
    if (!isUserLoading) {
      getAllCrops();
    }
  }, [isUserLoading]);

  if (isLoading.value || isUserLoading) {
    return (
      <div>
        <Spinner />
        <p>Loading crops ...</p>
      </div>
    );
  }

  return <App crops={crops.value} areThereCrops={areThereCrops.value} />;
}


