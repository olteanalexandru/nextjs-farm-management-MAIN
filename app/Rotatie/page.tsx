'use client'
import { useEffect } from 'react';
import Spinner from '../Crud/Spinner';
import { useGlobalContextCrop } from '../providers/culturaStore';
import { useSignals } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';
import App from './components/App';

export default function Rotatie() {
  const { crops, isLoading, getAllCrops, areThereCrops } = useGlobalContextCrop();
  const { isLoading: isUserLoading } = useUser();

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


