// Navigation type definitions
import type { RouteResponse } from '../services/maps';

export type RootStackParamList = {
  // Main App Screens
  MainHome: undefined;
  Quickstart:
    | {
        destinationId?: string;
        destinationName?: string;
        destination?: string;
        routeData?: RouteResponse;
      }
    | undefined;
  Availability:
    | {
        routeId?: string;
        parkingLotName?: string;
        travelMode?: 'car' | 'shuttle' | 'transit' | 'bike';
        startInDetailView?: boolean;
        destinationName?: string;
      }
    | undefined;
  Favorites: undefined;
  Profile: undefined;
  Settings: undefined;
  Parking: { fromRoutes?: boolean } | undefined;
  Rewards: undefined;

  // Admin
  AdminHome: undefined;
  ShuttleDashboard: undefined;
  LiveAlerts: undefined;
  ParkingManagement: undefined;

  // Admin Screens
  Admin: undefined;
  AdminUsers: undefined;
  AdminParking: undefined;
  AdminAlerts: undefined;
};

// Screen names as constants for type-safe navigation
export const SCREENS = {
  MAIN_HOME: 'MainHome',
  QUICKSTART: 'Quickstart',
  AVAILABILITY: 'Availability',
  FAVORITES: 'Favorites',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  PARKING: 'Parking',
  ADMIN: 'Admin',
  ADMIN_USERS: 'AdminUsers',
  ADMIN_PARKING: 'AdminParking',
  ADMIN_ALERTS: 'AdminAlerts',
} as const;
