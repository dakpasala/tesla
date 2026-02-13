import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { ParkingRow } from '../services/parkings';

interface ParkingEditModalProps {
  visible: boolean;
  lot: ParkingRow | null;
  onClose: () => void;
  onSave: (availability: number, statusOverride: string | null) => void;
  totalCapacity: number;
}

export default function ParkingEditModal({
  visible,
  lot,
  onClose,
  onSave,
  totalCapacity,
}: ParkingEditModalProps) {
  const [tempOccupancy, setTempOccupancy] = useState(0);
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  // Synchronize internal state when modal opens
  useEffect(() => {
    if (lot && visible) {
      setLocalStatus(lot.status_override || null);
      const available = lot.availability ?? 0;
      // Calculate initial percentage based on the specific lot's capacity
      const currentOcc = Math.round(((totalCapacity - available) / totalCapacity) * 100);
      setTempOccupancy(currentOcc);
    }
  }, [lot, visible, totalCapacity]);

  const adjustOccupancy = (val: number) => {
    setLocalStatus(null); // Stepper clears manual status
    setTempOccupancy((prev) => Math.min(100, Math.max(0, prev + val)));
  };

  const handleInternalSave = () => {
    // Math: Convert percentage back to available spots using the REAL capacity
    let newAvailable = Math.round(totalCapacity * (1 - tempOccupancy / 100));
    
    // Force 0 if explicitly marked Full or Closed
    if (localStatus === 'FULL' || localStatus === 'Lot closed') {
      newAvailable = 0;
    }
    
    onSave(newAvailable, localStatus);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{lot?.lot_name || 'Edit Lot'}</Text>

          <View style={styles.occupancySection}>
            <View>
              <Text style={styles.sectionLabel}>Parking Occupancy</Text>
              <Text style={styles.subLabel}>Auto-calculated by Vision Model</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => adjustOccupancy(-5)} style={styles.stepBtn}>
                <Text style={styles.stepText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.occValueText}>{localStatus ? '--' : `${tempOccupancy}%`}</Text>
              <TouchableOpacity onPress={() => adjustOccupancy(5)} style={styles.stepBtn}>
                <Text style={styles.stepText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Status Overrides</Text>
          <View style={styles.overrideRow}>
            {[
              { label: 'Mark as full', val: 'FULL' },
              { label: 'Reserved for event', val: 'Reserved for event' },
              { label: 'Lot closed', val: 'Lot closed' },
            ].map((item) => (
              <TouchableOpacity
                key={item.val}
                style={[styles.overrideBtn, localStatus === item.val && styles.overrideBtnActive]}
                onPress={() => setLocalStatus(item.val)}
              >
                <Text style={[styles.overrideText, localStatus === item.val && styles.overrideTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleInternalSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  occValueText: { fontSize: 14, fontWeight: '600', minWidth: 45, textAlign: 'center' },
  overrideRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 32 },
  overrideBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#F9F9F9' },
  overrideBtnActive: { backgroundColor: '#555', borderColor: '#555' },
  overrideText: { fontSize: 11, color: '#333' },
  overrideTextActive: { color: '#FFF' },
  saveButton: { backgroundColor: '#555', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  cancelButton: { marginTop: 12, alignItems: 'center' },
  cancelText: { color: '#8E8E93', fontSize: 14 },
});