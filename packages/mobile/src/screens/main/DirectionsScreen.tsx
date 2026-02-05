// packages/mobile/src/screens/main/DirectionsScreen.tsx

import React, { useRef, useState, useMemo, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRideContext, TravelMode } from '../../context/RideContext';
import OptionsCard, { OptionItem } from '../../components/OptionsCard';
import Svg, {
  Circle,
  Path,
  Line,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {
  RouteHeader,
  TransportMode as HeaderTransportMode,
} from '../../components/RouteHeader';
import { LocationBox } from '../../components/LocationBox';
import {
  getAllLocations,
  getAllParkingAvailability,
} from '../../services/parkings';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DirectionsRouteProp = RouteProp<RootStackParamList, 'Directions'>;

const { width } = Dimensions.get('window');

// Internal shape the component uses — built from the two API responses
interface ParkingLot {
  id: string;
  name: string;
  status: string;
  fullness: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

// Helper: maps availability (0–100) to a human-readable status
function getStatus(availability: number): string {
  if (availability >= 80) return 'Almost Full';
  if (availability >= 50) return 'Filling Up';
  return 'Available';
}

function DirectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DirectionsRouteProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const { destination, setDestination, travelMode, setTravelMode } =
    useRideContext();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(
    null
  );
  const [selectedSublot, setSelectedSublot] = useState<string>('Sublot B');

  // --- API state ---
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch locations + availability, then merge
  useEffect(() => {
    let cancelled = false;

    async function fetchLots() {
      try {
        setLoading(true);
        setError(null);

        const [locations, availabilities] = await Promise.all([
          getAllLocations(),
          getAllParkingAvailability(),
        ]);

        if (cancelled) return;

        // Build a quick lookup: loc_name -> availability rows
        const availMap = new Map<string, number>();
        for (const row of availabilities) {
          // If multiple lot_names per location, you could key on
          // `${row.loc_name}::${row.lot_name}` for sublot granularity later.
          // For now we just use the first one we find per location.
          if (!availMap.has(row.loc_name)) {
            availMap.set(row.loc_name, row.availability);
          }
        }

        // Merge into ParkingLot[]
        const merged: ParkingLot[] = locations.map(loc => {
          const fullness = availMap.get(loc.name) ?? 0;
          return {
            id: loc.name.toLowerCase().replace(/\s+/g, '_'),
            name: loc.name,
            status: getStatus(fullness),
            fullness,
            coordinate: {
              latitude: loc.lat,
              longitude: loc.lng,
            },
          };
        });

        setParkingLots(merged);

        // Auto-select the first lot if none selected yet
        if (merged.length > 0) {
          setSelectedParkingId(merged[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load parking lots. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLots();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fallback if no destination in context
  const destinationLat = destination?.coordinate?.latitude ?? 37.4419;
  const destinationLng = destination?.coordinate?.longitude ?? -122.143;
  const destinationName = destination?.title ?? 'Tesla Deer Creek';

  // Matches Figma: 20% peek, 50% half, 80% full (to avoid covering header)
  const snapPoints = useMemo(() => ['20%', '50%', '65%', '80%'], []);

  const handleParkingSelect = (id: string) => {
    const lot = parkingLots.find(p => p.id === id);
    if (!lot) return;

    // 1. Update selection state
    setSelectedParkingId(id);

    // 2. Update global destination context (updates header)
    setDestination({
      id: lot.id,
      title: `Tesla ${lot.name}`,
      subtitle: `${lot.fullness}% Full`,
      coordinate: lot.coordinate,
    });

    // 3. Animate Map Camera
    mapRef.current?.animateCamera({
      center: lot.coordinate,
      pitch: 0,
      heading: 0,
      altitude: 1000,
      zoom: 15,
    });
  };

  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${destinationLat},${destinationLng}`,
      android: `google.navigation:q=${destinationLat},${destinationLng}`,
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Maps app not available');
        }
      });
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
    Linking.openURL(url);
  };

  const handleRoutePress = () => {
    if (viewMode === 'list') {
      setViewMode('detail');
    } else {
      openInGoogleMaps();
    }
  };

  const handleReport = () => {
    Alert.alert('Report an Issue', 'Select an issue type:', [
      {
        text: 'Shuttle Delayed',
        onPress: () => console.log('Shuttle Delayed'),
      },
      { text: 'Missed Pickup', onPress: () => console.log('Missed Pickup') },
      { text: 'Shuttle Full', onPress: () => console.log('Shuttle Full') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderParkingDetail = () => {
    const lot = parkingLots.find(p => p.id === selectedParkingId);
    if (!lot) return null;

    return (
      <View style={styles.detailContainer}>
        {/* Header */}
        <View style={styles.detailHeaderRow}>
          <Image
            source={require('../../assets/icons/new/newCar.png')}
            style={{ width: 24, height: 24, tintColor: '#000', marginRight: 8 }}
          />
          <Text style={styles.detailTitle}>{lot.name}</Text>
          <Text style={styles.detailUpdateText}>Updated 2 min ago</Text>
        </View>

        {/* Status / Forecast */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>CURRENTLY</Text>
            <View style={styles.dotYellow} />
            <Text style={styles.statusValue}>{lot.fullness}% full</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>FORECAST</Text>
            <View style={styles.dotRed} />
            <Text style={styles.statusValue}>
              About {Math.min(lot.fullness + 20, 100)}% full by 9:30 AM
            </Text>
          </View>
        </View>

        {/* Sublot List */}
        <View style={styles.sublotList}>
          {lot.id === selectedParkingId && parkingLots.length > 0 ? (
            <>
              {/* Sublot A */}
              <TouchableOpacity
                style={
                  selectedSublot === 'Sublot A'
                    ? styles.sublotRowSelected
                    : styles.sublotRow
                }
                onPress={() => setSelectedSublot('Sublot A')}
              >
                <Text
                  style={
                    selectedSublot === 'Sublot A'
                      ? styles.sublotNameSelected
                      : styles.sublotName
                  }
                >
                  SUBLOT A
                </Text>
                <Text
                  style={
                    selectedSublot === 'Sublot A'
                      ? styles.sublotStatsSelected
                      : styles.sublotStats
                  }
                >
                  {lot.fullness}% → {Math.min(lot.fullness + 5, 100)}%
                </Text>
                <View
                  style={lot.fullness >= 80 ? styles.dotRed : styles.dotYellow}
                />
              </TouchableOpacity>
              {/* Sublot B */}
              <TouchableOpacity
                style={
                  selectedSublot === 'Sublot B'
                    ? styles.sublotRowSelected
                    : styles.sublotRow
                }
                onPress={() => setSelectedSublot('Sublot B')}
              >
                <Text
                  style={
                    selectedSublot === 'Sublot B'
                      ? styles.sublotNameSelected
                      : styles.sublotName
                  }
                >
                  SUBLOT B
                </Text>
                <Text
                  style={
                    selectedSublot === 'Sublot B'
                      ? styles.sublotStatsSelected
                      : styles.sublotStats
                  }
                >
                  {Math.max(lot.fullness - 20, 0)}% → {lot.fullness}%
                </Text>
                <View
                  style={
                    lot.fullness >= 60 ? styles.dotYellow : styles.dotGreen
                  }
                />
              </TouchableOpacity>
              {/* Sublot C */}
              <TouchableOpacity
                style={
                  selectedSublot === 'Sublot C'
                    ? styles.sublotRowSelected
                    : styles.sublotRow
                }
                onPress={() => setSelectedSublot('Sublot C')}
              >
                <Text
                  style={
                    selectedSublot === 'Sublot C'
                      ? styles.sublotNameSelected
                      : styles.sublotName
                  }
                >
                  SUBLOT C
                </Text>
                <Text
                  style={
                    selectedSublot === 'Sublot C'
                      ? styles.sublotStatsSelected
                      : styles.sublotStats
                  }
                >
                  {Math.min(lot.fullness + 10, 100)}% →{' '}
                  {Math.min(lot.fullness + 20, 100)}%
                </Text>
                <View style={styles.dotRed} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.sublotRowSelected}
                onPress={() => setSelectedSublot('Main Lot')}
              >
                <Text style={styles.sublotNameSelected}>MAIN LOT</Text>
                <Text style={styles.sublotStatsSelected}>
                  {lot.status === 'Available' ? 'Verified Space' : 'Limited'}
                </Text>
                <View style={styles.dotGreen} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sublotRow}
                onPress={() => setSelectedSublot('Overflow')}
              >
                <Text style={styles.sublotName}>OVERFLOW</Text>
                <Text style={styles.sublotStats}>Empty</Text>
                <View style={styles.dotGreen} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Also Consider Shuttle */}
        <Text style={styles.sectionHeader}>ALSO CONSIDER SHUTTLE</Text>
        <TouchableOpacity
          style={styles.shuttleSuggestionCard}
          onPress={() => setTravelMode('shuttle')}
        >
          <Image
            source={require('../../assets/icons/new/newShuttle.png')}
            style={{ width: 24, height: 24, marginRight: 12 }}
          />
          <Text style={styles.shuttleSuggestionText}>50 min</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.dotYellow} />
          <Text style={styles.statusValue}>65% full</Text>
        </TouchableOpacity>

        {/* Footer Actions */}
        <View style={styles.detailFooter}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setViewMode('list')}
          >
            <Text style={styles.backButtonText}>Other Lots</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.startButton}
            onPress={openInGoogleMaps}
          >
            <Text style={styles.startButtonText}>
              Route to {selectedSublot}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderParkingList = () => (
    <View>
      {/* Parking List */}
      <OptionsCard
        items={parkingLots.map(lot => {
          const isSelected = selectedParkingId === lot.id;
          return {
            id: lot.id,
            title: lot.name,
            subtitle: lot.status,
            rightText: `${lot.fullness}% Full`,
            selected: isSelected,
          };
        })}
        onSelect={item => handleParkingSelect(item.id)}
        style={{ borderWidth: 0, padding: 0 }}
        itemStyle={{
          backgroundColor: '#fff',
          marginBottom: 12,
          minHeight: 80,
          height: 'auto',
          alignItems: 'center',
        }}
      />

      <Text style={styles.sectionHeader}>ALSO CONSIDER</Text>

      <OptionsCard
        items={[
          {
            id: 'shuttle-a',
            title: 'Shuttle A',
            subtitle: 'On Time',
            rightText: 'Arrives in 5 min',
            icon: require('../../assets/icons/new/newShuttle.png'),
          },
          {
            id: 'shuttle-b',
            title: 'Shuttle B',
            subtitle: 'On Time',
            rightText: 'Arrives in 10 min',
            icon: require('../../assets/icons/new/newShuttle.png'),
          },
        ]}
        onSelect={() => setTravelMode('shuttle')}
        style={{ borderWidth: 0, padding: 0 }}
        itemStyle={{
          backgroundColor: '#fff',
          marginBottom: 12,
        }}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.startButton} onPress={handleRoutePress}>
          <Text style={styles.startButtonText}>
            Route to{' '}
            {parkingLots.find(p => p.id === selectedParkingId)?.name ?? '...'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRouteContent = () => (
    <>
      {/* Quick Start Card (Primary Route) */}
      <TouchableOpacity
        style={styles.routeCard}
        activeOpacity={0.9}
        onPress={openInGoogleMaps}
      >
        <View style={styles.routeHeader}>
          <View>
            <Text style={styles.routeTitle}>
              {travelMode === 'shuttle'
                ? 'Tesla Shuttle A'
                : 'Recommended Route'}
            </Text>
            <Text style={styles.routeSub}>On Time · 10 min away</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>50 Min</Text>
            <Text style={styles.etaSub}>9:30 AM ETA</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.routeDetails}>
          {/* Timeline / Steps simulation */}
          <View style={styles.stepRow}>
            <Svg width={12} height={40}>
              <Circle cx={6} cy={6} r={3} fill="#007AFF" />
              <Line
                x1={6}
                y1={6}
                x2={6}
                y2={40}
                stroke="#E5E5E5"
                strokeWidth={2}
              />
            </Svg>
            <Text style={styles.stepText}>Your Location</Text>
            <Text style={styles.stepTime}>8:40 AM</Text>
          </View>
          <View style={styles.stepRow}>
            <Svg width={12} height={40}>
              <Line
                x1={6}
                y1={0}
                x2={6}
                y2={40}
                stroke="#E5E5E5"
                strokeWidth={2}
              />
              <Circle cx={6} cy={20} r={2} fill="#8E8E93" />
            </Svg>
            <View style={styles.stepContent}>
              <Text style={styles.stepText}>10 min walk</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <Svg width={12} height={12}>
              <Circle cx={6} cy={6} r={3} fill="#000" />
            </Svg>
            <Text style={styles.stepText}>Stevens Creek/Albany Bus Stop</Text>
            <Text style={styles.stepTime}>8:50 AM</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={openInGoogleMaps}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Other Modes / Report Link */}
      <View style={styles.footerLinks}>
        <Text style={styles.footerTitle}>OTHER OPTIONS</Text>
        {/* Simple list of alternates */}
        <TouchableOpacity
          style={styles.altRow}
          onPress={() => setTravelMode('shuttle')}
        >
          <Text style={styles.altText}>Tesla Shuttle B</Text>
          <Text style={styles.altTime}>55 min</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.altRow}
          onPress={() => setTravelMode('transit')}
        >
          <Text style={styles.altText}>Public Transit</Text>
          <Text style={styles.altTime}>1h 10m</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.reportLink} onPress={handleReport}>
        <Text style={styles.reportText}>
          See something off?{' '}
          <Text style={styles.reportLinkText}>Report it</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  // --- Loading / Error states ---
  const renderLoading = () => (
    <View style={styles.centeredState}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.stateText}>Loading parking lots...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centeredState}>
      <Text style={styles.stateText}>{error}</Text>
      <TouchableOpacity
        style={[
          styles.startButton,
          { marginTop: 12, flex: 0, paddingHorizontal: 24 },
        ]}
        onPress={() => {
          // Re-trigger the effect by toggling loading
          setLoading(true);
          setError(null);
        }}
      >
        <Text style={styles.startButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: destinationLat,
            longitude: destinationLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Pin for each fetched lot */}
          {parkingLots.map(lot => (
            <Marker
              key={lot.id}
              coordinate={lot.coordinate}
              title={`Tesla ${lot.name}`}
              description={`${lot.fullness}% Full`}
            >
              <View
                style={{
                  backgroundColor:
                    lot.id === selectedParkingId ? '#007AFF' : '#FF3B30',
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderWidth: 2,
                  borderColor: '#fff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                  elevation: 3,
                }}
              >
                <Text
                  style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}
                >
                  {lot.fullness}%
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Header Overlay - LocationBox */}
      <LocationBox destination={destinationName} />

      {/* Bottom Sheet - Route Planning */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1} // Start at 50%
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        style={{ zIndex: 100 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Shared RouteHeader: Back Button, Tabs, Time Selector */}
          <RouteHeader
            onBackPress={() => navigation.goBack()}
            activeMode={travelMode as HeaderTransportMode}
            onModeChange={mode => setTravelMode(mode as TravelMode)}
            modeTimes={{
              car: '30m',
              shuttle: '50m',
              transit: '1hr5m',
              bike: '30m',
            }}
          />

          {/* Conditional Content */}
          {loading
            ? renderLoading()
            : error
              ? renderError()
              : travelMode === 'car'
                ? viewMode === 'list'
                  ? renderParkingList()
                  : renderParkingDetail()
                : renderRouteContent()}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

export default memo(DirectionsScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetBackground: {
    backgroundColor: '#FCFCFC',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomSheetHandle: {
    backgroundColor: '#E0E0E0',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 24,
    overflow: 'hidden',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  routeSub: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 2,
    fontWeight: '500',
  },
  etaBadge: {
    alignItems: 'flex-end',
  },
  etaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  etaSub: {
    fontSize: 12,
    color: '#8E8E93',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
  routeDetails: {
    padding: 16,
    paddingVertical: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  stepContent: {
    flex: 1,
    marginLeft: 8,
    paddingBottom: 4,
  },
  stepTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actionRow: {
    padding: 16,
    paddingTop: 0,
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLinks: {
    marginBottom: 24,
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  altText: {
    fontSize: 15,
    color: '#000',
  },
  altTime: {
    fontSize: 15,
    color: '#8E8E93',
  },
  reportLink: {
    alignSelf: 'center',
    paddingBottom: 20,
  },
  reportText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  reportLinkText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  // Parking Styles
  parkingList: {
    marginBottom: 24,
  },
  parkingRow: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parkingRowSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F2F8FF',
  },
  parkingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  parkingStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusFull: {
    color: '#FF3B30',
  },
  statusOk: {
    color: '#34C759',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  // Detail View Styles
  detailContainer: {
    paddingBottom: 20,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  detailUpdateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusSection: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    width: 80,
  },
  statusValue: {
    fontSize: 13,
    color: '#000',
  },
  dotYellow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFCC00',
    marginRight: 8,
  },
  dotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginRight: 8,
  },
  sublotList: {
    marginBottom: 20,
  },
  sublotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 8,
  },
  sublotRowSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 8,
  },
  sublotName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    flex: 1,
  },
  sublotNameSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    flex: 1,
  },
  sublotStats: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
  },
  sublotStatsSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
  },
  shuttleSuggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  shuttleSuggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  detailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  // Loading / Error
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  stateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
});
