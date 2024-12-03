"use client";

import { useState, useEffect } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';
import { RecommendationResponse } from '../types/api';
import CropCard from '../components/CropCard';

export default function RotationPage() {
  const { getAllCrops, crops, isLoading } = useGlobalContextCrop();
  const [selectedCrops, setSelectedCrops] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    getAllCrops();
  }, [getAllCrops]);

  // Filter only selected crops
  const selectedCropsData = crops.filter(crop => crop.isSelected);

  const handleSelectionCount = (crop: RecommendationResponse, count: number) => {
    setSelectedCrops(prev => {
      const newMap = new Map(prev);
      const cropId = crop.id?.toString() || crop._id;
      if (count > 0) {
        newMap.set(cropId, count);
      } else {
        newMap.delete(cropId);
      }
      return newMap;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Rotation Planning</h1>
        <p className="mt-2 text-gray-600">Select quantities for your rotation plan</p>
      </div>

      {isLoading.value ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading selected crops...</p>
        </div>
      ) : selectedCropsData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedCropsData.map(crop => (
            <div key={crop.id?.toString() || crop._id} className="relative">
              <CropCard
                crop={crop}
                isSelected={true}
                readOnly={true}
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white p-2 rounded-lg shadow border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Times in Rotation:</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={selectedCrops.get(crop.id?.toString() || crop._id) || 0}
                    onChange={(e) => handleSelectionCount(crop, parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="mt-2 text-gray-500">No crops selected. Please select crops from the dashboard first.</p>
        </div>
      )}

      {selectedCropsData.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => {/* Handle rotation generation */}}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            Generate Rotation Plan
          </button>
        </div>
      )}
    </div>
  );
}
