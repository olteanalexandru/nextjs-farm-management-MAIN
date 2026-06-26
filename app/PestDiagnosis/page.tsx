'use client';

import { useState } from 'react';
import { useUserContext } from '../providers/UserStore';
import PremiumBadge from '../components/premium/PremiumBadge';
import UpgradePrompt from '../components/premium/UpgradePrompt';
import UsageMeter from '../components/premium/UsageMeter';

interface DiagnosisCandidate {
  name: string;
  type: 'PEST' | 'DISEASE';
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  recommendedAction: string;
}

interface DiagnosisResult {
  isAgricultural: boolean;
  candidates: DiagnosisCandidate[];
}

const LIKELIHOOD_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-700'
};

export default function PestDiagnosisPage() {
  const { isPremium, billing, refreshBilling } = useUserContext();
  const [cropName, setCropName] = useState('');
  const [symptomDescription, setSymptomDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRecommended, setUpgradeRecommended] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const usage = billing?.usage.find((u) => u.feature === 'PEST_DIAGNOSIS');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUpgradeRecommended(false);
    setResult(null);

    try {
      const response = await fetch('/api/Controllers/Diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropName, symptomDescription }),
      });
      const data = await response.json();
      if (!response.ok) {
        setUpgradeRecommended(Boolean(data?.upgradeRecommended));
        throw new Error(data?.error || 'Failed to generate diagnosis');
      }
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      refreshBilling();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="border-b pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Pest & Disease Diagnosis</h1>
          {!isPremium && <PremiumBadge />}
        </div>
        <p className="mt-2 text-gray-600">Describe what you&apos;re seeing on your crop and get AI-assisted suggestions.</p>
        {usage && (
          <div className="mt-3 max-w-xs">
            <UsageMeter label="Daily AI uses" used={usage.used} limit={usage.limit} />
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-4 rounded-md">
        This tool gives general, AI-generated suggestions for guidance only. It is not a confirmed diagnosis.
        Always verify with a local agronomist or agricultural extension service before taking action.
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crop name (optional)
          </label>
          <input
            type="text"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            placeholder="e.g. Tomato"
            maxLength={60}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe the symptoms
          </label>
          <textarea
            value={symptomDescription}
            onChange={(e) => setSymptomDescription(e.target.value)}
            placeholder="e.g. Yellowing leaves with brown spots, starting from the bottom of the plant..."
            rows={5}
            minLength={10}
            maxLength={800}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {error && !upgradeRecommended && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>
        )}
        {error && upgradeRecommended && <UpgradePrompt message={error} />}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || symptomDescription.trim().length < 10}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Diagnosing...' : 'Get Diagnosis'}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          {!result.isAgricultural ? (
            <p className="text-gray-600">
              This doesn&apos;t look like a plant health problem we can help diagnose. Try describing the symptoms
              you&apos;re seeing on the crop in more detail.
            </p>
          ) : result.candidates.length === 0 ? (
            <p className="text-gray-600">No likely candidates could be identified from this description.</p>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Possible Causes</h3>
              {result.candidates.map((candidate, i) => (
                <div key={i} className="border rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-medium">{candidate.name}</h4>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {candidate.type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${LIKELIHOOD_STYLES[candidate.likelihood]}`}>
                        {candidate.likelihood} likelihood
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{candidate.description}</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Recommended action: </span>
                    {candidate.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
