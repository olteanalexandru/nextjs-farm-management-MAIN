'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface NitrogenTrendPoint {
  year: number;
  avgNitrogenBalance: number;
}

interface CropProfit {
  cropName: string;
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  harvestCount: number;
  totalYield: number;
}

interface FarmAnalyticsData {
  cropCount: number;
  rotationCount: number;
  soilTestCount: number;
  avgPH: number | null;
  fertilizationPlanCount: number;
  fertilizationCompletionRate: number | null;
  harvestCount: number;
  totalYield: number;
  distinctHarvestedCrops: number;
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  nitrogenBalanceTrend: NitrogenTrendPoint[];
  profitByCrop: CropProfit[];
  soilHealthTrend: { month: string; avgPH: number }[];
  yieldTrend: { month: string; totalYield: number }[];
}

function StatCard({ label, value, link }: { label: string; value: string; link?: string }) {
  const content = (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
  return link ? <Link href={link}>{content}</Link> : content;
}

export default function FarmAnalytics() {
  const [data, setData] = useState<FarmAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/Controllers/Analytics');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load analytics');
        setData(json.analytics);
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
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
        {error || 'No analytics available'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Crops" value={data.cropCount.toString()} />
        <StatCard label="Rotations" value={data.rotationCount.toString()} link="/Rotatie" />
        <StatCard
          label="Fertilization Completion"
          value={data.fertilizationCompletionRate !== null ? `${data.fertilizationCompletionRate}%` : 'N/A'}
          link="/SoilManagement"
        />
        <StatCard label="Avg Soil pH" value={data.avgPH !== null ? data.avgPH.toString() : 'N/A'} link="/SoilManagement" />
        <StatCard label="Harvests Logged" value={data.harvestCount.toString()} link="/Harvest" />
        <StatCard label="Total Yield" value={data.totalYield.toString()} link="/Harvest" />
        <StatCard label="Net Profit" value={`€${data.netProfit.toFixed(2)}`} link="/Finance" />
        <StatCard label="Total Revenue" value={`€${data.totalRevenue.toFixed(2)}`} link="/Finance" />
      </div>

      {data.nitrogenBalanceTrend.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-medium text-gray-900 mb-4">Nitrogen Balance Trend (Rotations)</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={data.nitrogenBalanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avgNitrogenBalance" stroke="#16a34a" name="Avg Nitrogen Balance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.soilHealthTrend.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-medium text-gray-900 mb-4">Soil pH Trend (Last 12 Months)</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={data.soilHealthTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[4, 9]} />
                <Tooltip />
                <Line type="monotone" dataKey="avgPH" stroke="#0891b2" name="Avg pH" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.yieldTrend.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-medium text-gray-900 mb-4">Yield Trend (Last 12 Months)</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={data.yieldTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalYield" fill="#16a34a" name="Total Yield" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.profitByCrop.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h3 className="font-medium text-gray-900 mb-4">Profitability by Crop</h3>
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="pb-2 pr-4">Crop</th>
                <th className="pb-2 pr-4">Revenue</th>
                <th className="pb-2 pr-4">Expense</th>
                <th className="pb-2 pr-4">Net Profit</th>
                <th className="pb-2 pr-4">Harvests</th>
                <th className="pb-2">Total Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.profitByCrop.map(row => (
                <tr key={row.cropName}>
                  <td className="py-2 pr-4 font-medium text-gray-900">{row.cropName}</td>
                  <td className="py-2 pr-4 text-green-700">{row.totalRevenue.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-red-700">{row.totalExpense.toFixed(2)}</td>
                  <td className={`py-2 pr-4 font-semibold ${row.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {row.netProfit >= 0 ? '+' : ''}{row.netProfit.toFixed(2)}
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{row.harvestCount}</td>
                  <td className="py-2 text-gray-700">{row.totalYield}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
