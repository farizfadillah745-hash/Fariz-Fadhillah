import React from 'react';
import { Store } from '../types';
import { InteractiveMap } from './InteractiveMap';

interface MapLocatorProps {
  stores: Store[];
  onSelectStore: (store: Store) => void;
}

export const MapLocator: React.FC<MapLocatorProps> = ({ stores, onSelectStore }) => {
  const handleScanGoRedirect = (store: Store) => {
    // Navigate user directly to the 'scan-go' tab in App.tsx
    const scanGoTabBtn = document.getElementById('scan-go-tab');
    if (scanGoTabBtn) {
      scanGoTabBtn.click();
    } else {
      // Fallback
      alert(`Membuka menu Scan & Go untuk ${store.name}. Silakan gunakan pemindai barcode.`);
    }
  };

  return (
    <div id="map-locator-wrapper" className="space-y-4">
      <InteractiveMap 
        stores={stores} 
        onSelectStore={onSelectStore} 
        onScanGoClick={handleScanGoRedirect}
      />
    </div>
  );
};
