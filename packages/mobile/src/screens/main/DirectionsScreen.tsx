import React, { useRef, useState, useMemo, memo } from 'react';
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DirectionsRouteProp = RouteProp<RootStackParamList, 'Directions'>;

const { width } = Dimensions.get('window');

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

const PARKING_LOTS: ParkingLot[] = [
  {
    id: 'deer_creek',
    name: 'Deer Creek',
    status: 'Almost Full',
    fullness: 90,
    coordinate: { latitude: 37.4419, longitude: -122.143 },
  },
  {
    id: 'page_mill',
    name: 'Page Mill',
    status: 'Available',
    fullness: 45,
    coordinate: { latitude: 37.426, longitude: -122.145 }, // Approx nearby
  },
  {
    id: 'hanover',
    name: 'Hanover',
    status: 'Available',
    fullness: 20,
    coordinate: { latitude: 37.425, longitude: -122.155 }, // Approx nearby
  },
];

function DirectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DirectionsRouteProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const { destination, setDestination, travelMode, setTravelMode } =
    useRideContext();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedParkingId, setSelectedParkingId] =
    useState<string>('deer_creek');
  const [selectedSublot, setSelectedSublot] = useState<string>('Sublot B');

  // Fallback if no destination in context
  const destinationLat = destination?.coordinate?.latitude ?? 37.4419;
  const destinationLng = destination?.coordinate?.longitude ?? -122.143;
  const destinationName = destination?.title ?? 'Tesla Deer Creek';

  // Matches Figma: 20% peek, 50% half, 80% full (to avoid covering header)
  const snapPoints = useMemo(() => ['20%', '50%', '80%'], []);

  const handleParkingSelect = (id: string) => {
    const lot = PARKING_LOTS.find(p => p.id === id);
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
    const lot = PARKING_LOTS.find(p => p.id === selectedParkingId);
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
          {lot.id === 'deer_creek' ? (
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
                  85% → 90%
                </Text>
                <View style={styles.dotRed} />
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
                  65% → 75%
                </Text>
                <View style={styles.dotYellow} />
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
                  90% → 97%
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
              Route to {lot.id === 'deer_creek' ? selectedSublot : lot.name}
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
        items={PARKING_LOTS.map(lot => {
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
          minHeight: 80, // Allow flexible height
          height: 'auto',
          alignItems: 'center', // Standard center alignment for list items
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
            Route to {PARKING_LOTS.find(p => p.id === selectedParkingId)?.name}
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

  // Custom Route Header resembling Figma
  const renderRouteHeader = () => (
    <View style={styles.headerContainer}>
      {/* Route Card */}
      <View style={styles.routeHeaderCard}>
        {/* Row 1: Current */}
        <View style={styles.routeRowItem}>
          <View style={styles.iconCol}>
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Circle cx={8} cy={8} r={6} fill="#007AFF" />
            </Svg>
          </View>
          <Text style={styles.locationLabel}>Current</Text>
        </View>

        {/* Full width Divider */}
        <View style={styles.headerDivider} />

        {/* Row 2: Destination */}
        <View style={styles.routeRowItem}>
          <View style={styles.iconCol}>
            <Svg width={16} height={24} viewBox="0 0 16 24">
              <G translateY={-28}>
                <Path
                  d="M8 50 C8 50 14 44 14 39 C14 35.6863 11.3137 33 8 33 C4.68629 33 2 35.6863 2 39 C2 44 8 50 8 50 Z"
                  fill="#FF3B30"
                />
                <Circle cx={8} cy={39} r={2} fill="#FFF" />
              </G>
            </Svg>
          </View>
          <Text style={styles.locationTitle}>{destinationName}</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['car', 'shuttle', 'transit', 'bike'] as TravelMode[]).map(mode => {
        const isActive = travelMode === mode;
        let iconSource;
        switch (mode) {
          case 'car':
            iconSource = require('../../assets/icons/new/newCar.png');
            break;
          case 'shuttle':
            iconSource = require('../../assets/icons/new/newShuttle.png');
            break;
          case 'transit':
            // Assuming newBus.png is for transit/bus
            iconSource = require('../../assets/icons/new/newBus.png');
            break;
          case 'bike':
            iconSource = require('../../assets/icons/new/newBike.png');
            break;
        }

        return (
          <TouchableOpacity
            key={mode}
            style={[styles.tab, isActive && styles.activeTabBorder]}
            onPress={() => setTravelMode(mode)}
          >
            <Image
              source={iconSource}
              style={[
                styles.tabIconImage,
                { tintColor: isActive ? '#007AFF' : '#8E8E93' },
              ]}
              resizeMode="contain"
            />
            <Text style={[styles.tabTime, isActive && styles.activeTabTime]}>
              {mode === 'car' && '30m'}
              {mode === 'shuttle' && '50m'}
              {mode === 'transit' && '1hr5m'}
              {mode === 'bike' && '30m'}
            </Text>
          </TouchableOpacity>
        );
      })}
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
          <Marker
            coordinate={{ latitude: destinationLat, longitude: destinationLng }}
            title={destinationName}
            image={require('../../assets/icons/destination.png')}
          />
        </MapView>
      </View>

      {/* Header Overlay */}
      {renderRouteHeader()}

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
          {/* Mode Tabs */}
          {renderTabs()}

          {/* Time Selector */}
          <View style={styles.timeSelector}>
            <TouchableOpacity style={styles.timeButton}>
              <Text style={styles.timeButtonText}>Now ▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.timeButton, { marginLeft: 10 }]}>
              <Text style={styles.timeButtonText}>Leave at...</Text>
            </TouchableOpacity>
          </View>

          {/* Conditional Content */}
          {travelMode === 'car'
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
  headerContainer: {
    position: 'absolute',
    top: 60,
    left: 35,
    right: 35,
    zIndex: 1, // Lowered so Bottom Sheet covers it
    // Removed flexDirection row since back button is gone
  },
  // backButton styles removed
  routeHeaderCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  routeRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconCol: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  locationLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
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
  timeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
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
    color: '#34C759', // Green for 'On Time'
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
    paddingVertical: 12, // Reduced padding for sleekness
    alignItems: 'center',
    flex: 1, // Ensure equal width if in row
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
    borderColor: '#007AFF', // Blue border for selected
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
    paddingVertical: 12, // Reduced padding for sleekness
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    flex: 1, // Even width
    marginRight: 12, // Spacing
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
