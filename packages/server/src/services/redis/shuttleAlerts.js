import { getRedisClient } from './redisClient.js';

export async function addShuttleReport(shuttleName, comment) {
  const redis = await getRedisClient();

  const report = {
    id: `report_${Date.now()}`,
    comment,
    created_at: new Date().toISOString(),
  };

  const key = `reports:shuttle:${shuttleName}`;

  await redis.rPush(key, JSON.stringify(report));
  await redis.expire(key, 86400); // expire in 24h

  return report;
}

export async function getShuttleReports(shuttleName) {
  const redis = await getRedisClient();

  const key = `reports:shuttle:${shuttleName}`;
  const reports = await redis.lRange(key, 0, -1);

  return reports.map(JSON.parse);
}

export async function createShuttleAlert({
  shuttleName,
  type,            // "delay" | "cancellation"
  reason,          // "traffic", "weather", etc.
  delayMinutes,    // number | null
  clearReports,    // boolean
}) {
  const redis = await getRedisClient();

  const alert = {
    id: `alert_${Date.now()}`,
    type,
    reason,
    delay_minutes: delayMinutes,
    created_at: new Date().toISOString(),
  };

  const alertKey = `alerts:shuttle:${shuttleName}`;
  const reportKey = `reports:shuttle:${shuttleName}`;

  // push alert
  await redis.rPush(alertKey, JSON.stringify(alert));

  await redis.expire(alertKey, 86400);

  // optionally clear reports
  if (clearReports) {
    await redis.del(reportKey);
  }

  return alert;
}

export async function getShuttleAlerts(shuttleName) {
  const redis = await getRedisClient();

  const key = `alerts:shuttle:${shuttleName}`;
  const alerts = await redis.lRange(key, 0, -1);

  return alerts.map(JSON.parse);
}
