// packages/mobile/src/components/CreateNewAnnoucement.tsx

import React, { forwardRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import Svg, { Path } from 'react-native-svg';
import { createShuttleAlertAdmin } from '../services/shuttleAlerts';

const SHUTTLE_OPTIONS = [
  'Tesla HQ Deer Creek Shuttle A',
  'Tesla HQ Deer Creek Shuttle B',
  'Tesla HQ Deer Creek Shuttle C',
  'Tesla HQ Deer Creek Shuttle D',
];

const ANNOUNCEMENT_TYPES = [
  { id: 'bad-weather', label: 'Bad Weather', reason: 'weather' },
  { id: 'road-closure', label: 'Road Closure', reason: 'road_closure' },
  { id: 'traffic', label: 'Traffic', reason: 'traffic' },
  { id: 'shuttle-full', label: 'Shuttle Full', reason: 'capacity' },
];

interface CreateNewAnnouncementProps {
  onSuccess?: () => void;
}

const CreateNewAnnouncement = forwardRef<Modalize, CreateNewAnnouncementProps>(
  ({ onSuccess }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedShuttle, setSelectedShuttle] = useState(SHUTTLE_OPTIONS[0]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [details, setDetails] = useState('');
    const [delay, setDelay] = useState(15);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (clearReports: boolean) => {
      if (!selectedType) {
        Alert.alert('Error', 'Please select an announcement type');
        return;
      }

      const selectedTypeObj = ANNOUNCEMENT_TYPES.find(t => t.id === selectedType);
      if (!selectedTypeObj) return;

      setSubmitting(true);

      try {
        await createShuttleAlertAdmin(selectedShuttle, {
          type: 'delay',
          reason: selectedTypeObj.reason,
          delayMinutes: delay,
          clearReports,
        });

        Alert.alert('Success', 'Alert created successfully!');
        
        // Reset form
        setSelectedType(null);
        setDetails('');
        setDelay(15);
        
        // Close modal
        if (ref && 'current' in ref && ref.current) {
          ref.current.close();
        }

        // Trigger refresh in parent
        onSuccess?.();
      } catch (err) {
        console.error('Failed to create alert:', err);
        Alert.alert('Error', 'Failed to create alert. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modalize ref={ref} modalHeight={538} modalStyle={styles.modalScreen}>
        <View style={styles.container}>
          {/* Main Content */}
          <View style={styles.content}>
            {/* Title Row */}
            <View style={styles.titleRow}>
              <Text style={styles.mainTitle}>Create Announcement</Text>

              {/* Shuttle Dropdown */}
              <View style={styles.dropdownWrapper}>
                <Pressable
                  style={styles.dropdownButton}
                  onPress={() => setDropdownOpen(v => !v)}
                >
                  <Text style={styles.dropdownText}>
                    {selectedShuttle.replace('Tesla HQ Deer Creek ', '')}
                  </Text>
                  <Svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#666"
                  >
                    <Path
                      d={dropdownOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Pressable>

                {dropdownOpen && (
                  <ScrollView
                    style={styles.dropdownMenu}
                    nestedScrollEnabled={true}
                  >
                    {SHUTTLE_OPTIONS.map(shuttle => (
                      <Pressable
                        key={shuttle}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedShuttle(shuttle);
                          setDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {shuttle.replace('Tesla HQ Deer Creek ', '')}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Announcement Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Announcement Type</Text>

              <View style={styles.typeGrid}>
                {ANNOUNCEMENT_TYPES.map(type => (
                  <Pressable
                    key={type.id}
                    style={styles.radioRow}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <View style={styles.radioButton}>
                      {selectedType === type.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>{type.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Details Text Area */}
            <View style={styles.section}>
              <TextInput
                style={styles.textArea}
                placeholder="Add more details (optional)"
                placeholderTextColor="#C7C7C7"
                multiline
                value={details}
                onChangeText={setDetails}
                textAlignVertical="top"
              />
            </View>

            {/* Delay Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delay</Text>

              <View style={styles.delayControl}>
                <Pressable
                  style={styles.delayButton}
                  onPress={() => setDelay(Math.max(0, delay - 5))}
                >
                  <Text style={styles.delayButtonText}>−</Text>
                </Pressable>

                <Text style={styles.delayValue}>{delay}</Text>

                <Pressable
                  style={styles.delayButton}
                  onPress={() => setDelay(delay + 5)}
                >
                  <Text style={styles.delayButtonText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.primaryButton, submitting && styles.buttonDisabled]}
                onPress={() => handleSubmit(true)}
                disabled={submitting}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting ? 'Sending...' : 'Push Alert & Resolve Reports'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
                onPress={() => handleSubmit(false)}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>
                  {submitting ? 'Sending...' : 'Push Alert Only'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modalize>
    );
  }
);

const styles = StyleSheet.create({
  modalScreen: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  container: {
    flex: 1,
    paddingBottom: 40,
  },
  content: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingTop: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Inter',
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  dropdownText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 120,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'Inter',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 14,
    fontFamily: 'Inter',
  },
  typeGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 24,
    rowGap: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 15,
    height: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D1D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Inter',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    color: '#000000',
    minHeight: 90,
    backgroundColor: '#FAFAFA',
    fontFamily: 'Inter',
  },
  delayControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  delayButton: {
    width: 30,
    height: 32,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delayButtonText: {
    fontSize: 22,
    color: '#CCCCCC',
    fontWeight: '300',
    fontFamily: 'Inter',
  },
  delayValue: {
    fontSize: 11.6044,
    fontWeight: '500',
    color: '#000000',
    minWidth: 50,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6A6A6A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#D1D1D1',
    fontFamily: 'Inter',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default CreateNewAnnouncement;