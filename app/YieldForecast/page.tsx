'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface CropForecast {
  cropId: number;
  cropName: string;
  historicalSamples: number;
  baselineYield: number | null;
  forecastYield: number | null;
  unit: string;
  phFactor: number;
  nFactor: number;
  notes: string;
}

interface SoilSummary {
  pH: number;
  nitrogen: number;
  testDate: string;
}

interface ForecastData {
  forecasts: CropForecast[];
  currentYear: number;
  soilSummary: SoilSummary | null;
}

const FACTOR_COLOR = (f: number) =>
  f >= 0.95 ? 'text-green-600' : f >= 0.8 ? 'text-yellow-600' : 'text-red-600';

export default function YieldForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/Controllers/Forecast');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load forecast');
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!data) return null;

  const { forecasts, currentYear, soilSummary } = data;

  const chartData = forecasts
    .filter((f) => f.baselineYield != null && f.forecastYield != null)
    .map((f) => ({
      name: f.cropName,
      Baseline: f.baselineYield,
      Forecast: f.forecastYield,
    }));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Yield Forecast — {currentYear}</h1>
        <p className="mt-2 text-gray-600">
          Projected yields for currently planted crops, adjusted for soil pH and nitrogen levels.
        </p>
      </div>

      {soilSummary ? (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-sky-900 space-y-1">
          <p className="font-medium">Soil conditions used for adjustment (latest test: {soilSummary.testDate})</p>
          <p>pH: <strong>{soilSummary.pH}</strong> · Nitrogen: <strong>{soilSummary.nitrogen} mg/kg</strong></p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          No soil test found. Yield adjustments assume optimal soil conditions.
          <a href="/SoilManagement" className="ml-2 underline">Add a soil test →</a>
        </div>
      )}

      {forecasts.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          <p className="text-lg font-medium">No crops planted this year</p>
          <p className="mt-1 text-sm">Add rotation plans for {currentYear} to see yield forecasts.</p>
          <a href="/Rotatie" className="mt-3 inline-block text-green-600 underline text-sm">Go to Crop Rotation →</a>
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-medium text-gray-900 mb-4">Baseline vs Forecast Yield</h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Baseline" fill="#94a3b8" />
                    <Bar dataKey="Forecast" fill="#16a34a">
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={(entry.Forecast ?? 0) >= (entry.Baseline ?? 0) ? '#16a34a' : '#dc2626'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Historical Avg</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Forecast</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">pH Factor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">N Factor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Samples</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {forecasts.map((f) => {
                  const delta =
                    f.forecastYield != null && f.baselineYield != null && f.baselineYield > 0
                      ? ((f.forecastYield - f.baselineYield) / f.baselineYield) * 100
                      : null;

                  return (
                    <tr key={f.cropId}>
                      <td className="px-4 py-2 font-medium text-gray-900">{f.cropName}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {f.baselineYield != null ? `${f.baselineYield} ${f.unit}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {f.forecastYield != null ? (
                          <span>
                            <span className="font-medium">{f.forecastYield} {f.unit}</span>
                            {delta != null && (
                              <span className={`ml-2 text-xs ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({delta >= 0 ? '+' : ''}{delta.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">Insufficient data</span>
                        )}
                      </td>
                      <td className={`px-4 py-2 text-sm font-medium ${FACTOR_COLOR(f.phFactor)}`}>
                        {(f.phFactor * 100).toFixed(0)}%
                      </td>
                      <td className={`px-4 py-2 text-sm font-medium ${FACTOR_COLOR(f.nFactor)}`}>
                        {(f.nFactor * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{f.historicalSamples}</td>
                      <td className="px-4 py-2 text-xs text-gray-500 max-w-xs">{f.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1">
            <p><strong>How forecasts are calculated:</strong></p>
            <p>Historical average yield for the crop (last 5 years) × pH adjustment factor × nitrogen adjustment factor.</p>
            <p>pH factor: 1.0 at pH {6.5}, −8% per 0.5 pH unit deviation (min 60%).</p>
            <p>N factor: 1.0 at ≥{50} mg/kg nitrogen, proportional below (min 50%).</p>
          </div>
        </>
      )}
    </div>
  );
}
