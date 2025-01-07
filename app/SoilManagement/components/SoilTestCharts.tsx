'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useSoilTests } from '../../providers/soilTestStore';

interface SoilTest {
  id: number;
  testDate: string;
  fieldLocation: string;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

interface ChartData {
  date: string;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

interface Props {
  fieldLocation?: string;
}

export default function SoilTestCharts({ fieldLocation }: Props) {
  const t = useTranslations('SoilManagement');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | undefined>(fieldLocation);
  const [fields, setFields] = useState<string[]>([]);
  const { fetchSoilTests } = useSoilTests();

  useEffect(() => {
    fetchSoilTests().then(data => {
      // Get unique field locations
      const uniqueFields = Array.from(new Set(data.map(test => test.fieldLocation)));
      setFields(uniqueFields);

      // If no field is selected, use the first one
      if (!selectedField && uniqueFields.length > 0) {
        setSelectedField(uniqueFields[0]);
      }

      // Filter and transform data for the selected field
      const filteredData = data
        .filter(test => !selectedField || test.fieldLocation === selectedField)
        .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
        .map(test => ({
          date: new Date(test.testDate).toLocaleDateString(),
          pH: test.pH,
          organicMatter: test.organicMatter,
          nitrogen: test.nitrogen,
          phosphorus: test.phosphorus,
          potassium: test.potassium,
        }));

      setChartData(filteredData);
    }).catch(setError).finally(() => setLoading(false));
  }, [selectedField]);

  if (loading) return <div className="text-center">{t('loading')}</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (chartData.length === 0) return <div className="text-center">{t('noDataAvailable')}</div>;

  return (
    <div className="space-y-6">
      {!fieldLocation && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('selectField')}
          </label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            {fields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-8">
        {/* pH and Organic Matter Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">{t('pHAndOrganicMatter')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pH"
                  stroke="#8884d8"
                  name={t('pH')}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="organicMatter"
                  stroke="#82ca9d"
                  name={t('organicMatter')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NPK Levels Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">{t('nutrientLevels')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="nitrogen"
                  stroke="#8884d8"
                  name={t('nitrogen')}
                />
                <Line
                  type="monotone"
                  dataKey="phosphorus"
                  stroke="#82ca9d"
                  name={t('phosphorus')}
                />
                <Line
                  type="monotone"
                  dataKey="potassium"
                  stroke="#ffc658"
                  name={t('potassium')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
