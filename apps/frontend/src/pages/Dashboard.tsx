import React from 'react';
import { useGetCurrentWeather, useGetWeatherForecast, useGetAirQuality, useGetWeatherAlerts } from '@workspace/api-client-react';
import { useLocationContext } from '@/contexts/LocationContext';
import { WeatherIcon } from '@/components/WeatherIcon';
import { Droplets, Wind, Gauge, Eye, Cloud, Sun, Sunrise, Sunset, Thermometer, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, unit, icon: Icon, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col hover:bg-card/60 transition-colors"
  >
    <div className="flex items-center gap-2 text-muted-foreground mb-3">
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <span className="text-xs uppercase tracking-wider font-semibold truncate">{title}</span>
    </div>
    <div className="flex items-baseline gap-1 mt-auto">
      <span className="text-2xl sm:text-3xl font-bold text-foreground font-mono">{value}</span>
      <span className="text-sm text-muted-foreground">{unit}</span>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const { location } = useLocationContext();

  const { data: current, isLoading: isCurrentLoading } = useGetCurrentWeather(
    { lat: location.lat, lon: location.lon },
    { query: { enabled: !!location.lat && !!location.lon } }
  );

  const { data: forecast, isLoading: isForecastLoading } = useGetWeatherForecast(
    { lat: location.lat, lon: location.lon, days: 7 },
    { query: { enabled: !!location.lat && !!location.lon } }
  );

  const { data: aqi, isLoading: isAqiLoading } = useGetAirQuality(
    { lat: location.lat, lon: location.lon },
    { query: { enabled: !!location.lat && !!location.lon } }
  );

  const { data: alerts } = useGetWeatherAlerts(
    { lat: location.lat, lon: location.lon },
    { query: { enabled: !!location.lat && !!location.lon } }
  );

  if (isCurrentLoading || isForecastLoading || isAqiLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!current) return <div className="p-8 text-center text-red-500">Failed to load weather data</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight truncate">
            {location.name}
          </h1>
          <p className="text-muted-foreground mt-1.5 flex items-center gap-2 text-sm flex-wrap">
            <span>Lat: {location.lat.toFixed(4)}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" aria-hidden="true"></span>
            <span>Lon: {location.lon.toFixed(4)}</span>
          </p>
        </div>
        <div className="text-sm text-muted-foreground shrink-0">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Alert Banner */}
      {alerts && alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="font-bold text-destructive">{alerts[0].title}</h3>
            <p className="text-sm text-destructive/80 mt-1">{alerts[0].description}</p>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/80 to-card/20 backdrop-blur-xl border border-white/10 p-5 sm:p-8 md:p-10"
      >
        {/* Decorative blurs — contained, no overflow */}
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-72 sm:h-72 bg-primary/20 blur-[80px] rounded-full pointer-events-none" aria-hidden="true"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-secondary/20 blur-[80px] rounded-full pointer-events-none" aria-hidden="true"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
          {/* Temperature display */}
          <div className="text-center md:text-left w-full md:w-auto">
            <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4">
              <WeatherIcon code={current.weather_code} className="text-5xl sm:text-7xl md:text-8xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              <div className="text-6xl sm:text-8xl md:text-[120px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 font-mono leading-none">
                {Math.round(current.temperature)}°
              </div>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-medium mt-3 capitalize text-white/90">
              {current.weather_description}
            </div>
            <div className="text-muted-foreground mt-1.5 text-base sm:text-lg">
              Feels like <span className="text-foreground font-semibold font-mono">{Math.round(current.feels_like)}°</span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 w-full md:flex-1">
            <div className="bg-black/20 rounded-2xl p-3 sm:p-4 border border-white/5">
              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                <Sunrise className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" /> Sunrise
              </div>
              <div className="text-lg sm:text-xl font-bold mt-1 font-mono">
                {new Date(current.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="bg-black/20 rounded-2xl p-3 sm:p-4 border border-white/5">
              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                <Sunset className="w-3.5 h-3.5 text-secondary shrink-0" aria-hidden="true" /> Sunset
              </div>
              <div className="text-lg sm:text-xl font-bold mt-1 font-mono">
                {new Date(current.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="col-span-2 bg-black/20 rounded-2xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" /> Wind
                </div>
                <div className="text-lg sm:text-xl font-bold mt-1 font-mono flex items-baseline gap-1">
                  {current.wind_speed} <span className="text-sm text-muted-foreground font-sans">km/h</span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/10 flex items-center justify-center relative shrink-0" aria-label={`Wind direction: ${current.wind_direction}°`}>
                <div className="absolute w-1 h-3 bg-cyan-400 rounded-full" style={{ transform: `rotate(${current.wind_direction}deg)`, transformOrigin: 'bottom center', bottom: '50%' }}></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid — 2 cols mobile, 3 cols sm, 6 cols lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard title="Humidity" value={current.humidity} unit="%" icon={Droplets} delay={0.1} />
        <MetricCard title="Pressure" value={current.pressure} unit="hPa" icon={Gauge} delay={0.2} />
        <MetricCard title="Visibility" value={current.visibility >= 1000 ? (current.visibility / 1000).toFixed(1) : current.visibility} unit={current.visibility >= 1000 ? 'km' : 'm'} icon={Eye} delay={0.3} />
        <MetricCard title="Cloud Cover" value={current.cloud_cover} unit="%" icon={Cloud} delay={0.4} />
        <MetricCard title="UV Index" value={current.uv_index} unit="" icon={Sun} delay={0.5} />
        <MetricCard title="Rainfall" value={current.rainfall} unit="mm" icon={Droplets} delay={0.6} />
      </div>

      {/* Hourly + AQI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Hourly Forecast */}
        <div className="lg:col-span-2 bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6">
          <h3 className="font-semibold text-base sm:text-lg mb-5 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary shrink-0" aria-hidden="true" /> 24-Hour Forecast
          </h3>
          <div className="flex overflow-x-auto pb-3 gap-4 sm:gap-6 scrollbar-hide snap-x snap-mandatory" role="list" aria-label="Hourly forecast">
            {forecast?.hourly.slice(0, 24).map((h, i) => {
              const date = new Date(h.time);
              const isNow = i === 0;
              return (
                <div
                  key={h.time}
                  role="listitem"
                  className={`flex flex-col items-center min-w-[52px] sm:min-w-[60px] snap-center shrink-0 ${isNow ? 'bg-primary/20 border border-primary/50 rounded-2xl p-2 -my-2' : ''}`}
                >
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2 font-mono">{isNow ? 'Now' : date.getHours() + ':00'}</div>
                  <WeatherIcon code={h.weather_code} className="text-2xl sm:text-3xl mb-2" />
                  <div className="text-base sm:text-lg font-bold font-mono">{Math.round(h.temperature)}°</div>
                  {h.precipitation_probability > 0 && (
                    <div className="text-xs text-secondary font-mono mt-1">{h.precipitation_probability}%</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AQI Panel */}
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6">
          <h3 className="font-semibold text-base sm:text-lg mb-5 flex items-center gap-2">
            <Wind className="w-5 h-5 text-primary shrink-0" aria-hidden="true" /> Air Quality
          </h3>
          {aqi ? (
            <div>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="text-4xl sm:text-5xl font-black font-mono leading-none text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">{aqi.aqi}</div>
                  <div className="text-sm text-emerald-500 font-medium uppercase tracking-wider mt-2">{aqi.aqi_category || 'Good'}</div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { label: 'PM2.5', value: aqi.pm2_5, max: 50 },
                  { label: 'PM10', value: aqi.pm10, max: 100 },
                  { label: 'O₃', value: aqi.ozone, max: 150 },
                  { label: 'NO₂', value: aqi.nitrogen_dioxide, max: 100 },
                ].map(pollutant => (
                  <div key={pollutant.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{pollutant.label}</span>
                      <span className="font-mono font-medium">{pollutant.value} <span className="text-[10px] text-muted-foreground">µg/m³</span></span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (pollutant.value / pollutant.max) * 100)}%` }}
                        role="progressbar"
                        aria-valuenow={pollutant.value}
                        aria-valuemax={pollutant.max}
                        aria-label={pollutant.label}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">AQI data unavailable.</div>
          )}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 sm:p-6">
        <h3 className="font-semibold text-base sm:text-lg mb-5 flex items-center gap-2">
          <Sun className="w-5 h-5 text-primary shrink-0" aria-hidden="true" /> 7-Day Forecast
        </h3>
        <div className="space-y-2 sm:space-y-3" role="list" aria-label="7-day forecast">
          {forecast?.daily.slice(0, 7).map((d) => (
            <div
              key={d.date}
              role="listitem"
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-white/5 transition-colors gap-2"
            >
              <div className="w-16 sm:w-24 font-medium text-sm sm:text-base shrink-0">
                {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <WeatherIcon code={d.weather_code} className="text-xl sm:text-2xl shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block capitalize truncate">{d.weather_description}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Droplets className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${d.precipitation_probability_max > 0 ? 'text-secondary' : 'text-muted-foreground/30'}`} aria-hidden="true" />
                <span className="text-xs sm:text-sm font-mono w-8 text-right">{d.precipitation_probability_max}%</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-mono text-sm sm:text-base">
                <span className="text-muted-foreground">{Math.round(d.temp_min)}°</span>
                <div className="w-10 sm:w-16 h-1.5 bg-white/10 rounded-full overflow-hidden hidden xs:block">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-orange-400"></div>
                </div>
                <span className="font-bold text-foreground">{Math.round(d.temp_max)}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
