'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import SoilTests from './SoilTests';
import FertilizationPlans from './FertilizationPlans';
import SoilTestCharts from './SoilTestCharts';
import FertilizationRecommendations from './FertilizationRecommendations';

export default function SoilManagementDashboard() {
  const [activeTab, setActiveTab] = useState<'tests' | 'plans' | 'charts' | 'recommendations'>('tests');
  const t = useTranslations('SoilManagement');

  const handleRecommendationSelect = (recommendation: {
    fertilizer: string;
    applicationRate: number;
    applicationMethod: string;
  }) => {
    // Switch to plans tab and pass recommendation data
    setActiveTab('plans');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tests')}
            className={`${
              activeTab === 'tests'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t('soilTests')}
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`${
              activeTab === 'charts'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t('analytics')}
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`${
              activeTab === 'recommendations'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t('recommendations')}
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`${
              activeTab === 'plans'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t('fertilizationPlans')}
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'tests' && <SoilTests />}
        {activeTab === 'charts' && <SoilTestCharts />}
        {activeTab === 'recommendations' && (
          <FertilizationRecommendations onRecommendationSelect={handleRecommendationSelect} />
        )}
        {activeTab === 'plans' && <FertilizationPlans />}
      </div>
    </div>
  );
}
