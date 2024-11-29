'use client'
import { useEffect } from 'react';
import Spinner from '../Crud/Spinner';
import { useGlobalContextCrop } from '../providers/culturaStore';
import { useSignals } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';
import RotationPlanner from './components/RotationPlanner';

export default function Rotatie() {
  const { isLoading, getAllCrops, areThereCrops } = useGlobalContextCrop();
  const { isLoading: isUserLoading } = useUser();

  useSignals();

  useEffect(() => {
    if (!isUserLoading) {
      getAllCrops();
    }
  }, [isUserLoading, getAllCrops]);

  if (isLoading.value || isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner />
        <p className="mt-4 text-gray-600">Loading crops...</p>
      </div>
    );
  }

  if (!areThereCrops.value) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Crops Available</h2>
          <p className="text-gray-600">Please add some crops before planning rotations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Crop Rotation Planner</h1>
      <div className="bg-white rounded-lg shadow-lg">
        <RotationPlanner />
      </div>
    </div>
  );
}
