// packages/mobile/src/screens/admin/LiveAlertsPage.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ShuttleListItem from '../../components/ShuttleListItem'; // Swapped import
import AnnouncementDropDown from '../../components/AnnouncementDropdown';

import { getAnnouncements, Announcement } from '../../services/shuttleAlerts';

export default function LiveAlertsPage() {
  const navigation = useNavigation();
  const [alerts, setAlerts] = React.useState<Announcement[]>([]);

  React.useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await getAnnouncements();
        setAlerts(data);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      }
    }
    fetchAlerts();
  }, []);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>{'< '}Shuttle Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Live Alerts</Text>

        <View style={styles.announcementWrapper}>
          <AnnouncementDropDown
            onSelectOption={option => {
              console.log('Selected:', option);
            }}
          />
        </View>

        <Text style={styles.sectionLabel}>ALL ALERTS</Text>

        {alerts.map((alert, index) => (
          <ShuttleListItem
            key={alert.id}
            title={alert.shuttleName}
            subtitle={`Sent ${formatTime(alert.createdAt)}`}
            rightText={`${alert.delayMinutes} MIN DELAY`}
            statusColor="red" // Standardizing on Red for delays/alerts
            showSeparator={index !== alerts.length - 1}
            onPress={() => console.log('Alert pressed', alert.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: { padding: 4 },
  backText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  announcementWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 100, // Important for the dropdown to overlap list items
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
});
