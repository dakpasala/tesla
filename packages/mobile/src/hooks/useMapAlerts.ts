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
            await showShuttleNotification({
              shuttleId: alert.shuttleId,
              event: alert.event,
              etaMinutes: alert.etaMinutes,
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
