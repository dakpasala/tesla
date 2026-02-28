// Polls the server every 30 seconds for pending parking and shuttle alerts for the current user.
// Dispatches local push notifications for each alert type and clears them after delivery.

import { useEffect } from 'react';
import { getUserAlerts, clearUserAlerts } from '../services/alerts';
import {
  showParkingNotification,
  showShuttleNotification,
  requestNotificationPermission,
} from '../services/notifications';

export function useMapAlerts(userId: number | null) {
  // Request permissions
  useEffect(() => {
    if (userId) {
      requestNotificationPermission();
    }
  }, [userId]);

  // Poll for alerts
  useEffect(() => {
    if (!userId) return;

    const checkAlerts = async () => {
      try {
        const alerts = await getUserAlerts(userId);

        for (const alert of alerts) {
          if (alert.type === 'parking') {
            await showParkingNotification({
              locationName: alert.locationName,
              lot: alert.lot,
              available: alert.available,
              type: alert.alertType,
            });
          } else if (alert.type === 'shuttle') {
            // ETA notification from polling job
            await showShuttleNotification({
              shuttleName: alert.shuttleName,
              message: alert.message,
              event: alert.event,
              etaMinutes: alert.etaMinutes,
            });
          } else if (alert.type === 'shuttle_alert') {
            // Admin-posted alert (delay, weather, road closure etc.)
            await showShuttleNotification({
              shuttleName: alert.shuttleName,
              message: alert.message,
              event: alert.alertType,
              etaMinutes: alert.delayMinutes ?? 0,
            });
          }
        }

        if (alerts.length > 0) {
          await clearUserAlerts(userId);
        }
      } catch (err) {
        console.error('Failed to check alerts:', err);
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [userId]);
}