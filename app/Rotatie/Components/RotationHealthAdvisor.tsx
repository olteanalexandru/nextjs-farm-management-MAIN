'use client';

import { useState } from 'react';

interface RotationInsight {
  summary: string;
  risks: string[];
  tips: string[];
}

interface RotationHealthAdvisorProps {
  rotationId: number;
}

export default function RotationHealthAdvisor({ rotationId }: RotationHealthAdvisorProps) {
  const [insight, setInsight] = useState<RotationInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetInsight = async () => {
    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      const response = await fetch('/api/Controllers/Rotation/rotation-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotationId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate AI insight');
      }
      setInsight(data.insight);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border-t pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">AI Rotation Health Advisor</h4>
        <button
          onClick={handleGetInsight}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze Rotation Health'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>
      )}

      {insight && (
        <div className="bg-blue-50 p-4 rounded-md space-y-3 text-sm">
          <p className="text-blue-900">{insight.summary}</p>
          {insight.risks.length > 0 && (
            <div>
              <p className="font-medium text-blue-800">Risks to Watch</p>
              <ul className="list-disc list-inside text-blue-700">
                {insight.risks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
          {insight.tips.length > 0 && (
            <div>
              <p className="font-medium text-blue-800">Practical Tips</p>
              <ul className="list-disc list-inside text-blue-700">
                {insight.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
