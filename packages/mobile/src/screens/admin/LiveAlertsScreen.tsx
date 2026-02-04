import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LIVE_ALERTS_MOCK } from '../../helpers/AdminHelper';
import { BackButton } from '../../components/BackButton';

export default function LiveAlertsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Live Alerts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dashboardCard}>
          <Text style={styles.cardTitle}>Create Announcement</Text>
          <View style={styles.inputPlaceholder}>
            <Text style={styles.placeholderText}>
              Type announcement here...
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Announcement Type</Text>
            <Text style={styles.value}>All Day Alert ›</Text>
          </View>
          <TouchableOpacity style={styles.publishBtn}>
            <Text style={styles.publishText}>Publish Alert</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Active Alerts</Text>
        {LIVE_ALERTS_MOCK.map(alert => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Text
                style={[
                  styles.alertType,
                  alert.severity === 'high' ? styles.highSev : styles.medSev,
                ]}
              >
                {alert.type === 'shuttle' ? 'BUS DELAY' : 'PARKING FULL'}
              </Text>
              <Switch value={true} trackColor={{ true: '#34C759' }} />
            </View>
            <Text style={styles.alertMsg}>{alert.message}</Text>
            <Text style={styles.alertTime}>{alert.time}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    padding: 20,
  },
  dashboardCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputPlaceholder: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    height: 80,
  },
  placeholderText: {
    color: '#8E8E93',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#000',
  },
  value: {
    fontSize: 16,
    color: '#007AFF',
  },
  publishBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  alertType: {
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  highSev: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
  },
  medSev: {
    backgroundColor: '#FFF3E0',
    color: '#F57C00',
  },
  alertMsg: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
