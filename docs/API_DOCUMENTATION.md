# API Endpoints Documentation

The Aerisyn Backend exposes a RESTful API under the `/api` route prefix. It uses standard HTTP response codes and accepts/returns JSON payloads.

---

## Endpoint Index

### 1. Health Checks
* `GET /api/healthz` - Check server status.

### 2. Weather Data
* `GET /api/weather/current` - Retrieve current conditions.
* `GET /api/weather/forecast` - Retrieve hourly/daily forecasts.
* `GET /api/weather/historical` - Retrieve historical climate records.
* `GET /api/weather/alerts` - Get active weather alerts.

### 3. Air Quality
* `GET /api/air-quality` - Get current air pollutants.

### 4. Locations & Geocoding
* `GET /api/geocoding/search` - Search coordinates by city name.
* `GET /api/geocoding/reverse` - Search city name by coordinates.

### 5. AI Weather Assistant
* `POST /api/assistant/query` - Conversational weather queries.

### 6. Machine Learning Predictions
* `GET /api/ml/predictions` - Statistical trend predictions.
* `GET /api/ml/models` - Compare statistical models.
* `POST /api/ml/train` - Train/Re-evaluate ML algorithms.

### 7. City Favorites & History
* `GET /api/cities/favorites` - Get favorite cities.
* `POST /api/cities/favorites` - Save city to favorites.
* `DELETE /api/cities/favorites/:id` - Delete city from favorites.
* `GET /api/cities/search-history` - Get recent searches.
* `POST /api/cities/search-history` - Save search history.
* `DELETE /api/cities/search-history` - Clear search history.

---

## Detailed Endpoint References

### Get Current Weather
* **Path**: `/api/weather/current`
* **Method**: `GET`
* **Query Parameters**:
  - `lat` (Number, Required)
  - `lon` (Number, Required)
  - `timezone` (String, Optional)
* **Response (200 OK)**:
  ```json
  {
    "temperature": 28.4,
    "feels_like": 30.1,
    "humidity": 65,
    "pressure": 1011,
    "wind_speed": 12.5,
    "wind_direction": 180,
    "visibility": 10,
    "cloud_cover": 40,
    "rainfall": 0,
    "uv_index": 5.2,
    "weather_code": 2,
    "weather_description": "Partly cloudy",
    "is_day": 1,
    "sunrise": "2026-07-16T06:10",
    "sunset": "2026-07-16T18:45"
  }
  ```

### AI Assistant Query
* **Path**: `/api/assistant/query`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "question": "Should I bring an umbrella today?",
    "lat": 12.97,
    "lon": 77.59,
    "city_name": "Bengaluru"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "answer": "Yes, precipitation is expected this afternoon. Rain probability is high.",
    "confidence": "High",
    "weather_context": "LIVE WEATHER DATA: temp range 21°C - 29°C, rain probability 80%...",
    "recommendations": [
      "Carry an umbrella or raincoat",
      "Avoid traveling during peak afternoon rain hours"
    ],
    "powered_by": "gemini"
  }
  ```

### ML Predictions
* **Path**: `/api/ml/predictions`
* **Method**: `GET`
* **Query Parameters**:
  - `lat` (Number, Required)
  - `lon` (Number, Required)
* **Response (200 OK)**:
  ```json
  {
    "location_lat": 12.97,
    "location_lon": 77.59,
    "predictions": [
      {
        "target": "Tomorrow Max Temperature",
        "predicted_value": 29.5,
        "unit": "°C",
        "confidence": 92,
        "model_used": "Gradient Boosting",
        "lower_bound": 28.1,
        "upper_bound": 30.9
      }
    ],
    "generated_at": "2026-07-16T17:15:00.000Z"
  }
  ```
