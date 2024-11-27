"use client";

import { useState, useMemo } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';
import RecommendationForm from './RecommendationForm';
import Pagination from '../components/Pagination';
import SearchAndFilter from './SearchAndFilter';

interface Recommendation {
  _id?: string;
  id: number;
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  onDelete?: (id: number) => Promise<void>;
  onEdit?: (recommendation: Recommendation) => void;
}

export default function RecommendationList({
  recommendations,
  onDelete,
  onEdit
}: RecommendationListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { deleteCrop, updateCrop } = useGlobalContextCrop();
  const itemsPerPage = 3;
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('');

  const filterOptions = [
    { value: 'high_nitrogen', label: 'High Nitrogen Demand' },
    { value: 'low_nitrogen', label: 'Low Nitrogen Demand' },
    { value: 'has_pests', label: 'Has Pests' },
    { value: 'has_diseases', label: 'Has Diseases' }
  ];

  const filteredRecommendations = useMemo(() => {
    return recommendations
      .filter(rec => {
        // Search filter
        const matchesSearch = rec.cropName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        // Category filter
        if (!filter) return matchesSearch;

        switch (filter) {
          case 'high_nitrogen':
            return matchesSearch && rec.nitrogenDemand > 50;
          case 'low_nitrogen':
            return matchesSearch && rec.nitrogenDemand <= 50;
          case 'has_pests':
            return matchesSearch && rec.pests.length > 0;
          case 'has_diseases':
            return matchesSearch && rec.diseases.length > 0;
          default:
            return matchesSearch;
        }
      });
  }, [recommendations, searchQuery, filter]);

  const handleDelete = async (recommendation: Recommendation) => {
    const cropId = recommendation._id || recommendation.id?.toString();
    if (!cropId) {
      console.error('No valid ID found for deletion');
      return;
    }

    if (confirm('Are you sure you want to delete this recommendation?')) {
      await deleteCrop(cropId);
      if (onDelete) {
        await onDelete(recommendation.id);  // Call the onDelete callback if provided
      } else {
        window.location.reload();
      }
    }
  };

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecommendations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecommendations.length / itemsPerPage);

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
      <SearchAndFilter
        onSearch={setSearchQuery}
        onFilter={setFilter}
        filterOptions={filterOptions}
        placeholder="Search recommendations..."
      />
      
      <div className="grid gap-4">
        {currentItems.map(recommendation => (
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
                      onClick={() => handleDelete(recommendation)}
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
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
