// Navigation type definitions
export type RootStackParamList = {
  // Main App Screens
  MainHome: undefined;
  Routes: { destinationId?: string; destinationName?: string } | undefined;
  Directions: { routeId: string };
  Favorites: undefined;
  Profile: undefined;
  Settings: undefined;
  Parking: { fromRoutes?: boolean } | undefined;

  // Admin Screens
  Admin: undefined;
  AdminUsers: undefined;
  AdminParking: undefined;
  AdminAlerts: undefined;
};

// Screen names as constants for type-safe navigation
export const SCREENS = {
  MAIN_HOME: 'MainHome',
  ROUTES: 'Routes',
  DIRECTIONS: 'Directions',
  FAVORITES: 'Favorites',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  PARKING: 'Parking',
  ADMIN: 'Admin',
  ADMIN_USERS: 'AdminUsers',
  ADMIN_PARKING: 'AdminParking',
  ADMIN_ALERTS: 'AdminAlerts',
} as const;
