import type { Request, Response } from "express";
import { GetMlPredictionsQueryParams, GetMlModelsQueryParams, TriggerMlTrainingBody } from "@workspace/api-zod";
import { trainAndPredict, type PredictionResult } from "../../../../ml/prediction/ml-engine.js";
import { WeatherService } from "../services/weather.service.js";
import { cache, TTL } from "../lib/cache.js";

const getTrainingData = (lat: number, lon: number, days: number) =>
  cache.getOrFetch(
    `ml-training:${lat.toFixed(4)}:${lon.toFixed(4)}:${days}`,
    TTL.ML_TRAINING,
    () => WeatherService.fetchHistoricalForML(lat, lon, days)
  );

export class MlController {
  static async getPredictions(req: Request, res: Response): Promise<void> {
    const parsed = GetMlPredictionsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { lat, lon } = parsed.data;

    try {
      const trainingData = await getTrainingData(lat, lon, 90);

      const bestPred = (preds: PredictionResult[], label: string, unit: string) => {
        const best = preds[0];
        return {
          target: label,
          predicted_value: best.predicted_value,
          unit,
          confidence: best.confidence,
          model_used: best.model_used,
          lower_bound: best.lower_bound,
          upper_bound: best.upper_bound,
        };
      };

      const { predictions: tempMaxPreds } = trainAndPredict(trainingData, "tempMax");
      const { predictions: tempMinPreds } = trainAndPredict(trainingData, "tempMin");
      const { predictions: precipPreds } = trainAndPredict(trainingData, "precipitation");
      const { predictions: windPreds } = trainAndPredict(trainingData, "windSpeed");
      const { predictions: humidPreds } = trainAndPredict(trainingData, "humidity");
      const { predictions: pressPreds } = trainAndPredict(trainingData, "pressure");

      res.json({
        location_lat: lat,
        location_lon: lon,
        predictions: [
          bestPred(tempMaxPreds, "Tomorrow Max Temperature", "°C"),
          bestPred(tempMinPreds, "Tomorrow Min Temperature", "°C"),
          bestPred(precipPreds, "Rain Probability / Precipitation", "mm"),
          bestPred(windPreds, "Wind Speed", "km/h"),
          bestPred(humidPreds, "Humidity", "%"),
          bestPred(pressPreds, "Pressure", "hPa"),
        ],
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to generate ML predictions");
      res.status(500).json({ error: "Failed to generate predictions" });
    }
  }

  static async getModels(req: Request, res: Response): Promise<void> {
    const parsed = GetMlModelsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { lat, lon } = parsed.data;

    try {
      const trainingData = await getTrainingData(lat, lon, 90);
      const { metrics } = trainAndPredict(trainingData, "tempMax");

      res.json({
        models: metrics,
        best_model: metrics[0].model_name,
        target_variable: "Temperature (Max)",
      });
    } catch (err) {
      req.log.error({ err }, "Failed to get ML models");
      res.status(500).json({ error: "Failed to get model metrics" });
    }
  }

  static async trainModels(req: Request, res: Response): Promise<void> {
    const parsed = TriggerMlTrainingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { lat, lon, days_of_history = 365 } = parsed.data;

    try {
      const trainingData = await WeatherService.fetchHistoricalForML(
        lat,
        lon,
        Math.min(days_of_history, 365)
      );
      // Invalidate cached training data so next predictions use fresh data
      cache.delete(`ml-training:${lat.toFixed(4)}:${lon.toFixed(4)}:90`);
      const { metrics: tempMetrics } = trainAndPredict(trainingData, "tempMax");
      const { metrics: windMetrics } = trainAndPredict(trainingData, "windSpeed");

      res.json({
        success: true,
        message: `Successfully trained models on ${trainingData.dates.length} days of historical data`,
        models_trained: ["Linear Regression", "XGBoost", "Gradient Boosting", "Random Forest"],
        training_samples: trainingData.dates.length,
        metrics: tempMetrics.map((m, i) => ({
          ...m,
          rmse: Math.round(((m.rmse + (windMetrics[i]?.rmse ?? 0)) / 2) * 100) / 100,
          mae: Math.round(((m.mae + (windMetrics[i]?.mae ?? 0)) / 2) * 100) / 100,
          r2: Math.round(((m.r2 + (windMetrics[i]?.r2 ?? 0)) / 2) * 1000) / 1000,
        })),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to train ML models");
      res.status(500).json({ error: "Failed to train models" });
    }
  }
}
