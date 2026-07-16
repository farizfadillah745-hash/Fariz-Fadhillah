import React from 'react';
import { AlertCircle, HelpCircle, ShieldAlert, Zap } from 'lucide-react';

interface MapErrorFallbackProps {
  errorMsg?: string;
  onDismiss?: () => void;
  onActivateSandbox?: () => void;
}

export const MapErrorFallback: React.FC<MapErrorFallbackProps> = ({ 
  errorMsg = "Gagal memuat modul Google Maps API secara langsung.",
  onActivateSandbox 
}) => {
  return (
    <div id="map-error-fallback" className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-white font-sans flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12 shadow-xl animate-fade-in">
      <div className="bg-amber-500/20 text-amber-400 p-4 rounded-full border border-amber-500/30 mb-4">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-slate-100">Google Maps API Terkendala</h3>
      <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-sm">
        {errorMsg}. Kami telah mengaktifkan <strong className="text-emerald-400">Sandbox Simulator Mode</strong> dengan peta interaktif vector agar Anda tetap dapat mencoba fungsionalitas pencarian jarak secara real-time.
      </p>

      <div className="w-full bg-slate-950 rounded-xl p-4 border border-slate-800 text-left mb-6">
        <div className="flex gap-2.5 items-start">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-200">Ingin Mengaktifkan Live Google Maps?</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Dapatkan Google Maps API Key Anda dari Google Cloud Console dengan modul <strong>Maps JavaScript API</strong>, <strong>Places API (New)</strong>, dan <strong>Geocoding API</strong> diaktifkan. Kemudian tambahkan ke Secrets Anda dengan nama <code className="bg-slate-800 text-emerald-300 px-1 py-0.5 rounded font-mono">GOOGLE_MAPS_PLATFORM_KEY</code>.
            </p>
          </div>
        </div>
      </div>

      {onActivateSandbox && (
        <button
          onClick={onActivateSandbox}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Masuk ke Simulator Mode Terpadu
        </button>
      )}
    </div>
  );
};
