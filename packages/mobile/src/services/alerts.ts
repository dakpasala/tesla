// packages/mobile/src/services/alerts.ts
import { get, del } from './crud';

export type ParkingAlert = {
  type: 'parking';
  locationId: number;
  locationName: string;
  lot: string;
  available: number;
  threshold: number;
  alertType: 'BELOW' | 'RECOVERY';
  timestamp: number;
};

export type ShuttleAlert = {
  type: 'shuttle';
  shuttleId: string;
  event: string;
  etaMinutes: number;
  timestamp: number;
};

export type Alert = ParkingAlert | ShuttleAlert;

export type AlertsResponse = {
  alerts: Alert[];
};

export async function getUserAlerts(userId: number): Promise<Alert[]> {
  const response = await get<AlertsResponse>(`alerts/${userId}`);
  return response.alerts;
}

export async function clearUserAlerts(userId: number): Promise<void> {
  await del(`alerts/${userId}`);
}
