'use client';

import { Card } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { Crop } from '../../../types/api';

export function PageContent() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await fetch('/api/Controllers/Crop/crops/user/selectedCrops');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch crops');
        setCrops(data.crops || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch crops');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCrops();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!crops.length) return <div>No crops in rotation</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {crops.map((crop, index) => (
        <Card key={crop.id} className="h-100 shadow-sm">
          <Card.Body>
            <Card.Title>{crop.cropName}</Card.Title>
            {crop.plantingDate && (
              <Card.Text>Planting Date: {new Date(crop.plantingDate).toLocaleDateString()}</Card.Text>
            )}
            {crop.harvestingDate && (
              <Card.Text>Harvest Date: {new Date(crop.harvestingDate).toLocaleDateString()}</Card.Text>
            )}
            <Card.Text>Nitrogen Balance: {Number(crop.nitrogenDemand) - Number(crop.nitrogenSupply)}</Card.Text>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
