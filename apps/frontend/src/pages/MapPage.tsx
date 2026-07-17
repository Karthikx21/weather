import React, { useState, useEffect } from 'react';
import { useLocationContext } from '@/contexts/LocationContext';
import { useSearchLocations, useGetCurrentWeather } from '@workspace/api-client-react';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { WeatherIcon } from '@/components/WeatherIcon';
import 'leaflet/dist/leaflet.css';

import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OWM_KEY = import.meta.env.VITE_OWM_API_KEY ?? '';

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

function WeatherMarker({ lat, lon }: { lat: number; lon: number }) {
  const { data } = useGetCurrentWeather(
    { lat, lon },
    { query: { enabled: !!lat && !!lon, staleTime: 5 * 60 * 1000 } }
  );
  if (!data) return null;

  return (
    <Marker position={[lat, lon]}>
      <Popup>
        <div className="text-center p-1 min-w-[110px]">
          <div className="text-3xl mb-1"><WeatherIcon code={data.weather_code} /></div>
          <div className="text-2xl font-bold font-mono">{Math.round(data.temperature)}°</div>
          <div className="text-sm capitalize text-gray-600">{data.weather_description}</div>
          <div className="text-xs mt-2 flex items-center justify-center gap-2">
            <span>💧 {data.humidity}%</span>
            <span>💨 {data.wind_speed}km/h</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapPage() {
  const { location, setLocation } = useLocationContext();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { data: results } = useSearchLocations(
    { q: debouncedQuery, limit: 5 },
    { query: { enabled: debouncedQuery.length > 2 } }
  );

  return (
    <div className="flex flex-col gap-4 pb-6" style={{ height: 'calc(100dvh - 120px)', minHeight: '500px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">Live Map</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Interactive global weather visualization</p>
        </div>

        {/* Search — z-index above map */}
        <div className="relative w-full sm:w-auto sm:min-w-[280px] max-w-sm" style={{ zIndex: 1000 }}>
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Fly to location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[44px]"
              aria-label="Search for a location"
            />
          </div>
          {results && results.length > 0 && query.length > 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden">
              <ul className="py-2" role="listbox" aria-label="Location suggestions">
                {results.map((res) => (
                  <li key={`${res.lat}-${res.lon}`} role="option" aria-selected={false}>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors min-h-[44px]"
                      onClick={() => {
                        setLocation({ lat: res.lat, lon: res.lon, name: res.name });
                        setQuery('');
                      }}
                    >
                      <span className="font-medium block">{res.name}</span>
                      <span className="text-xs text-muted-foreground">{res.country}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Map container — fills remaining space */}
      <div className="flex-1 min-h-[300px] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl" style={{ zIndex: 0 }}>
        <MapContainer
          center={[location.lat, location.lon]}
          zoom={10}
          className="w-full h-full"
          zoomControl={false}
        >
          <MapUpdater center={[location.lat, location.lon]} />

          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Dark Map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>

            {OWM_KEY && (
              <>
                <LayersControl.Overlay checked name="Precipitation">
                  <TileLayer
                    url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
                    opacity={0.6}
                  />
                </LayersControl.Overlay>
                <LayersControl.Overlay name="Clouds">
                  <TileLayer
                    url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
                    opacity={0.6}
                  />
                </LayersControl.Overlay>
              </>
            )}
          </LayersControl>

          <WeatherMarker lat={location.lat} lon={location.lon} />
        </MapContainer>
      </div>
    </div>
  );
}
