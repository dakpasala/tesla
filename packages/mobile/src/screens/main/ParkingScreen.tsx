import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
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
  distance: string;
  status: 'available' | 'limited' | 'full';
}

const MOCK_PARKING: ParkingLot[] = [
  {
    id: '1',
    name: 'Lot A - Main Building',
    available: 45,
    total: 100,
    distance: '0.1 mi',
    status: 'available',
  },
  {
    id: '2',
    name: 'Lot B - East Wing',
    available: 12,
    total: 80,
    distance: '0.2 mi',
    status: 'limited',
  },
  {
    id: '3',
    name: 'Lot C - Visitor',
    available: 0,
    total: 50,
    distance: '0.3 mi',
    status: 'full',
  },
  {
    id: '4',
    name: 'Garage 1 - Underground',
    available: 89,
    total: 200,
    distance: '0.15 mi',
    status: 'available',
  },
  {
    id: '5',
    name: 'Garage 2 - South',
    available: 5,
    total: 150,
    distance: '0.25 mi',
    status: 'limited',
  },
];

const STATUS_COLORS = {
  available: '#34A853',
  limited: '#FBBC04',
  full: '#EA4335',
};

export default function ParkingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available'>(
    'all'
  );

  const filteredLots =
    selectedFilter === 'all'
      ? MOCK_PARKING
      : MOCK_PARKING.filter(lot => lot.status !== 'full');

  const getAvailabilityPercentage = (lot: ParkingLot) => {
    return Math.round((lot.available / lot.total) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking</Text>
        <TouchableOpacity>
          <Text style={styles.refreshButton}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Tesla HQ Parking</Text>
        <Text style={styles.summarySubtitle}>Real-time availability</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>151</Text>
            <Text style={styles.summaryStatLabel}>Available</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>580</Text>
            <Text style={styles.summaryStatLabel}>Total</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={[styles.summaryStatValue, { color: '#34A853' }]}>
              26%
            </Text>
            <Text style={styles.summaryStatLabel}>Free</Text>
          </View>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All Lots
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'available' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter('available')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === 'available' && styles.filterButtonTextActive,
            ]}
          >
            Available Only
          </Text>
        </TouchableOpacity>
      </View>

      {/* Parking Lots */}
      <ScrollView style={styles.lotsList}>
        {filteredLots.map(lot => (
          <TouchableOpacity key={lot.id} style={styles.lotCard}>
            <View style={styles.lotInfo}>
              <Text style={styles.lotName}>{lot.name}</Text>
              <Text style={styles.lotDistance}>{lot.distance} away</Text>
            </View>
            <View style={styles.lotAvailability}>
              <View style={styles.availabilityBar}>
                <View
                  style={[
                    styles.availabilityFill,
                    {
                      width: `${getAvailabilityPercentage(lot)}%`,
                      backgroundColor: STATUS_COLORS[lot.status],
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.availabilityText,
                  { color: STATUS_COLORS[lot.status] },
                ]}
              >
                {lot.available}/{lot.total}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  refreshButton: {
    fontSize: 24,
    color: '#4285F4',
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#111',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  lotsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  lotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  lotInfo: {
    flex: 1,
  },
  lotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  lotDistance: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  lotAvailability: {
    alignItems: 'flex-end',
  },
  availabilityBar: {
    width: 60,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
