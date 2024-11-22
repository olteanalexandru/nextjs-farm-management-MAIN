"use client";

import { useState, useEffect } from 'react';
import CropForm from '../Crud/CropForm';
import RotatieItem from '../Crud/RotatieItem';
import Pagination from './Pagination';
import { useGlobalContextCrop } from '../providers/culturaStore';

export default function FarmerDashboard() {
  const { crops } = useGlobalContextCrop();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredCrops = crops.value.filter(crop =>
    crop.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.cropVariety?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.soilType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCrops = filteredCrops.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <section className="heading">
            <p>Add crops:</p>
          </section>
          <CropForm />
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <section className="content">
            {Array.isArray(crops.value) && crops.value.length > 0 ? (
              <div className="crops">
                <RotatieItem crops={paginatedCrops} />
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredCrops.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : (
              <h3>No crops were added</h3>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
