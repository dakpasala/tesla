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

  const { visible, etaMinutes, stopName, isDelayed } = notification;

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
        {/* Content */}
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
    alignItems: 'flex-start',
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
  },
});

export default ShuttleNotificationBanner;
