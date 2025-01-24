'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { observer } from 'mobx-react';
import { Card, Select, Alert, Spin } from 'antd';
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
import styles from './SoilTestCharts.module.scss';

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

const SoilTestCharts = observer(({ fieldLocation }: Props) => {
  const t = useTranslations('SoilManagement');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedField, setSelectedField] = useState<string | undefined>(fieldLocation);
  const [fields, setFields] = useState<string[]>([]);
  const soilTestStore = useSoilTests();

  useEffect(() => {
    soilTestStore.fetchSoilTests().then(data => {
      const uniqueFields = Array.from(new Set(data.map(test => test.fieldLocation)));
      setFields(uniqueFields);

      if (!selectedField && uniqueFields.length > 0) {
        setSelectedField(uniqueFields[0]);
      }

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
    });
  }, [selectedField, soilTestStore]);

  if (soilTestStore.loading) return <Spin size="large" />;
  if (soilTestStore.error) return <Alert type="error" message={soilTestStore.error} showIcon />;
  if (chartData.length === 0) return <Alert type="info" message={t('noDataAvailable')} showIcon />;

  return (
    <div className={styles.soilTestCharts}>
      {!fieldLocation && (
        <div className={styles.fieldSelector}>
          <Select
            value={selectedField}
            onChange={setSelectedField}
            placeholder={t('selectField')}
          >
            {fields.map((field) => (
              <Select.Option key={field} value={field}>
                {field}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}

      <Card title={t('pHAndOrganicMatter')}>
        <div className={styles.chartContainer}>
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
                stroke="#1890ff"
                name={t('pH')}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="organicMatter"
                stroke="#52c41a"
                name={t('organicMatter')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title={t('nutrientLevels')}>
        <div className={styles.chartContainer}>
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
                stroke="#1890ff"
                name={t('nitrogen')}
              />
              <Line
                type="monotone"
                dataKey="phosphorus"
                stroke="#52c41a"
                name={t('phosphorus')}
              />
              <Line
                type="monotone"
                dataKey="potassium"
                stroke="#faad14"
                name={t('potassium')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
});

export default SoilTestCharts;
