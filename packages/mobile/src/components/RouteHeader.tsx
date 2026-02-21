// packages/mobile/src/components/RouteHeader.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AtmWheelPicker from './AtmWheelPicker';

export type TransportMode = 'car' | 'shuttle' | 'transit' | 'bike';

export interface ModeTimes {
  car?: string;
  shuttle?: string;
  transit?: string;
  bike?: string;
}

interface RouteHeaderProps {
  onBackPress: () => void;
  activeMode: TransportMode;
  onModeChange: (mode: TransportMode) => void;
  modeTimes?: ModeTimes;
  style?: ViewStyle;
  departureTime?: { hour: number; minute: number; period: 'am' | 'pm' } | null;
  onDepartureTimeChange?: (time: { hour: number; minute: number; period: 'am' | 'pm' } | null) => void;
}

const DEFAULT_TIMES: ModeTimes = {
  car: '30m',
  shuttle: '50m',
  transit: '1hr5m',
  bike: '30m',
};

const MODE_ICONS: Record<TransportMode, any> = {
  car: require('../assets/icons/new/newCar.png'),
  shuttle: require('../assets/icons/new/newShuttle.png'),
  transit: require('../assets/icons/new/newBus.png'),
  bike: require('../assets/icons/new/newBike.png'),
};

function formatDepartureLabel(time: { hour: number; minute: number; period: 'am' | 'pm' } | null | undefined): string {
  if (!time) return 'Now ▾';
  const min = time.minute.toString().padStart(2, '0');
  return `${time.hour}:${min} ${time.period.toUpperCase()} ▾`;
}

export function RouteHeader({
  onBackPress,
  activeMode,
  onModeChange,
  modeTimes = DEFAULT_TIMES,
  style,
  departureTime,
  onDepartureTimeChange,
}: RouteHeaderProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingTime, setPendingTime] = useState<{ hour: number; minute: number; period: 'am' | 'pm' } | null>(null);

  const modes: TransportMode[] = ['car', 'shuttle', 'transit', 'bike'];
  const isNow = !departureTime;

  const handleOpenPicker = () => {
    // Seed picker with current departureTime or current clock time
    const now = new Date();
    let h = now.getHours() % 12 || 12;
    let m = Math.min(55, Math.round(now.getMinutes() / 5) * 5);
    let p: 'am' | 'pm' = now.getHours() >= 12 ? 'pm' : 'am';
    setPendingTime(departureTime ?? { hour: h, minute: m, period: p });
    setPickerVisible(true);
  };

  const handleConfirm = () => {
    onDepartureTimeChange?.(pendingTime);
    setPickerVisible(false);
  };

  const handleNow = () => {
    onDepartureTimeChange?.(null);
    setPickerVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Transport Mode Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: c.border }]}>
        {modes.map(mode => {
          const isActive = activeMode === mode;
          const time = modeTimes[mode] || DEFAULT_TIMES[mode];
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.tab, isActive && styles.activeTabBorder]}
              onPress={() => onModeChange(mode)}
            >
              <Image
                source={MODE_ICONS[mode]}
                style={[
                  styles.tabIconImage,
                  { tintColor: isActive ? '#007AFF' : c.text.secondary },
                ]}
                resizeMode="contain"
              />
              <Text style={[
                styles.tabTime,
                { color: c.text.primary },
                isActive && styles.activeTabTime,
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Departure Time Row */}
      <TouchableOpacity
        style={[styles.departureRow, { borderColor: c.border, backgroundColor: c.backgroundAlt }]}
        onPress={handleOpenPicker}
        activeOpacity={0.7}
      >
        <Text style={[styles.departureLabel, { color: c.text.secondary }]}>Departing</Text>
        <Text style={[styles.departureValue, { color: isNow ? c.text.primary : '#007AFF' }]}>
          {formatDepartureLabel(departureTime)}
        </Text>
      </TouchableOpacity>

      {/* Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Text style={[styles.modalCancel, { color: c.text.secondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: c.text.primary }]}>Departure Time</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Now pill */}
            <TouchableOpacity
              style={[
                styles.nowPill,
                { borderColor: c.border, backgroundColor: isNow ? '#007AFF' : c.backgroundAlt },
              ]}
              onPress={handleNow}
            >
              <Text style={[styles.nowPillText, { color: isNow ? '#fff' : c.text.primary }]}>
                Leave Now
              </Text>
            </TouchableOpacity>

            <AtmWheelPicker
              initialHour={pendingTime?.hour}
              initialMinute={pendingTime?.minute}
              initialPeriod={pendingTime?.period}
              onTimeChange={t => setPendingTime(t)}
              showSelectionOverlay
            />

            <View style={{ height: 32 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    paddingBottom: 0.1,
  },
  tab: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 0,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingHorizontal: 4,
    marginRight: 5,
  },
  activeTabBorder: {
    borderBottomColor: '#0761E0',
  },
  tabIconImage: {
    width: 32,
    height: 32,
    marginRight: 6,
  },
  tabTime: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },
  activeTabTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0761E0',
  },
  departureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  departureLabel: {
    fontSize: 13,
  },
  departureValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalCancel: {
    fontSize: 15,
  },
  modalDone: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  nowPill: {
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  nowPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RouteHeader;