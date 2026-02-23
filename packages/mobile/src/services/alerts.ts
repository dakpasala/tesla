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
  shuttleName: string;
  routeName: string;
  message: string;
  event: string;
  etaMinutes: number;
  timestamp: number;
};

export type ShuttleAdminAlert = {
  type: 'shuttle_alert';
  shuttleName: string;
  alertId: string;
  alertType: string;
  reason: string;
  delayMinutes: number | null;
  message: string;
  timestamp: number;
};

export type ShuttleAllAlert = {
  type: 'shuttle_alert';
  shuttleName: 'All Shuttles';
  alertId: string;
  alertType: string;
  reason: string;
  delayMinutes: number | null;
  message: string; 
  timestamp: number;
};

export type Alert = ParkingAlert | ShuttleAlert | ShuttleAdminAlert | ShuttleAllAlert;

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