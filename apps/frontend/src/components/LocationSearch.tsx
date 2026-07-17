import React, { useState, useEffect } from 'react';
import { useSearchLocations } from '@workspace/api-client-react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useLocationContext } from '@/contexts/LocationContext';
import { useDebounce } from '@/hooks/use-debounce';

export function LocationSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [isOpen, setIsOpen] = useState(false);
  const { setLocation, refreshLocation } = useLocationContext();

  const { data: results, isLoading } = useSearchLocations(
    { q: debouncedQuery, limit: 5 },
    { query: { enabled: debouncedQuery.length > 2 } }
  );

  useEffect(() => {
    const handleClick = () => setIsOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search city..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/70 min-h-[44px]"
          aria-label="Search for a city"
          aria-expanded={isOpen && query.length > 2}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            refreshLocation();
          }}
          className="absolute right-2 p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Use current location"
          aria-label="Use current location"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>

      {isOpen && query.length > 2 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden"
          style={{ zIndex: 60 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : results && results.length > 0 ? (
            <ul className="py-2" role="listbox" aria-label="City suggestions">
              {results.map((res) => (
                <li key={`${res.lat}-${res.lon}`} role="option" aria-selected={false}>
                  <button
                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex flex-col min-h-[44px] justify-center"
                    onClick={() => {
                      setLocation({ lat: res.lat, lon: res.lon, name: res.name });
                      setQuery('');
                      setIsOpen(false);
                    }}
                  >
                    <span className="font-medium text-sm">{res.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {res.admin1 ? `${res.admin1}, ` : ''}{res.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-center text-muted-foreground">No locations found.</div>
          )}
        </div>
      )}
    </div>
  );
}
