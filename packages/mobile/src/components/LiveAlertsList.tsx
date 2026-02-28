// Renders a scrollable list of active shuttle delay alerts with shuttle name and send time.
// Shows a loading spinner while data is fetching and an empty state when no alerts exist.
// Each alert item displays the shuttle name, the time the alert was sent, and the delay duration.
// The list is scrollable and has a loading indicator at the center when data is being fetched.
// If there are no active alerts, a message is displayed in the center of the screen.

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
} from 'react-native';
import ShuttleListItem from './ShuttleListItem';
import { Announcement } from '../services/shuttleAlerts';
import { useTheme } from '../context/ThemeContext';

interface LiveAlertsListProps {
  alerts?: Announcement[];
  loading?: boolean;
}

export default function LiveAlertsList({
  alerts,
  loading,
}: LiveAlertsListProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: c.text.secondary }]}>
        No active alerts.
      </Text>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {alerts.map((alert, index) => (
        <ShuttleListItem
          key={alert.id}
          title={alert.shuttleName}
          subtitle={`Sent ${formatTime(alert.createdAt)}`}
          rightText={`${alert.delayMinutes} MIN DELAY`}
          statusColor="red"
          showSeparator={index !== alerts.length - 1}
          onPress={() => console.log('Alert pressed', alert.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 30,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 40,
  },
});