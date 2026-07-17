import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Location = {
  lat: number;
  lon: number;
  name: string;
};

type LocationContextType = {
  location: Location;
  setLocation: (loc: Location) => void;
  refreshLocation: () => void;
  isLoadingLocation: boolean;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DEFAULT_LOCATION: Location = {
  lat: 51.5074,
  lon: -0.1278,
  name: 'London',
};

const STORAGE_KEY = 'aerisyn_location';

function loadSavedLocation(): Location | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'lat' in parsed &&
      'lon' in parsed &&
      'name' in parsed
    ) {
      return parsed as Location;
    }
    return null;
  } catch {
    return null;
  }
}

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocationState] = useState<Location>(DEFAULT_LOCATION);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const fetchDeviceLocation = useCallback(() => {
    setIsLoadingLocation(true);
    if (!navigator.geolocation) {
      setIsLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: Location = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: 'Current Location',
        };
        setLocationState(loc);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        setIsLoadingLocation(false);
      },
      (err) => {
        console.warn('Geolocation unavailable:', err.code);
        setIsLoadingLocation(false);
      }
    );
  }, []);

  useEffect(() => {
    const saved = loadSavedLocation();
    if (saved) {
      setLocationState(saved);
      setIsLoadingLocation(false);
    } else {
      fetchDeviceLocation();
    }
  }, [fetchDeviceLocation]);

  const setLocation = useCallback((loc: Location) => {
    setLocationState(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation, refreshLocation: fetchDeviceLocation, isLoadingLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
};
