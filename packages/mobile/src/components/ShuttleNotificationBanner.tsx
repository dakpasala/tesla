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

  // Extract short stop name (e.g., "Stevens Creek" from "Stevens Creek & Albany Bus Stop")
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
    if (index === 0) return true;
    return reachedStops[index]?.reached ?? false;
  };

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

          {/* Stop Name */}
          <Text style={styles.stopName} numberOfLines={1}>
            {shortStopName}
          </Text>

          {/* Status */}
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>

        {/* Right Side - Route Component */}
        {stopStatus && stopStatus.length > 0 && nextStops && (
          <View style={styles.routeContainer}>
            <View style={styles.routeColumn}>
              {/* Dot 1 - Current Stop */}
              <View
                style={[
                  styles.dot,
                  styles.dot1,
                  { backgroundColor: '#007AFF' },
                ]}
              />

              {/* Vertical line 1-2 */}
              <View style={styles.verticalLine12} />

              {/* Dot 2 */}
              <View
                style={[
                  styles.dot,
                  styles.dot2,
                  { backgroundColor: isStopReached(1) ? '#007AFF' : '#D1D1D6' },
                ]}
              />

              {/* Vertical line 2-3 */}
              <View style={styles.verticalLine23} />

              {/* Dot 3 */}
              <View
                style={[
                  styles.dot,
                  styles.dot3,
                  { backgroundColor: isStopReached(2) ? '#007AFF' : '#D1D1D6' },
                ]}
              />
            </View>

            {/* Stop labels */}
            <View style={styles.labelsContainer}>
              <Text style={[styles.stopLabel, styles.stopLabel1Active]}>
                {stops[0] || ''}
              </Text>
              <Text
                style={[
                  styles.stopLabel,
                  isStopReached(1) && styles.stopLabelActive,
                ]}
              >
                {stops[1] || ''}
              </Text>
              <Text
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
    paddingVertical: 14,
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
    marginBottom: 4,
  },
  stopName: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 12,
    color: '#666666',
    marginBottom: 6,
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 12,
    marginBottom: 6,
  },
  /* Route Component Styles */
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 8,
    width: 110,
  },
  routeColumn: {
    position: 'relative',
    width: 12,
    height: 90,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    zIndex: 10,
  },
  dot1: {
    top: 0,
  },
  dot2: {
    top: 39,
  },
  dot3: {
    top: 78,
  },
  verticalLine12: {
    position: 'absolute',
    top: 6,
    left: 5,
    width: 2,
    height: 33,
    backgroundColor: '#D1D1D6',
  },
  verticalLine23: {
    position: 'absolute',
    top: 45,
    left: 5,
    width: 2,
    height: 33,
    backgroundColor: '#D1D1D6',
  },
  labelsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 12,
    height: 90,
    flexDirection: 'column',
  },
  stopLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 10,
    color: '#999999',
    maxWidth: 70,
    lineHeight: 12,
  },
  stopLabel1Active: {
    color: '#007AFF',
    fontWeight: '600',
  },
  stopLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default ShuttleNotificationBanner;
