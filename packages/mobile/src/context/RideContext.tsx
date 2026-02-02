import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Destination = {
  id: string;
  title: string;
  subtitle: string;
  coordinate?: Coordinate;
};

export type TravelMode = 'car' | 'shuttle' | 'transit' | 'bike';

interface RideContextType {
  destination: Destination | null;
  setDestination: (dest: Destination | null) => void;
  travelMode: TravelMode;
  setTravelMode: (mode: TravelMode) => void;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider = ({ children }: { children: ReactNode }) => {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('shuttle');

  return (
    <RideContext.Provider
      value={{
        destination,
        setDestination,
        travelMode,
        setTravelMode,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRideContext = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRideContext must be used within a RideProvider');
  }
  return context;
};
