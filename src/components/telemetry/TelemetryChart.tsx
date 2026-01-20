import { memo, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AggregatedData, AggregationType } from '@/types/telemetry';

interface TelemetryChartProps {
  data: AggregatedData[];
  aggregationType: AggregationType;
  isLoading?: boolean;
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatValue = (value: number, type: AggregationType) => {
  if (type === 'count') return Math.round(value).toLocaleString();
  return value.toFixed(2);
};

export const TelemetryChart = memo(function TelemetryChart({ 
  data, 
  aggregationType,
  isLoading 
}: TelemetryChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      timestamp: item.timestamp,
      time: formatTime(item.timestamp),
      value: item[aggregationType],
    }));
  }, [data, aggregationType]);

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center" role="status" aria-label="Loading chart">
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No data available for the selected filters
      </div>
    );
  }

  return (
    <div 
      className="h-[300px] w-full" 
      role="img" 
      aria-label={`Time series chart showing ${aggregationType} values over time`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(173, 80%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(173, 80%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(217, 33%, 20%)" 
            vertical={false}
          />
          <XAxis 
            dataKey="time" 
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
            tickLine={{ stroke: 'hsl(217, 33%, 20%)' }}
            axisLine={{ stroke: 'hsl(217, 33%, 20%)' }}
          />
          <YAxis 
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
            tickLine={{ stroke: 'hsl(217, 33%, 20%)' }}
            axisLine={{ stroke: 'hsl(217, 33%, 20%)' }}
            tickFormatter={(val) => formatValue(val, aggregationType)}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(222, 47%, 8%)',
              border: '1px solid hsl(217, 33%, 20%)',
              borderRadius: '8px',
              color: 'hsl(210, 40%, 98%)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(215, 20%, 55%)' }}
            formatter={(value: number) => [formatValue(value, aggregationType), aggregationType.toUpperCase()]}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(173, 80%, 50%)" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
