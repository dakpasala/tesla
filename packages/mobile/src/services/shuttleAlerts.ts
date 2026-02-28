// packages/mobile/src/services/shuttleAlerts.ts

// Service for submitting and fetching shuttle reports and announcements.
// Provides both user-facing report submission and admin-only routes for managing alerts.
// Includes helpers for fetching all reports, counts, and region-wide announcements.

import { get, post } from './crud';

export type Report = {
  id: string;
  shuttleName: string;
  comment: string;
  createdAt: string;
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
): Promise<Report> {
  return post<Report>(`shuttles/${encodeURIComponent(shuttleName)}/reports`, {
    comment,
  });
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

// get total count
export async function getShuttleReportsCount(): Promise<number> {
  const response = await get<{ count: number }>('shuttles/admin/count');
  return response.count;
}

// fetch reports for a specific shuttle
export async function getShuttleReportsAdmin(
  shuttleName: string
): Promise<Report[]> {
  return get<Report[]>(
    `shuttles/admin/${encodeURIComponent(shuttleName)}/reports`
  );
}

// create alert for a single shuttle
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

// create alert for ALL shuttles
export async function createShuttleAlertAdminAll(alert: {
  type: string;
  reason: string;
  delayMinutes?: number;
  clearReports?: boolean;
}): Promise<ShuttleAlert> {
  return post<ShuttleAlert>('shuttles/admin/alerts/all', alert);
}

export type Announcement = {
  id: string;
  shuttleName: string;
  delayMinutes: number;
  createdAt: string;
};

export type AnnouncementsResponse = {
  announcements: Announcement[];
};

// alerts = announcements
export async function getAnnouncements(): Promise<Announcement[]> {
  const response = await get<AnnouncementsResponse>(
    'shuttles/admin/announcements'
  );
  return response.announcements;
}

export type ReportsResponse = {
  reports: Report[];
};

// fetch all reports across all shuttles
export async function getAllReports(): Promise<Report[]> {
  const response = await get<ReportsResponse>('shuttles/admin/reports');
  return response.reports;
}
