import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface LocationSearchProps {
  onLocationSelected: (lat: number, lng: number, addressName?: string) => void;
  hasValidKey: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelected,
  hasValidKey,
  searchQuery,
  setSearchQuery
}) => {
  const placesLib = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fallback simulator suggestions
  const indonesianCities = [
    { name: "Jakarta Pusat, DKI Jakarta", lat: -6.1951, lng: 106.8208 },
    { name: "Bandung, Jawa Barat", lat: -6.8893, lng: 107.5959 },
    { name: "Surabaya, Jawa Timur", lat: -7.2625, lng: 112.7383 },
    { name: "Medan, Sumatera Utara", lat: 3.5852, lng: 98.6716 },
    { name: "Badung (Kuta), Bali", lat: -8.7185, lng: 115.1685 },
    { name: "Makassar, Sulawesi Selatan", lat: -5.1581, lng: 119.3970 }
  ];

  // Initialize real Google Places autocomplete if active
  useEffect(() => {
    if (!hasValidKey || !placesLib || !inputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address', 'name'],
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'id' } // Restrict to Indonesia
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const name = place.name || place.formatted_address || '';
        onLocationSelected(lat, lng, name);
        setSearchQuery(name);
      }
    });

    return () => {
      if (google && google.maps && google.maps.event) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [placesLib, hasValidKey, onLocationSelected, setSearchQuery]);

  // Fallback interactive search input logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!hasValidKey) {
      if (val.trim() === '') {
        setSuggestions([]);
        setShowDropdown(false);
      } else {
        const filtered = indonesianCities.filter(city =>
          city.name.toLowerCase().includes(val.toLowerCase())
        );
        setSuggestions(filtered);
        setShowDropdown(true);
      }
    }
  };

  const handleSuggestionClick = (city: any) => {
    onLocationSelected(city.lat, city.lng, city.name);
    setSearchQuery(city.name);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div id="location-search-box" className="relative w-full font-sans">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={hasValidKey ? "Cari alamat, mall, kota atau toko..." : "Ketik kota (Jakarta, Bandung, Bali, dll)..."}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (!hasValidKey && searchQuery.trim() !== '') {
              setShowDropdown(true);
            }
          }}
          className="pl-9 pr-8 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-all focus:shadow-md"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSuggestions([]);
              setShowDropdown(false);
            }}
            className="absolute right-3 top-2.5 hover:text-slate-600 text-slate-400 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Simulator Suggestions Dropdown */}
      {!hasValidKey && showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-50 animate-fade-in">
          {suggestions.map((city, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(city)}
              className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{city.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
