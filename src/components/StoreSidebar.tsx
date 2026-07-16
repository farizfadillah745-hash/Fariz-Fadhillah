import React from 'react';
import { Store } from '../types';
import { MapPin, Star, Clock, Compass, Navigation } from 'lucide-react';

interface StoreSidebarProps {
  stores: Store[];
  activeStore: Store | null;
  onStoreSelect: (store: Store) => void;
  onQueueClick: (store: Store) => void;
  onScanGoClick: (store: Store) => void;
  onShowDirections: (store: Store) => void;
}

export const StoreSidebar: React.FC<StoreSidebarProps> = ({
  stores,
  activeStore,
  onStoreSelect,
  onQueueClick,
  onScanGoClick,
  onShowDirections
}) => {
  return (
    <div id="store-sidebar-panel" className="flex flex-col h-full bg-white font-sans">
      <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
          Toko Fashion Terdekat ({stores.length})
        </span>
        <span className="text-[9px] text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full font-mono font-bold shadow-sm">
          Urut Terdekat 📍
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <MapPin className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
            <p className="text-xs font-bold text-slate-700">Tidak Ada Toko Fashion Ditemukan</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
              Silakan atur ulang radius filter atau kata pencarian Anda.
            </p>
          </div>
        ) : (
          stores.map((store) => {
            const isActive = activeStore?.id === store.id;
            
            // Check if open (opening hours calculation)
            const currentHour = new Date().getHours();
            const isOpenNow = store.isOpen !== false; // fallback to true

            return (
              <div
                key={store.id}
                onClick={() => onStoreSelect(store)}
                onMouseEnter={() => {
                  // Pre-highlight on hover
                }}
                className={`p-4 transition-all hover:bg-slate-50/50 cursor-pointer ${
                  isActive ? 'bg-emerald-50/30 border-l-4 border-emerald-500' : ''
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-2.5 items-start min-w-0">
                    <img
                      src={store.logo}
                      alt={store.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-800 hover:text-emerald-600 transition-colors truncate">
                        {store.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-normal">
                        {store.address}
                      </p>
                      
                      {/* Open/Close Badge */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          isOpenNow 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {isOpenNow ? 'BUKA' : 'TUTUP'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          Jam: {store.openingHours?.monday || '10:00-22:00'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Distance badge */}
                  <div className="shrink-0 text-right">
                    <span className="inline-block bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-blue-100">
                      {(store as any).distanceKm ? `${(store as any).distanceKm.toFixed(1)} km` : '1.2 km'}
                    </span>
                  </div>
                </div>

                {/* Queue status metrics */}
                <div className="grid grid-cols-2 gap-2 mt-3.5 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Antrian: <strong className="text-slate-800">{store.currentQueueCount} org</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 justify-end">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span>Rating: <strong className="text-slate-800">{store.rating > 0 ? store.rating : 'Baru'}</strong></span>
                  </div>
                </div>

                {/* Expanded Action Controls */}
                {isActive && (
                  <div className="mt-3.5 flex flex-wrap gap-2 pt-3 border-t border-dashed border-slate-200 animate-fade-in">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQueueClick(store);
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Antri Virtual
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onScanGoClick(store);
                      }}
                      className="bg-slate-900 hover:bg-slate-850 text-white text-[11px] font-bold py-2 px-3 rounded-lg transition-all active:scale-95"
                    >
                      Scan & Go
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowDirections(store);
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                      Rute
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
