import React, { useState } from 'react';
import { Car, Footprints, Train, Navigation, ArrowLeft, Clock, Compass } from 'lucide-react';
import { Store } from '../types';

interface DirectionsPanelProps {
  store: Store;
  distanceKm: number;
  onClose: () => void;
  hasValidKey: boolean;
}

export type TransportMode = 'DRIVING' | 'WALKING' | 'TRANSIT';

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  store,
  distanceKm,
  onClose,
  hasValidKey
}) => {
  const [mode, setMode] = useState<TransportMode>('DRIVING');

  // Calculate simulated speed and durations based on selected transport mode
  const getStats = () => {
    let speed = 40; // km/h for driving
    let modeLabel = 'Mengemudi';
    
    if (mode === 'WALKING') {
      speed = 5; // km/h
      modeLabel = 'Berjalan kaki';
    } else if (mode === 'TRANSIT') {
      speed = 30; // km/h
      modeLabel = 'Transportasi Umum';
    }

    const durationHrs = distanceKm / speed;
    const durationMinutes = Math.max(1, Math.round(durationHrs * 60));

    let durationText = `${durationMinutes} mnt`;
    if (durationMinutes >= 60) {
      const hrs = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      durationText = `${hrs} jam ${mins} mnt`;
    }

    return {
      durationText,
      modeLabel,
      distanceText: `${distanceKm.toFixed(1)} km`
    };
  };

  const stats = getStats();

  return (
    <div id="directions-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white font-sans shadow-xl animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <button 
          onClick={onClose}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar
        </button>
        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          RUTE AKTIF
        </span>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-bold text-slate-300">Menuju Ke:</h4>
        <h3 className="text-sm font-extrabold text-white mt-0.5">{store.name}</h3>
        <p className="text-[10px] text-slate-400 mt-1 leading-normal truncate">{store.address}</p>
      </div>

      {/* Transport Mode Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setMode('DRIVING')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all text-[10px] font-bold ${
            mode === 'DRIVING' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car className="w-4 h-4 mb-1" />
          Mobil/Motor
        </button>
        <button
          onClick={() => setMode('WALKING')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all text-[10px] font-bold ${
            mode === 'WALKING' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Footprints className="w-4 h-4 mb-1" />
          Jalan Kaki
        </button>
        <button
          onClick={() => setMode('TRANSIT')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all text-[10px] font-bold ${
            mode === 'TRANSIT' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Train className="w-4 h-4 mb-1" />
          KRL / MRT
        </button>
      </div>

      {/* Travel Summary Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Estimasi Waktu</span>
          <span className="font-extrabold text-emerald-400 flex items-center gap-1 font-mono text-sm">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {stats.durationText}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-slate-900 pt-2">
          <span className="text-slate-400 font-medium">Jarak Tempuh</span>
          <span className="font-bold text-slate-200 font-mono">
            {stats.distanceText}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] border-t border-slate-900 pt-2 text-slate-400">
          <span>Moda Terpilih</span>
          <span>{stats.modeLabel}</span>
        </div>
      </div>

      {/* Simulated Turn-by-Turn Guidance */}
      <div className="mt-4 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
          <Navigation className="w-3 h-3 text-emerald-500" />
          Panduan Navigasi ({stats.modeLabel})
        </div>
        <ol className="text-[10px] text-slate-400 space-y-1.5 list-decimal pl-4 leading-normal">
          <li>Mulai dari lokasi Anda sekarang.</li>
          <li>Menuju arah timur raya sepanjang rute utama.</li>
          <li>Ikuti petunjuk peta {hasValidKey ? "langsung GPS" : "interaktif FashCollab"} menuju mall/pusat belanja.</li>
          <li>Tujuan Anda berada di sebelah kiri Anda.</li>
        </ol>
      </div>
    </div>
  );
};
