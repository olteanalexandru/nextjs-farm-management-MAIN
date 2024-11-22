"use client";

import { useState, useEffect } from 'react';
import CropForm from '../Crud/CropForm';
import RotatieItem from '../Crud/RotatieItem';
import Pagination from './Pagination';
import { useGlobalContextCrop } from '../providers/culturaStore';

export default function FarmerDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Farmer Overview
        </h2>
        {/* Add farmer specific content */}
      </div>
    </div>
  );
}
