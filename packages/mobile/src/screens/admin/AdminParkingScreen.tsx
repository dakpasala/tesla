import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ParkingLot {
  id: string;
  name: string;
  available: number;
  total: number;
  isOpen: boolean;
  reservedSpots: number;
}

const MOCK_LOTS: ParkingLot[] = [
  {
    id: '1',
    name: 'Lot A - Main Building',
    available: 45,
    total: 100,
    isOpen: true,
    reservedSpots: 10,
  },
  {
    id: '2',
    name: 'Lot B - East Wing',
    available: 12,
    total: 80,
    isOpen: true,
    reservedSpots: 5,
  },
  {
    id: '3',
    name: 'Lot C - Visitor',
    available: 0,
    total: 50,
    isOpen: false,
    reservedSpots: 0,
  },
  {
    id: '4',
    name: 'Garage 1 - Underground',
    available: 89,
    total: 200,
    isOpen: true,
    reservedSpots: 20,
  },
  {
    id: '5',
    name: 'Garage 2 - South',
    available: 5,
    total: 150,
    isOpen: true,
    reservedSpots: 15,
  },
];

export default function AdminParkingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [lots, setLots] = useState(MOCK_LOTS);

  const toggleLot = (lotId: string) => {
    setLots(
      lots.map(lot =>
        lot.id === lotId ? { ...lot, isOpen: !lot.isOpen } : lot
      )
    );
  };

  const getTotalStats = () => {
    const totalAvailable = lots
      .filter(l => l.isOpen)
      .reduce((sum, l) => sum + l.available, 0);
    const totalSpots = lots
      .filter(l => l.isOpen)
      .reduce((sum, l) => sum + l.total, 0);
    const totalReserved = lots.reduce((sum, l) => sum + l.reservedSpots, 0);
    return { totalAvailable, totalSpots, totalReserved };
  };

  const stats = getTotalStats();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Control</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalAvailable}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalSpots}</Text>
            <Text style={styles.statLabel}>Total Open</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalReserved}</Text>
            <Text style={styles.statLabel}>Reserved</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>📢 Send Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionDanger]}
          >
            <Text style={styles.quickActionText}>🚫 Close All</Text>
          </TouchableOpacity>
        </View>

        {/* Lot Controls */}
        <Text style={styles.sectionTitle}>Manage Lots</Text>
        {lots.map(lot => (
          <View key={lot.id} style={styles.lotCard}>
            <View style={styles.lotHeader}>
              <View style={styles.lotInfo}>
                <Text style={styles.lotName}>{lot.name}</Text>
                <Text style={styles.lotStats}>
                  {lot.available}/{lot.total} available • {lot.reservedSpots}{' '}
                  reserved
                </Text>
              </View>
              <Switch
                value={lot.isOpen}
                onValueChange={() => toggleLot(lot.id)}
                trackColor={{ false: '#ddd', true: '#34A853' }}
              />
            </View>

            {lot.isOpen && (
              <View style={styles.lotActions}>
                <TouchableOpacity style={styles.lotActionButton}>
                  <Text style={styles.lotActionText}>Edit Capacity</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.lotActionButton}>
                  <Text style={styles.lotActionText}>Reservations</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.lotActionButton}>
                  <Text style={styles.lotActionText}>View Map</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 24,
    color: '#111',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickActionDanger: {
    backgroundColor: '#ffebee',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  lotCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  lotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lotInfo: {
    flex: 1,
  },
  lotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  lotStats: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  lotActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  lotActionButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  lotActionText: {
    fontSize: 12,
    color: '#666',
  },
});
