"use client";

import { useState, useEffect } from 'react';
import CropForm from '../Crud/CropForm';
import Pagination from './Pagination';
import { useGlobalContextCrop } from '../providers/culturaStore';
import { useUserContext } from '../providers/UserStore';
import ActionCard from './ActionCard';
import CropCard from './CropCard';
import CropDetails from './CropDetails';
import FarmAnalytics from './FarmAnalytics';
import PremiumBadge from './premium/PremiumBadge';
import { RecommendationResponse } from '../types/api';

export default function FarmerDashboard() {
  const { crops, isLoading, getAllCrops, selectare } = useGlobalContextCrop();
  const { isPremium } = useUserContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const itemsPerPage = 4;

  useEffect(() => {
    getAllCrops();
  }, [getAllCrops]); // Add proper dependency

  useEffect(() => {
    if (crops && crops.length > 0) {
      console.log('Current crops:', crops); // Debug log for crops data
    }
  }, [crops]);

  // Filter out any undefined or null values
  const validCrops = crops?.filter(crop => crop && crop.cropName) || [];
  const totalPages = Math.ceil(validCrops.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCrops = validCrops.slice(indexOfFirstItem, indexOfLastItem);

  const handleCropSelect = async (crop: RecommendationResponse) => {
    const cropId = crop.id?.toString() || crop._id || '';
    if (!cropId) return;
    
    try {
      await selectare(cropId, !crop.isSelected);
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

      {/* Farm Analytics Section */}
      <FarmAnalytics />

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ActionCard
          title="Crop Rotation Planner"
          description="Plan and optimize your crop rotations"
          link="/Rotatie"
          badge={!isPremium && <PremiumBadge />}
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
          title="AI Crop Encyclopedia"
          description="Look up any crop's growing requirements with AI"
          link="/CropWiki"
          badge={!isPremium && <PremiumBadge />}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />

        <ActionCard
          title="Fertilization Recommendations"
          description="Get personalized fertilization plans and AI agronomist notes"
          link="/SoilManagement"
          badge={!isPremium && <PremiumBadge />}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />

        <ActionCard
          title="Pest & Disease Diagnosis"
          description="Describe symptoms and get AI-assisted diagnosis suggestions"
          link="/PestDiagnosis"
          badge={!isPremium && <PremiumBadge />}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        <ActionCard
          title="Log a Harvest"
          description="Record yield and track harvest history"
          link="/Harvest"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />

        <ActionCard
          title="Track Finances"
          description="Log costs and revenue, see profit and loss"
          link="/Finance"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              {currentCrops.map((crop: RecommendationResponse) => (
                <CropCard
                  key={crop.id?.toString() || crop._id}
                  crop={crop}
                  onSelect={handleCropSelect}
                  isSelected={Boolean(crop.isSelected)}
                />
              ))}
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
