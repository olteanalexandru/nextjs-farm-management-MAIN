"use client";

import { useState, useEffect } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';

interface RecommendationFormProps {
  recommendation?: {
    cropName: string;
    nitrogenSupply: number;
    nitrogenDemand: number;
    pests: string[];
    diseases: string[];
  };
  onCancel?: () => void;
  onSuccess?: (data: any) => void;
  mode?: 'create' | 'update';
}

export default function RecommendationForm({ 
  recommendation, 
  onCancel, 
  onSuccess,
  mode = 'create'
}: RecommendationFormProps) {
  const { addTheCropRecommendation } = useGlobalContextCrop();
  const [formData, setFormData] = useState({
    cropName: '',
    nitrogenSupply: 0,
    nitrogenDemand: 0,
    pests: [''],
    diseases: ['']
  });

  useEffect(() => {
    if (recommendation) {
      setFormData({
        cropName: recommendation.cropName || '',
        nitrogenSupply: recommendation.nitrogenSupply || 0,
        nitrogenDemand: recommendation.nitrogenDemand || 0,
        pests: recommendation.pests?.length ? recommendation.pests : [''],
        diseases: recommendation.diseases?.length ? recommendation.diseases : ['']
      });
    }
  }, [recommendation]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.cropName.trim()) {
      alert('Crop name is required');
      return;
    }

    try {
      const cleanedData = {
        ...formData,
        pests: formData.pests.filter(pest => pest.trim() !== ''),
        diseases: formData.diseases.filter(disease => disease.trim() !== ''),
        nitrogenSupply: Number(formData.nitrogenSupply),
        nitrogenDemand: Number(formData.nitrogenDemand)
      };

      if (mode === 'update') {
        onSuccess?.(cleanedData);
      } else {
        await addTheCropRecommendation(cleanedData);
        setFormData({
          cropName: '',
          nitrogenSupply: 0,
          nitrogenDemand: 0,
          pests: [''],
          diseases: ['']
        });
        onSuccess?.(cleanedData);
      }
    } catch (error) {
      console.error('Error saving recommendation:', error);
      alert('Failed to save recommendation. Please try again.');
    }
  };

  const handleArrayInput = (
    field: 'pests' | 'diseases',
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayField = (field: 'pests' | 'diseases') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };

  const removeArrayField = (field: 'pests' | 'diseases', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Crop Name
        </label>
        <input
          type="text"
          value={formData.cropName}
          onChange={(e) => setFormData({...formData, cropName: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                   focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nitrogen Supply
          </label>
          <input
            type="number"
            value={formData.nitrogenSupply}
            onChange={(e) => setFormData({
              ...formData,
              nitrogenSupply: parseFloat(e.target.value)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nitrogen Demand
          </label>
          <input
            type="number"
            value={formData.nitrogenDemand}
            onChange={(e) => setFormData({
              ...formData,
              nitrogenDemand: parseFloat(e.target.value)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Pests Array Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pests
        </label>
        {formData.pests.map((pest, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={pest}
              onChange={(e) => handleArrayInput('pests', index, e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm 
                       focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removeArrayField('pests', index)}
              className="px-2 py-1 text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayField('pests')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Pest
        </button>
      </div>

      {/* Diseases Array Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diseases
        </label>
        {formData.diseases.map((disease, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={disease}
              onChange={(e) => handleArrayInput('diseases', index, e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm 
                       focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removeArrayField('diseases', index)}
              className="px-2 py-1 text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayField('diseases')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Disease
        </button>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md 
                   hover:bg-blue-700 transition-colors duration-200"
        >
          {recommendation ? 'Update' : 'Create'} Recommendation
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md 
                     hover:bg-gray-700 transition-colors duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
