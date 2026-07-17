import React from 'react';
import { useGetWeatherAlerts } from '@workspace/api-client-react';
import { useLocationContext } from '@/contexts/LocationContext';
import { AlertTriangle, Info, AlertOctagon, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'extreme': return 'border-red-500 bg-red-500/10 text-red-500';
    case 'high': return 'border-orange-500 bg-orange-500/10 text-orange-500';
    case 'medium': return 'border-yellow-500 bg-yellow-500/10 text-yellow-500';
    case 'low': return 'border-blue-500 bg-blue-500/10 text-blue-500';
    default: return 'border-white/10 bg-white/5 text-foreground';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'extreme': return ShieldAlert;
    case 'high': return AlertOctagon;
    case 'medium': return AlertTriangle;
    case 'low': return Info;
    default: return Info;
  }
};

export default function Alerts() {
  const { location } = useLocationContext();

  const { data: alerts, isLoading } = useGetWeatherAlerts(
    { lat: location.lat, lon: location.lon },
    {
      query: {
        enabled: !!location.lat && !!location.lon,
        refetchInterval: 30000,
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight flex items-center gap-3 flex-wrap">
          <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-primary shrink-0" aria-hidden="true" />
          Active Alerts
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Real-time weather warnings for {location.name}</p>
      </div>

      {!alerts || alerts.length === 0 ? (
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center" role="status">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" aria-hidden="true" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2">No Active Alerts</h2>
          <p className="text-muted-foreground text-sm">Conditions are clear. Auto-refreshing every 30 seconds.</p>
        </div>
      ) : (
        <div className="space-y-4" role="list" aria-label="Weather alerts">
          {alerts.map((alert, i) => {
            const Icon = getSeverityIcon(alert.severity);
            const styleClass = getSeverityStyles(alert.severity);
            const colorClass = styleClass.split(' ').pop() ?? '';
            const borderBg = styleClass.split(' ').slice(0, 2).join(' ');

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`border rounded-3xl p-4 sm:p-6 ${borderBg}`}
                role="listitem"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 rounded-2xl bg-black/20 shrink-0 ${colorClass}`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Top row: severity badge + type + timestamp */}
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-black/20 ${colorClass} shrink-0`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm font-medium opacity-80 uppercase tracking-widest">{alert.type}</span>
                      {alert.end_time && (
                        <div className="text-xs font-mono opacity-60 ml-auto shrink-0">
                          Until {new Date(alert.end_time).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <h3 className={`text-lg sm:text-xl font-bold mb-2 ${colorClass}`}>{alert.title}</h3>
                    <p className="text-foreground/80 leading-relaxed text-sm">{alert.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
