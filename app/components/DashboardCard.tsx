"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardCardProps {
    title: string;
    metric: number;
    trend: number;
    data: { name: string; value: number }[];
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, metric, trend, data }) => {
    const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600';
    const trendIcon = trend >= 0 ? '↑' : '↓';

    return (
        <div className="rounded-xl bg-white p-6 shadow-soft transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                    <div className="mt-1 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">{metric}</p>
                        <span className={`ml-2 text-sm font-medium ${trendColor}`}>
                            {trendIcon} {Math.abs(trend)}%
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={value => `${value}%`}
                        />
                        <Tooltip />
                        <Line 
                            type="monotone" 
                            dataKey="value"
                            stroke="#4F46E5"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DashboardCard;
