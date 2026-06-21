'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FertilizationService } from '../services/fertilizationService';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Crop {
  id: number;
  cropName: string;
  nitrogenDemand: number;
  nitrogenSupply: number;
  soilResidualNitrogen?: number;
}

interface SoilTest {
  id: number;
  testDate: string;
  fieldLocation: string;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  texture: string;
}

interface RecommendationProps {
  onRecommendationSelect?: (recommendation: {
    fertilizer: string;
    applicationRate: number;
    applicationMethod: string;
  }) => void;
}

interface AiInsight {
  summary: string;
  risks: string[];
  tips: string[];
}

export default function FertilizationRecommendations({ onRecommendationSelect }: RecommendationProps) {
  const t = useTranslations('SoilManagement');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [activeCropId, setActiveCropId] = useState<number | null>(null);
  const [activeSoilTestId, setActiveSoilTestId] = useState<number | null>(null);
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightError, setAiInsightError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchCrops(),
      fetchSoilTests()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchCrops = async () => {
    try {
      const response = await fetch('/api/Controllers/Crop/crops/all');
      if (!response.ok) throw new Error('Failed to fetch crops');
      const data = await response.json();
      setCrops(data.crops || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchSoilTests = async () => {
    try {
      const response = await fetch('/api/Controllers/Soil/soilTests');
      if (!response.ok) throw new Error('Failed to fetch soil tests');
      const data = await response.json();
      setSoilTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const generateRecommendation = () => {
    const crop = crops.find(c => c.id.toString() === selectedCrop);
    const soilTest = soilTests.find(t => t.fieldLocation === selectedField);

    if (!crop || !soilTest) {
      setError('Please select both a crop and a field');
      return;
    }

    const currentSeason = FertilizationService.getSeason(new Date());
    const recommendation = FertilizationService.getFertilizerRecommendation(
      crop,
      soilTest,
      currentSeason
    );

    setRecommendation(recommendation);
    setActiveCropId(crop.id);
    setActiveSoilTestId(soilTest.id);
    setAiInsight(null);
    setAiInsightError(null);

    if (onRecommendationSelect) {
      onRecommendationSelect({
        fertilizer: recommendation.fertilizer,
        applicationRate: recommendation.applicationRate,
        applicationMethod: recommendation.applicationMethod,
      });
    }
  };

  const handleAiInsight = async () => {
    if (!activeCropId || !activeSoilTestId) return;

    setAiInsightLoading(true);
    setAiInsightError(null);
    setAiInsight(null);

    try {
      const response = await fetch('/api/Controllers/Soil/fertilization-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropId: activeCropId, soilTestId: activeSoilTestId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate AI notes');
      }
      setAiInsight(data.insight);
    } catch (err) {
      setAiInsightError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAiInsightLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium">{t('fertilizationRecommendations')}</h3>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('selectCrop')}
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="">{t('chooseCrop')}</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.cropName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('selectField')}
          </label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="">{t('chooseField')}</option>
            {Array.from(new Set(soilTests.map(test => test.fieldLocation))).map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={generateRecommendation}
          disabled={!selectedCrop || !selectedField}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {t('generateRecommendation')}
        </button>
      </div>

      {recommendation && (
        <div className="mt-6 space-y-4 border-t pt-4">
          <h4 className="font-medium">{t('recommendationResults')}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('recommendedFertilizer')}</p>
              <p className="mt-1">{recommendation.fertilizer}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">{t('applicationRate')}</p>
              <p className="mt-1">{recommendation.applicationRate.toFixed(2)} kg/ha</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">{t('applicationMethod')}</p>
              <p className="mt-1">{recommendation.applicationMethod}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">{t('timing')}</p>
              <p className="mt-1">{recommendation.timing}</p>
            </div>
          </div>

          {recommendation.notes && (
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm font-medium text-yellow-800">{t('additionalNotes')}</p>
              <p className="mt-1 text-sm text-yellow-700">{recommendation.notes}</p>
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{t('aiAgronomistNotes')}</h4>
              <button
                onClick={handleAiInsight}
                disabled={aiInsightLoading}
                className="bg-blue-500 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {aiInsightLoading ? t('generating') : t('getAiNotes')}
              </button>
            </div>

            {aiInsightError && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{aiInsightError}</div>
            )}

            {aiInsight && (
              <div className="bg-blue-50 p-4 rounded-md space-y-3 text-sm">
                <p className="text-blue-900">{aiInsight.summary}</p>
                {aiInsight.risks.length > 0 && (
                  <div>
                    <p className="font-medium text-blue-800">{t('risksToWatch')}</p>
                    <ul className="list-disc list-inside text-blue-700">
                      {aiInsight.risks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiInsight.tips.length > 0 && (
                  <div>
                    <p className="font-medium text-blue-800">{t('practicalTips')}</p>
                    <ul className="list-disc list-inside text-blue-700">
                      {aiInsight.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
