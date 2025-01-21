"use client";

import { useState, useEffect } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';
import { RecommendationResponse } from '../types/api';
import CropCard from '../components/CropCard';
import RotatieForm from './RotatieForm';
import RotationChart from './Components/RotationChart';
import RotationDetails from './Components/RotationDetails';
import { getCropsRepeatedBySelection } from './Components/helperFunctions';
import { useGlobalContextRotation } from '../providers/rotationStore';

// Add these interfaces at the top of the file
interface Crop {
  id: number;
  cropName: string;

}

interface RotationPlan {
  year: number;
  division: number;
  crop: Crop;
  divisionSize: number | string;
  nitrogenBalance: number | string;
}

interface RotationData {
  id: number;
  rotationName: string;
  fieldSize: number;
  numberOfDivisions: number;
  rotationPlans: RotationPlan[];
}

interface NitrogenBalanceMap {
  [key: string]: string; // key format: "year-division"
}

export default function RotationPage() {
  const { getAllCrops, crops, isLoading } = useGlobalContextCrop();
  const { getCropRotation, deleteCropRotation, updateDivisionSizeAndRedistribute, updateNitrogenBalanceAndRegenerateRotation } = useGlobalContextRotation();
  const [selectedCrops, setSelectedCrops] = useState<Map<string, number>>(new Map());
  const [showRotationForm, setShowRotationForm] = useState(false);
  const [rotationPlan, setRotationPlan] = useState<RotationData | null>(null);
  const [chartData, setChartData] = useState<Array<any>>([]);
  const [rotationData, setRotationData] = useState<RotationData | null>(null);
  const [existingRotations, setExistingRotations] = useState<RotationData[]>([]);
  const [isLoadingRotations, setIsLoadingRotations] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [divisionSizeValues, setDivisionSizeValues] = useState<string[]>([]);
  const [nitrogenBalanceValues, setNitrogenBalanceValues] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [nitrogenBalanceMap, setNitrogenBalanceMap] = useState<NitrogenBalanceMap>({});

  useEffect(() => {
    getAllCrops();
  }, [getAllCrops]);

  // Modify this effect to properly handle the Promise
  useEffect(() => {
    const fetchRotations = async () => {
      setIsLoadingRotations(true);
      try {
        const rotations = await getCropRotation();
        if (Array.isArray(rotations)) {
          setExistingRotations(rotations);
        } else {
          setLoadError('Invalid rotation data received');
        }
      } catch (error: any) {
        setLoadError(error.message || 'Failed to load rotations');
      } finally {
        setIsLoadingRotations(false);
      }
    };

    fetchRotations();
  }, []);

  // Filter only selected crops
  const selectedCropsData = crops.filter(crop => crop.isSelected);

  const handleSelectionCount = (crop: RecommendationResponse, count: number) => {
    setSelectedCrops(prev => {
      const newMap = new Map(prev);
      const cropId = crop.id?.toString() || crop._id;
      if (count > 0) {
        newMap.set(cropId as string, count);
      } else {
        if (cropId) {
          newMap.delete(cropId);
        }
      }
      return newMap;
    });
  };

  const handleGenerateRotation = async () => {
    // Convert selectedCrops Map to array format expected by getCropsRepeatedBySelection
    const selections = Array.from(selectedCrops.entries()).map(([cropId, count]) => ({
      cropId,
      selectionCount: count
    }));

    // Get repeated crops based on selection
    const repeatedCrops = getCropsRepeatedBySelection(selectedCropsData, selections);
    setShowRotationForm(true);
  };

  const handleRotationGenerated = (plan: RotationData) => {
    console.log('Received rotation plan:', plan); // Debug log

    if (!plan) {
      console.error('No plan data received');
      return;
    }

    setRotationPlan(plan);
    setRotationData(plan);

    if (plan.rotationPlans) {
      console.log('Processing rotation plans:', plan.rotationPlans); // Debug log
      const transformedChartData = plan.rotationPlans.map(rp => ({
        year: rp.year,
        division: rp.division,
        cropName: rp.crop.cropName,
        divisionSize: parseFloat(rp.divisionSize.toString()),
        nitrogenBalance: parseFloat(rp.nitrogenBalance.toString())
      }));
      console.log('Transformed chart data:', transformedChartData); // Debug log
      setChartData(transformedChartData);
    }
  };

  // Add handlers for viewing and deleting rotations
  const handleViewRotation = (rotation: RotationData) => {
    setRotationData(rotation);
    const transformedChartData = rotation.rotationPlans.map(rp => ({
      year: rp.year,
      division: rp.division,
      cropName: rp.crop.cropName,
      divisionSize: parseFloat(rp.divisionSize.toString()),
      nitrogenBalance: parseFloat(rp.nitrogenBalance.toString())
    }));
    setChartData(transformedChartData);
    
    // Initialize division size and nitrogen balance values
    setDivisionSizeValues(rotation.rotationPlans.map(rp => rp.divisionSize.toString()));
    
    // Initialize nitrogen balance map
    const initialNitrogenMap: NitrogenBalanceMap = {};
    rotation.rotationPlans.forEach(rp => {
      initialNitrogenMap[`${rp.year}-${rp.division}`] = rp.nitrogenBalance.toString();
    });
    setNitrogenBalanceMap(initialNitrogenMap);
    
    setShowRotationForm(false);
  };

  const handleDeleteRotation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rotation?')) return;
    try {
      await deleteCropRotation(id.toString());
      setExistingRotations(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting rotation:', error);
      alert('Failed to delete rotation');
    }
  };

  // Add debug log for render
  console.log('Current state:', {
    rotationData,
    chartData,
    showRotationForm
  });

  // Add these handlers
  const handleDivisionSizeChange = (index: number, value: string) => {
    const newValues = [...divisionSizeValues];
    newValues[index] = value;
    setDivisionSizeValues(newValues);
  };

  const handleNitrogenBalanceChange = (year: number, division: number, value: string) => {
    setNitrogenBalanceMap(prev => ({
      ...prev,
      [`${year}-${division}`]: value
    }));
  };

  const handleDivisionSizeSubmit = async (value: number, division: string) => {
    if (!rotationData) return;
    setIsUpdating(true);
    try {
      await updateDivisionSizeAndRedistribute({
        rotationName: rotationData.rotationName,
        division: parseInt(division),
        newDivisionSize: value
      });
      // Refresh rotation data through getCropRotation
      await getCropRotation();
    } catch (error) {
      console.error('Error updating division size:', error);
      alert('Failed to update division size');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNitrogenBalanceSubmit = async (value: number, year: number, division: string) => {
    if (!rotationData) return;
    setIsUpdating(true);
    try {
      await updateNitrogenBalanceAndRegenerateRotation({
        rotationName: rotationData.rotationName,
        year: year,
        division: parseInt(division),
        nitrogenBalance: value
      });
      // Refresh rotation data through getCropRotation
      await getCropRotation();
    } catch (error) {
      console.error('Error updating nitrogen balance:', error);
      alert('Failed to update nitrogen balance and recalculate rotation');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Rotation Planning</h1>
        <p className="mt-2 text-gray-600">Select quantities for your rotation plan</p>
      </div>

      {/* Add existing rotations display */}
      {isLoadingRotations ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading rotations...</p>
        </div>
      ) : loadError ? (
        <div className="text-red-600 p-4 bg-red-50 rounded">
          {loadError}
        </div>
      ) : existingRotations.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Existing Rotations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingRotations.map((rotation) => (
              <div
                key={rotation.id}
                className="p-4 border rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium">{rotation.rotationName}</h3>
                <p className="text-sm text-gray-600">
                  Field Size: {rotation.fieldSize} ha
                </p>
                <p className="text-sm text-gray-600">
                  Divisions: {rotation.numberOfDivisions}
                </p>
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => handleViewRotation(rotation)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteRotation(rotation.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-600 mb-8">No existing rotations found.</p>
      )}

      {/* Show rotation data if available, otherwise show crop selection */}
      {rotationData ? (
        <div className="space-y-8">
          <RotationChart chartData={chartData} />
          <RotationDetails
            rotation={rotationData}
            planIndex={0}
            divisionSizeValues={divisionSizeValues}
            nitrogenBalanceMap={nitrogenBalanceMap}
            onDivisionSizeChange={handleDivisionSizeChange}
            onNitrogenBalanceChange={handleNitrogenBalanceChange}
            onDivisionSizeSubmit={handleDivisionSizeSubmit}
            onNitrogenBalanceSubmit={handleNitrogenBalanceSubmit}
            onDelete={() => {
              if (rotationData) {
                handleDeleteRotation(rotationData.id);
              }
            }}
            isUpdating={isUpdating}
          />
          <button
            onClick={() => {
              setRotationData(null);
              setShowRotationForm(false);
            }}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Back to Crop Selection
          </button>
        </div>
      ) : (
        // Show crop selection interface only if no rotation is being viewed
        isLoading.value ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading selected crops...</p>
          </div>
        ) : (
          <>
            {!showRotationForm ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCropsData.map(crop => (
                    <div key={crop.id?.toString() || crop._id} className="relative">
                      <CropCard
                        crop={crop}
                        isSelected={true}
                        readOnly={true}
                      />
                      <br />
                      <div className="absolute bottom-4 left-4 right-4 bg-white p-2  rounded-lg shadow border">

                        <div className="flex items-center justify-between ">
                       
                          <label className="text-sm font-medium text-gray-700 ">Times in Rotation:</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={selectedCrops.get((crop.id?.toString() || crop._id) as string) || 0}
                            onChange={(e) => handleSelectionCount(crop, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 border rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCropsData.length > 0 && (
                  <div className="fixed bottom-6 right-6">
                    <button
                      onClick={handleGenerateRotation}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      Generate Rotation Plan
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-8">
                <RotatieForm
                  filteredCrops={getCropsRepeatedBySelection(
                    selectedCropsData,
                    Array.from(selectedCrops.entries()).map(([cropId, count]) => ({
                      cropId,
                      selectionCount: count
                    }))
                  )}
                  onRotationGenerated={handleRotationGenerated}
                />

                {/* Add debug display */}
                <div className="text-sm text-gray-500">
                  {rotationData ? 'Rotation data available' : 'No rotation data'}
                </div>

                {rotationData && (
                  <>
                    <RotationChart 
                      chartData={chartData} 
                    />
                    <RotationDetails
                      rotation={rotationData}
                      planIndex={0}
                      divisionSizeValues={(rotationData as RotationData).rotationPlans?.map(rp => rp.divisionSize.toString()) || []}
                      nitrogenBalanceMap={nitrogenBalanceMap}
                      onDivisionSizeChange={handleDivisionSizeChange}
                      onNitrogenBalanceChange={handleNitrogenBalanceChange}
                      onDivisionSizeSubmit={handleDivisionSizeSubmit}
                      onNitrogenBalanceSubmit={handleNitrogenBalanceSubmit}
                      onDelete={() => handleDeleteRotation((rotationData as RotationData).id)}
                      isUpdating={isUpdating}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}