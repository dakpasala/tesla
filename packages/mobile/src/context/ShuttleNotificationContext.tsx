import React, { createContext, useState, useCallback, ReactNode } from 'react';

export interface ShuttleNotificationState {
  visible: boolean;
  etaMinutes: number;
  stopName: string;
  isDelayed: boolean;
  stopStatus?: any[];
  nextStops?: string[];
}

interface ShuttleNotificationContextType {
  notification: ShuttleNotificationState;
  showNotification: (data: Omit<ShuttleNotificationState, 'visible'>) => void;
  hideNotification: () => void;
}

export const ShuttleNotificationContext = createContext<
  ShuttleNotificationContextType | undefined
>(undefined);

export const ShuttleNotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notification, setNotification] = useState<ShuttleNotificationState>({
    visible: false,
    etaMinutes: 0,
    stopName: '',
    isDelayed: false,
    stopStatus: undefined,
    nextStops: undefined,
  });

  const showNotification = useCallback(
    (data: Omit<ShuttleNotificationState, 'visible'>) => {
      setNotification(prev => ({
        ...prev,
        ...data,
        visible: true,
      }));
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  return (
    <ShuttleNotificationContext.Provider
      value={{ notification, showNotification, hideNotification }}
    >
      {children}
    </ShuttleNotificationContext.Provider>
  );
};

export const useShuttleNotification = () => {
  const context = React.useContext(ShuttleNotificationContext);
  if (!context) {
    throw new Error(
      'useShuttleNotification must be used within ShuttleNotificationProvider'
    );
  }
  return context;
};
