import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Label } from 'recharts';
import { Typography } from 'antd';
import { useTranslations } from 'next-intl';

const { Title } = Typography;
const colors = ['8884d8', '82ca9d', 'ffc658', 'a4de6c', 'd0ed57', 'ffc658', '00c49f', 'ff7300', 'ff8042'];

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
  const t = useTranslations('RotatieDashboard');
  console.log('Chart receiving data:', chartData); // Debug log

  return (
    <>
      <Title level={3}>{t('anual evolution')}</Title>
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
            <Label value="Year" offset={-5} position="insideBottom" />
          </XAxis>
          <YAxis label={{ value: 'Nitrogen balance', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {chartData[0] && Object.keys(chartData[0]).map((key, i) => {
            if (key !== 'year') {
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`#${colors[i % colors.length]}`}
                  activeDot={{ r: 8 }}
                />
              );
            }
            return null;
          })}
        </LineChart>
      </ResponsiveContainer>
      <div>
  
      </div>
    </>
  );
};

export default RotationChart;
