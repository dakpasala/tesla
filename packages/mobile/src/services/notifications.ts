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

// Track shuttle notification state for meaningful change detection
interface ShuttleNotificationState {
  previousStatus: string;
  previousTitle: string;
  isBoardingNow: boolean;
  previousExpectedArrivalTime: string; // Track actual arrival time from server, not calculated ETA
  previousThresholdCrossed5Min: boolean; // Track if we've already alerted at 5 min
  isFirstUpdate: boolean; // Track if this is the first update after starting tracking
}

const shuttleNotificationState: { [key: string]: ShuttleNotificationState } =
  {};

export async function startShuttleTracking(
  rideId: string,
  stopName: string,
  nextStops: string[], // Add next stops list
  getLiveStatusFn: (rideId: string) => Promise<{
    etaMinutes: number;
    isDelayed: boolean;
    delayMinutes: number;
    occupancy: number;
    expectedArrivalTime?: string; // ISO timestamp from server
    stopStatus?: any[]; // Stop status array for progress calculation
  }>,
  onNotificationUpdate?: (data: {
    etaMinutes: number;
    stopName: string;
    isDelayed: boolean;
    stopStatus?: any[]; // For progress visualization
    nextStops?: string[];
  }) => void
) {
  console.log(
    '[Shuttle Tracking] Starting tracking for rideId:',
    rideId,
    'stopName:',
    stopName
  );

  // Cancel any existing shuttle notification from previous route
  // This ensures a fresh notification will "pop" for the new route
  await notifee.cancelNotification('shuttle-arrival-tracking');

  // Initialize state for this shuttle (reset if starting tracking again)
  shuttleNotificationState[rideId] = {
    previousStatus: '',
    previousTitle: '',
    isBoardingNow: false,
    previousExpectedArrivalTime: '',
    previousThresholdCrossed5Min: false,
    isFirstUpdate: true,
  };

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
      console.log(
        '[Shuttle Tracking] Fetched fresh status at',
        new Date().toLocaleTimeString(),
        ':',
        status
      );

      const statusText = status.isDelayed ? 'Late' : 'On Time';
      const statusEmoji = status.isDelayed ? '🔴' : '🟢';

      // Determine title based on ETA
      const isBoardingNow = status.etaMinutes <= 1;
      const title = isBoardingNow
        ? 'Boarding Now'
        : `Arriving in ${status.etaMinutes} min`;

      // Extract stop name without full address (e.g., "Stevens Creek" from "Stevens Creek & Albany Bus Stop")
      const shortStopName = stopName.split(' & ')[0] || stopName;

      // Initialize or get previous state
      if (!shuttleNotificationState[rideId]) {
        shuttleNotificationState[rideId] = {
          previousStatus: statusText,
          previousTitle: title,
          isBoardingNow: isBoardingNow,
          previousExpectedArrivalTime: status.expectedArrivalTime || '',
          previousThresholdCrossed5Min: false,
        };
      }

      const prevState = shuttleNotificationState[rideId];
      const arrivalTimeChanged =
        prevState.previousExpectedArrivalTime !==
        (status.expectedArrivalTime || '');

      // Detect meaningful changes
      const statusChanged = prevState.previousStatus !== statusText;
      const transitionToBoarding = !prevState.isBoardingNow && isBoardingNow;

      // Only trigger 5-minute alert once per tracking session
      const shouldAlert5Minutes =
        status.etaMinutes <= 5 && !prevState.previousThresholdCrossed5Min;

      // Display on first update or on meaningful user-facing changes
      const shouldDisplayNotification =
        prevState.isFirstUpdate ||
        statusChanged ||
        transitionToBoarding ||
        shouldAlert5Minutes;

      if (shouldDisplayNotification) {
        console.log(
          '[Shuttle Tracking] Meaningful change detected! Updating notification...',
          {
            statusChanged,
            transitionToBoarding,
            shouldAlert5Minutes,
            arrivalTimeChanged,
          }
        );

        // Update state with all meaningful info
        shuttleNotificationState[rideId] = {
          previousStatus: statusText,
          previousTitle: title,
          isBoardingNow: isBoardingNow,
          previousExpectedArrivalTime: status.expectedArrivalTime || '',
          previousThresholdCrossed5Min:
            shouldAlert5Minutes || prevState.previousThresholdCrossed5Min,
          isFirstUpdate: false,
        };

        // Trigger in-app notification
        if (onNotificationUpdate) {
          onNotificationUpdate({
            etaMinutes: status.etaMinutes,
            stopName: shortStopName,
            isDelayed: status.isDelayed,
            stopStatus: status.stopStatus,
            nextStops: nextStops,
          });
        }

        // Display persistent notification
        await notifee.displayNotification({
          id: 'shuttle-arrival-tracking',
          title: title,
          body: `${shortStopName}\n${statusText}`,
          android: {
            channelId: notificationChannelId!,
            importance: AndroidImportance.HIGH,
            ongoing: true,
            autoCancel: false,
            smallIcon: 'ic_notification',
            color: status.isDelayed ? '#FF3B30' : '#34C759',
            style: {
              type: 'bigtext',
              text: `${shortStopName}\n${statusText}`,
            },
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
            badge: 0,
            foregroundPresentationOptions: {
              alert: true,
              badge: false,
              sound: true,
            },
          },
        });
      } else {
        console.log(
          '[Shuttle Tracking] No meaningful changes - notification stays persistent without popping up'
        );
      }
    } catch (error) {
      console.error('Failed to update shuttle notification:', error);
    }
  };

  // Clear any existing interval
  if (backgroundInterval) {
    clearInterval(backgroundInterval);
    backgroundInterval = null;
  }

  // Do initial update
  await updateNotification();

  // Update notification every 30 seconds regardless of app state to ensure persistence
  backgroundInterval = setInterval(async () => {
    console.log(
      '[Shuttle Tracking] ⏰ 30-second interval tick - checking for updates...'
    );
    await updateNotification();
  }, 30000);
}

export async function stopShuttleTracking(rideId?: string) {
  if (backgroundInterval) {
    clearInterval(backgroundInterval);
    backgroundInterval = null;
  }

  // Clean up state for this shuttle
  if (rideId && shuttleNotificationState[rideId] !== undefined) {
    delete shuttleNotificationState[rideId];
  }

  await notifee.cancelNotification('shuttle-arrival-tracking');
}

export function pauseShuttleTracking() {
  // Stop the background update interval but keep the notification persistent
  if (backgroundInterval) {
    clearInterval(backgroundInterval);
    backgroundInterval = null;
    console.log(
      '[Shuttle Tracking] Paused background updates (notification remains visible)'
    );
  }
}

export function setupShuttleNotificationHandlers(
  onNotificationTap: () => void,
  onStopTracking: () => void
) {
  const unsubscribeForeground = notifee.onForegroundEvent(
    ({ type, detail }) => {
      if (type === EventType.PRESS) {
        onNotificationTap();
      } else if (
        type === EventType.ACTION_PRESS &&
        detail.pressAction?.id === 'stop-tracking'
      ) {
        onStopTracking();
        stopShuttleTracking();
      }
    }
  );

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
