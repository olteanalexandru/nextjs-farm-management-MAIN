"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

interface Crop {
  _id?: string;
  id?: number;
  cropName: string;
  cropType: string;
  cropVariety?: string;
  imageUrl?: string;
  plantingDate?: string;
  harvestingDate?: string;
  soilType?: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests?: string[];
  diseases?: string[];
  isOwnCrop?: boolean;
}

interface CropCardProps {
  crop: Crop;
  isSelected: boolean;
  readOnly?: boolean;
  onSelect?: (crop: Crop) => void;
}

const CropCard = ({ crop, isSelected, readOnly = false, onSelect }: CropCardProps) => {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cropId = crop.id?.toString() || crop._id;
    if (cropId) {
      router.push(`/Crop/${cropId}`);
    }
  };

  const nitrogenPercentage = Math.round((crop.nitrogenSupply / (crop.nitrogenDemand || 1)) * 100);
  const getNitrogenStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`
      relative bg-white rounded-xl shadow-md transform transition-all duration-300 ease-in-out
      hover:shadow-lg hover:-translate-y-1
      ${isSelected ? 'border-2 border-blue-500 ring-4 ring-blue-100' : 'border border-gray-200'}
    `}>
      {crop.isOwnCrop && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800
            shadow-sm backdrop-blur-sm">
            Your Crop
          </span>
        </div>
      )}
      
      {crop.imageUrl && (
        <div className="relative aspect-w-16 aspect-h-9 rounded-t-xl overflow-hidden bg-gray-100">
          <div className={`transition-opacity duration-300 ${imageLoading ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"/>
            </div>
          </div>
          <Image
            src={crop.imageUrl}
            alt={crop.cropName}
            fill
            className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoadingComplete={() => setImageLoading(false)}
          />
        </div>
      )}
      
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{crop.cropName}</h3>
            <p className="text-sm font-medium text-gray-600">
              {crop.cropType} {crop.cropVariety && <span>• {crop.cropVariety}</span>}
            </p>
          </div>
          {isSelected && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Selected
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {crop.plantingDate && (
            <div className="space-y-1">
              <span className="text-gray-500 font-medium">Planting Date</span>
              <p className="text-gray-900">{new Date(crop.plantingDate).toLocaleDateString()}</p>
            </div>
          )}
          {crop.harvestingDate && (
            <div className="space-y-1">
              <span className="text-gray-500 font-medium">Harvesting Date</span>
              <p className="text-gray-900">{new Date(crop.harvestingDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div 
              className={`${getNitrogenStatusColor(nitrogenPercentage)} h-3 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(nitrogenPercentage, 100)}%` }}
              />
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {nitrogenPercentage}%
            </span>
          </div>
          <p className="text-xs font-medium text-gray-500">Nitrogen Balance</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onSelect && onSelect(crop)}
            className={`
              flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
              ${isSelected 
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'}
            `}
          >
            {isSelected ? 'Selected' : 'Select Crop'}
          </button>
          <button
            onClick={handleDetailsClick}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 
              rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropCard;
