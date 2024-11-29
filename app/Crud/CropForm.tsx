"use client";

import { useState } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';
import CropRecommendations from './CropRecommandations';
import { CropCreate } from '../types/api';

interface CropFormProps {
  onSuccess?: () => void;
}

export default function CropForm({ onSuccess }: CropFormProps) {
  const { createCrop, isLoading, isError, message } = useGlobalContextCrop();
  const [formData, setFormData] = useState<CropCreate>({
    cropName: '',
    cropType: '',
    cropVariety: '',
    soilType: '',
    nitrogenSupply: 0,
    nitrogenDemand: 0,
    soilResidualNitrogen: 0,
    ItShouldNotBeRepeatedForXYears: 0,
    fertilizers: [''],
    pests: [''],
    diseases: [''],
    climate: '',
    description: '',
    imageUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCrop(formData);
    if (!isError.value) {
      setFormData({
        cropName: '',
        cropType: '',
        cropVariety: '',
        soilType: '',
        nitrogenSupply: 0,
        nitrogenDemand: 0,
        soilResidualNitrogen: 0,
        ItShouldNotBeRepeatedForXYears: 0,
        fertilizers: [''],
        pests: [''],
        diseases: [''],
        climate: '',
        description: '',
        imageUrl: '',
      });
      onSuccess?.();
    }
  };

  const handleArrayChange = (
    field: 'fertilizers' | 'pests' | 'diseases',
    index: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayField = (field: 'fertilizers' | 'pests' | 'diseases') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'fertilizers' | 'pests' | 'diseases', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_: string, i: number) => i !== index)
    }));
  };

  const arrayFields = ['fertilizers', 'pests', 'diseases'] as const;

  return (
    <div className="space-y-6">
      {/* Recommendations Section - Show at the top */}
      {formData.cropName.length >= 3 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Similar Crops & Recommendations</h3>
          <CropRecommendations cropName={formData.cropName} token="" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Crop Name</label>
            <input
              type="text"
              required
              value={formData.cropName}
              onChange={(e) => setFormData(prev => ({ ...prev, cropName: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Crop Type</label>
            <input
              type="text"
              required
              value={formData.cropType}
              onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Variety</label>
            <input
              type="text"
              value={formData.cropVariety}
              onChange={(e) => setFormData(prev => ({ ...prev, cropVariety: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Soil Type</label>
            <input
              type="text"
              value={formData.soilType}
              onChange={(e) => setFormData(prev => ({ ...prev, soilType: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nitrogen Supply</label>
            <input
              type="number"
              value={formData.nitrogenSupply}
              onChange={(e) => setFormData(prev => ({ ...prev, nitrogenSupply: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nitrogen Demand</label>
            <input
              type="number"
              value={formData.nitrogenDemand}
              onChange={(e) => setFormData(prev => ({ ...prev, nitrogenDemand: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rotation Period (Years)</label>
            <input
              type="number"
              value={formData.ItShouldNotBeRepeatedForXYears}
              onChange={(e) => setFormData(prev => ({ ...prev, ItShouldNotBeRepeatedForXYears: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Dynamic Arrays */}
        {arrayFields.map((field) => (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 capitalize">{field}</label>
            {formData[field].map((value: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleArrayChange(field, index, e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeArrayField(field, index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField(field)}
              className="text-blue-600 hover:text-blue-800"
            >
              Add {field.slice(0, -1)}
            </button>
          </div>
        ))}

        {isError.value && (
          <div className="text-red-600 text-sm">{message.value}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading.value}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading.value ? 'Saving...' : 'Save Crop'}
          </button>
        </div>
      </form>
    </div>
  );
}
