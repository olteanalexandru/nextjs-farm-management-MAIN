"use client";

import { useState } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';
import RecommendationForm from './RecommendationForm';

interface Recommendation {
  id: number;
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
}

export default function RecommendationList({ recommendations }: { recommendations: Recommendation[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const { deleteCrop, updateCrop } = useGlobalContextCrop();

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this recommendation?')) {
      await deleteCrop(id.toString());
      window.location.reload();
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!editingId) return;
    
    try {
      const updateData = {
        ...formData,
        cropType: 'RECOMMENDATION',
        cropVariety: '',
        soilResidualNitrogen: 0,
        ItShouldNotBeRepeatedForXYears: 0,
        climate: '',
        soilType: ''
      };

      await updateCrop(editingId.toString(), updateData);
      setEditingId(null);
      window.location.reload();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      alert('Failed to update recommendation');
    }
  };

  return (
    <div className="space-y-4">
      {recommendations.map(recommendation => (
        <div key={recommendation.id} className="bg-white p-4 rounded-lg shadow">
          {editingId === recommendation.id ? (
            <RecommendationForm
              mode="update"
              recommendation={recommendation}
              onSuccess={handleUpdate}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{recommendation.cropName}</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Nitrogen Supply: {recommendation.nitrogenSupply}</p>
                    <p>Nitrogen Demand: {recommendation.nitrogenDemand}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(recommendation.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(recommendation.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4">
                {recommendation.pests.length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-medium">Pests:</h4>
                    <ul className="list-disc list-inside">
                      {recommendation.pests.map((pest, index) => (
                        <li key={index} className="text-sm">{pest}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {recommendation.diseases.length > 0 && (
                  <div>
                    <h4 className="font-medium">Diseases:</h4>
                    <ul className="list-disc list-inside">
                      {recommendation.diseases.map((disease, index) => (
                        <li key={index} className="text-sm">{disease}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
