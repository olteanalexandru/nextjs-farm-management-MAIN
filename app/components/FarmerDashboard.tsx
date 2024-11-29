"use client";

import { useState, useEffect } from 'react';
import CropForm from '../Crud/CropForm';
import Pagination from './Pagination';
import { useGlobalContextCrop } from '../providers/culturaStore';
import ActionCard from './ActionCard';
import CropCard from './CropCard';
import CropDetails from './CropDetails';
import { RecommendationResponse } from '../types/api';

export default function FarmerDashboard() {
  const { crops, isLoading, getAllCrops, SinglePage, selectare } = useGlobalContextCrop();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState<Set<string>>(new Set());
  const itemsPerPage = 4;

  useEffect(() => {
    getAllCrops();
  }, []);

  const totalPages = crops ? Math.ceil(crops.length / itemsPerPage) : 0;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCrops = crops ? crops.slice(indexOfFirstItem, indexOfLastItem) : [];

  const handleCropSelect = async (crop: RecommendationResponse) => {
    const cropId = crop.id?.toString() || crop._id || '';
    if (!cropId) {
      console.error('Invalid crop ID');
      return;
    }
    
    const isCurrentlySelected = selectedCrops.has(cropId);
    
    try {
      await selectare(cropId, !isCurrentlySelected, 1);
      
      setSelectedCrops(prev => {
        const newSelected = new Set(prev);
        if (isCurrentlySelected) {
          newSelected.delete(cropId);
        } else {
          newSelected.add(cropId);
        }
        return newSelected;
      });
    } catch (error) {
      console.error('Error selecting crop:', error);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Dashboard Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your crops and plan rotations</p>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Crop Rotation Planner"
          description="Plan and optimize your crop rotations"
          link="/Rotatie"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
        
        <ActionCard
          title="Add New Crop"
          description="Add a new crop to your inventory"
          action={() => setShowAddCrop(true)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        />

        <ActionCard
          title="View Recommendations"
          description="Get personalized crop recommendations"
          link="/Recomandari"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />
      </div>

      {/* Current Crops Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Your Current Crops
        </h2>
        {isLoading.value ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading crops...</p>
          </div>
        ) : crops && crops.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCrops.map((crop: RecommendationResponse) => {
                const cropId = crop.id?.toString() || crop._id || '';
                return (
                  <CropCard
                    key={cropId}
                    crop={crop}
                    onSelect={handleCropSelect}
                    isSelected={selectedCrops.has(cropId)}
                  />
                );
              })}
            </div>
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="mt-2 text-gray-500">No crops found. Start by adding some crops to your rotation plan.</p>
          </div>
        )}
      </div>

      {/* Add New Crop Modal */}
      {showAddCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Crop</h2>
              <button
                onClick={() => setShowAddCrop(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CropForm onSuccess={() => {
              setShowAddCrop(false);
              getAllCrops();
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
