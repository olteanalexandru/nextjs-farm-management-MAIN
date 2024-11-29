"use client";
import React, { useState, useEffect } from 'react';
import { useGlobalContextCrop } from '../../providers/culturaStore';
import styles from '../Rotatie.module.css';

interface Crop {
  id: number;
  _id?: string;
  cropName: string;
  cropType: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
}

interface RotationSlot {
  year: number;
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  crop?: Crop;
}

const RotationPlanner = () => {
  const { crops, getAllCrops } = useGlobalContextCrop();
  const [rotationPlan, setRotationPlan] = useState<RotationSlot[]>([]);
  const [years, setYears] = useState(3);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    getAllCrops();
  }, [getAllCrops]);

  // Initialize rotation plan
  useEffect(() => {
    const seasons: ('Spring' | 'Summer' | 'Fall' | 'Winter')[] = ['Spring', 'Summer', 'Fall', 'Winter'];
    const newPlan: RotationSlot[] = [];
    
    for (let year = 1; year <= years; year++) {
      seasons.forEach(season => {
        newPlan.push({ year, season });
      });
    }
    
    setRotationPlan(newPlan);
  }, [years]);

  // Check if a crop can be planted in a specific slot
  const canPlantCrop = (crop: Crop, slotIndex: number): boolean => {
    // Check previous plantings of the same crop
    const lastPlanting = rotationPlan
      .slice(0, slotIndex)
      .findIndex(slot => slot.crop?.id === crop.id);

    if (lastPlanting !== -1) {
      const seasonsGap = slotIndex - lastPlanting;
      const yearsGap = seasonsGap / 4;
      // Use a default minimum gap of 2 years if not specified
      if (yearsGap < 2) {
        return false;
      }
    }

    // Check nitrogen balance
    const previousSlot = slotIndex > 0 ? rotationPlan[slotIndex - 1] : null;
    if (previousSlot?.crop) {
      const nitrogenBalance = previousSlot.crop.nitrogenSupply - crop.nitrogenDemand;
      if (nitrogenBalance < -50) { // Threshold for nitrogen deficiency
        return false;
      }
    }

    // Check disease and pest compatibility
    const previousCrops = rotationPlan
      .slice(Math.max(0, slotIndex - 4), slotIndex)
      .filter(slot => slot.crop)
      .map(slot => slot.crop!);

    const hasCommonPests = previousCrops.some(prevCrop =>
      prevCrop.pests.some(pest => crop.pests.includes(pest))
    );

    const hasCommonDiseases = previousCrops.some(prevCrop =>
      prevCrop.diseases.some(disease => crop.diseases.includes(disease))
    );

    if (hasCommonPests || hasCommonDiseases) {
      return false;
    }

    return true;
  };

  // Handle crop selection for a slot
  const handleCropSelection = (crop: Crop) => {
    if (selectedSlot === null) return;

    if (!canPlantCrop(crop, selectedSlot)) {
      setError('This crop is not suitable for this slot due to rotation restrictions');
      return;
    }

    setRotationPlan(prev => {
      const newPlan = [...prev];
      newPlan[selectedSlot] = { ...newPlan[selectedSlot], crop };
      return newPlan;
    });
    setError('');
    setSelectedSlot(null);
  };

  // Get recommended crops for a slot
  const getRecommendedCrops = (slotIndex: number): Crop[] => {
    return crops.filter(crop => canPlantCrop(crop, slotIndex));
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Number of Years:</label>
        <input
          type="number"
          min="1"
          max="10"
          value={years}
          onChange={(e) => setYears(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {rotationPlan.map((slot, index) => (
          <div
            key={`${slot.year}-${slot.season}`}
            onClick={() => setSelectedSlot(index)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedSlot === index
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-700">
              Year {slot.year} - {slot.season}
            </div>
            {slot.crop ? (
              <div className="mt-2 text-sm text-gray-600">
                {slot.crop.cropName}
                <br />
                <span className="text-xs">
                  N Supply: {slot.crop.nitrogenSupply}
                  <br />
                  N Demand: {slot.crop.nitrogenDemand}
                </span>
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-400">Empty</div>
            )}
          </div>
        ))}
      </div>

      {selectedSlot !== null && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Recommended Crops for Selected Slot
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {getRecommendedCrops(selectedSlot).map(crop => (
              <button
                key={crop.id}
                onClick={() => handleCropSelection(crop)}
                className="p-3 text-left border rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">{crop.cropName}</div>
                <div className="text-sm text-gray-500">
                  Type: {crop.cropType}
                  <br />
                  N Supply: {crop.nitrogenSupply}
                  <br />
                  N Demand: {crop.nitrogenDemand}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RotationPlanner;
