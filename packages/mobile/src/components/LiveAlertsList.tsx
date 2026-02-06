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

interface LiveAlertsListProps {
  alerts?: Announcement[];
  loading?: boolean;
}

export default function LiveAlertsList({
  alerts,
  loading,
}: LiveAlertsListProps) {
  // If no data provided, component could self-fetch, but for now we assume data is passed
  // or we render empty.

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
    return <Text style={styles.emptyText}>No active alerts.</Text>;
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
