"use client"
import React, { useEffect, useState } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';
import { RecommendationResponse } from '../types/api';

export default function CropRecommendations({ cropName, token }: { cropName: string, token: string }) {
  const { getCropRecommendations } = useGlobalContextCrop();
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const result = await getCropRecommendations(cropName);
        if (Array.isArray(result)) {
          setRecommendations(result);
          setError('');
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
        setRecommendations([]);
      }
    };

    if (cropName && cropName.length >= 3) {
      fetchRecommendations();
    } else {
      setRecommendations([]);
    }
  }, [cropName, getCropRecommendations, token]);

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recommendations.map((recommendation) => (
          <div 
            key={recommendation.id || recommendation._id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {recommendation.cropName || 'Unknown Crop'}
              </h3>
              <p className="text-sm text-gray-500">Recommendation</p>
            </div>
            <div className="p-4 space-y-3">
              {recommendation.diseases && recommendation.diseases.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Diseases:</p>
                  <p className="text-sm text-gray-600">
                    {recommendation.diseases.join(', ')}
                  </p>
                </div>
              )}
              
              {recommendation.pests && recommendation.pests.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Pests:</p>
                  <p className="text-sm text-gray-600">
                    {recommendation.pests.join(', ')}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-700">Nitrogen Balance:</p>
                <div className="mt-1 flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(recommendation.nitrogenSupply / (recommendation.nitrogenDemand || 1)) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {Math.round((recommendation.nitrogenSupply / (recommendation.nitrogenDemand || 1)) * 100)}%
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Supply: </span>
                    <span className="text-gray-900">{recommendation.nitrogenSupply}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Demand: </span>
                    <span className="text-gray-900">{recommendation.nitrogenDemand}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {recommendations.length === 0 && !error && cropName.length >= 3 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No recommendations found for &quot;{cropName}&quot;</p>
        </div>
      )}
    </div>
  );
}
