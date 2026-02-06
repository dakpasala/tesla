import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
} from 'react-native';
import ShuttleListItem from './ShuttleListItem';
import { getAnnouncements, Announcement } from '../services/shuttleAlerts';

export default function LiveAlertsList() {
  const [alerts, setAlerts] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await getAnnouncements();
        setAlerts(data);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

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

  if (alerts.length === 0) {
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
