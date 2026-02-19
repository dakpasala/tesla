// packages/mobile/src/components/ParkingDetailView.tsx
import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { ParkingLot, ParkingRow } from '../services/parkings';
import { getForecastText } from '../helpers/mapUtils';
import { ModeTimes } from './RouteHeader';
import { TravelMode } from '../context/RideContext';
import OptionsCard from './OptionsCard';

interface ParkingDetailViewProps {
  selectedLot: ParkingLot | undefined;
  routesLoading: boolean;
  routeDuration: string | null;
  sublotsLoading: boolean;
  sublots: ParkingRow[];
  selectedSublot: string;
  onSelectSublot: (name: string) => void;
  onSetTravelMode: (mode: TravelMode) => void;
  modeTimes: ModeTimes;
  onOpenInGoogleMaps: () => void;
  onPressOtherLots: () => void;
}

export function ParkingDetailView({
  selectedLot,
  routesLoading,
  routeDuration,
  sublotsLoading,
  sublots,
  selectedSublot,
  onSelectSublot,
  onSetTravelMode,
  modeTimes,
  onOpenInGoogleMaps,
  onPressOtherLots,
}: ParkingDetailViewProps) {
  const lot = selectedLot;

  /**
   * Helper to determine dot color based on fullness or override status
   */
  const getDotStyle = (percent: number, status?: string | null) => {
    if (status === 'Lot closed' || percent >= 90) return styles.dotRed;
    if (status === 'Reserved for event' || percent >= 75)
      return styles.dotYellow;
    return styles.dotGreen;
  };

  const short = (s: string, max = 14) =>
    s.length > max ? s.slice(0, max - 1) + '…' : s;

  const currentFullness = lot?.fullness ?? 0;
  const forecastFullness = Math.min(currentFullness + 15, 95);

  return (
    <View style={styles.detailContainer}>
      {/* Route calculation loading state */}
      {routesLoading && (
        <View style={styles.routeLoadingBanner}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.routeLoadingText}>Calculating route...</Text>
        </View>
      )}
      {/* Route time display
      {!routesLoading && routeDuration && (
        <View style={styles.routeTimeBanner}>
          <Image
            source={require('../assets/icons/new/newCar.png')}
            style={styles.iconSmall}
          />
          <Text style={styles.routeTimeText}>{routeDuration} drive</Text>
        </View>
      )} */}
      <View style={styles.detailInner}>
        <View style={styles.detailHeaderRow}>
          <Image
            source={require('../assets/icons/new/parkCar.png')}
            style={styles.iconLarge}
          />
          <Text style={styles.detailTitle}>{lot?.name || 'Loading...'}</Text>
          <Text style={styles.detailUpdateText}>Updated recently</Text>
        </View>
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>CURRENTLY</Text>
            <View style={getDotStyle(currentFullness)} />
            <Text style={styles.statusValue}>
              {sublots.length > 0 && selectedSublot
                ? (() => {
                    const selected = sublots.find(s => s.lot_name === selectedSublot);
                    if (selected?.status_override) {
                      return selected.status_override;
                    }
                    const capacity = Number(selected?.capacity);
                    const available = Number(selected?.current_available);
                    if (!isNaN(capacity) && !isNaN(available) && capacity > 0) {
                      const fullness = Math.round(((capacity - available) / capacity) * 100);
                      return `${fullness}% full`;
                    }
                    return `${currentFullness}% full`;
                  })()
                : `${currentFullness}% full`}
            </Text>
          </View>
          {(() => {
            // Don't show forecast if lot is closed or at 100%
            const selected = sublots.find(s => s.lot_name === selectedSublot);
            const isClosed = selected?.status_override?.toLowerCase().includes('closed');
            
            const capacity = Number(selected?.capacity);
            const available = Number(selected?.current_available);
            let currentPercent = currentFullness;
            
            if (!isNaN(capacity) && !isNaN(available) && capacity > 0) {
              currentPercent = Math.round(((capacity - available) / capacity) * 100);
            }
            
            if (isClosed || currentPercent >= 100) {
              return null;
            }
            
            const futurePercent = Math.min(currentPercent + 15, 100);
            
            return (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>FORECAST</Text>
                <View style={getDotStyle(futurePercent)} />
                <Text style={styles.statusValue}>
                  {currentPercent}% → {futurePercent}%
                </Text>
              </View>
            );
          })()}
        </View>

        {sublotsLoading ? (
          <ActivityIndicator
            size="small"
            color="#007AFF"
            style={styles.loader}
          />
        ) : (
          <View style={styles.sublotList}>
            {sublots.length > 0 ? (
              sublots.map((sublot, index) => {
                const isSelected = selectedSublot === sublot.lot_name;

                /**
                 * Logic: Use status_override if present, otherwise calculate percentage
                 */
                const hasOverride = !!sublot.status_override;
                const capacity = Number(sublot.capacity);
                const available = Number(sublot.current_available);

                let fullness = 0;

                if (
                  !isNaN(capacity) &&
                  !isNaN(available) &&
                  capacity > 0
                ) {
                  fullness = Math.round(
                    ((capacity - available) / capacity) * 100
                  );
                } else {
                  fullness = lot?.fullness ?? 0;
                }

                const displayText = hasOverride
                  ? sublot.status_override
                  : (() => {
                      if (fullness >= 100) {
                        return '100% full';
                      }
                      const futureFullness = Math.min(fullness + 15, 100);
                      return `${fullness}% → ${futureFullness}%`;
                    })();

                const dotStyle = getDotStyle(fullness, sublot.status_override);

                return (
                  <GHTouchableOpacity
                    key={`${sublot.location_name}-${sublot.lot_name}-${index}`}
                    style={
                      isSelected ? styles.sublotRowSelected : styles.sublotRow
                    }
                    onPress={() => onSelectSublot(sublot.lot_name)}
                  >
                    <Text
                      style={
                        isSelected
                          ? styles.sublotNameSelected
                          : styles.sublotName
                      }
                    >
                      {sublot.lot_name}
                    </Text>

                    <View style={styles.sublotRightWrap}>
                      <Text
                        style={
                          isSelected
                            ? styles.sublotStatsSelected
                            : styles.sublotStats
                        }
                      >
                        {displayText}
                      </Text>
                    </View>

                    <View style={dotStyle} />
                  </GHTouchableOpacity>
                );
              })
            ) : (
              <GHTouchableOpacity
                style={styles.sublotRowSelected}
                onPress={() => onSelectSublot('Main Lot')}
              >
                <Text style={styles.sublotNameSelected}>MAIN LOT</Text>
                <Text style={styles.sublotStatsSelected}>
                  {lot?.fullness ?? 0}% full
                </Text>
                <View style={getDotStyle(lot?.fullness ?? 0)} />
              </GHTouchableOpacity>
            )}
          </View>
        )}

        <GHTouchableOpacity
          style={styles.shuttleSuggestionCard}
          onPress={() => onSetTravelMode('shuttle')}
        >
          <Image
            source={require('../assets/icons/new/newShuttle.png')}
            style={styles.shuttleIcon}
          />
          <View style={styles.shuttleTextContainer}>
            <Text style={styles.sectionHeader}>ALSO CONSIDER SHUTTLE</Text>
            <Text style={styles.shuttleSuggestionText}>
              {modeTimes.shuttle || '50 min'}
            </Text>
          </View>
          <View style={styles.spacer} />
        </GHTouchableOpacity>
        <View style={styles.detailFooterRow}>
          <GHTouchableOpacity
            style={styles.secondaryButton}
            onPress={onPressOtherLots}
          >
            <Text style={styles.secondaryButtonText}>Other Lots</Text>
          </GHTouchableOpacity>

          <GHTouchableOpacity
            style={styles.startButton}
            onPress={onOpenInGoogleMaps}
          >
            <Text
              style={styles.startButtonText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Route to {short(selectedSublot || 'Lot')}
            </Text>
          </GHTouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  detailContainer: { paddingBottom: 20 },
  routeLoadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  routeLoadingText: { marginLeft: 8, fontSize: 14, color: '#007AFF' },
  routeTimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  routeTimeText: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },
  iconSmall: { width: 20, height: 20, marginRight: 8 },
  iconLarge: { width: 32, height: 25, marginRight: 10 },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: { fontSize: 20, color: '#1C1C1C', flex: 1 },
  detailUpdateText: { fontSize: 12, color: '#6A6A6A', fontStyle: 'italic' },
  statusSection: { marginBottom: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusLabel: { fontSize: 12, color: '#6A6A6A', width: 120 },
  statusValue: { fontSize: 12, color: '#1C1C1C' },
  dotYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FCC82C',
    marginRight: 8,
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E83F3F',
    marginRight: 8,
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A9C30',
    marginRight: 8,
  },
  sectionHeader: {
    fontSize: 12,
    color: '#6A6A6A',
    marginBottom: 23,
    marginLeft: -30,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  loader: { marginVertical: 20 },
  sublotList: { marginBottom: 10 },
  sublotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    marginBottom: 8,
  },
  sublotRowSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0761E0',
    marginBottom: 8,
  },
  sublotName: { flex: 1, fontSize: 12, color: '#1C1C1C' },
  sublotNameSelected: {
    flex: 1,
    fontSize: 12,
    color: '#0761E0',
  },
  sublotStats: {
    fontSize: 13,
    color: '#8E8E93',
    marginRight: 8,
    textAlign: 'right',
  },
  sublotStatsSelected: {
    fontSize: 13,
    color: '#007AFF',
    marginRight: 8,
    textAlign: 'right',
  },
  shuttleSuggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F1F1',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  shuttleIcon: { width: 29, height: 29, marginRight: -10, marginTop: 20 },
  shuttleSuggestionText: {
    fontSize: 14,
    color: '#1C1C1C',
    marginTop: -10,
    marginRight: 10,
  },
  spacer: { flex: 1 },
  detailFooter: { marginTop: 8 },
  startButton: {
    backgroundColor: '#0761E0',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 12,
    flex: 2,
    minHeight: 54,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  shuttleTextContainer: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'column',
    marginLeft: 10,
  },

  shuttleTitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailInner: {
    paddingHorizontal: 8,
  },

  sublotRightWrap: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -30 }],
  },
  detailFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: '#F1F1F1',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1C',
  },

  startButtonText: {
    color: '#FCFCFC',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});