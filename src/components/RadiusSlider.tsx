import React from 'react';
import { Sliders, Compass } from 'lucide-react';

interface RadiusSliderProps {
  radius: number; // in kilometers
  onRadiusChange: (newRadius: number) => void;
}

export const RadiusSlider: React.FC<RadiusSliderProps> = ({ radius, onRadiusChange }) => {
  const options = [
    { value: 5, label: '5 km (Sangat Dekat)' },
    { value: 15, label: '15 km (Dalam Kota)' },
    { value: 50, label: '50 km (Luar Kota)' },
    { value: 250, label: '250 km (Regional)' },
    { value: 10000, label: 'Semua (Seluruh Indonesia)' }
  ];

  return (
    <div id="radius-slider" className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm font-sans">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-emerald-600 animate-pulse" />
          Radius Jangkauan
        </label>
        <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
          {radius === 10000 ? 'Seluruh Indonesia' : `${radius} km`}
        </span>
      </div>

      <input
        type="range"
        min="0"
        max={options.length - 1}
        value={options.findIndex(opt => opt.value === radius)}
        onChange={(e) => {
          const index = parseInt(e.target.value);
          onRadiusChange(options[index].value);
        }}
        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 mb-1"
      />

      <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
        <span>5 km</span>
        <span>15 km</span>
        <span>50 km</span>
        <span>250 km</span>
        <span>Semua</span>
      </div>
    </div>
  );
};
