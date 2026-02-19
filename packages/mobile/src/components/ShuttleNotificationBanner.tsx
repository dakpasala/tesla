import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useShuttleNotification } from '../context/ShuttleNotificationContext';

const ShuttleNotificationBanner: React.FC = () => {
  const { notification, hideNotification } = useShuttleNotification();
  const [slideAnim] = useState(new Animated.Value(-200));

  const { visible, etaMinutes, stopName, isDelayed, stopStatus, nextStops } =
    notification;

  const shortStopName = stopName
    ? stopName.split(' & ')[0] || stopName
    : 'Stop';

  // Determine title based on ETA
  const title =
    etaMinutes <= 1 ? 'Boarding Now' : `Arriving in ${etaMinutes} min`;

  // Determine status text and color
  const statusText = isDelayed ? 'Late' : 'On Time';
  const statusColor = isDelayed ? '#FF3B30' : '#1A9C30';

  // Calculate progress from stopStatus for the route visualization
  const getStopState = (stop: any) => {
    if ('Awaiting' in stop) return 'Awaiting';
    if ('Arrived' in stop) return 'Arrived';
    if ('Departed' in stop) return 'Departed';
    if ('Skipped' in stop) return 'Skipped';
    return 'Unknown';
  };

  const stops = nextStops || ['Stop 1', 'Stop 2', 'Stop 3'];
  const reachedStops =
    stopStatus?.map((stop, index) => {
      const state = getStopState(stop);
      return {
        index,
        state,
        reached:
          state === 'Arrived' || state === 'Departed' || state === 'Skipped',
      };
    }) || [];

  const isStopReached = (index: number) => {
    if (index === 0) return true; // First stop is always reached (current)
    return reachedStops[index]?.reached ?? false;
  };

  /**
   * ROUTE PROGRESS (copied logic from ShuttleArrivalSheet)
   */
  const totalStops = stopStatus?.length || 0;
  const totalSegments = Math.max(totalStops - 1, 1);

  const currentStopIndex = stopStatus
    ? stopStatus.findIndex((s: any) => getStopState(s) === 'Awaiting')
    : -1;

  const previousIndex = currentStopIndex > 0 ? currentStopIndex - 1 : 0;

  let SEGMENT_PROGRESS = 0;

  if (
    currentStopIndex >= 0 &&
    stopStatus &&
    stopStatus[currentStopIndex] &&
    'Awaiting' in stopStatus[currentStopIndex]
  ) {
    const awaiting = stopStatus[currentStopIndex].Awaiting;

    const now = Date.now();
    const departure = new Date(awaiting.scheduledDepartureTime).getTime();
    const arrival = new Date(awaiting.expectedArrivalTime).getTime();

    if (arrival > departure) {
      SEGMENT_PROGRESS = Math.max(
        0,
        Math.min(1, (now - departure) / (arrival - departure))
      );
    }
  }

  const ROUTE_PROGRESS = (previousIndex + SEGMENT_PROGRESS) / totalSegments;

  const APPROACH_RATIO = 0.2;

  // Animated progress value (0..1)
  const [routeProgressAnim] = useState(
    () => new Animated.Value(ROUTE_PROGRESS)
  );

  useEffect(() => {
    // animate to new route progress whenever stopStatus changes
    Animated.timing(routeProgressAnim, {
      toValue: ROUTE_PROGRESS,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [stopStatus]);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 10 seconds
      const timeout = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 300,
          useNativeDriver: true,
        }).start(() => hideNotification());
      }, 10000);

      return () => clearTimeout(timeout);
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, hideNotification]);

  if (!visible) return null;

  // L-shape geometry (matches ShuttleArrivalSheet scaled for banner)
  const HORIZONTAL_START_RIGHT = -20;
  const HORIZONTAL_LENGTH = 85;
  const VERTICAL_START_TOP = 22;
  const VERTICAL_LENGTH = 65;

  // Animated car position along the L-shaped path
  const carRightAnim = routeProgressAnim.interpolate({
    inputRange: [0, APPROACH_RATIO, 1],
    outputRange: [
      HORIZONTAL_START_RIGHT,
      HORIZONTAL_START_RIGHT + HORIZONTAL_LENGTH,
      HORIZONTAL_START_RIGHT + HORIZONTAL_LENGTH,
    ],
    extrapolate: 'clamp',
  });

  const carTopAnim = routeProgressAnim.interpolate({
    inputRange: [0, APPROACH_RATIO, 1],
    outputRange: [
      VERTICAL_START_TOP - 22,
      VERTICAL_START_TOP - 22,
      VERTICAL_START_TOP - 22 + VERTICAL_LENGTH,
    ],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.banner}
        onPress={hideNotification}
        activeOpacity={0.9}
      >
        {/* Left Content */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Stop Name (full) */}
          <Text
            style={[styles.stopName, styles.stopNamePrimary]}
            numberOfLines={1}
          >
            {stopName || ''}
          </Text>

          {/* Status */}
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>

        {/* Right Side - Route Component */}
        {stopStatus && stopStatus.length > 0 && nextStops && (
          <View style={styles.routeContainer}>
            <View style={styles.routeCol}>
              {/* Static background path: horizontal -> curve -> vertical */}
              <View style={styles.horizontalLine} />
              <View style={styles.curve} />
              <View style={styles.verticalLine} />

              {/* Shuttle icon (animated along L-path) */}
              <Animated.View
                style={[styles.car, { right: carRightAnim, top: carTopAnim }]}
              >
                <Text style={styles.carIcon}>🚐</Text>
              </Animated.View>

              {/* DOTS */}
              <View
                style={[
                  styles.dot,
                  styles.dotTop,
                  {
                    backgroundColor: isStopReached(0) ? '#007AFF' : '#D1D1D6',
                  },
                ]}
              />
              <View
                style={[
                  styles.dot,
                  styles.dotMiddle,
                  {
                    backgroundColor: isStopReached(1) ? '#007AFF' : '#D1D1D6',
                  },
                ]}
              />
              <View
                style={[
                  styles.dot,
                  styles.dotBottom,
                  {
                    backgroundColor: isStopReached(2) ? '#007AFF' : '#D1D1D6',
                  },
                ]}
              />
            </View>

            {/* Stop labels */}
            <View style={styles.labelsCol}>
              <Text
                numberOfLines={1}
                style={[
                  styles.stopLabel,
                  isStopReached(0) && styles.stopLabelActive,
                ]}
              >
                {stops[0] || ''}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.stopLabel,
                  isStopReached(1) && styles.stopLabelActive,
                ]}
              >
                {stops[1] || ''}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.stopLabel,
                  isStopReached(2) && styles.stopLabelActive,
                ]}
              >
                {stops[2] || ''}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#000000',
    marginBottom: 6,
  },
  stopName: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 12,
    color: '#666666',
    marginBottom: 10,
  },
  stopNamePrimary: {
    color: '#000000',
    fontWeight: '300',
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 12,
    marginBottom: 0,
  },
  /* Route Component Styles - Copied from ShuttleArrivalSheet */
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  routeCol: {
    width: 36,
    height: 95,
    position: 'relative',
  },
  horizontalLine: {
    position: 'absolute',
    top: 8,
    right: -20,
    width: 85,
    height: 2,
    backgroundColor: '#D1D1D6',
  },
  curve: {
    position: 'absolute',
    top: 8,
    right: 64,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#D1D1D6',
    borderTopLeftRadius: 8,
  },
  verticalLine: {
    position: 'absolute',
    top: 22,
    right: 76,
    width: 2,
    height: 65,
    backgroundColor: '#D1D1D6',
  },
  car: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 2,
    top: -2,
    right: 65,
    zIndex: 10,
  },
  carIcon: {
    fontSize: 12,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotTop: {
    top: 12,
    right: 73,
  },
  dotMiddle: {
    top: 40,
    right: 73,
  },
  dotBottom: {
    top: 68,
    right: 73,
  },
  labelsCol: {
    // position labels so they sit inside the L-path:
    // placed below the horizontal/curve and snug to the right of the vertical line
    marginLeft: -60,
    paddingTop: 20,
    width: 120,
  },
  stopLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    color: '#999999',
    marginBottom: 14,
  },
  stopLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  /* Unused old styles - keeping for backwards compat */
  stopLabel1Active: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default ShuttleNotificationBanner;
