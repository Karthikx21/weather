import React, { useState, useCallback } from 'react';
import { useCompareCities, useSearchLocations } from '@workspace/api-client-react';
import {
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Plus, X, Loader2 } from 'lucide-react';
import { WeatherIcon } from '@/components/WeatherIcon';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/use-debounce';

type CityEntry = {
  name: string;
  lat: number;
  lon: number;
};

const COLORS = ['#06b6d4', '#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#d946ef'];

export default function Compare() {
  const [cities, setCities] = useState<CityEntry[]>([
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
  ]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const compareMutation = useCompareCities();

  const { data: searchResults } = useSearchLocations(
    { q: debouncedQuery, limit: 5 },
    { query: { enabled: debouncedQuery.length > 2 } }
  );

  const runComparison = useCallback(
    (list: CityEntry[]) => {
      if (list.length === 0) return;
      compareMutation.mutate({
        data: { cities: list.map((c) => ({ name: c.name, lat: c.lat, lon: c.lon })) },
      });
    },
    [compareMutation]
  );

  React.useEffect(() => {
    runComparison(cities);
  }, [cities, runComparison]);

  const addCity = (city: CityEntry) => {
    if (cities.length >= 6 || cities.some((c) => c.name === city.name)) return;
    const updated = [...cities, city];
    setCities(updated);
    setQuery('');
  };

  const removeCity = (name: string) => {
    setCities((prev) => prev.filter((c) => c.name !== name));
  };

  const comparisonData = compareMutation.data ?? [];
  const isComparing = compareMutation.isPending;

  const barChartData = comparisonData.map((c) => ({
    name: c.city.name,
    temperature: c.current_weather.temperature,
    humidity: c.current_weather.humidity,
    aqi: c.air_quality.aqi,
    wind: c.current_weather.wind_speed,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">Compare</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Compare weather conditions across cities</p>
        </div>

        {/* City search */}
        <div className="relative w-full sm:w-auto sm:min-w-[280px] max-w-sm z-50">
          <div className="relative flex items-center">
            <Plus className="absolute left-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Add city (max 6)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={cities.length >= 6}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 min-h-[44px]"
              aria-label="Add city to compare"
            />
          </div>
          {searchResults && searchResults.length > 0 && query.length > 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden">
              <ul className="py-2" role="listbox">
                {searchResults.map((res) => (
                  <li key={`${res.lat}-${res.lon}`} role="option" aria-selected={false}>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors min-h-[44px]"
                      onClick={() => addCity({ name: res.name, lat: res.lat, lon: res.lon })}
                    >
                      <span className="font-medium">{res.name}</span>{' '}
                      <span className="text-xs text-muted-foreground">{res.country}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* City chips */}
      <div className="flex flex-wrap gap-2">
        {cities.map((city, idx) => (
          <div key={city.name} className="flex items-center gap-2 bg-card/60 border border-white/10 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} aria-hidden="true"></div>
            <span className="font-medium text-sm">{city.name}</span>
            <button
              onClick={() => removeCity(city.name)}
              className="text-muted-foreground hover:text-destructive transition-colors min-h-[24px] min-w-[24px] flex items-center justify-center"
              aria-label={`Remove ${city.name}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {isComparing && comparisonData.length === 0 ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {/* City cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {comparisonData.map((d, i) => (
              <motion.div
                key={d.city.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} aria-hidden="true"></div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl sm:text-2xl font-bold truncate pr-2">{d.city.name}</h3>
                  <WeatherIcon code={d.current_weather.weather_code} className="text-3xl sm:text-4xl drop-shadow-md shrink-0" />
                </div>

                <div className="text-5xl sm:text-6xl font-black font-mono tracking-tighter mb-2">
                  {Math.round(d.current_weather.temperature)}°
                </div>
                <div className="text-sm text-muted-foreground capitalize mb-5">
                  {d.current_weather.weather_description}
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                  <div><span className="text-muted-foreground">Humidity:</span> <span className="font-mono font-medium">{d.current_weather.humidity}%</span></div>
                  <div><span className="text-muted-foreground">Wind:</span> <span className="font-mono font-medium">{d.current_weather.wind_speed}km/h</span></div>
                  <div><span className="text-muted-foreground">AQI:</span> <span className="font-mono font-medium text-emerald-400">{d.air_quality.aqi}</span></div>
                  <div><span className="text-muted-foreground">Rain:</span> <span className="font-mono font-medium">{d.current_weather.rainfall}mm</span></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
            {/* Bar chart */}
            <div className="xl:col-span-2 bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6">
              <h3 className="font-semibold text-base sm:text-lg mb-5">Metric Comparison</h3>
              <div className="h-[280px] sm:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} width={35} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(10,15,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="temperature" name="Temp (°C)" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="humidity" name="Humidity (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="wind" name="Wind (km/h)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="aqi" name="AQI" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar chart */}
            <div className="xl:col-span-1 bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col">
              <h3 className="font-semibold text-base sm:text-lg mb-2">Atmospheric Profile</h3>
              <div className="flex-1 min-h-[260px] sm:min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                    { subject: 'Temp', ...Object.fromEntries(barChartData.map((d) => [d.name, d.temperature])) },
                    { subject: 'Humid', ...Object.fromEntries(barChartData.map((d) => [d.name, d.humidity])) },
                    { subject: 'Wind', ...Object.fromEntries(barChartData.map((d) => [d.name, d.wind])) },
                    { subject: 'AQI', ...Object.fromEntries(barChartData.map((d) => [d.name, d.aqi])) },
                  ]}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(10,15,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    {barChartData.map((d, i) => (
                      <Radar key={d.name} name={d.name} dataKey={d.name} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
