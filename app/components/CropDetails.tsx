"use client";

import { useState } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';

interface CropDetailsProps {
  cropId: string;
  onClose: () => void;
}

export default function CropDetails({ cropId, onClose }: CropDetailsProps) {
  const { singleCrop, deleteCrop, isLoading, isError, message } = useGlobalContextCrop();
  const [isEditing, setIsEditing] = useState(false);

  const crop = singleCrop.value;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this crop?')) {
      await deleteCrop(cropId);
      onClose();
    }
  };

  if (isLoading.value) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isError.value) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h3 className="text-red-600">Error: {message.value}</h3>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!crop) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{crop.cropName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700">Crop Type</h3>
              <p>{crop.cropType}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Variety</h3>
              <p>{crop.cropVariety || 'Not specified'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700">Soil Type</h3>
            <p>{crop.soilType || 'Not specified'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700">Nitrogen Supply</h3>
              <p>{crop.nitrogenSupply || '0'} units</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Nitrogen Demand</h3>
              <p>{crop.nitrogenDemand || '0'} units</p>
            </div>
          </div>

          {crop.fertilizers && crop.fertilizers.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700">Fertilizers</h3>
              <ul className="list-disc list-inside">
                {crop.fertilizers.map((fertilizer, index) => (
                  <li key={index}>{fertilizer}</li>
                ))}
              </ul>
            </div>
          )}

          {crop.pests && crop.pests.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700">Pests</h3>
              <ul className="list-disc list-inside">
                {crop.pests.map((pest, index) => (
                  <li key={index}>{pest}</li>
                ))}
              </ul>
            </div>
          )}

          {crop.diseases && crop.diseases.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700">Diseases</h3>
              <ul className="list-disc list-inside">
                {crop.diseases.map((disease, index) => (
                  <li key={index}>{disease}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-700">Rotation Period</h3>
            <p>{crop.ItShouldNotBeRepeatedForXYears || '0'} years</p>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Crop
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
