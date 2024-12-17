'use client';

import { useState } from 'react';

export default function DatabaseChanges() {
  const [status, setStatus] = useState('');

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to clean the database? This action cannot be undone.')) {
      return;
    }

    try {
      setStatus('Cleaning database...');
      const response = await fetch('/api/database/cleanup', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Cleanup failed');
      }

      setStatus('Database cleaned successfully');
    } catch (error) {
      setStatus('Error cleaning database');
      console.error(error);
    }
  };

  const handleGenerate = async () => {
    if (!confirm('Do you want to generate dummy data?')) {
      return;
    }

    try {
      setStatus('Generating dummy data...');
      const response = await fetch('/api/database/generate', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Generation failed');
      }

      setStatus('Dummy data generated successfully');
    } catch (error) {
      setStatus('Error generating dummy data');
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Database Management</h1>
      <div className="space-x-4">
        <button
          onClick={handleCleanup}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Clean Database
        </button>
        <button
          onClick={handleGenerate}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Generate Dummy Data
        </button>
      </div>
      {status && (
        <p className="mt-4">
          Status: {status}
        </p>
      )}
    </div>
  );
}
