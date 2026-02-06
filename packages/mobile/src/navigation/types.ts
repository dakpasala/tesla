// Navigation type definitions
import type { RouteResponse } from '../services/maps';

export type RootStackParamList = {
  // Main App Screens
  Map:
    | {
        destinationName?: string;
        destinationAddress?: string;
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
  ShuttleReports: { shuttleName: string };
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
  MAP: 'Map',
  FAVORITES: 'Favorites',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  PARKING: 'Parking',
  ADMIN: 'Admin',
  ADMIN_USERS: 'AdminUsers',
  ADMIN_PARKING: 'AdminParking',
  ADMIN_ALERTS: 'AdminAlerts',
} as const;