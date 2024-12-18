'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import SoilTests from './SoilTests';
import FertilizationPlans from './FertilizationPlans';

export default function SoilManagementDashboard() {
  const [activeTab, setActiveTab] = useState<'tests' | 'plans'>('tests');
  const t = useTranslations('SoilManagement');

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
        {activeTab === 'tests' ? <SoilTests /> : <FertilizationPlans />}
      </div>
    </div>
  );
}
