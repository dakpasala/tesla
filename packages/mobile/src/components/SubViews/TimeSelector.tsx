import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TimeSelectorScreen from '../../screens/TimeSelectorScreen';

interface TimeSelectorProps {
  onSelect?: (item: any) => void;
}

export default function TimeSelector({ onSelect }: TimeSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(() => {
    const now = new Date();
    const formatted = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `Now: ${formatted}`;
  });

  function handleSelectTime(time: string) {
    setSelectedLeave(time);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Time Selector</Text>

      <View style={styles.dropdownWrap}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
        >
          <Text style={styles.dropdownText}>{selectedLeave}</Text>
          <Text style={styles.dropdownCaret}>▾</Text>
        </TouchableOpacity>
      </View>

      <TimeSelectorScreen
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectTime={handleSelectTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdownWrap: {
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    alignSelf: 'flex-start',
    minWidth: 140,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111',
  },
  dropdownCaret: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});
