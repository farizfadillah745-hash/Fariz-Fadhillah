import React from 'react';
import { Store } from '../types';
import { StoreMarkers } from './StoreMarkers';

interface ClusterMarkersProps {
  stores: Store[];
  activeStoreId?: string;
  onStoreClick: (store: Store) => void;
  zoomLevel: number;
}

export const ClusterMarkers: React.FC<ClusterMarkersProps> = ({
  stores,
  activeStoreId,
  onStoreClick,
  zoomLevel
}) => {
  // If zoom level is very small (zoomed out far), we can cluster markers by city to look extremely professional!
  const isFarZoom = zoomLevel < 6;

  if (isFarZoom) {
    // Group by city
    const cityGroups: { [city: string]: { stores: Store[]; lat: number; lng: number } } = {};
    
    stores.forEach(store => {
      if (store.latitude && store.longitude) {
        if (!cityGroups[store.city]) {
          cityGroups[store.city] = {
            stores: [],
            lat: store.latitude,
            lng: store.longitude
          };
        }
        cityGroups[store.city].stores.push(store);
      }
    });

    return (
      <>
        {Object.entries(cityGroups).map(([cityName, data], idx) => {
          const count = data.stores.length;
          const firstStore = data.stores[0];

          return (
            <StoreMarkers 
              key={idx}
              stores={data.stores}
              activeStoreId={activeStoreId}
              onStoreClick={onStoreClick}
            />
          );
        })}
      </>
    );
  }

  return (
    <StoreMarkers 
      stores={stores}
      activeStoreId={activeStoreId}
      onStoreClick={onStoreClick}
    />
  );
};
