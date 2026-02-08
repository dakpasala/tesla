// packages/mobile/src/components/ShuttleArrivalSheet.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { LiveStatusResponse, getOccupancyPercentage } from '../services/tripshot';

interface ShuttleArrivalSheetProps {
  stopName: string;
  etaMinutes: number;
  status: 'On Time' | 'Delayed';
  occupancy?: number;
  nextStops?: string[];
  onBack: () => void;
  onReportIssue: () => void;
  liveStatus?: LiveStatusResponse | null;
  onRefreshStatus?: () => void; // Callback to refresh live status
}

export function ShuttleArrivalSheet({
  stopName,
  etaMinutes,
  status,
  occupancy = 75,
  nextStops = ['Stevens Creek', 'Sunnyvale', 'Mountain View'],
  onBack,
  onReportIssue,
  liveStatus,
  onRefreshStatus,
}: ShuttleArrivalSheetProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const firstRide = liveStatus?.rides?.[0];
  const actualOccupancy = firstRide
    ? getOccupancyPercentage(firstRide)
    : occupancy;

  // Poll for updates every 10 seconds
  useEffect(() => {
    if (!onRefreshStatus) return;

    // Initial fetch
    onRefreshStatus();

    // Set up polling interval
    const interval = setInterval(() => {
      onRefreshStatus();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [onRefreshStatus]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - refresh immediately
        console.log('App came to foreground - refreshing status');
        if (onRefreshStatus) {
          onRefreshStatus();
        }
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState, onRefreshStatus]);

  return (
    <View style={styles.container}>
      {/* Handle bar */}
      <View style={styles.handleBar} />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>‹</Text>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Main content */}
      <View style={styles.content}>
        {/* Arrival info */}
        <Text style={styles.arrivalTitle}>Arriving In {etaMinutes} Min</Text>
        <Text style={styles.stopName}>{stopName}</Text>
        <Text
          style={[
            styles.statusText,
            status === 'Delayed' && styles.statusDelayed,
          ]}
        >
          {status}
        </Text>

        {/* Occupancy info */}
        <View style={styles.occupancyContainer}>
          <Text style={styles.occupancyIcon}>👥</Text>
          <Text style={styles.occupancyText}>{actualOccupancy}% Full</Text>
        </View>

        {/* Next stops */}
        <View style={styles.nextStopsContainer}>
          {nextStops.map((stop, index) => (
            <View key={index} style={styles.nextStopRow}>
              <View
                style={[
                  styles.stopDot,
                  index === 0 && styles.stopDotActive,
                ]}
              />
              <Text style={styles.nextStopText}>{stop}</Text>
            </View>
          ))}
        </View>

        {/* Report issue link */}
        <TouchableOpacity
          style={styles.reportContainer}
          onPress={onReportIssue}
        >
          <Text style={styles.reportText}>
            See something off?{' '}
            <Text style={styles.reportLink}>Report it</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    paddingTop: 14,
    paddingHorizontal: 34,
    paddingBottom: 40,
    minHeight: 244,
  },
  handleBar: {
    width: 73,
    height: 3,
    backgroundColor: '#D9D9D9',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backIcon: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '400',
    marginRight: 4,
  },
  backText: {
    fontSize: 12,
    color: '#333333',
    fontFamily: 'Inter',
  },
  content: {
    gap: 10,
  },
  arrivalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  stopName: {
    fontSize: 15,
    fontWeight: '400',
    color: '#333333',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#34C759',
  },
  statusDelayed: {
    color: '#FF9500',
  },
  occupancyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  occupancyIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  occupancyText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  nextStopsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  nextStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
    marginRight: 12,
  },
  stopDotActive: {
    backgroundColor: '#007AFF',
  },
  nextStopText: {
    fontSize: 14,
    color: '#333333',
  },
  reportContainer: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  reportText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  reportLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
});