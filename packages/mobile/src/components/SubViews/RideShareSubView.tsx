import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

type RideOption = {
  id: string;
  provider: string;
  remaining: string;
  arrival: string;
  seatsLeft: number;
};

interface RideShareSubViewProps {
  initialItems?: RideOption[];
  onSelect?: (item: RideOption) => void;
}

const DEFAULT_ITEMS: RideOption[] = [
  {
    id: '1',
    provider: 'Lyft',
    remaining: '30m',
    arrival: '1:03 PM',
    seatsLeft: 2,
  },
  {
    id: '2',
    provider: 'Lyft',
    remaining: '55m',
    arrival: '1:28 PM',
    seatsLeft: 1,
  },
  {
    id: '3',
    provider: 'Liftango',
    remaining: '12m',
    arrival: '12:45 PM',
    seatsLeft: 0,
  },
  {
    id: '4',
    provider: 'Go Tesla',
    remaining: '2m',
    arrival: '12:35 - 12:40 PM',
    seatsLeft: 3,
  },
];

export default function RideShareSubView({
  initialItems = DEFAULT_ITEMS,
  onSelect,
}: RideShareSubViewProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(() => {
    const now = new Date();
    const formatted = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `Leave Now: ${formatted}`;
  });

  const PRESET_TIMES = ['Leave Now', '12:45 PM', '1:00 PM', '1:15 PM'];

  function selectTime(option: string) {
    if (option === 'Leave Now') {
      const now = new Date();
      const formatted = now.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
      setSelectedLeave(`Leave Now: ${formatted}`);
    } else {
      setSelectedLeave(`Leave At: ${option}`);
    }
    setDropdownOpen(false);
  }

  function renderRow(item: RideOption) {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.item}
        onPress={() => onSelect && onSelect(item)}
        accessibilityRole="button"
        accessibilityHint={`Opens details for ${item.provider}`}
      >
        <View style={styles.itemRow}>
          <Image
            source={require('../../assets/icons/old/car.png')}
            style={styles.icon}
            resizeMode="contain"
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.remainingText}>{item.remaining}</Text>
            <Text style={styles.providerText}>{item.provider}</Text>
            <Text style={styles.arrivalText}>Arrives {item.arrival}</Text>
          </View>

          <View
            style={[styles.badge, item.seatsLeft === 0 && styles.badgeFull]}
          >
            <Text style={styles.badgeText}>
              {item.seatsLeft > 0 ? `${item.seatsLeft} seats` : 'Full'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rideshare</Text>

      <View style={styles.dropdownWrap}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownOpen(v => !v)}
          accessibilityRole="button"
        >
          <Text style={styles.dropdownText}>{selectedLeave}</Text>
          <Text style={styles.dropdownCaret}>{dropdownOpen ? '▴' : '▾'}</Text>
        </TouchableOpacity>

        {dropdownOpen ? (
          <View style={styles.dropdownMenu}>
            {PRESET_TIMES.map(opt => (
              <TouchableOpacity
                key={opt}
                style={styles.dropdownItem}
                onPress={() => selectTime(opt)}
              >
                <Text style={styles.dropdownItemText}>
                  {opt === 'Leave Now'
                    ? `Leave Now (${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})`
                    : opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.listContent}>
        {initialItems.map(i => (
          <View key={i.id}>
            {renderRow(i)}
            <View style={styles.separator} />
          </View>
        ))}
      </View>
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
  listContent: {
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  remainingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  providerText: {
    fontSize: 14,
    color: '#333',
  },
  arrivalText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#e6f7ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  badgeFull: {
    backgroundColor: '#fdecea',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a58ca',
  },
  icon: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 6,
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
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    alignSelf: 'flex-start',
    minWidth: 140,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#222',
  },
});
