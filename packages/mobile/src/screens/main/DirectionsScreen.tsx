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
}

const PARKING_LOTS: ParkingLot[] = [
  { id: 'deer_creek', name: 'Deer Creek', status: 'Almost Full', fullness: 90 },
  { id: 'page_mill', name: 'Page Mill', status: 'Available', fullness: 45 },
  { id: 'hanover', name: 'Hanover', status: 'Available', fullness: 20 },
];

function DirectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DirectionsRouteProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { destination, travelMode, setTravelMode } = useRideContext();
  const [selectedParkingId, setSelectedParkingId] =
    useState<string>('deer_creek');

  // Fallback if no destination in context
  const destinationLat = destination?.coordinate?.latitude ?? 37.4419;
  const destinationLng = destination?.coordinate?.longitude ?? -122.143;
  const destinationName = destination?.title ?? 'Tesla Deer Creek';

  // Matches Figma: 20% peek, 50% half, 95% full
  const snapPoints = useMemo(() => ['20%', '50%', '95%'], []);

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

  const renderParkingContent = () => (
    <View>
      {/* Parking List */}
      <View style={styles.parkingList}>
        {PARKING_LOTS.map(lot => {
          const isSelected = selectedParkingId === lot.id;
          return (
            <TouchableOpacity
              key={lot.id}
              style={[
                styles.parkingRow,
                isSelected && styles.parkingRowSelected,
              ]}
              onPress={() => setSelectedParkingId(lot.id)}
            >
              <View>
                <Text style={styles.parkingName}>{lot.name}</Text>
                <Text
                  style={[
                    styles.parkingStatus,
                    lot.fullness > 80 ? styles.statusFull : styles.statusOk,
                  ]}
                >
                  {lot.id === 'deer_creek' && 'Sublot B · '}
                  {lot.status}
                </Text>
              </View>
              {isSelected && (
                <Svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#007AFF"
                  strokeWidth={2}
                >
                  <Path
                    d="M20 6L9 17L4 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionHeader}>ALSO CONSIDER</Text>

      {/* Shuttle Alternative */}
      <View style={styles.altOptionCard}>
        <View style={styles.altHeader}>
          <Image
            source={require('../../assets/icons/new/newShuttle.png')}
            style={styles.altIcon}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.altTitle}>Shuttle A</Text>
            <Text style={styles.altSub}>On Time</Text>
          </View>
          <Text style={styles.altRightTime}>Arrives in 5 min</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.altHeader}>
          <Image
            source={require('../../assets/icons/new/newShuttle.png')}
            style={styles.altIcon}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.altTitle}>Shuttle B</Text>
            <Text style={styles.altSub}>On Time</Text>
          </View>
          <Text style={styles.altRightTime}>Arrives in 15 min</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.startButton} onPress={openInGoogleMaps}>
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
        <View style={styles.altRow}>
          <Text style={styles.altText}>Tesla Shuttle B</Text>
          <Text style={styles.altTime}>55 min</Text>
        </View>
        <View style={styles.altRow}>
          <Text style={styles.altText}>Public Transit</Text>
          <Text style={styles.altTime}>1h 10m</Text>
        </View>
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
          {travelMode === 'car' ? renderParkingContent() : renderRouteContent()}
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
    zIndex: 10,
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
    paddingVertical: 14,
    alignItems: 'center',
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
  altOptionCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  altHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  altIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    tintColor: '#000',
  },
  altTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  altSub: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  altRightTime: {
    marginLeft: 'auto',
    fontSize: 13,
    color: '#8E8E93',
  },
});
