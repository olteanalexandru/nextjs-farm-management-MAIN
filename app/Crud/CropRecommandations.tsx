

"use client"
import React, { useEffect, useState } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';

export default function CropRecommendations({ cropName, token }: { cropName: string, token: string }) {
  const { getCropRecommendations } = useGlobalContextCrop();
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    getCropRecommendations(cropName).then((recommendations) => {
      if (recommendations !== undefined) {
        setRecommendations(recommendations);
      }
    });
  }, [cropName, getCropRecommendations, token]);


  return (
    <div className="container">
      <div className="row">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="col-sm-6 col-md-4 col-lg-3">
            <div
              className="card border-primary mb-3"
              style={{ maxWidth: '18rem' }}
            >
              <div className="card-header">{recommendation.cropName}</div>
              <div className="card-body">
                <p className="card-text small">
                  <strong>Diseases:</strong>{' '}
                  {recommendation.diseases.join(', ')}
                </p>
                <p className="card-text small">
                  <strong>Pests:</strong> {recommendation.pests.join(', ')}
                </p>
                <p className="card-text small">
                  <strong>Nitrogen Supply:</strong>{' '}
                  {recommendation.nitrogenSupply}
                </p>
                <p className="card-text small">
                  <strong>Nitrogen Demand:</strong>{' '}
                  {recommendation.nitrogenDemand}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}