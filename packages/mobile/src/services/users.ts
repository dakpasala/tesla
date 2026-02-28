// packages/mobile/src/services/users.ts

// Service for managing user data including balance, incentives, and saved addresses.
// Handles CRUD operations for home/work addresses, favorites, and shuttle subscriptions.
// Also tracks user location state for geofence-based features at Tesla offices.

import { get, post, put, del } from './crud';

export type Favorite = { label: string; name: string; address: string };

// --------------------
// users
// --------------------

// get balance for user
export async function getUserBalance(
  userId: number
): Promise<{ userId: number; name: string; balance: number }> {
  return get(`users/${userId}/balance`);
}

// get incentives for user (this where many to one comes in)
export async function getUserIncentives(userId: number) {
  return get(`users/${userId}/incentives`);
}

// add incentives and balance for user
export async function awardTransitIncentive(
  userId: number,
  transitType: string
) {
  return post(`users/${userId}/incentives`, { transitType });
}

// --------------------
// home address
// --------------------

// get home address
export async function getUserHomeAddress(userId: number): Promise<{ userId: number; home_address: string }> {
  return get(`users/${userId}/home_address`);
}


// set home address
export async function setUserHomeAddress(userId: number, homeAddress: string) {
  return put(`users/${userId}/home_address`, { homeAddress });
}

// --------------------
// work address
// --------------------

// get work address
export async function getUserWorkAddress(userId: number): Promise<{ userId: number; work_address: string }> {
  return get(`users/${userId}/work_address`);
}

// set work address
export async function setUserWorkAddress(userId: number, workAddress: string) {
  return put(`users/${userId}/work_address`, { workAddress });
}

// --------------------
// favorites
// --------------------

// get favorites
export async function getUserFavorites(
  userId: number
): Promise<Favorite[]> {
  return get(`users/${userId}/favorites`);
}


// add favorite
export async function addUserFavorite(
  userId: number,
  favorite: Favorite
) {
  return post(`users/${userId}/favorites`, favorite);
}


// remove favorite by name
export async function removeUserFavorite(userId: number, name: string) {
  return del(`users/${userId}/favorites/${encodeURIComponent(name)}`);
}

// --------------------
// location-state
// --------------------

// add location state
export async function setUserLocationState(
  userId: number,
  state: 'AT_LOCATION' | 'LEFT_LOCATION',
  locationId: number
) {
  return post(`users/${userId}/location-state`, {
    state,
    location_id: locationId,
  });
}

// subscribe to shuttle
export async function subscribeToShuttle(userId: number, shuttleName: string) {
  return post(`users/${userId}/shuttle`, { shuttleName });
}

export async function unsubscribeFromShuttle(userId: number, shuttleName: string) {
  return del(`users/${userId}/shuttle/${encodeURIComponent(shuttleName)}`);
}
