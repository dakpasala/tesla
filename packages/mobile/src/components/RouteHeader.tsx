// packages/mobile/src/components/RouteHeader.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';
import { BackButton } from './BackButton';

// Transport mode type
export type TransportMode = 'car' | 'shuttle' | 'transit' | 'bike';

// Mode time configuration
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
}

// Default times if not provided
const DEFAULT_TIMES: ModeTimes = {
  car: '30m',
  shuttle: '50m',
  transit: '1hr5m',
  bike: '30m',
};

// Icon sources for each mode
const MODE_ICONS: Record<TransportMode, any> = {
  car: require('../assets/icons/new/newCar.png'),
  shuttle: require('../assets/icons/new/newShuttle.png'),
  transit: require('../assets/icons/new/newBus.png'),
  bike: require('../assets/icons/new/newBike.png'),
};

export function RouteHeader({
  onBackPress,
  activeMode,
  onModeChange,
  modeTimes = DEFAULT_TIMES,
  style,
}: RouteHeaderProps) {
  const modes: TransportMode[] = ['car', 'shuttle', 'transit', 'bike'];

  return (
    <View style={[styles.container, style]}>
      {/* Back Button */}
      <View style={styles.backButtonRow}>
        <BackButton onPress={onBackPress} style={{ alignSelf: 'flex-start' }} />
      </View>

      {/* Transport Mode Tabs */}
      <View style={styles.tabContainer}>
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
                  { tintColor: isActive ? '#007AFF' : '#8E8E93' },
                ]}
                resizeMode="contain"
              />
              <Text style={[styles.tabTime, isActive && styles.activeTabTime]}>
                {time}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Time Selector */}
      <View style={styles.timeSelector}>
        <TouchableOpacity style={styles.timeButton}>
          <Text style={styles.timeButtonText}>Now ▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.timeButton, styles.timeButtonSpacing]}>
          <Text style={styles.timeButtonText}>Leave at...</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  backButtonRow: {
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBorder: {
    borderBottomColor: '#007AFF',
  },
  tabIconImage: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  tabTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabTime: {
    color: '#000',
    fontWeight: '600',
  },
  timeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  timeButtonSpacing: {
    marginLeft: 10,
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
});

export default RouteHeader;
