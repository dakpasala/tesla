import { get, post } from './crud';

export type ShuttleReport = {
  id?: string;
  shuttleName: string;
  comment: string;
  createdAt?: string;
};

export type ShuttleAlert = {
  id?: string;
  shuttleName: string;
  type: string;
  reason: string;
  delayMinutes?: number;
  clearReports?: boolean;
  createdAt?: string;
};

// submit a report
export async function submitShuttleReport(
  shuttleName: string,
  comment: string
): Promise<ShuttleReport> {
  return post<ShuttleReport>(
    `shuttles/${encodeURIComponent(shuttleName)}/reports`,
    { comment }
  );
}

// fetch alerts
export async function getShuttleAlerts(
  shuttleName: string
): Promise<ShuttleAlert[]> {
  return get<ShuttleAlert[]>(
    `shuttles/${encodeURIComponent(shuttleName)}/alerts`
  );
}

// ADMIN ROUTES

// fetch reports
export async function getShuttleReportsAdmin(
  shuttleName: string
): Promise<ShuttleReport[]> {
  return get<ShuttleReport[]>(
    `shuttles/admin/${encodeURIComponent(shuttleName)}/reports`
  );
}

// create alert
export async function createShuttleAlertAdmin(
  shuttleName: string,
  alert: {
    type: string;
    reason: string;
    delayMinutes?: number;
    clearReports?: boolean;
  }
): Promise<ShuttleAlert> {
  return post<ShuttleAlert>(
    `shuttles/admin/${encodeURIComponent(shuttleName)}/alerts`,
    alert
  );
}
