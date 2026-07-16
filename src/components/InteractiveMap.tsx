import React, { useState, useMemo, useEffect } from 'react';
import { Store } from '../types';
import { GoogleMapsWrapper } from './GoogleMapsWrapper';
import { LocationSearch } from './LocationSearch';
import { RadiusSlider } from './RadiusSlider';
import { StoreSidebar } from './StoreSidebar';
import { DirectionsPanel } from './DirectionsPanel';
import { UserLocationMarker, UserLocationFallback } from './UserLocationMarker';
import { ClusterMarkers } from './ClusterMarkers';
import { MapErrorFallback } from './MapErrorFallback';
import { 
  Map, InfoWindow, Pin, useMap 
} from '@vis.gl/react-google-maps';
import { 
  Compass, MapPin, ShieldAlert, CheckCircle, Navigation, 
  Layers, Maximize, Minimize, Plus, Minus, Search, Sparkles
} from 'lucide-react';

interface InteractiveMapProps {
  stores: Store[];
  onSelectStore: (store: Store) => void;
  onScanGoClick: (store: Store) => void;
}

// Simulated pixel/vector coordinates of Indonesia city nodes on our vector map
const REGION_COORDINATES: { [key: string]: { x: number; y: number } } = {
  "Jakarta Pusat": { x: 30, y: 65 },
  "Bandung": { x: 34, y: 72 },
  "Surabaya": { x: 50, y: 74 },
  "Medan": { x: 12, y: 25 },
  "Badung (Kuta)": { x: 58, y: 82 },
  "Makassar": { x: 74, y: 55 }
};

// Haversine formula helper
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  stores, 
  onSelectStore,
  onScanGoClick 
}) => {
  // Common state values
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [radiusFilter, setRadiusFilter] = useState<number>(10000); // 10000 means "All" / Indonesian scale
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  // Route guidance states
  const [routingStore, setRoutingStore] = useState<Store | null>(null);

  // SANDBOX SIMULATOR COORDINATES
  const [sandboxMyLocation, setSandboxMyLocation] = useState<{ x: number; y: number }>({ x: 26, y: 64 }); // Default near Jakarta region

  // LIVE GPS REAL COORDINATES
  const [userLatLng, setUserLatLng] = useState<{ lat: number; lng: number }>({
    lat: -6.1951, // Jakarta Pusat
    lng: 106.8208
  });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -6.1951,
    lng: 106.8208
  });
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // List of provinces for filters
  const provinces = useMemo(() => {
    const list = new Set(stores.map(s => s.province));
    return ['all', ...Array.from(list)];
  }, [stores]);

  // Geolocation detector
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi otomatis.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLatLng({ lat, lng });
        setMapCenter({ lat, lng });
        setMapZoom(13);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        alert(`Gagal mendeteksi lokasi otomatis (${error.message}). Menggunakan koordinat default.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (hasValidKey) {
      detectUserLocation();
    }
  }, []);

  // Compute distances dynamically
  const processedStores = useMemo(() => {
    return stores.map(store => {
      let distanceKm = 1.2; // default fallback
      
      if (hasValidKey) {
        if (store.latitude && store.longitude) {
          distanceKm = calculateHaversineDistance(
            userLatLng.lat,
            userLatLng.lng,
            store.latitude,
            store.longitude
          );
        }
      } else {
        // Sandbox simulator distance mapping
        const storePos = REGION_COORDINATES[store.city] || { x: 50, y: 50 };
        const dx = storePos.x - sandboxMyLocation.x;
        const dy = storePos.y - sandboxMyLocation.y;
        distanceKm = Math.sqrt(dx * dx + dy * dy) * 12.5; // conversion multiplier
      }

      return {
        ...store,
        distanceKm
      };
    });
  }, [stores, hasValidKey, userLatLng, sandboxMyLocation]);

  // Filter & sort
  const filteredStores = useMemo(() => {
    return processedStores
      .filter(store => {
        const matchSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            store.address.toLowerCase().includes(searchQuery.toLowerCase());

        const matchCategory = selectedCategory === 'all' || store.category === selectedCategory || store.category === 'all';
        const matchProvince = selectedProvince === 'all' || store.province === selectedProvince;
        const matchRadius = radiusFilter === 10000 || store.distanceKm <= radiusFilter;

        return matchSearch && matchCategory && matchProvince && matchRadius;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [processedStores, searchQuery, selectedCategory, selectedProvince, radiusFilter]);

  // Custom Zoom Handlers (Google Maps & Fallback)
  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 20));
  };
  
  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 1));
  };

  // Click on sandbox vector map to move user location
  const handleSandboxMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasValidKey) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSandboxMyLocation({ x: Math.round(x), y: Math.round(y) });
  };

  return (
    <div id="fashcollab-master-map" className={`bg-white border border-slate-100 rounded-2xl overflow-hidden font-sans shadow-sm flex flex-col ${
      isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : 'relative h-[580px]'
    }`}>
      
      {/* Header Banner */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          {hasValidKey ? (
            <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30">
              <CheckCircle className="w-5 h-5" />
            </div>
          ) : (
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              PETA INTERAKTIF: 
              <span className={hasValidKey ? "text-emerald-400" : "text-amber-400"}>
                {hasValidKey ? "LIVE GPS AKTIF" : "SANDBOX SIMULATOR MODE"}
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
              {hasValidKey 
                ? "Sistem melacak GPS Anda secara langsung untuk mencocokkan rute navigasi dan antrian toko terdekat."
                : "Klik di titik mana saja pada Peta Vektor Indonesia di sebelah kiri untuk memperbarui jarak ke toko."
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {hasValidKey && (
            <button
              onClick={detectUserLocation}
              disabled={isLocating}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? "Menyinkronkan GPS..." : "📍 Perbarui GPS Saya"}
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors flex items-center gap-1 shrink-0"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            {isFullscreen ? "Selesai Fullscreen" : "Fullscreen Peta"}
          </button>
        </div>
      </div>

      {/* Control filters bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 grid grid-cols-1 md:grid-cols-12 gap-3 z-10">
        
        {/* Search input with autocomplete support */}
        <div className="col-span-1 md:col-span-4">
          <LocationSearch 
            hasValidKey={hasValidKey}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLocationSelected={(lat, lng, addressName) => {
              setUserLatLng({ lat, lng });
              setMapCenter({ lat, lng });
              setMapZoom(14);
              if (addressName) {
                setSearchQuery(addressName);
              }
            }}
          />
        </div>

        {/* Radius filter slider */}
        <div className="col-span-1 md:col-span-3">
          <RadiusSlider 
            radius={radiusFilter}
            onRadiusChange={setRadiusFilter}
          />
        </div>

        {/* Province Filter */}
        <div className="col-span-1 md:col-span-2.5">
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full h-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none transition-all"
          >
            <option value="all">Semua Provinsi</option>
            {provinces.filter(p => p !== 'all').map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Category selector */}
        <div className="col-span-1 md:col-span-2.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none transition-all"
          >
            <option value="all">Semua Kategori Fashion</option>
            <option value="baju">Pakaian (Baju/Celana)</option>
            <option value="sepatu">Sepatu & Sneakers</option>
            <option value="aksesori">Aksesoris & Hijab Tas</option>
          </select>
        </div>

      </div>

      {/* Main split display body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* MAP STAGE (LIVE GOOGLE MAPS vs SIMULATED RETRO IMAGE VECTOR MAP) */}
        <div className="flex-1 h-2/3 lg:h-full relative overflow-hidden bg-slate-950">
          
          {hasValidKey ? (
            <GoogleMapsWrapper apiKey={API_KEY}>
              <div className="w-full h-full relative">
                <Map
                  center={mapCenter}
                  zoom={mapZoom}
                  onCenterChanged={(e) => setMapCenter(e.detail.center)}
                  onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
                  mapTypeId={mapType}
                  mapId="FASHCOLLAB_LIVE_MAP"
                  style={{ width: '100%', height: '100%' }}
                  gestureHandling={'cooperative'}
                  disableDefaultUI={true}
                >
                  {/* User Pulse Dot */}
                  <UserLocationMarker position={userLatLng} />

                  {/* Filtered Store Pins with Clustering */}
                  <ClusterMarkers 
                    stores={filteredStores}
                    activeStoreId={activeStore?.id}
                    onStoreClick={(store) => {
                      setActiveStore(store);
                      setMapCenter({ lat: store.latitude!, lng: store.longitude! });
                    }}
                    zoomLevel={mapZoom}
                  />

                  {/* Draw circular visual boundary for active radius */}
                  {radiusFilter !== 10000 && (
                    <MapRadiusCircle position={userLatLng} radiusKm={radiusFilter} />
                  )}

                  {/* Info Window popover when activeStore pin is clicked */}
                  {activeStore && activeStore.latitude && activeStore.longitude && (
                    <InfoWindow
                      position={{ lat: activeStore.latitude, lng: activeStore.longitude }}
                      onCloseClick={() => setActiveStore(null)}
                    >
                      <div className="p-1 font-sans text-xs text-slate-800 max-w-[210px]">
                        <div className="flex gap-2 items-center">
                          <img src={activeStore.logo} className="w-7 h-7 rounded-lg object-cover border border-slate-100" />
                          <div>
                            <h4 className="font-extrabold text-slate-900 leading-tight truncate">{activeStore.name}</h4>
                            <span className="text-[9px] text-slate-400 block truncate mt-0.5">{activeStore.city}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 leading-normal">{activeStore.address}</p>
                        
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            Antri: {activeStore.currentQueueCount} org
                          </span>
                          <span className="font-bold text-slate-700 font-mono">
                            {(activeStore as any).distanceKm ? `${(activeStore as any).distanceKm.toFixed(1)} km` : '1.2 km'}
                          </span>
                        </div>

                        <div className="mt-3 flex gap-1.5 w-full">
                          <button
                            onClick={() => onSelectStore(activeStore)}
                            className="flex-1 bg-emerald-600 text-white font-bold text-[10px] py-1.5 px-2 rounded-md hover:bg-emerald-700 transition-colors"
                          >
                            Daftar Antri
                          </button>
                          <button
                            onClick={() => setRoutingStore(activeStore)}
                            className="bg-blue-600 text-white font-bold text-[10px] py-1.5 px-2 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Rute
                          </button>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </div>
            </GoogleMapsWrapper>
          ) : (
            // FALLBACK SANDBOX INTERACTIVE INDONESIA VECTOR MAP
            <div className="w-full h-full relative cursor-crosshair select-none" onClick={handleSandboxMapClick}>
              {/* Dot grid */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
              
              {/* Overlay Guidance Note */}
              <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl text-[10px] text-gray-300 border border-slate-800 pointer-events-none z-20 max-w-[250px] shadow-2xl">
                <div className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Peta Simulasi Indonesia
                </div>
                <div className="text-slate-400 mt-1.5 leading-relaxed">
                  Silakan <strong>klik di titik mana saja</strong> pada peta untuk memindahkan posisi GPS Anda. Jarak dan urutan toko di sidebar akan diperbarui secara otomatis.
                </div>
              </div>

              {/* Draw Vector Silhouettes */}
              <svg className="absolute inset-0 w-full h-full text-slate-800" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Sumatra Silhouette */}
                <polygon points="4,12 22,38 18,48 8,44 1,22" fill="currentColor" opacity="0.45" />
                {/* Java Silhouette */}
                <polygon points="22,66 58,78 62,86 44,81 26,72" fill="currentColor" opacity="0.45" />
                {/* Kalimantan Silhouette */}
                <polygon points="36,28 54,22 62,38 54,54 38,48" fill="currentColor" opacity="0.45" />
                {/* Sulawesi Silhouette */}
                <polygon points="68,38 80,34 82,48 74,60 66,52" fill="currentColor" opacity="0.45" />
                {/* Bali Silhouette */}
                <polygon points="58,82 64,83 62,87 58,86" fill="currentColor" opacity="0.45" />
              </svg>

              {/* Draw simulated route line if routing is active */}
              {routingStore && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line 
                    x1={sandboxMyLocation.x} 
                    y1={sandboxMyLocation.y} 
                    x2={(REGION_COORDINATES[routingStore.city] || { x: 50, y: 50 }).x} 
                    y2={(REGION_COORDINATES[routingStore.city] || { x: 50, y: 50 }).y} 
                    stroke="#10b981" 
                    strokeWidth="0.8" 
                    strokeDasharray="1.5,1"
                    className="animate-pulse"
                  />
                </svg>
              )}

              {/* Draw radius circle overlay around user location in sandbox */}
              {radiusFilter !== 10000 && (
                <div 
                  className="absolute border border-dashed border-emerald-500/40 bg-emerald-500/5 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 z-10"
                  style={{
                    left: `${sandboxMyLocation.x}%`,
                    top: `${sandboxMyLocation.y}%`,
                    width: `${radiusFilter * 1.5}%`,
                    height: `${radiusFilter * 1.5}%`
                  }}
                />
              )}

              {/* Pulse User Fallback */}
              <UserLocationFallback positionPercent={sandboxMyLocation} />

              {/* Store fallbacks */}
              {filteredStores.map((store) => {
                const coords = REGION_COORDINATES[store.city] || { x: 50, y: 50 };
                const isSelected = activeStore?.id === store.id;

                let categoryColor = 'bg-emerald-500'; // baju
                if (store.category === 'sepatu') categoryColor = 'bg-blue-500';
                else if (store.category === 'aksesori') categoryColor = 'bg-amber-500';

                return (
                  <button
                    key={store.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStore(store);
                    }}
                    className="absolute z-25 transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-150"
                    style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  >
                    <div className="relative flex flex-col items-center">
                      {/* Hover details */}
                      <div className={`absolute bottom-full mb-2 bg-slate-950 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl border border-slate-800 shadow-2xl transition-all duration-150 ${
                        isSelected ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                      } whitespace-nowrap z-50`}>
                        {store.name}
                        <div className="text-[9px] text-emerald-400 font-normal mt-0.5">Antri: {store.currentQueueCount} org</div>
                      </div>

                      {/* Map pin */}
                      <div className={`p-2 rounded-full shadow-2xl border-2 transition-all ${
                        isSelected 
                          ? 'bg-pink-500 border-white scale-125 z-40' 
                          : `${categoryColor} border-slate-900 group-hover:scale-115`
                      }`}>
                        <MapPin className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* LAYER SWITCHER & ZOOM WIDGETS overlayed on map */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
            {/* Map layers toggles (only if Google Maps is active) */}
            {hasValidKey && (
              <div className="flex gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
                <button
                  onClick={() => setMapType('roadmap')}
                  className={`p-1.5 rounded-lg text-[9px] font-bold transition-all ${
                    mapType === 'roadmap' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tampilan Jalan"
                >
                  Jalan
                </button>
                <button
                  onClick={() => setMapType('satellite')}
                  className={`p-1.5 rounded-lg text-[9px] font-bold transition-all ${
                    mapType === 'satellite' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Satelit"
                >
                  Satelit
                </button>
              </div>
            )}

            {/* Standard Zoom Buttons */}
            <div className="flex flex-col bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden shrink-0">
              <button
                onClick={handleZoomIn}
                className="p-2.5 hover:bg-slate-50 border-b border-slate-100 transition-colors text-slate-600 active:scale-95"
                title="Perbesar Peta"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2.5 hover:bg-slate-50 transition-colors text-slate-600 active:scale-95"
                title="Perkecil Peta"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* SIDEBAR LIST & ROUTE PLANNER (right side in desktop, bottom half on mobile) */}
        <div className="w-full lg:w-[360px] h-1/3 lg:h-full border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col bg-white shrink-0">
          
          {routingStore ? (
            // DIRECTIONS PANEL DISPLAY MODE
            <div className="p-4 flex-1 overflow-y-auto">
              <DirectionsPanel 
                store={routingStore}
                distanceKm={routingStore.distanceKm}
                onClose={() => setRoutingStore(null)}
                hasValidKey={hasValidKey}
              />
            </div>
          ) : (
            // STANDARD STORE LIST DISPLAY MODE
            <StoreSidebar 
              stores={filteredStores}
              activeStore={activeStore}
              onStoreSelect={(store) => {
                setActiveStore(store);
                if (hasValidKey && store.latitude && store.longitude) {
                  setMapCenter({ lat: store.latitude, lng: store.longitude });
                  setMapZoom(13);
                }
              }}
              onQueueClick={onSelectStore}
              onScanGoClick={onScanGoClick}
              onShowDirections={(store) => setRoutingStore(store)}
            />
          )}

        </div>

      </div>

    </div>
  );
};

// Helper internal react subcomponent for rendering search radius circles inside live maps
function MapRadiusCircle({ position, radiusKm }: { position: { lat: number; lng: number }; radiusKm: number }) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;

    // Create radius circle
    const circle = new google.maps.Circle({
      map,
      center: position,
      radius: radiusKm * 1000, // convert km to meters
      fillColor: '#10b981',
      fillOpacity: 0.08,
      strokeColor: '#10b981',
      strokeOpacity: 0.35,
      strokeWeight: 1
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, mapsLib, position, radiusKm]);

  return null;
}
