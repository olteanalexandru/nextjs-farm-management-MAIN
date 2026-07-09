import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Label } from 'recharts';
import { Typography, Spin, Alert } from 'antd';
import { useTranslations } from 'next-intl';

const { Title } = Typography;

interface ChartData {
  year: number;
  division: number;
  cropName: string;
  divisionSize: number;
  nitrogenBalance: number;
}

interface RotationChartProps {
  chartData: ChartData[];
}

const RotationChart: React.FC<RotationChartProps> = ({ chartData }) => {
  const t = useTranslations('RotationDashboard');

  if (!chartData || chartData.length === 0) {
    return <Alert message={t('noChartData')} type="warning" />;
  }

  return (
    <>
      <Title level={3}>{t('annualEvolution')}</Title>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          width={500}
          height={300}
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" padding={{ left: 30, right: 30 }}>
            <Label value={t('year')} offset={-5} position="insideBottom" />
          </XAxis>
          <YAxis label={{ value: t('nitrogenBalance'), angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="nitrogenBalance"
            stroke="#22c55e"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div>
  
      </div>
    </>
  );
};

export default RotationChart;
