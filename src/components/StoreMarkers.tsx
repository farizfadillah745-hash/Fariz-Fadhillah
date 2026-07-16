import React from 'react';
import { Store } from '../types';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Shirt, Footprints, Sparkles, Store as StoreIcon } from 'lucide-react';

interface StoreMarkersProps {
  stores: Store[];
  activeStoreId?: string;
  onStoreClick: (store: Store) => void;
}

export const StoreMarkers: React.FC<StoreMarkersProps> = ({
  stores,
  activeStoreId,
  onStoreClick
}) => {
  return (
    <>
      {stores.map((store) => {
        if (!store.latitude || !store.longitude) return null;
        const isSelected = activeStoreId === store.id;

        // Custom styling based on category
        let color = '#4f46e5'; // default indigo
        if (store.category === 'baju') color = '#10b981'; // emerald
        else if (store.category === 'sepatu') color = '#3b82f6'; // blue
        else if (store.category === 'aksesori') color = '#f59e0b'; // amber

        return (
          <AdvancedMarker
            key={store.id}
            position={{ lat: store.latitude, lng: store.longitude }}
            onClick={() => onStoreClick(store)}
          >
            <div className="relative cursor-pointer group">
              {/* Tooltip Hover Badge */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg border border-slate-800 shadow-xl whitespace-nowrap z-50">
                <span className="font-bold block">{store.name}</span>
                <span className="text-[9px] text-slate-400">Antrian: {store.currentQueueCount} orang</span>
              </div>

              {/* Marker pin with Category icon inside */}
              <Pin 
                background={isSelected ? '#ec4899' : color} 
                borderColor="#ffffff"
                glyphColor="#ffffff" 
                scale={isSelected ? 1.25 : 1.0}
              />
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};
