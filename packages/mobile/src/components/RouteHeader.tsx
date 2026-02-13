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

      {/* Time Selector Row with Back Button */}
      {/* <View style={styles.timeSelector}>
        <BackButton onPress={onBackPress} style={styles.backButton} /> */}
      {/* <TouchableOpacity style={styles.timeButton}>
          <Text style={styles.timeButtonText}>Now ▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.timeButton, styles.timeButtonSpacing]}>
          <Text style={styles.timeButtonText}>Leave at...</Text>
        </TouchableOpacity> */}
      {/* </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
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
    // Push content slightly to ensure margin on small screens
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
    color: '#1C1C1C',
    lineHeight: 14,
  },
  activeTabTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0761E0',
  },
});

export default RouteHeader;
