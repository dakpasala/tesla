// packages/mobile/src/services/notifications.ts

import notifee from '@notifee/react-native';

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