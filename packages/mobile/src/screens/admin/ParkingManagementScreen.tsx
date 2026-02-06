// packages/mobile/src/screens/admin/ParkingManagementScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getAllParkingAvailability, ParkingRow, updateParkingAvailability } from '../../services/parkings';
import ParkingUtilizationCard from '../../components/ParkingUtilizationCard';

export default function ParkingManagementScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [groupedData, setGroupedData] = useState<Record<string, ParkingRow[]>>({});
  
  // State for the Admin Edit Modal (Matching Screenshot)
  const [isEditing, setIsEditing] = useState(false);
  const [activeLot, setActiveLot] = useState<ParkingRow | null>(null);
  const [tempOccupancy, setTempOccupancy] = useState(0);

  const TOTAL_CAPACITY = 500;

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

  const openEditModal = (lot: ParkingRow) => {
    setActiveLot(lot);
    const available = lot.availability ?? 0;
    const currentOcc = Math.round(((TOTAL_CAPACITY - available) / TOTAL_CAPACITY) * 100);
    setTempOccupancy(currentOcc);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!activeLot) return;
    
    // Convert percentage back to "available spots" for the API
    const newAvailable = Math.round(TOTAL_CAPACITY * (1 - tempOccupancy / 100));
    
    try {
      await updateParkingAvailability({
        location_name: activeLot.location_name,
        lot_name: activeLot.lot_name,
        availability: newAvailable
      });
      setIsEditing(false);
      fetchData(); // Refresh list
    } catch (e) {
      console.error("Save failed", e);
    }
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
            <View style={styles.grid}>
              {lots.map((lot) => {
                const available = lot.availability ?? 0;
                const percentage = Math.round(((TOTAL_CAPACITY - available) / TOTAL_CAPACITY) * 100);

                return (
                  <View key={`${lot.location_id}-${lot.lot_name}`} style={styles.cardWrapper}>
                    <ParkingUtilizationCard
                      title={lot.lot_name}
                      percentage={percentage}
                      statusLabel={percentage >= 90 ? 'Almost Full' : 'Available'}
                      onEditPress={() => openEditModal(lot)}
                    />
                  </View>
                );
              })}
              {/* Grid spacers */}
              <View style={styles.cardWrapper} />
              <View style={styles.cardWrapper} />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Admin Edit Modal - Exact match to your screenshot */}
      <Modal visible={isEditing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsEditing(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>
              {activeLot?.location_name} - {activeLot?.lot_name}
            </Text>

            <View style={styles.occupancySection}>
              <View>
                <Text style={styles.sectionLabel}>Parking Occupancy</Text>
                <Text style={styles.subLabel}>Auto-calculated by Vision Model</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => setTempOccupancy(prev => Math.max(0, prev - 5))} style={styles.stepBtn}>
                  <Text style={styles.stepText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.occValueText}>{tempOccupancy}%</Text>
                <TouchableOpacity onPress={() => setTempOccupancy(prev => Math.min(100, prev + 5))} style={styles.stepBtn}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Status Overrides</Text>
            <View style={styles.overrideRow}>
              <TouchableOpacity style={styles.overrideBtn}><Text style={styles.overrideText}>Mark as full</Text></TouchableOpacity>
              <TouchableOpacity style={styles.overrideBtn}><Text style={styles.overrideText}>Reserved for event</Text></TouchableOpacity>
              <TouchableOpacity style={styles.overrideBtn}><Text style={styles.overrideText}>Lot closed</Text></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingVertical: 12 },
  backButton: { marginBottom: 4, width: 80 }, // Added this to fix your error
  backText: { fontSize: 16, color: '#FF3B30', fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#000' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  locationSection: { marginTop: 32 },
  locationTitle: { fontSize: 14, fontWeight: '500', color: '#1C1C1E', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardWrapper: { width: 97, marginBottom: 16 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E5E5', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 24 },
  occupancySection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  subLabel: { fontSize: 11, color: '#8E8E93', fontStyle: 'italic', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 4 },
  stepBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  stepText: { fontSize: 20, color: '#8E8E93' },
  occValueText: { fontSize: 14, fontWeight: '600', paddingHorizontal: 12 },
  overrideRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 32 },
  overrideBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#F9F9F9' },
  overrideText: { fontSize: 12, color: '#333' },
  saveButton: { backgroundColor: '#555', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});