// packages/mobile/src/screens/admin/ParkingManagementScreen.tsx

// Admin screen for viewing and managing parking lot availability across all Tesla locations.
// Groups parking lots by location and displays utilization via visual cards.
// Admins can edit individual lot availability and apply status overrides (e.g. Full, Closed).

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getAllParkingAvailability, updateParkingAvailability, ParkingRow } from '../../services/parkings';
import ParkingUtilizationCard from '../../components/ParkingUtilizationCard';
import ParkingEditModal from '../../components/ParkingEditModal';
import { useTheme } from '../../context/ThemeContext';

export default function ParkingManagementScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const [loading, setLoading] = useState(true);
  const [groupedData, setGroupedData] = useState<Record<string, ParkingRow[]>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeLot, setActiveLot] = useState<ParkingRow | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAllParkingAvailability();
      const dataArray = Array.isArray(data) ? data : [];
      
      const grouped = dataArray.reduce((acc, lot) => {
        const locName = lot.location_name || 'Unknown Location';
        if (!acc[locName]) acc[locName] = [];
        acc[locName].push(lot);
        return acc;
      }, {} as Record<string, ParkingRow[]>);

      setGroupedData(grouped);
    } catch (error) {
      console.error('Failed to fetch parking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (lot: ParkingRow) => {
    setActiveLot(lot);
    setIsEditing(true);
  };

  const handleSaveParking = async (availability: number, statusOverride: string | null) => {
    if (!activeLot) return;
    try {

      console.log('--- DEBUG SAVE ---');
      console.log('Lot Name:', activeLot.lot_name);
      console.log('Database Capacity:', activeLot.capacity); 
      console.log('Calculated Availability to Send:', availability);
      console.log('Status Override:', statusOverride);
      console.log('------------------');
      
      await updateParkingAvailability({
        location_name: activeLot.location_name,
        lot_name: activeLot.lot_name,
        availability,
        status_override: statusOverride
      });
      setIsEditing(false);
      fetchData(); 
    } catch (e: any) { 
      console.error("Save failed:", e.response?.data?.error || e.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'< '}Home</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text.primary }]}>Parking Lots Management</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedData).map(([locationName, lots]) => (
          <View key={locationName} style={styles.locationSection}>
            <Text style={[styles.locationTitle, { color: c.text.secondary }]}>{locationName}</Text>
            <View style={styles.grid}>
              {lots.map((lot) => {
                // Calculation using dynamic capacity
                const capacity = lot.capacity || 1; 
                const available = lot.availability ?? 0;
                const percentage = Math.round(((capacity - available) / capacity) * 100);
                
                const isManualOverride = 
                  lot.status_override === 'Reserved for event' || 
                  lot.status_override === 'Lot closed';

                const displayPercentage = lot.status_override === 'FULL' ? 100 : percentage;
                const displayLabel = lot.status_override || (percentage >= 90 ? 'Almost Full' : 'Available');

                return (
                  <View key={`${lot.location_id}-${lot.lot_name}`} style={styles.cardWrapper}>
                    <ParkingUtilizationCard
                      title={lot.lot_name}
                      percentage={displayPercentage}
                      statusLabel={displayLabel}
                      isStatusOnly={isManualOverride} // Hides ring for Reserved/Closed
                      onEditPress={() => handleOpenModal(lot)}
                    />
                  </View>
                );
              })}
              <View style={{ width: 97 }} />
            </View>
          </View>
        ))}
      </ScrollView>

      <ParkingEditModal 
        visible={isEditing}
        lot={activeLot}
        // Pass the REAL capacity here to fix the math!
        totalCapacity={activeLot?.capacity || 1} 
        onClose={() => setIsEditing(false)}
        onSave={handleSaveParking}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingVertical: 12 },
  backButton: { marginBottom: 4, width: 80 },
  backText: { fontSize: 16, color: '#FF3B30', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#000' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  locationSection: { marginTop: 32 },
  locationTitle: { fontSize: 14, fontWeight: '500', color: '#1C1C1E', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardWrapper: { width: 97, marginBottom: 16 },
});