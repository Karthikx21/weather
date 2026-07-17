# Machine Learning Engine Documentation

Aerisyn implements an on-device/in-process **TS-ML Engine** that trains statistical models on real historical weather records retrieved from the Open-Meteo climate archives.

---

## Model Core (`ml/prediction/ml-engine.ts`)

The TS-ML Engine executes four distinct mathematical modeling algorithms to forecast future temperature, precipitation, pressure, humidity, and wind speed.

```
                      ┌─────────────────────────────────────────┐
                      │             Training Data               │
                      │  (dates, temp, precipitation, wind...)   │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼ Split 80/20
                   ┌───────────────────────┴───────────────────────┐
                   ▼                                               ▼
         ┌──────────────────┐                            ┌──────────────────┐
         │  Training Set    │                            │     Test Set     │
         └─────────┬────────┘                            └─────────┬────────┘
                   │                                               │
  ┌────────────────┼────────────────┌──────────────────┐           │
  ▼                ▼                ▼                  ▼           │
┌───┐            ┌───┐            ┌───┐              ┌───┐         │ Calculate Metrics
│OLS│            │EMA│            │GBM│              │ R│         │ (RMSE, MAE, R²)
└───┘            └───┘            └───┘              └───┘         │
  │                │                │                  │           │
  └────────────────┼────────────────┼──────────────────┴───────────┼
                   │                │                              │
                   ▼                ▼                              ▼
             ┌───────────┐    ┌───────────┐                  ┌───────────┐
             │Predictive │    │Validation │                  │Confidence │
             │  Output   │    │  Metrics  │                  │  Scores   │
             └───────────┘    └───────────┘                  └───────────┘
```

---

## Supported Algorithms

### 1. Ordinary Least Squares (OLS) Linear Regression
- **Mathematical Basis**: $y = mx + c$
- **Implementation**: Fits a linear trend-line using time index as independent variable $x$ and meteorological values as dependent variables $y$.
- **Best Suited For**: Long-term climate trend calculations and macro temp changes.

### 2. Seasonal Exponentially Weighted Moving Average (EMA)
- **Mathematical Basis**: $\hat{y}_t = \alpha \cdot y_t + (1 - \alpha) \cdot \hat{y}_{t-1}$
- **Implementation**: Deseasonalizes data based on a weekly index (period=7), applies exponential smoothing, and reseasonalizes to forecast short-term weather.
- **Best Suited For**: Moderate, immediate weather fluctuations.

### 3. Gradient Boosting Machine (GBM) Simulation
- **Implementation**: Additive tree model that starts with OLS trend as a base estimator, calculates residuals, trains a series of small estimators (EMA, seasonal, and momentum residual checks) to sequentially correct error trends, and sums the results.
- **Best Suited For**: Complex, non-linear atmospheric anomalies.

### 4. Bagged Seasonal Window (Random Forest) Simulation
- **Implementation**: Splits the historical sequence into 15 random subset bootstrap windows (bags) of length $N \times 0.6$, evaluates OLS/EMA forecasts on each bag using slightly randomized parameters, and averages the predictions while trimming top/bottom outlier results.
- **Best Suited For**: Resisting extreme spikes and preventing training overfitting.

---

## Evaluation Metrics

For every model trained, the engine measures performance against a test set (20% of the timeline):
* **Root Mean Squared Error (RMSE)**: Measures large discrepancies and prediction errors:
  $$RMSE = \sqrt{\frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2}$$
* **Mean Absolute Error (MAE)**: Measures average deviation magnitude.
* **Coefficient of Determination ($R^2$)**: Measures variance captured by the model relative to a naive mean forecast:
  $$R^2 = 1 - \frac{SS_{res}}{SS_{tot}}$$
* **Confidence Rating**: Derived from Mean Absolute Percentage Error (MAPE) against series limits, outputting a value from 55% to 97%.
