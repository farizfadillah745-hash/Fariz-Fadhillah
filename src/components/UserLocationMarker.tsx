import React from 'react';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface UserLocationMarkerProps {
  position: { lat: number; lng: number };
  accuracy?: number; // in meters
}

export const UserLocationMarker: React.FC<UserLocationMarkerMarkerProps & any> = ({ 
  position 
}) => {
  return (
    <AdvancedMarker position={position}>
      <div className="relative flex flex-col items-center">
        <div className="bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-bounce mb-1">
          📍 Lokasi Saya
        </div>
        
        {/* Pulsing Outer Circle */}
        <div className="w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400 animate-ping absolute -bottom-1"></div>
        
        {/* Small Solid Dot inside pin */}
        <Pin background="#2563eb" borderColor="#ffffff" glyphColor="#ffffff" scale={0.9} />
      </div>
    </AdvancedMarker>
  );
};

// Exporting a non-google fallback variant as well for sandbox vector map
export const UserLocationFallback: React.FC<{ positionPercent: { x: number; y: number } }> = ({ positionPercent }) => {
  return (
    <div
      className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none"
      style={{ left: `${positionPercent.x}%`, top: `${positionPercent.y}%` }}
    >
      <div className="flex flex-col items-center">
        <div className="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 uppercase tracking-wider">
          Saya (Simulasi)
        </div>
        <div className="relative w-4 h-4 mt-1">
          <div className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping"></div>
          <div className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-md mx-auto my-0.5"></div>
        </div>
      </div>
    </div>
  );
};
