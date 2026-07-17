import React, { useState } from 'react';
import { useGetHistoricalSummary, GetHistoricalSummaryPeriod } from '@workspace/api-client-react';
import { useLocationContext } from '@/contexts/LocationContext';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';

export default function Analytics() {
  const { location } = useLocationContext();
  const [period, setPeriod] = useState<GetHistoricalSummaryPeriod>(GetHistoricalSummaryPeriod.month);
  const [chartType, setChartType] = useState<'temperature' | 'rainfall' | 'wind'>('temperature');

  const { data, isLoading } = useGetHistoricalSummary(
    { lat: location.lat, lon: location.lon, period },
    { query: { enabled: !!location.lat && !!location.lon } }
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-500">Failed to load analytics</div>;

  const chartData = data.daily_data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tempMax: d.temp_max,
    tempMin: d.temp_min,
    rainfall: d.precipitation_sum,
    windSpeed: d.wind_speed_max,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Historical trends for {location.name}</p>
        </div>

        {/* Period toggle — scrollable on very small screens */}
        <div className="flex bg-card/40 backdrop-blur-xl border border-white/5 p-1 rounded-xl overflow-x-auto scrollbar-hide shrink-0 max-w-full">
          {Object.values(GetHistoricalSummaryPeriod).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap min-h-[36px] ${period === p ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-4 sm:p-5 rounded-2xl">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Avg Temp</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">{data.avg_temp.toFixed(1)}°</div>
        </div>
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-4 sm:p-5 rounded-2xl">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Rainfall</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-secondary">{data.total_rainfall.toFixed(1)}<span className="text-sm">mm</span></div>
        </div>
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-4 sm:p-5 rounded-2xl">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Avg Humidity</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400">{data.avg_humidity.toFixed(0)}<span className="text-sm">%</span></div>
        </div>
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-4 sm:p-5 rounded-2xl">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Max Temp</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-orange-400">{data.max_temp.toFixed(1)}°</div>
        </div>
      </div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6 md:p-8"
      >
        {/* Chart type toggle */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          <button
            onClick={() => setChartType('temperature')}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[36px] ${chartType === 'temperature' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:bg-white/5'}`}
          >
            Temperature
          </button>
          <button
            onClick={() => setChartType('rainfall')}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[36px] ${chartType === 'rainfall' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-white/10 text-muted-foreground hover:bg-white/5'}`}
          >
            Rainfall
          </button>
          <button
            onClick={() => setChartType('wind')}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[36px] ${chartType === 'wind' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-white/10 text-muted-foreground hover:bg-white/5'}`}
          >
            Wind Speed
          </button>
        </div>

        {/* Responsive chart height */}
        <div className="h-[260px] sm:h-[320px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'temperature' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickMargin={8} interval="preserveStartEnd" />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(val) => `${val}°`} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(10,15,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontFamily: 'Space Mono' }}
                />
                <Legend />
                <Line type="monotone" dataKey="tempMax" name="Max Temp" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="tempMin" name="Min Temp" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            ) : chartType === 'rainfall' ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickMargin={8} interval="preserveStartEnd" />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(val) => `${val}mm`} width={45} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(10,15,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="rainfall" name="Rainfall" stroke="#3b82f6" fill="rgba(59,130,246,0.2)" strokeWidth={2} />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickMargin={8} interval="preserveStartEnd" />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(val) => `${val}kph`} width={45} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(10,15,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="windSpeed" name="Max Wind Speed" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
