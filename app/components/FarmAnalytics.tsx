'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
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
    </div>
  );
}
