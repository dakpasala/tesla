// Modal with a search input that lets users pick a destination from a list of known campus locations.
// Filters results in real time and falls back to a full location list when the input is empty.

// packages/mobile/src/components/AddressAutocompleteModal.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getAllLocations, Location } from '../services/parkings';
import { useTheme } from '../context/ThemeContext';

interface AddressAutocompleteModalProps {
  visible: boolean;
  title: string;
  initialValue?: string;
  onSave: (address: string) => void;
  onCancel: () => void;
}

export default function AddressAutocompleteModal({
  visible,
  title,
  initialValue = '',
  onSave,
  onCancel,
}: AddressAutocompleteModalProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const [inputValue, setInputValue] = useState(initialValue);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load all locations on mount
  useEffect(() => {
    async function loadLocations() {
      try {
        const locs = await getAllLocations();
        setLocations(locs);
        setFilteredLocations(locs); // Show all initially
      } catch (error) {
        console.error('Failed to load locations:', error);
      } finally {
        setLoading(false);
      }
    }
    if (visible) {
      loadLocations();
      setInputValue(initialValue);
    }
  }, [visible, initialValue]);

  // Filter locations when input changes
  useEffect(() => {
    if (!inputValue.trim()) {
      // Show all locations when input is empty
      setFilteredLocations(locations);
      setShowDropdown(true);
      return;
    }

    const query = inputValue.toLowerCase();
    const filtered = locations.filter(
      loc =>
        loc.name.toLowerCase().includes(query) ||
        loc.address.toLowerCase().includes(query)
    );

    setFilteredLocations(filtered);
    setShowDropdown(true);
  }, [inputValue, locations]);

  const handleSelectLocation = (location: Location) => {
    setInputValue(location.address);
    setShowDropdown(false);
  };

  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim());
    }
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={[styles.locationItem, { borderBottomColor: c.border }]}
      onPress={() => handleSelectLocation(item)}
    >
      <View style={styles.pinIcon}>
        <Text style={styles.pinText}>📍</Text>
      </View>
      <View style={styles.locationTextContainer}>
        <Text style={[styles.locationName, { color: c.text.primary }]}>{item.name}</Text>
        <Text style={[styles.locationAddress, { color: c.text.secondary }]}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalCard, { backgroundColor: c.card }]}>
          <Text style={[styles.modalTitle, { color: c.text.primary }]}>{title}</Text>

          <TextInput
            style={[styles.modalInput, { borderColor: c.border, color: c.text.primary, backgroundColor: c.backgroundAlt }]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Search by location or address..."
            placeholderTextColor={c.text.secondary}
            autoFocus
            clearButtonMode="while-editing"
            returnKeyType="done"
          />

          {/* Autocomplete Dropdown - Always visible to maintain height */}
          <View style={[styles.dropdown, { borderColor: c.border, backgroundColor: c.card }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0761E0" />
              </View>
            ) : filteredLocations.length > 0 ? (
              <FlatList
                data={filteredLocations}
                renderItem={renderLocationItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.locationList}
                keyboardShouldPersistTaps="handled"
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.noResultsText, { color: c.text.secondary }]}>No locations found</Text>
              </View>
            )}
          </View>

          {/* Powered by Google */}
          {filteredLocations.length > 0 && (
            <Text style={styles.poweredBy}>powered by Google</Text>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalCancel, { borderColor: c.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.modalCancelText, { color: c.text.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSave,
                !inputValue.trim() && styles.modalSaveDisabled,
              ]}
              onPress={handleSave}
              disabled={!inputValue.trim()}
            >
              <Text
                style={[
                  styles.modalSaveText,
                  !inputValue.trim() && styles.modalSaveTextDisabled,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    paddingBottom: 34,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 50,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000',
    backgroundColor: '#FAFAFA',
  },
  dropdown: {
    marginTop: 8,
    height: 320, // Fixed height to fit ~5 items (64px per item × 5)
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  locationList: {
    flex: 1, // Fill the fixed height container
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pinIcon: {
    marginRight: 12,
  },
  pinText: {
    fontSize: 16,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
  },
  emptyDropdown: {
    flex: 1,
  },
  poweredBy: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
  },
  modalSaveDisabled: {
    backgroundColor: '#E0E0E0',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalSaveTextDisabled: {
    color: '#999',
  },
});
