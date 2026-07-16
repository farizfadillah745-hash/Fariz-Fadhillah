import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

interface GoogleMapsWrapperProps {
  children: React.ReactNode;
  apiKey: string;
}

export const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({ children, apiKey }) => {
  const hasValidKey = Boolean(apiKey) && apiKey !== 'YOUR_API_KEY' && apiKey.trim() !== '';

  if (!hasValidKey) {
    // If no API key is specified, let's wrap it in a custom context or just render it
    // because we have an beautiful vector sandbox map!
    return <>{children}</>;
  }

  return (
    <APIProvider apiKey={apiKey} version="weekly" libraries={['places', 'geometry']}>
      {children}
    </APIProvider>
  );
};
