// packages/mobile/src/services/notifications.ts

import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { AppState } from 'react-native';

export async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1; // 1 = authorized
}

export async function showParkingNotification({
  locationName,
  lot,
  available,
  type,
}: {
  locationName: string;
  lot: string;
  available: number;
  type: 'BELOW' | 'RECOVERY';
}) {
  await notifee.displayNotification({
    title: type === 'BELOW' ? '⚠️ Low Parking' : '✅ Parking Available',
    body: `${locationName} - ${lot}: ${available} spots available`,
    ios: {
      sound: 'default',
      badgeCount: 1,
    },
    data: {
      locationName,
      lot,
      available: String(available),
    },
  });
}

export async function showShuttleNotification({
  shuttleId,
  event,
  etaMinutes,
}: {
  shuttleId: string;
  event: string;
  etaMinutes: number;
}) {
  await notifee.displayNotification({
    title: '🚌 Shuttle Update',
    body: `Shuttle ${shuttleId}: ${event} (${etaMinutes} min)`,
    ios: {
      sound: 'default',
    },
  });
}

// SHUTTLE TRACKING NOTIFICATIONS (Background)

let backgroundInterval: NodeJS.Timeout | null = null;
let notificationChannelId: string | null = null;

export async function startShuttleTracking(
  rideId: string,
  stopName: string,
  getLiveStatusFn: (rideId: string) => Promise<{
    etaMinutes: number;
    isDelayed: boolean;
    delayMinutes: number;
    occupancy: number;
  }>
) {
  await requestNotificationPermission();

  if (!notificationChannelId) {
    notificationChannelId = await notifee.createChannel({
      id: 'shuttle-tracking',
      name: 'Shuttle Tracking',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const updateNotification = async () => {
    try {
      const status = await getLiveStatusFn(rideId);

      await notifee.displayNotification({
        id: 'shuttle-arrival-tracking',
        title: `🚌 Arriving in ${status.etaMinutes} min`,
        body: `${stopName} • ${status.isDelayed ? `${status.delayMinutes} min delay` : 'On Time'} • ${status.occupancy}% Full`,
        android: {
          channelId: notificationChannelId!,
          importance: AndroidImportance.HIGH,
          ongoing: true, 
          autoCancel: false,
          smallIcon: 'ic_notification',
          color: '#007AFF',
          progress: {
            max: 15,
            current: Math.max(0, 15 - status.etaMinutes),
          },
          actions: [
            {
              title: 'Stop Tracking',
              pressAction: {
                id: 'stop-tracking',
              },
            },
          ],
        },
        ios: {
          sound: 'default',
          categoryId: 'shuttle-tracking',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: false, 
          },
        },
      });
    } catch (error) {
      console.error('Failed to update shuttle notification:', error);
    }
  };

  await updateNotification();

  if (backgroundInterval) {
    clearInterval(backgroundInterval);
  }

  backgroundInterval = setInterval(async () => {
    const appState = AppState.currentState;

    if (appState === 'background' || appState === 'inactive') {
      await updateNotification();
    }
  }, 30000);
}


export async function stopShuttleTracking() {
  if (backgroundInterval) {
    clearInterval(backgroundInterval);
    backgroundInterval = null;
  }

  await notifee.cancelNotification('shuttle-arrival-tracking');
}


export function setupShuttleNotificationHandlers(
  onNotificationTap: () => void,
  onStopTracking: () => void
) {
  const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      onNotificationTap();
    } else if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === 'stop-tracking'
    ) {
      onStopTracking();
      stopShuttleTracking();
    }
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === 'stop-tracking'
    ) {
      await stopShuttleTracking();
    }
  });

  return unsubscribeForeground;
}