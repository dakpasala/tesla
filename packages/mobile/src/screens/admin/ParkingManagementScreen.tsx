// packages/mobile/src/screens/admin/ParkingManagementScreen.tsx

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
import { PARKING_STATS } from '../../helpers/AdminHelper';
import AdminStatsCard from './AdminStatsCard';

export default function ParkingManagementScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Lots Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          {PARKING_STATS.map(stat => (
            <AdminStatsCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              trendValue={stat.trendValue}
              style={{ marginRight: 10, marginBottom: 10 }}
            />
          ))}
        </View>

        {/* Deer Creek */}
        <View style={styles.lotCard}>
          <View style={styles.lotHeader}>
            <Text style={styles.lotName}>Deer Creek</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Almost Full</Text>
            </View>
          </View>

          {/* Sublots */}
          <View style={styles.sublotRow}>
            <View style={styles.sublotInfo}>
              <Text style={styles.sublotName}>Sublot A</Text>
              <Text style={styles.sublotOcc}>95% Full</Text>
            </View>
            <View style={styles.donut} />
          </View>
          <View style={styles.sublotRow}>
            <View style={styles.sublotInfo}>
              <Text style={styles.sublotName}>Sublot B</Text>
              <Text style={styles.sublotOcc}>72% Full</Text>
            </View>
            <View style={styles.donut} />
          </View>
          <View style={styles.sublotRow}>
            <View style={styles.sublotInfo}>
              <Text style={styles.sublotName}>Sublot C</Text>
              <Text style={styles.sublotOcc}>45% Full</Text>
            </View>
            <View style={styles.donut} />
          </View>
        </View>

        {/* Page Mill */}
        <View style={styles.lotCard}>
          <View style={styles.lotHeader}>
            <Text style={styles.lotName}>Page Mill</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.statusText, { color: '#2E7D32' }]}>
                Available
              </Text>
            </View>
          </View>
          <View style={styles.sublotRow}>
            <View style={styles.sublotInfo}>
              <Text style={styles.sublotName}>Main Lot</Text>
              <Text style={styles.sublotOcc}>30% Full</Text>
            </View>
            <View style={styles.donut} />
          </View>
        </View>
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  lotCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lotName: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '500',
  },
  sublotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  sublotInfo: {
    flex: 1,
  },
  sublotName: {
    fontSize: 14,
    color: '#666',
  },
  sublotOcc: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  donut: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#4285F4',
    opacity: 0.3, // easy placeholder for donut chart
  },
});
