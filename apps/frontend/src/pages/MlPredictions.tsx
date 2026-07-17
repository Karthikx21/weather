import React from 'react';
import { useGetMlPredictions, useGetMlModels, useTriggerMlTraining } from '@workspace/api-client-react';
import { useLocationContext } from '@/contexts/LocationContext';
import { BrainCircuit, RefreshCw, Trophy, Target, ShieldCheck, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function MlPredictions() {
  const { location } = useLocationContext();
  const { toast } = useToast();

  const { data: predictions, isLoading: isPredLoading, refetch: refetchPredictions } = useGetMlPredictions(
    { lat: location.lat, lon: location.lon },
    { query: { enabled: !!location.lat && !!location.lon } }
  );

  const { data: models, isLoading: isModelsLoading, refetch: refetchModels } = useGetMlModels(
    { lat: location.lat, lon: location.lon },
    { query: { enabled: !!location.lat && !!location.lon } }
  );

  const trainMutation = useTriggerMlTraining();

  const handleRetrain = () => {
    trainMutation.mutate(
      { data: { lat: location.lat, lon: location.lon, days_of_history: 30 } },
      {
        onSuccess: () => {
          toast({ title: 'Training Complete', description: 'Models have been retrained with recent data.' });
          refetchPredictions();
          refetchModels();
        },
        onError: () => {
          toast({ title: 'Training Failed', description: 'Could not retrain models. Please try again.', variant: 'destructive' });
        },
      }
    );
  };

  if (isPredLoading || isModelsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight flex items-center gap-3 flex-wrap">
            <BrainCircuit className="w-8 h-8 sm:w-10 sm:h-10 text-primary shrink-0" aria-hidden="true" />
            ML Intelligence
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Next-24h predictive models for {location.name}</p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={trainMutation.isPending}
          className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 min-h-[44px] shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${trainMutation.isPending ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{trainMutation.isPending ? 'Retraining...' : 'Retrain Models'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Predictions */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-secondary shrink-0" aria-hidden="true" /> Tomorrow's Forecast
          </h2>
          {predictions?.predictions.map((pred, i) => (
            <motion.div
              key={pred.target}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-5"
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="font-semibold text-base sm:text-lg capitalize">{pred.target.replace('_', ' ')}</div>
                <div className="text-xs px-2 py-1 bg-white/5 rounded-md text-muted-foreground font-mono shrink-0">{pred.model_used}</div>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <div className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {pred.predicted_value.toFixed(1)}
                </div>
                <div className="text-muted-foreground">{pred.unit}</div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Confidence Score</span>
                  <span className="font-mono">{pred.confidence}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-full"
                    style={{ width: `${pred.confidence}%` }}
                    role="progressbar"
                    aria-valuenow={pred.confidence}
                    aria-valuemax={100}
                    aria-label={`Confidence: ${pred.confidence}%`}
                  ></div>
                </div>
                {pred.lower_bound != null && pred.upper_bound != null && (
                  <div className="text-[10px] text-muted-foreground text-right mt-1 font-mono">
                    Interval: [{pred.lower_bound.toFixed(1)}, {pred.upper_bound.toFixed(1)}]
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Model Performance */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" aria-hidden="true" /> Model Performance
          </h2>
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shrink-0">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-muted-foreground">Best Performing Model</div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-foreground truncate">{models?.best_model}</div>
                </div>
              </div>
            </div>

            {/* Responsive table with horizontal scroll */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="p-3 sm:p-4 font-medium text-muted-foreground text-sm">Model</th>
                    <th className="p-3 sm:p-4 font-medium text-muted-foreground text-sm">RMSE</th>
                    <th className="p-3 sm:p-4 font-medium text-muted-foreground text-sm">MAE</th>
                    <th className="p-3 sm:p-4 font-medium text-muted-foreground text-sm">R²</th>
                    <th className="p-3 sm:p-4 font-medium text-muted-foreground text-sm">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm">
                  {models?.models.map((model) => (
                    <tr
                      key={model.model_name}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${model.model_name === models.best_model ? 'bg-primary/5' : ''}`}
                    >
                      <td className="p-3 sm:p-4 font-sans font-medium">
                        <div className="flex items-center gap-2">
                          {model.model_name === models.best_model && <ShieldCheck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />}
                          <span className="truncate max-w-[120px] sm:max-w-none">{model.model_name}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">{model.rmse.toFixed(3)}</td>
                      <td className="p-3 sm:p-4">{model.mae.toFixed(3)}</td>
                      <td className="p-3 sm:p-4 text-emerald-400">{model.r2.toFixed(3)}</td>
                      <td className="p-3 sm:p-4">{model.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
