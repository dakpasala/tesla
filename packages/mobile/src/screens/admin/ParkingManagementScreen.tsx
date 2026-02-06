// packages/mobile/src/screens/admin/ParkingManagementScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getAllParkingAvailability, ParkingRow } from '../../services/parkings';
import ParkingUtilizationCard from '../../components/ParkingUtilizationCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const groupLotsByLocation = (lots: ParkingRow[]) => {
  return lots.reduce((acc, lot) => {
    const locName = lot.location_name || 'Unknown Location';
    if (!acc[locName]) {
      acc[locName] = [];
    }
    acc[locName].push(lot);
    return acc;
  }, {} as Record<string, ParkingRow[]>);
};

export default function ParkingManagementScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [groupedData, setGroupedData] = useState<Record<string, ParkingRow[]>>({});

  const TOTAL_CAPACITY = 500;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAllParkingAvailability();
      const dataArray = Array.isArray(data) ? data : [];
      setGroupedData(groupLotsByLocation(dataArray));
    } catch (error) {
      console.error('Failed to fetch parking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (percentage: number) => {
    if (percentage >= 100) return 'FULL';
    if (percentage >= 90) return 'Almost Full';
    return 'Available';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'< '}Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Lots Management</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedData).map(([locationName, lots]) => (
          <View key={locationName} style={styles.locationSection}>
            <Text style={styles.locationTitle}>{locationName}</Text>
            
            {/* Grid container handles the centering and spacing */}
            <View style={styles.grid}>
              {lots.map((lot) => {
                const available = lot.availability ?? 0;
                const occupied = Math.max(0, TOTAL_CAPACITY - available);
                const percentage = Math.round((occupied / TOTAL_CAPACITY) * 100);

                return (
                  <View key={`${lot.location_id}-${lot.lot_name}`} style={styles.cardWrapper}>
                    <ParkingUtilizationCard
                      title={lot.lot_name}
                      percentage={percentage}
                      statusLabel={getStatusLabel(percentage)}
                      onEditPress={() => console.log('Edit:', lot.lot_name)}
                    />
                  </View>
                );
              })}
              {/* Invisible spacers ensure the last row aligns to the left if < 3 items */}
              {lots.length % 3 !== 0 && (
                <View style={{ width: 97 }} />
              )}
            </View>
          </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24, // Matches Figma breathing room
    paddingVertical: 12,
  },
  backButton: { marginBottom: 4 },
  backText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  locationSection: {
    marginTop: 32,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '500', // 14 Medium
    color: '#1C1C1E',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // This distributes 3 cards evenly across the padding-adjusted width
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
  },
  cardWrapper: {
    marginBottom: 16,
    // Explicit width from your layout screenshot
    width: 97, 
  },
});