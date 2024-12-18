'use client';

import { Suspense } from 'react';
import SoilManagementDashboard from './components/SoilManagementDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslations } from 'next-intl';

export default function SoilManagementPage() {
  const t = useTranslations('SoilManagement');

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-800">{t('title')}</h1>
      </div>
      <div className="p-6">
        <Suspense fallback={<LoadingSpinner />}>
          <SoilManagementDashboard />
        </Suspense>
      </div>
    </div>
  );
}
