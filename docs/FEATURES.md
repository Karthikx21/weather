# Application Features and Capabilities

This document details the functional capabilities of the **Aerisyn AI Weather Intelligence Platform** from both the user's perspective and the system execution perspective.

---

## Features Index

### 🌤️ 1. Interactive Real-Time Dashboard
Provides users with a comprehensive view of active local atmospheric metrics:
- **Hero Condition View**: Weather code descriptions, temperature, feels-like metric, sunrise/sunset, and wind speed.
- **Micro-Metrics Grid**: Dynamic grid cards detailing humidity, barometric pressure, visibility, cloud cover, UV indexes, and hourly precipitation levels.
- **Location Context**: Global coordinates tracking dynamically displayed relative to search parameters.

### 📊 2. Deep Weather Analytics
Detailed graphs showing how weather conditions change over time:
- **Hourly Forecast Chart**: Shows temperature fluctuations and precipitation chances over the next 24 hours.
- **Daily Trend Chart**: High/low temperature ranges and wind trends for the next 7 days.
- **Historical Comparison**: Side-by-side comparison of past and present records for weather trends.

### 🗺️ 3. Geographic Visualizations
Visual representation of weather metrics across coordinates:
- **Leaflet Map Integration**: Centered on active search parameters.
- **Current Metrics Overlay**: Shows key metrics (temperature, weather status) directly on the map.

### 💬 4. Intelligent Conversational Assistant
Natural language conversation for weather inquiries:
- **Context-Aware Responses**: Combines current weather, daily ranges, UV index, and air quality metrics to answer questions.
- **Fallback Capability**: Uses Gemini API if keys are set; otherwise, switches to a rule-based engine to guarantee responses.
- **Actionable Bullet Points**: Concludes responses with specific recommendations (e.g., carrying an umbrella, wearing sunscreen).

### 🧠 5. Predictive ML Trendlines
Predicts future weather patterns:
- **Multi-Model Forecast**: Predictions for max/min temperature, wind speed, pressure, humidity, and rainfall.
- **Algorithm Comparison**: Visualizes error metrics (RMSE, MAE, R²) side-by-side to show which algorithm is best.
- **Trigger Refit**: Users can trigger new model runs to incorporate fresh weather data.

### 💾 6. User Personalization & States
- **Favorites Bar**: Users can bookmark cities to quickly switch between locations.
- **Search History**: Tracks the last 20 searched coordinates for fast navigation.
